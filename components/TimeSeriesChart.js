import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as d3 from "d3";

const INDICATORS = [
  { key: "VIX", label: "VIX", color: "#ef5350" },
  { key: "yield_spread", label: "Yield Spread", color: "#42a5f5" },
  { key: "credit_spread", label: "Credit Spread", color: "#66bb6a" },
];

// Crisis presets (label + date range for brush)
const CRISIS_PRESETS = [
  { label: "Black Monday", start: new Date(1987, 7, 1), end: new Date(1988, 3, 30) },
  { label: "Asian Crisis", start: new Date(1997, 5, 1), end: new Date(1998, 11, 31) },
  { label: "Dot-com", start: new Date(2000, 2, 1), end: new Date(2002, 9, 31) },
  { label: "GFC", start: new Date(2007, 6, 1), end: new Date(2009, 5, 30) },
  { label: "COVID-19", start: new Date(2020, 0, 1), end: new Date(2021, 5, 30) },
];

const CRISIS_ANNOTATIONS = [
  { name: "Black Monday", date: "1987-10-01" },
  { name: "Asian Crisis", date: "1997-07-01" },
  { name: "Dot-com", date: "2000-03-01" },
  { name: "GFC", date: "2008-09-01" },
  { name: "COVID-19", date: "2020-03-01" },
];

const MARGIN = { top: 24, right: 56, bottom: 36, left: 44 };
const WIDTH = 900;
const HEIGHT = 240;

function zScore(values) {
  const mean = d3.mean(values);
  const std = d3.deviation(values) || 1;
  return values.map((v) => (v - mean) / std);
}

