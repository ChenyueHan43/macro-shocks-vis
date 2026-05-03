import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const INDICATORS = [
  { key: "VIX", label: "VIX", color: "#ef5350" },
  { key: "yield_spread", label: "Yield Spread", color: "#42a5f5" },
  { key: "credit_spread", label: "Credit Spread", color: "#66bb6a" },
];

const CRISES = [
  { name: "Black Monday", date: "1987-10-01" },
  { name: "Asian Crisis", date: "1997-07-01" },
  { name: "Dot-com", date: "2000-03-01" },
  { name: "GFC", date: "2008-09-01" },
  { name: "COVID-19", date: "2020-03-01" },
];

const MARGIN = { top: 24, right: 24, bottom: 36, left: 44 };
const WIDTH = 900;
const HEIGHT = 240;

function zScore(values) {
  const mean = d3.mean(values);
  const std = d3.deviation(values) || 1;
  return values.map((v) => (v - mean) / std);
}

export function TimeSeriesChart({ data, onBrushChange }) {
  const svgRef = useRef(null);
  const [activeKeys, setActiveKeys] = useState(
    new Set(["VIX", "yield_spread", "credit_spread"])
  );
  const [mode, setMode] = useState("zscore");

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const parseDate = d3.timeParse("%Y-%m-%d");
    const parsed = data
      .map((d) => ({
        date: parseDate(d.date),
        VIX: +d.VIX,
        yield_spread: +d.yield_spread,
        credit_spread: +d.credit_spread,
        shock_event: d.shock_event,
      }))
      .filter((d) => d.date);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(parsed, (d) => d.date))
      .range([0, innerW]);

    const activeIndicators = INDICATORS.filter((ind) =>
      activeKeys.has(ind.key)
    );

    // Build series — per-indicator y-scales in raw mode, shared z-score in zscore mode
    const seriesData = activeIndicators.map((ind) => {
      const raw = parsed.map((d) => ({ date: d.date, value: d[ind.key] }));
      if (mode === "zscore") {
        const zs = zScore(raw.map((d) => d.value));
        return {
          ...ind,
          values: raw.map((d, i) => ({ date: d.date, value: zs[i] })),
          yScale: null, // set below
        };
      }
      const yScale = d3
        .scaleLinear()
        .domain(d3.extent(raw, (d) => d.value))
        .nice()
        .range([innerH, 0]);
      return { ...ind, values: raw, yScale };
    });

    // Shared y for z-score mode
    let sharedY = null;
    if (mode === "zscore") {
      const allVals = seriesData.flatMap((s) => s.values.map((d) => d.value));
      sharedY = d3
        .scaleLinear()
        .domain(d3.extent(allVals))
        .nice()
        .range([innerH, 0]);
    }

    // Grid lines (use first available y)
    const gridY = sharedY || (seriesData[0]?.yScale ?? d3.scaleLinear().range([innerH, 0]));
    g.append("g")
      .call(d3.axisLeft(gridY).tickSize(-innerW).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#1e2540")
      .attr("stroke-dasharray", "2,3");
    g.select(".domain").remove();

    // Crisis annotations
    const parseCrisis = d3.timeParse("%Y-%m-%d");
    CRISES.forEach((crisis, ci) => {
      const cx = x(parseCrisis(crisis.date));
      if (cx < 0 || cx > innerW) return;
      g.append("line")
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "rgba(255,213,79,0.25)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3");
      // Stagger labels to avoid overlap
      g.append("text")
        .attr("x", cx + 3)
        .attr("y", ci % 2 === 0 ? 9 : 20)
        .attr("fill", "#ffd54f")
        .attr("font-size", "9px")
        .attr("pointer-events", "none")
        .text(crisis.name);
    });

    // Draw lines
    seriesData.forEach((series) => {
      const y = sharedY ?? series.yScale;
      const lineGen = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.value))
        .defined((d) => !isNaN(d.value))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", series.color)
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.9)
        .attr("d", lineGen);
    });

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)).tickFormat(d3.timeFormat("%Y")))
      .call((a) => {
        a.selectAll("text").attr("fill", "#7986cb").attr("font-size", "10px");
        a.selectAll(".tick line, .domain").attr("stroke", "#2a3050");
      });

    // Y Axis
    if (sharedY) {
      g.append("g")
        .call(d3.axisLeft(sharedY).ticks(5))
        .call((a) => {
          a.selectAll("text").attr("fill", "#7986cb").attr("font-size", "10px");
          a.selectAll(".tick line, .domain").attr("stroke", "#2a3050");
        });
    }

    // Y label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -36)
      .attr("text-anchor", "middle")
      .attr("fill", "#546e7a")
      .attr("font-size", "9px")
      .text(mode === "zscore" ? "Z-Score (σ)" : "Value (per-series scale)");

    // Brush
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerW, innerH],
      ])
      .on("end", function (event) {
        if (!event.selection) {
          onBrushChange && onBrushChange(null);
          return;
        }
        const [x0, x1] = event.selection.map((px) => x.invert(px));
        onBrushChange && onBrushChange([x0, x1]);
      });

    const brushG = g.append("g").attr("class", "brush").call(brush);
    brushG.select(".selection")
      .attr("fill", "rgba(92,107,192,0.15)")
      .attr("stroke", "#5c6bc0")
      .attr("stroke-width", 1);
    brushG.selectAll(".handle").attr("fill", "#5c6bc0");

  }, [data, activeKeys, mode]);

  const toggleKey = (key) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // keep at least one
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="controls-row" style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {INDICATORS.map((ind) => (
            <label
              key={ind.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                cursor: "pointer",
                fontSize: "0.78rem",
                color: activeKeys.has(ind.key) ? ind.color : "#3a4060",
                transition: "color 0.15s",
              }}
            >
              <input
                type="checkbox"
                checked={activeKeys.has(ind.key)}
                onChange={() => toggleKey(ind.key)}
                style={{ accentColor: ind.color, cursor: "pointer" }}
              />
              {ind.label}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["raw", "zscore"].map((m) => (
            <button
              key={m}
              className={`asset-btn ${mode === m ? "active" : ""}`}
              onClick={() => setMode(m)}
              style={{ fontSize: "0.72rem", padding: "3px 10px" }}
            >
              {m === "raw" ? "Raw" : "Z-Score"}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          color: "#3a4060",
          marginBottom: 4,
          fontStyle: "italic",
        }}
      >
        Drag to select a time window — updates map &amp; heatmap below
      </div>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ display: "block" }}
      />
    </div>
  );
}
