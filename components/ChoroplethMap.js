import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const MAP_URL =
  "https://cdn.jsdelivr.net/npm/visionscarto-world-atlas@1/world/110m.json";

function useWorldMap() {
  const [map, setMap] = useState(null);
  useEffect(() => {
    d3.json(MAP_URL).then((topoData) => {
      setMap(topojson.feature(topoData, topoData.objects.countries));
    });
  }, []);
  return map;
}

export function ChoroplethMap({
  data,
  selectedYear,
  selectedAsset,
  onCountryClick,
  highlightedIso,
  brushYears,
}) {
  const map = useWorldMap();
  const [tooltip, setTooltip] = useState(null);

  const WIDTH = 960;
  const HEIGHT = 500;

  // Build lookup from iso3 → { return_pct, shock_event }
  // When brushYears is set, average returns over that year range instead of single year
  const { returnByIso, shockByIso, colorScale } = useMemo(() => {
    if (!data) return { returnByIso: {}, shockByIso: {}, colorScale: null };

    let subset;
    if (brushYears) {
      const [y0, y1] = brushYears;
      subset = data.filter(
        (d) => +d.year >= y0 && +d.year <= y1 && d.asset === selectedAsset
      );
    } else {
      subset = data.filter(
        (d) => +d.year === +selectedYear && d.asset === selectedAsset
      );
    }

    const returnByIso = {};
    const shockByIso = {};

    if (brushYears) {
      // Average returns per country over the brushed range
      const sums = {};
      const counts = {};
      subset.forEach((d) => {
        sums[d.iso3] = (sums[d.iso3] || 0) + +d.return_pct;
        counts[d.iso3] = (counts[d.iso3] || 0) + 1;
        if (d.shock_event?.trim()) shockByIso[d.iso3] = d.shock_event.trim();
      });
      Object.keys(sums).forEach((iso) => {
        returnByIso[iso] = sums[iso] / counts[iso];
      });
    } else {
      subset.forEach((d) => {
        returnByIso[d.iso3] = +d.return_pct;
        if (d.shock_event?.trim()) shockByIso[d.iso3] = d.shock_event.trim();
      });
    }

    const values = Object.values(returnByIso);
    const maxAbs = Math.max(d3.max(values.map(Math.abs)) ?? 30, 10);

    const colorScale = d3
      .scaleDiverging([-maxAbs, 0, maxAbs], d3.interpolateRdYlGn)
      .clamp(true);

    return { returnByIso, shockByIso, colorScale };
  }, [data, selectedYear, selectedAsset, brushYears]);

  if (!map || !data) {
    return (
      <div
        style={{
          height: HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#5c6bc0",
          fontSize: "0.85rem",
        }}
      >
        Loading world map…
      </div>
    );
  }

  const projection = d3.geoNaturalEarth1().fitSize([WIDTH, HEIGHT], map);
  const path = d3.geoPath(projection);

  return (
    <div style={{ position: "relative", lineHeight: 0 }}>
      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ display: "block", maxWidth: 720 }}
      >
        {/* Ocean */}
        <path
          d={path({ type: "Sphere" })}
          fill="#1a2340"
          stroke="#2a3a5a"
          strokeWidth={0.8}
        />

        {/* Graticule */}
        <path
          d={path(d3.geoGraticule()())}
          fill="none"
          stroke="#243050"
          strokeWidth={0.4}
        />

        {/* Countries */}
        {map.features.map((feature) => {
          const iso = feature.properties.a3;
          const ret = returnByIso[iso];
          const hasData = ret !== undefined && !isNaN(ret);
          const fill = hasData ? colorScale(ret) : "#2a3050";
          const isHighlighted = highlightedIso === iso;

          return (
            <path
              key={feature.id ?? iso}
              d={path(feature)}
              fill={fill}
              stroke={isHighlighted ? "#ffd54f" : "#0f1424"}
              strokeWidth={isHighlighted ? 2 : 0.5}
              style={{ cursor: hasData ? "pointer" : "default" }}
              onMouseEnter={(e) =>
                setTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  iso,
                  name: feature.properties.name,
                  ret,
                  hasData,
                  shock: shockByIso[iso],
                })
              }
              onMouseMove={(e) =>
                setTooltip((prev) =>
                  prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                )
              }
              onMouseLeave={() => setTooltip(null)}
              onClick={() => hasData && onCountryClick && onCountryClick(iso)}
            />
          );
        })}
      </svg>

      {/* Tooltip rendered via portal to escape stacking context */}
      {tooltip && typeof document !== "undefined" && createPortal(
        <div
          className="map-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y + 16 }}
        >
          <div className="country-name">{tooltip.name || tooltip.iso}</div>
          {tooltip.hasData ? (
            <div
              className={`return-value ${tooltip.ret >= 0 ? "positive" : "negative"}`}
            >
              {tooltip.ret >= 0 ? "+" : ""}
              {tooltip.ret.toFixed(1)}%
            </div>
          ) : (
            <div style={{ fontSize: "0.75rem", color: "#546e7a" }}>
              No data
            </div>
          )}
          {tooltip.shock && (
            <div className="crisis-badge">{tooltip.shock}</div>
          )}
          {/* ── Feature 2: Mini sparkline ── */}
          {tooltip.hasData && (() => {
            const countryData = data
              .filter((d) => d.iso3 === tooltip.iso && d.asset === selectedAsset)
              .sort((a, b) => +a.year - +b.year);
            if (countryData.length < 3) return null;
            const W = 130, H = 38;
            const years = countryData.map((d) => +d.year);
            const rets = countryData.map((d) => +d.return_pct);
            const xS = d3.scaleLinear().domain([d3.min(years), d3.max(years)]).range([0, W]);
            const yS = d3.scaleLinear().domain([d3.min(rets), d3.max(rets)]).range([H, 0]);
            const lineGen = d3.line().x((d) => xS(+d.year)).y((d) => yS(+d.return_pct)).curve(d3.curveMonotoneX);
            const zeroY = yS(Math.max(d3.min(rets), 0));
            const currentPt = countryData.find((d) => +d.year === +selectedYear);
            return (
              <svg width={W} height={H} style={{ display: "block", marginTop: 7 }}>
                {/* Zero line */}
                <line x1={0} x2={W} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
                {/* Sparkline */}
                <path d={lineGen(countryData)} fill="none" stroke="#7986cb" strokeWidth={1.3} />
                {/* Current year dot */}
                {currentPt && (
                  <circle
                    cx={xS(+currentPt.year)}
                    cy={yS(+currentPt.return_pct)}
                    r={3}
                    fill="#ffd54f"
                    stroke="#0d1117"
                    strokeWidth={1}
                  />
                )}
                {/* Year labels */}
                <text x={0} y={H} fill="#546e7a" fontSize="8" dominantBaseline="auto">1985</text>
                <text x={W} y={H} fill="#546e7a" fontSize="8" textAnchor="end" dominantBaseline="auto">2024</text>
              </svg>
            );
          })()}
        </div>,
        document.body
      )}
    </div>
  );
}
