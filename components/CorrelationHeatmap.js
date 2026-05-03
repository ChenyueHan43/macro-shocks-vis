import { useState, useMemo } from "react";
import * as d3 from "d3";

const MACRO_VARS = [
  { key: "gdp_growth", label: "GDP Growth" },
  { key: "inflation", label: "Inflation" },
  { key: "policy_rate", label: "Policy Rate" },
  { key: "unemployment", label: "Unemployment" },
  { key: "current_account", label: "Current Account" },
  { key: "debt_to_gdp", label: "Debt/GDP" },
  { key: "fx_change", label: "FX Change" },
  { key: "biz_confidence", label: "Biz. Confidence" },
  { key: "fin_stress_idx", label: "Fin. Stress" },
];

const ASSETS = [
  { key: "equities", label: "Equities" },
  { key: "bonds", label: "Bonds" },
  { key: "real_estate", label: "Real Est." },
  { key: "commodities", label: "Commod." },
  { key: "cash", label: "Cash" },
];

const ASSET_LABEL = {
  equities: "Equities",
  bonds: "Bonds",
  real_estate: "Real Estate",
  commodities: "Commodities",
  cash: "Cash",
};

const MACRO_LABEL = {
  gdp_growth: "GDP Growth",
  inflation: "Inflation",
  policy_rate: "Policy Rate",
  unemployment: "Unemployment",
  current_account: "Current Account",
  debt_to_gdp: "Debt/GDP",
  fx_change: "FX Change",
  biz_confidence: "Biz. Confidence",
  fin_stress_idx: "Fin. Stress",
};

const CELL_W = 64;
const CELL_H = 30;
const LABEL_W = 110;
const LABEL_H = 30;
const PAD_B = 28; // bottom padding for legend

