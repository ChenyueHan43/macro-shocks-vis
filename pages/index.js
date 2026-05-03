import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { ChoroplethMap } from "../components/ChoroplethMap";
import { MapLegend } from "../components/MapLegend";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import { CorrelationHeatmap } from "../components/CorrelationHeatmap";

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
  const [brushRange, setBrushRange] = useState(null); // [Date, Date] | null
  const animRef = useRef(null);

  const annualData = useCSV("/data/annual_returns.csv");
  const correlationData = useCSV("/data/correlations.csv");
  const monthlyData = useCSV("/data/monthly_indicators.csv");

  // Derive integer year range from brush dates
  const brushYears = brushRange
    ? [
        brushRange[0].getFullYear(),
        brushRange[1].getFullYear(),
      ]
    : null;

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

  // Crisis event badge for selected year (only when no brush active)
  const crisisThisYear =
    !brushYears && annualData
      ? [
          ...new Set(
            annualData
              .filter((d) => +d.year === selectedYear && d.shock_event?.trim())
              .map((d) => d.shock_event.trim())
          ),
        ]
      : [];

  // Compute maxAbs for the legend
  const maxAbs = (() => {
    if (!annualData) return 50;
    if (brushYears) {
      const [y0, y1] = brushYears;
      const vals = annualData
        .filter(
          (d) =>
            +d.year >= y0 && +d.year <= y1 && d.asset === selectedAsset
        )
        .map((d) => Math.abs(+d.return_pct));
      return Math.max(d3.max(vals) ?? 30, 10);
    }
    const vals = annualData
      .filter((d) => +d.year === selectedYear && d.asset === selectedAsset)
      .map((d) => Math.abs(+d.return_pct));
    return Math.max(d3.max(vals) ?? 30, 10);
  })();

  // Highlighted country data for View 3 overlay (Feature 7)
  const highlightedCountryData = useMemo(() => {
    if (!annualData || !highlightedIso) return null;
    return annualData
      .filter((d) => d.iso3 === highlightedIso && d.asset === selectedAsset)
      .sort((a, b) => +a.year - +b.year);
  }, [annualData, highlightedIso, selectedAsset]);

  const highlightedCountryName = useMemo(() => {
    if (!annualData || !highlightedIso) return null;
    return annualData.find((d) => d.iso3 === highlightedIso)?.country ?? highlightedIso;
  }, [annualData, highlightedIso]);

  const handleBrushChange = useCallback((range) => {
    setBrushRange(range);
    if (!range) setIsAnimating(false);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="app-header">
        <h1>Global Macro Shocks: 1985 – 2024</h1>
        <p>
          40-year interactive visualization of economic crises across 30
          countries &mdash; brush the timeline to filter all views
        </p>
      </div>

      {/* Row 1: View 3 — Monthly Time-Series (full width) */}
      <div className="view-panel">
        <div className="view-title">View 3 — Monthly Panic Indicators</div>
        <TimeSeriesChart
          data={monthlyData}
          onBrushChange={handleBrushChange}
          countryData={highlightedCountryData}
          countryName={highlightedCountryName}
        />
      </div>

      {/* Row 2: View 1 (Map) + View 2 (Heatmap) */}
      <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
        {/* View 1 — Choropleth Map */}
        <div className="view-panel" style={{ flex: "1 1 520px", minWidth: 320 }}>
          <div className="view-title">
            View 1 — Geographic Asset Returns
            {brushYears && (
              <span
                style={{
                  marginLeft: 8,
                  fontWeight: 400,
                  color: "#ffd54f",
                  fontSize: "0.72rem",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                avg {brushYears[0]}–{brushYears[1]}
              </span>
            )}
          </div>

          {/* Asset selector */}
          <div className="controls-row">
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

            {/* Year slider — disabled while brush is active */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: brushYears ? 0.4 : 1,
                pointerEvents: brushYears ? "none" : "auto",
              }}
            >
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
                <span key={c} className="crisis-badge-global">
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
            brushYears={brushYears}
          />

          {/* Legend */}
          <div style={{ marginTop: 8 }}>
            <MapLegend maxAbs={maxAbs} />
          </div>
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

        {/* View 2 — Correlation Heatmap */}
        <div className="view-panel" style={{ flex: "1 1 380px", minWidth: 280 }}>
          <div className="view-title">View 2 — Macro-Asset Correlation Heatmap</div>
          <CorrelationHeatmap
            data={correlationData}
            brushYears={brushYears}
            onCountryGroupChange={() => {}}
          />
        </div>
      </div>

    </div>
  );
}
