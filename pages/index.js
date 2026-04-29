import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { ChoroplethMap } from "../components/ChoroplethMap";
import { MapLegend } from "../components/MapLegend";

const ASSETS = [
  { value: "equities", label: "Equities" },
  { value: "bonds", label: "Bonds" },
  { value: "real_estate", label: "Real Estate" },
  { value: "commodities", label: "Commodities" },
  { value: "cash", label: "Cash" },
];

const MIN_YEAR = 1985;
const MAX_YEAR = 2024;

function useCSV(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    d3.csv(path).then(setData);
  }, [path]);
  return data;
}

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(2008);
  const [selectedAsset, setSelectedAsset] = useState("equities");
  const [highlightedIso, setHighlightedIso] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef(null);

  const annualData = useCSV("/data/annual_returns.csv");

  // Animation logic
  useEffect(() => {
    if (isAnimating) {
      animRef.current = setInterval(() => {
        setSelectedYear((y) => {
          if (y >= MAX_YEAR) {
            setIsAnimating(false);
            return MIN_YEAR;
          }
          return y + 1;
        });
      }, 400);
    } else {
      clearInterval(animRef.current);
    }
    return () => clearInterval(animRef.current);
  }, [isAnimating]);

  // Find crisis event for selected year (any country)
  const crisisThisYear = annualData
    ? [...new Set(
        annualData
          .filter((d) => +d.year === selectedYear && d.shock_event?.trim())
          .map((d) => d.shock_event.trim())
      )]
    : [];

  // Compute maxAbs for the legend (consistent with the map)
  const maxAbs = (() => {
    if (!annualData) return 50;
    const vals = annualData
      .filter((d) => +d.year === selectedYear && d.asset === selectedAsset)
      .map((d) => Math.abs(+d.return_pct));
    return Math.max(d3.max(vals) ?? 30, 10);
  })();

  return (
    <div>
      {/* Header */}
      <div className="app-header">
        <h1>Global Macro Shocks: 1985 – 2024</h1>
        <p>
          40-year interactive visualization of economic crises across 30
          countries
        </p>
      </div>

      {/* View 1 — Choropleth Map */}
      <div className="view-panel">
        <div className="view-title">View 1 — Geographic Asset Returns</div>

        {/* Controls row */}
        <div className="controls-row">
          {/* Asset selector */}
          <div style={{ display: "flex", gap: 6 }}>
            {ASSETS.map((a) => (
              <button
                key={a.value}
                className={`asset-btn ${selectedAsset === a.value ? "active" : ""}`}
                onClick={() => setSelectedAsset(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Year slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="year-label">{MIN_YEAR}</span>
            <input
              type="range"
              className="year-slider"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={selectedYear}
              onChange={(e) => setSelectedYear(+e.target.value)}
            />
            <span className="year-label">{MAX_YEAR}</span>
            <span className="year-value">{selectedYear}</span>
            <button
              className="animate-btn"
              onClick={() => setIsAnimating((v) => !v)}
            >
              {isAnimating ? "⏸ Pause" : "▶ Play"}
            </button>
          </div>
        </div>

        {/* Crisis badge */}
        {crisisThisYear.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {crisisThisYear.map((c) => (
              <span
                key={c}
                style={{
                  display: "inline-block",
                  background: "rgba(255,213,79,0.15)",
                  border: "1px solid rgba(255,213,79,0.4)",
                  color: "#ffd54f",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: "0.76rem",
                  marginRight: 6,
                }}
              >
                ⚠ {c}
              </span>
            ))}
          </div>
        )}

        {/* Map */}
        <ChoroplethMap
          data={annualData}
          selectedYear={selectedYear}
          selectedAsset={selectedAsset}
          onCountryClick={(iso) =>
            setHighlightedIso((prev) => (prev === iso ? null : iso))
          }
          highlightedIso={highlightedIso}
        />

        {/* Legend */}
        <div style={{ marginTop: 8 }}>
          <MapLegend maxAbs={maxAbs} />
        </div>

        {/* No-data note */}
        <div
          style={{
            marginTop: 6,
            fontSize: "0.72rem",
            color: "#546e7a",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              background: "#2a3050",
              borderRadius: 2,
            }}
          />
          No data available
        </div>
      </div>

      {/* Placeholder panels for View 2 and View 3 */}
      <div style={{ display: "flex", gap: 0 }}>
        <div className="view-panel" style={{ flex: 1 }}>
          <div className="view-title">View 2 — Correlation Heatmap</div>
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3a4060",
              fontSize: "0.8rem",
            }}
          >
            Coming soon (teammate's view)
          </div>
        </div>
        <div className="view-panel" style={{ flex: 1 }}>
          <div className="view-title">View 3 — Monthly Time-Series</div>
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3a4060",
              fontSize: "0.8rem",
            }}
          >
            Coming soon (shared view)
          </div>
        </div>
      </div>
    </div>
  );
}