export function CorrelationHeatmap({ data, brushYears, onCountryGroupChange }) {
  const [devLevel, setDevLevel] = useState("all");
  const [sparkline, setSparkline] = useState(null);

  const groups = [
    { value: "all", label: "All" },
    { value: "developed", label: "Developed" },
    { value: "emerging", label: "Emerging" },
  ];

  const handleGroupChange = (val) => {
    setDevLevel(val);
    onCountryGroupChange && onCountryGroupChange(val);
  };

  // Build matrix: macro_var + asset_class -> averaged correlation for the selected filters
  const matrix = useMemo(() => {
    if (!data) return {};
    let filtered = data.filter((d) => d.dev_level === devLevel);
    if (brushYears) {
      const [y0, y1] = brushYears;
      filtered = filtered.filter((d) => +d.year >= y0 && +d.year <= y1);
    }
    const sums = {};
    const counts = {};
    filtered.forEach((d) => {
      const k = `${d.macro_var}__${d.asset_class}`;
      sums[k] = (sums[k] || 0) + +d.correlation;
      counts[k] = (counts[k] || 0) + 1;
    });
    const result = {};
    Object.keys(sums).forEach((k) => {
      result[k] = sums[k] / counts[k];
    });
    return result;
  }, [data, devLevel, brushYears]);

  // Sparkline: 40-year trend for selected cell
  const sparklineData = useMemo(() => {
    if (!sparkline || !data) return null;
    const filtered = data.filter(
      (d) =>
        d.macro_var === sparkline.macro_var &&
        d.asset_class === sparkline.asset_class &&
        d.dev_level === devLevel
    );
    const byYear = d3.rollup(
      filtered,
      (v) => d3.mean(v, (d) => +d.correlation),
      (d) => +d.year
    );
    return Array.from(byYear, ([year, corr]) => ({ year, corr })).sort(
      (a, b) => a.year - b.year
    );
  }, [sparkline, data, devLevel]);

  const colorScale = d3.scaleDiverging([-1, 0, 1], d3.interpolateRdYlGn);

  const svgW = LABEL_W + ASSETS.length * CELL_W + 4;
  const svgH = LABEL_H + MACRO_VARS.length * CELL_H + PAD_B;

  return (
    <div>
      {/* Controls */}
      <div className="controls-row" style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {groups.map((g) => (
            <button
              key={g.value}
              className={`asset-btn ${devLevel === g.value ? "active" : ""}`}
              onClick={() => handleGroupChange(g.value)}
              style={{ fontSize: "0.72rem", padding: "3px 10px" }}
            >
              {g.label}
            </button>
          ))}
        </div>
        {brushYears && (
          <span
            style={{
              fontSize: "0.7rem",
              color: "#ffd54f",
              background: "rgba(255,213,79,0.08)",
              border: "1px solid rgba(255,213,79,0.25)",
              borderRadius: 3,
              padding: "2px 7px",
            }}
          >
            {brushYears[0]}–{brushYears[1]}
          </span>
        )}
      </div>
      <div
        style={{ fontSize: "0.7rem", color: "#3a4060", marginBottom: 6, fontStyle: "italic" }}
      >
        Click any cell for 40-year trend
      </div>

      {/* Heatmap */}
      <div style={{ overflowX: "auto" }}>
        <svg
          width={svgW}
          height={svgH}
          style={{ display: "block", fontFamily: "inherit" }}
        >
          {/* Column headers */}
          {ASSETS.map((asset, j) => (
            <text
              key={asset.key}
              x={LABEL_W + j * CELL_W + CELL_W / 2}
              y={LABEL_H - 8}
              textAnchor="middle"
              fill="#9fa8da"
              fontSize="10"
              fontWeight="600"
            >
              {asset.label}
            </text>
          ))}

          {/* Rows */}
          {MACRO_VARS.map((mv, i) => {
            const rowY = LABEL_H + i * CELL_H;
            return (
              <g key={mv.key}>
                {/* Row label */}
                <text
                  x={LABEL_W - 6}
                  y={rowY + CELL_H / 2 + 4}
                  textAnchor="end"
                  fill="#9fa8da"
                  fontSize="10"
                >
                  {mv.label}
                </text>

                {/* Cells */}
                {ASSETS.map((asset, j) => {
                  const k = `${mv.key}__${asset.key}`;
                  const corr = matrix[k];
                  const hasVal = corr !== undefined && !isNaN(corr);
                  const fill = hasVal ? colorScale(corr) : "#1e2540";
                  const isSelected =
                    sparkline?.macro_var === mv.key &&
                    sparkline?.asset_class === asset.key;
                  const textCol =
                    hasVal && Math.abs(corr) > 0.45 ? "#fff" : "#ccc";

                  return (
                    <g
                      key={asset.key}
                      onClick={() =>
                        setSparkline(
                          isSelected
                            ? null
                            : { macro_var: mv.key, asset_class: asset.key }
                        )
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={LABEL_W + j * CELL_W + 1}
                        y={rowY + 1}
                        width={CELL_W - 2}
                        height={CELL_H - 2}
                        fill={fill}
                        stroke={isSelected ? "#ffd54f" : "transparent"}
                        strokeWidth={isSelected ? 2 : 0}
                        rx={2}
                      />
                      {hasVal && (
                        <text
                          x={LABEL_W + j * CELL_W + CELL_W / 2}
                          y={rowY + CELL_H / 2 + 4}
                          textAnchor="middle"
                          fill={textCol}
                          fontSize="10"
                          fontWeight="600"
                          pointerEvents="none"
                        >
                          {corr.toFixed(2)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Legend */}
          <defs>
            <linearGradient id="corrLegend" x1="0" x2="1">
              <stop offset="0%" stopColor={colorScale(-1)} />
              <stop offset="50%" stopColor={colorScale(0)} />
              <stop offset="100%" stopColor={colorScale(1)} />
            </linearGradient>
          </defs>
          <text
            x={LABEL_W}
            y={svgH - PAD_B + 8}
            fill="#546e7a"
            fontSize="9"
          >
            −1
          </text>
          <text
            x={LABEL_W + (ASSETS.length * CELL_W) / 2}
            y={svgH - PAD_B + 8}
            fill="#546e7a"
            fontSize="9"
            textAnchor="middle"
          >
            0
          </text>
          <text
            x={LABEL_W + ASSETS.length * CELL_W}
            y={svgH - PAD_B + 8}
            fill="#546e7a"
            fontSize="9"
            textAnchor="end"
          >
            +1
          </text>
          <rect
            x={LABEL_W}
            y={svgH - PAD_B + 12}
            width={ASSETS.length * CELL_W}
            height={9}
            fill="url(#corrLegend)"
            rx={3}
          />
        </svg>
      </div>

      {/* Sparkline */}
      {sparkline && sparklineData && (
        <SparklinePopup
          data={sparklineData}
          macroVar={sparkline.macro_var}
          assetClass={sparkline.asset_class}
          brushYears={brushYears}
          onClose={() => setSparkline(null)}
        />
      )}
    </div>
  );
}

function SparklinePopup({ data, macroVar, assetClass, brushYears, onClose }) {
  const W = 300;
  const H = 130;
  const m = { top: 18, right: 16, bottom: 24, left: 36 };
  const iW = W - m.left - m.right;
  const iH = H - m.top - m.bottom;

  const years = data.map((d) => d.year);
  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, iW]);
  const y = d3.scaleLinear().domain([-1, 1]).range([iH, 0]);

  const lineGen = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.corr))
    .curve(d3.curveMonotoneX);

  const areaGen = d3
    .area()
    .x((d) => x(d.year))
    .y0(y(0))
    .y1((d) => y(d.corr))
    .curve(d3.curveMonotoneX);

  const yTicks = [-1, -0.5, 0, 0.5, 1];
  const xTicks = [1985, 1995, 2005, 2015, 2024];

  // Compute brush highlight bounds clamped to data range
  const minYear = d3.min(years);
  const maxYear = d3.max(years);
  const bx0 = brushYears ? x(Math.max(brushYears[0], minYear)) : null;
  const bx1 = brushYears ? x(Math.min(brushYears[1], maxYear)) : null;

  return (
    <div
      style={{
        marginTop: 10,
        background: "#0d1117",
        border: "1px solid rgba(255,213,79,0.5)",
        borderRadius: 8,
        padding: "10px 14px 12px",
        position: "relative",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          background: "transparent",
          border: "none",
          color: "#546e7a",
          cursor: "pointer",
          fontSize: "0.95rem",
          lineHeight: 1,
        }}
      >
        ✕
      </button>
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 700,
          color: "#ffd54f",
          marginBottom: 2,
        }}
      >
        {MACRO_LABEL[macroVar]} × {ASSET_LABEL[assetClass]}
      </div>
      <div
        style={{ fontSize: "0.68rem", color: "#546e7a", marginBottom: 6 }}
      >
        40-year Pearson correlation trend (1985–2024)
      </div>
      <svg width={W} height={H} style={{ display: "block" }}>
        <g transform={`translate(${m.left},${m.top})`}>
          {/* Brush highlight */}
          {brushYears && bx1 > bx0 && (
            <rect
              x={bx0}
              width={bx1 - bx0}
              y={0}
              height={iH}
              fill="rgba(255,213,79,0.07)"
              stroke="rgba(255,213,79,0.3)"
              strokeWidth={1}
            />
          )}

          {/* Zero line */}
          <line
            x1={0}
            x2={iW}
            y1={y(0)}
            y2={y(0)}
            stroke="#2a3050"
            strokeWidth={1}
          />

          {/* Area fill */}
          <path d={areaGen(data)} fill="rgba(92,107,192,0.12)" />

          {/* Line */}
          <path
            d={lineGen(data)}
            fill="none"
            stroke="#7986cb"
            strokeWidth={1.8}
          />

          {/* Y ticks */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={-3}
                x2={0}
                y1={y(t)}
                y2={y(t)}
                stroke="#2a3050"
              />
              <text
                x={-5}
                y={y(t) + 3}
                textAnchor="end"
                fill="#546e7a"
                fontSize="8"
              >
                {t}
              </text>
            </g>
          ))}

          {/* X ticks */}
          {xTicks.map((yr) => (
            <text
              key={yr}
              x={x(yr)}
              y={iH + 13}
              textAnchor="middle"
              fill="#546e7a"
              fontSize="8"
            >
              {yr}
            </text>
          ))}

          {/* Border */}
          <rect
            x={0}
            y={0}
            width={iW}
            height={iH}
            fill="none"
            stroke="#1e2540"
            strokeWidth={0.5}
          />
        </g>
      </svg>
    </div>
  );
}