export function TimeSeriesChart({ data, onBrushChange, countryData, countryName }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const brushMoveRef = useRef(null);       // { moveTo(dates) }
  const currentSelectionRef = useRef(null); // [px0, px1] — restored on SVG re-render
  const suppressEndRef = useRef(false);     // suppress brush "end" during programmatic moves
  const chartStateRef = useRef(null);       // { x, innerH, innerW, g } for country overlay

  const [activeKeys, setActiveKeys] = useState(new Set(["VIX", "yield_spread", "credit_spread"]));
  const [mode, setMode] = useState("zscore");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [jumpRequest, setJumpRequest] = useState(null);
  const [hasSelection, setHasSelection] = useState(false);

  // ── Main chart effect ──
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const parseDate = d3.timeParse("%Y-%m-%d");
    const parsed = data.map((d) => ({
      date: parseDate(d.date),
      VIX: +d.VIX, yield_spread: +d.yield_spread, credit_spread: +d.credit_spread,
    })).filter((d) => d.date);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg.append("g")
      .attr("class", "inner-g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleTime().domain(d3.extent(parsed, (d) => d.date)).range([0, innerW]);

    chartStateRef.current = { x, innerH, innerW, g };

    const activeIndicators = INDICATORS.filter((ind) => activeKeys.has(ind.key));

    const seriesData = activeIndicators.map((ind) => {
      const raw = parsed.map((d) => ({ date: d.date, value: d[ind.key] }));
      if (mode === "zscore") {
        const zs = zScore(raw.map((d) => d.value));
        return { ...ind, values: raw.map((d, i) => ({ date: d.date, value: zs[i] })), yScale: null };
      }
      const yScale = d3.scaleLinear().domain(d3.extent(raw, (d) => d.value)).nice().range([innerH, 0]);
      return { ...ind, values: raw, yScale };
    });

    const zScoreLookup = {};
    activeIndicators.forEach((ind) => { zScoreLookup[ind.key] = zScore(parsed.map((d) => d[ind.key])); });

    let sharedY = null;
    if (mode === "zscore") {
      const allVals = seriesData.flatMap((s) => s.values.map((d) => d.value));
      sharedY = d3.scaleLinear().domain(d3.extent(allVals)).nice().range([innerH, 0]);
    }

    // Grid
    const gridY = sharedY || seriesData[0]?.yScale || d3.scaleLinear().range([innerH, 0]);
    g.append("g").call(d3.axisLeft(gridY).tickSize(-innerW).tickFormat(""))
      .selectAll("line").attr("stroke", "#1e2540").attr("stroke-dasharray", "2,3");
    g.select(".domain").remove();

    // Crisis annotations
    const parseCrisis = d3.timeParse("%Y-%m-%d");
    CRISIS_ANNOTATIONS.forEach((crisis, ci) => {
      const cx = x(parseCrisis(crisis.date));
      if (cx < 0 || cx > innerW) return;
      g.append("line").attr("x1", cx).attr("x2", cx).attr("y1", 0).attr("y2", innerH)
        .attr("stroke", "rgba(255,213,79,0.22)").attr("stroke-width", 1).attr("stroke-dasharray", "4,3");
      g.append("text").attr("x", cx + 3).attr("y", ci % 2 === 0 ? 9 : 20)
        .attr("fill", "#ffd54f").attr("font-size", "9px").attr("pointer-events", "none")
        .text(crisis.name);
    });

    // Lines
    seriesData.forEach((series) => {
      const y = sharedY ?? series.yScale;
      const lineGen = d3.line().x((d) => x(d.date)).y((d) => y(d.value))
        .defined((d) => !isNaN(d.value)).curve(d3.curveMonotoneX);
      g.append("path").datum(series.values)
        .attr("fill", "none").attr("stroke", series.color)
        .attr("stroke-width", 1.5).attr("opacity", 0.9).attr("d", lineGen);
    });

    // ── Feature 7: Country overlay ──
    if (countryData && countryData.length > 1) {
      const returns = countryData.map((d) => +d.return_pct);
      const yRight = d3.scaleLinear().domain(d3.extent(returns)).nice().range([innerH, 0]);
      const overlayG = g.append("g").attr("class", "country-overlay");

      // Right y-axis
      overlayG.append("g").attr("transform", `translate(${innerW}, 0)`)
        .call(d3.axisRight(yRight).ticks(4).tickFormat((d) => `${d > 0 ? "+" : ""}${d}%`))
        .call((a) => {
          a.selectAll("text").attr("fill", "#ffd54f").attr("font-size", "9px");
          a.selectAll(".tick line").attr("stroke", "rgba(255,213,79,0.2)");
          a.select(".domain").attr("stroke", "rgba(255,213,79,0.2)");
        });

      // Area + line
      const area = d3.area()
        .x((d) => x(new Date(+d.year, 6, 1))).y0(yRight(0)).y1((d) => yRight(+d.return_pct))
        .curve(d3.curveMonotoneX);
      const lineGen = d3.line()
        .x((d) => x(new Date(+d.year, 6, 1))).y((d) => yRight(+d.return_pct))
        .curve(d3.curveMonotoneX);

      overlayG.append("path").datum(countryData).attr("fill", "rgba(255,213,79,0.07)").attr("d", area);
      overlayG.append("path").datum(countryData)
        .attr("fill", "none").attr("stroke", "#ffd54f")
        .attr("stroke-width", 1.8).attr("stroke-dasharray", "5,2").attr("d", lineGen);

      // Country label
      const last = countryData[countryData.length - 1];
      overlayG.append("text")
        .attr("x", x(new Date(+last.year, 6, 1)) - 4)
        .attr("y", yRight(+last.return_pct) - 6)
        .attr("fill", "#ffd54f").attr("font-size", "9px").attr("text-anchor", "end")
        .text(countryName ?? "");
    }

    // X Axis
    g.append("g").attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)).tickFormat(d3.timeFormat("%Y")))
      .call((a) => {
        a.selectAll("text").attr("fill", "#7986cb").attr("font-size", "10px");
        a.selectAll(".tick line, .domain").attr("stroke", "#2a3050");
      });

    if (sharedY) {
      g.append("g").call(d3.axisLeft(sharedY).ticks(5))
        .call((a) => {
          a.selectAll("text").attr("fill", "#7986cb").attr("font-size", "10px");
          a.selectAll(".tick line, .domain").attr("stroke", "#2a3050");
        });
    }

    g.append("text").attr("transform", "rotate(-90)").attr("x", -innerH / 2).attr("y", -36)
      .attr("text-anchor", "middle").attr("fill", "#546e7a").attr("font-size", "9px")
      .text(mode === "zscore" ? "Z-Score (σ)" : "Value (per-series scale)");

    // ── Feature 3: Brush date labels ──
    const brushLabelL = g.append("text").attr("y", -7).attr("text-anchor", "middle")
      .attr("fill", "#ffd54f").attr("font-size", "9px").attr("display", "none");
    const brushLabelR = g.append("text").attr("y", -7).attr("text-anchor", "middle")
      .attr("fill", "#ffd54f").attr("font-size", "9px").attr("display", "none");
    const fmt = d3.timeFormat("%Y-%m");

    // ── Feature 1: Crosshair ──
    const crosshairG = g.append("g").style("display", "none");
    crosshairG.append("line").attr("class", "ch-line").attr("y1", 0).attr("y2", innerH)
      .attr("stroke", "rgba(220,220,220,0.32)").attr("stroke-width", 1).attr("stroke-dasharray", "3,2");
    const chDots = activeIndicators.map((ind) =>
      crosshairG.append("circle").attr("r", 4).attr("fill", ind.color)
        .attr("stroke", "#0d1117").attr("stroke-width", 1.5)
    );

    // Brush
    const brush = d3.brushX()
      .extent([[0, 0], [innerW, innerH]])
      .on("brush", function (event) {
        if (!event.selection) return;
        const [px0, px1] = event.selection;
        brushLabelL.attr("x", px0).attr("display", null).text(fmt(x.invert(px0)));
        brushLabelR.attr("x", px1).attr("display", null).text(fmt(x.invert(px1)));
        brushG.select(".selection").attr("fill", "rgba(92,107,192,0.18)").attr("stroke", "#7986cb").attr("stroke-width", 1.5);
      })
      .on("end", function (event) {
        if (suppressEndRef.current) { suppressEndRef.current = false; return; }
        if (!event.selection) {
          currentSelectionRef.current = null;
          setHasSelection(false);
          brushLabelL.attr("display", "none");
          brushLabelR.attr("display", "none");
          onBrushChange && onBrushChange(null);
          return;
        }
        currentSelectionRef.current = event.selection;
        setHasSelection(true);
        onBrushChange && onBrushChange(event.selection.map((px) => x.invert(px)));
      });

    const brushG = g.append("g").attr("class", "brush").call(brush);
    brushG.select(".selection").attr("fill", "rgba(92,107,192,0.15)").attr("stroke", "#5c6bc0").attr("stroke-width", 1);
    brushG.selectAll(".handle").attr("fill", "#5c6bc0");

    // Restore previous brush selection (e.g. after SVG re-render)
    if (currentSelectionRef.current) {
      suppressEndRef.current = true;
      brushG.call(brush.move, currentSelectionRef.current);
      // Restore labels
      const [px0, px1] = currentSelectionRef.current;
      brushLabelL.attr("x", px0).attr("display", null).text(fmt(x.invert(px0)));
      brushLabelR.attr("x", px1).attr("display", null).text(fmt(x.invert(px1)));
    }

    // Store brush move + clear functions
    brushMoveRef.current = {
      moveTo: (dates) => {
        const px0 = x(dates[0]), px1 = x(dates[1]);
        suppressEndRef.current = true;
        currentSelectionRef.current = [px0, px1];
        brushG.call(brush.move, [px0, px1]);
      },
      clear: () => {
        suppressEndRef.current = true;
        brushG.call(brush.move, null);
        currentSelectionRef.current = null;
        brushLabelL.attr("display", "none");
        brushLabelR.attr("display", "none");
      },
    };

    // ── Feature 1: Crosshair mousemove ──
    const bisect = d3.bisector((d) => d.date).left;
    brushG.select(".overlay")
      .on("mousemove", function (event) {
        crosshairG.style("display", null);
        const [mx] = d3.pointer(event);
        const x0 = x.invert(mx);
        const i = bisect(parsed, x0, 1);
        const dL = parsed[Math.max(0, i - 1)], dR = parsed[Math.min(i, parsed.length - 1)];
        const ci = dR && (x0 - dL.date > dR.date - x0) ? Math.min(i, parsed.length - 1) : Math.max(0, i - 1);
        const d = parsed[ci];
        if (!d) return;
        const cx = x(d.date);
        crosshairG.select(".ch-line").attr("x1", cx).attr("x2", cx);
        activeIndicators.forEach((ind, di) => {
          const yVal = mode === "zscore"
            ? sharedY(zScoreLookup[ind.key][ci])
            : (seriesData[di]?.yScale(d[ind.key]) ?? 0);
          chDots[di].attr("cx", cx).attr("cy", yVal);
        });
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const scale = rect.width / WIDTH;
          setHoverInfo({
            screenX: rect.left + (MARGIN.left + cx) * scale,
            screenY: rect.top + MARGIN.top * scale,
            date: d.date, VIX: d.VIX, yield_spread: d.yield_spread, credit_spread: d.credit_spread,
          });
        }
      })
      .on("mouseleave", function () { crosshairG.style("display", "none"); setHoverInfo(null); });

  }, [data, activeKeys, mode, countryData, countryName]); // eslint-disable-line

  // ── Feature 6: Crisis jump effect ──
  useEffect(() => {
    if (!jumpRequest || !brushMoveRef.current) return;
    brushMoveRef.current.moveTo(jumpRequest);
    setHasSelection(true);
    onBrushChange && onBrushChange(jumpRequest);
    setJumpRequest(null);
  }, [jumpRequest]); // eslint-disable-line

  const handleClear = () => {
    brushMoveRef.current?.clear();
    setHasSelection(false);
    onBrushChange && onBrushChange(null);
  };

  const toggleKey = (key) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  };

  return (
    <div>
      {/* ── Feature 6: Crisis quick-jump bar ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", color: "#546e7a", marginRight: 2 }}>Jump to:</span>
        {CRISIS_PRESETS.map((c) => (
          <button key={c.label}
            onClick={() => setJumpRequest([c.start, c.end])}
            style={{
              background: "rgba(255,213,79,0.07)", border: "1px solid rgba(255,213,79,0.3)",
              color: "#ffd54f", borderRadius: 4, padding: "2px 9px",
              fontSize: "0.72rem", cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,213,79,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,213,79,0.07)")}
          >
            {c.label}
          </button>
        ))}
        {hasSelection && (
          <button onClick={handleClear}
            style={{
              marginLeft: 4, background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.35)",
              color: "#ef9a9a", borderRadius: 4, padding: "2px 9px",
              fontSize: "0.72rem", cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,83,80,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,83,80,0.1)")}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="controls-row" style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {INDICATORS.map((ind) => (
            <label key={ind.key} style={{
              display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
              fontSize: "0.78rem", color: activeKeys.has(ind.key) ? ind.color : "#3a4060",
              transition: "color 0.15s",
            }}>
              <input type="checkbox" checked={activeKeys.has(ind.key)} onChange={() => toggleKey(ind.key)}
                style={{ accentColor: ind.color, cursor: "pointer" }} />
              {ind.label}
            </label>
          ))}
          {countryName && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: "#ffd54f" }}>
              <svg width={16} height={8}><line x1={0} y1={4} x2={16} y2={4} stroke="#ffd54f" strokeWidth={2} strokeDasharray="4,2" /></svg>
              {countryName} returns
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["raw", "zscore"].map((m) => (
            <button key={m} className={`asset-btn ${mode === m ? "active" : ""}`}
              onClick={() => setMode(m)} style={{ fontSize: "0.72rem", padding: "3px 10px" }}>
              {m === "raw" ? "Raw" : "Z-Score"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: "0.7rem", color: "#3a4060", marginBottom: 4, fontStyle: "italic" }}>
        Drag to select a time window — updates map &amp; heatmap · Click a country on the map to overlay its returns
      </div>

      <div ref={containerRef} style={{ position: "relative" }}>
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ display: "block" }} />
      </div>

      {/* Crosshair tooltip */}
      {hoverInfo && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", left: hoverInfo.screenX + 14, top: hoverInfo.screenY + 4,
          background: "rgba(10,14,30,0.93)", border: "1px solid #3a4060",
          borderRadius: 6, padding: "7px 11px", fontSize: "12px",
          pointerEvents: "none", zIndex: 9999, minWidth: 140,
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}>
          <div style={{ color: "#9fa8da", fontWeight: 700, marginBottom: 5, fontSize: "0.75rem" }}>
            {d3.timeFormat("%b %Y")(hoverInfo.date)}
          </div>
          {activeKeys.has("VIX") && (
            <div style={{ color: "#ef5350", marginBottom: 2 }}>VIX: <strong>{hoverInfo.VIX.toFixed(1)}</strong></div>
          )}
          {activeKeys.has("yield_spread") && (
            <div style={{ color: "#42a5f5", marginBottom: 2 }}>Yield Spread: <strong>{hoverInfo.yield_spread.toFixed(2)}%</strong></div>
          )}
          {activeKeys.has("credit_spread") && (
            <div style={{ color: "#66bb6a" }}>Credit Spread: <strong>{hoverInfo.credit_spread.toFixed(0)} bps</strong></div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
