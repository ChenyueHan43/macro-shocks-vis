import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
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
  equities: "Equities", bonds: "Bonds", real_estate: "Real Estate",
  commodities: "Commodities", cash: "Cash",
};

const MACRO_LABEL = {
  gdp_growth: "GDP Growth", inflation: "Inflation", policy_rate: "Policy Rate",
  unemployment: "Unemployment", current_account: "Current Account", debt_to_gdp: "Debt/GDP",
  fx_change: "FX Change", biz_confidence: "Biz. Confidence", fin_stress_idx: "Fin. Stress",
};

// Contextual descriptions for each macro × asset combination
const DESCRIPTIONS = {
  gdp_growth: {
    equities: ["Economic expansion fuels corporate earnings — equities typically thrive in growth regimes.", "Negative link may reflect tightening cycles where growth triggers rate hikes that compress valuations."],
    bonds: ["Growth and bonds rarely rise together; may reflect a short-term safe-haven rotation.", "Classic: strong growth lifts rate expectations, pushing bond prices down."],
    commodities: ["Booming economies drive raw material demand — commodity prices tend to follow growth.", "Supply shocks or currency dynamics may be overriding the demand signal."],
    real_estate: ["GDP growth underpins real estate via income gains and credit expansion.", "High growth with weak real estate may signal credit tightening or supply-side constraints."],
    cash: ["Unusual — growth typically rotates capital away from cash into riskier assets.", "Growth tilts investors toward equities and away from low-yield cash."],
  },
  inflation: {
    equities: ["Mild inflation may reflect healthy demand, momentarily supporting equities.", "High inflation erodes margins and raises discount rates, compressing equity valuations."],
    bonds: ["Unusual — inflation and bond prices rising together rarely persists.", "Classic: inflation erodes fixed-income real returns as nominal yields rise."],
    commodities: ["Commodities are a textbook inflation hedge — prices tend to rise alongside CPI.", "Deflationary commodity shocks can create this unusual inverse pattern."],
    real_estate: ["Real assets often appreciate with inflation, providing a natural hedge.", "Stagflation environments can produce this unusual pairing."],
    cash: ["Higher inflation briefly raises nominal rates, temporarily lifting cash yields.", "Inflation steadily erodes the purchasing power of cash holdings."],
  },
  fin_stress_idx: {
    equities: ["Unusual — may reflect post-stress recovery pricing or sector-specific dynamics.", "Financial stress triggers broad risk-off selling — equities are among the first casualties."],
    bonds: ["Classic flight-to-quality: stress drives investors into government bonds as safe havens.", "Unusual — credit spread blowouts may overwhelm the safe-haven bond effect."],
    commodities: ["Rare positive link — stress normally crushes commodity demand.", "Risk-off during crises reduces commodity exposure and industrial demand."],
    real_estate: ["Unusual — financial stress typically freezes credit and depresses property values.", "Financial stress dries up mortgage credit, triggering sharp real estate corrections."],
    cash: ["Textbook crisis response: financial stress drives a flight to cash and liquidity hoarding.", "Unusual — may reflect inflationary stress where cash is avoided."],
  },
  policy_rate: {
    equities: ["Rate hikes alongside equity gains can reflect a strong late-cycle economic regime.", "Higher policy rates increase discount rates, directly compressing equity present values."],
    bonds: ["Unusual: rising rates with bond gains may reflect short-duration or TIPS dynamics.", "Higher rates mechanically reduce the present value of future bond cash flows."],
    commodities: ["Rate hikes with commodity gains often signal a supply-shock inflation regime.", "Higher rates strengthen currency, reducing demand for USD-priced commodities."],
    real_estate: ["Rare — real estate typically suffers as mortgage and financing costs rise.", "Policy rate hikes raise borrowing costs, cooling property demand and prices."],
    cash: ["Higher policy rates directly boost returns on money markets and cash instruments.", "Unusual — may reflect unconventional near-zero rate environments."],
  },
  unemployment: {
    equities: ["Unusual — may reflect lagged cycle effects or sector-specific labor dynamics.", "High unemployment signals weak consumer demand and deteriorating corporate earnings."],
    bonds: ["High unemployment triggers dovish policy expectations, supporting bond prices.", "Rare — may reflect stagflationary episodes where bonds also suffer."],
    commodities: ["Unusual — joblessness typically suppresses industrial commodity demand.", "Weak labor markets reduce manufacturing activity and commodity consumption."],
    real_estate: ["Unusual — unemployment usually impairs mortgage capacity and housing demand.", "Job losses reduce household income and access to mortgage credit."],
    cash: ["Safety-seeking during downturns can boost cash allocations.", "Unusual — low unemployment typically reduces precautionary cash preference."],
  },
  current_account: {
    equities: ["Surplus countries attract capital inflows that can lift equity markets.", "Current account deficits may signal FX vulnerability, weighing on equity sentiment."],
    bonds: ["Surplus nations accumulate foreign reserves often held in bonds.", "Mixed relationship — trade dynamics rarely dominate bond pricing directly."],
    commodities: ["Commodity-exporting nations naturally show current account surpluses and high commodity prices.", "Service-driven surplus economies may not track commodity prices closely."],
    real_estate: ["Capital inflows from external surpluses can drive property price inflation.", "Deficit countries may draw down reserves rather than invest in real estate."],
    cash: ["Surplus economies accumulate FX reserves, often held in cash-equivalent instruments.", "Deficit countries may draw down cash reserves to fund external imbalances."],
  },
  debt_to_gdp: {
    equities: ["High debt with rising stocks may reflect a leveraged boom or financial repression.", "Fiscal stress from high debt undermines confidence and crowds out private investment."],
    bonds: ["Unusual — heavy government issuance can pressure bond prices upward in yield.", "High debt is classically associated with rising bond yields as solvency risk rises."],
    commodities: ["Commodity booms can drive both debt accumulation and high commodity prices.", "Fiscal austerity following debt crises suppresses demand and commodity prices."],
    real_estate: ["Debt-financed housing booms create a natural positive link.", "Debt overhangs historically precede real estate corrections and busts."],
    cash: ["Fiscal uncertainty may prompt precautionary saving and cash hoarding.", "Unusual dynamic — highly indebted economies typically crowd out safe returns."],
  },
  fx_change: {
    equities: ["Currency appreciation often reflects strong fundamentals, coinciding with equity gains.", "A stronger local currency hurts export competitiveness and multinational earnings."],
    bonds: ["Currency strength reduces import inflation, supporting domestic bond valuations.", "FX depreciation raises import prices and bond yield expectations."],
    commodities: ["Unusual — currency appreciation typically lowers USD-priced commodity costs for importers.", "USD-denominated commodities fall in local currency terms when the USD strengthens."],
    real_estate: ["Currency appreciation attracts foreign real estate investment inflows.", "FX depreciation can inflate nominal property prices but destroys real value."],
    cash: ["Currency strength makes domestic cash holdings more valuable in global terms.", "FX losses can wipe out nominal cash returns for foreign investors."],
  },
  biz_confidence: {
    equities: ["Business confidence is a leading indicator — high confidence directly lifts equity markets.", "Unusual — may reflect contrarian late-cycle dynamics or sentiment divergence."],
    bonds: ["Strong business confidence reduces safe-haven demand for government bonds.", "Rare — confidence usually steers capital toward equities, not bonds."],
    commodities: ["Confident businesses invest in capacity expansion, driving raw material demand.", "Supply factors or global dynamics may override domestic confidence signals."],
    real_estate: ["Business confidence drives commercial real estate demand and investment.", "Unusual — confidence typically supports real estate; may reflect sector-specific stress."],
    cash: ["Rare — high confidence typically rotates capital away from cash into productive assets.", "Low confidence drives precautionary cash accumulation."],
  },
};

function getCellDesc(macroVar, assetClass, corr) {
  if (corr === undefined || isNaN(corr)) return null;
  const arr = DESCRIPTIONS[macroVar]?.[assetClass];
  if (!arr) return `${corr >= 0 ? "Positive" : "Negative"} correlation between ${MACRO_LABEL[macroVar]} and ${ASSET_LABEL[assetClass]}.`;
  return arr[corr >= 0 ? 0 : 1];
}

const CELL_W = 64;
const CELL_H = 30;
const LABEL_W = 110;
const LABEL_H = 30;
const PAD_B = 28;

export function CorrelationHeatmap({ data, brushYears, selectedYear, onCountryGroupChange }) {
  const [devLevel, setDevLevel] = useState("all");
  const [sparkline, setSparkline] = useState(null);
  const [cellTooltip, setCellTooltip] = useState(null); // {x, y, macroVar, assetClass, corr}

  const groups = [
    { value: "all", label: "All" },
    { value: "developed", label: "Developed" },
    { value: "emerging", label: "Emerging" },
  ];

  const handleGroupChange = (val) => {
    setDevLevel(val);
    onCountryGroupChange && onCountryGroupChange(val);
  };

  const matrix = useMemo(() => {
    if (!data) return {};
    let filtered = data.filter((d) => d.dev_level === devLevel);
    if (brushYears) {
      const [y0, y1] = brushYears;
      filtered = filtered.filter((d) => +d.year >= y0 && +d.year <= y1);
    } else if (selectedYear) {
      filtered = filtered.filter((d) => +d.year === selectedYear);
    }
    const sums = {}, counts = {};
    filtered.forEach((d) => {
      const k = `${d.macro_var}__${d.asset_class}`;
      sums[k] = (sums[k] || 0) + +d.correlation;
      counts[k] = (counts[k] || 0) + 1;
    });
    const result = {};
    Object.keys(sums).forEach((k) => { result[k] = sums[k] / counts[k]; });
    return result;
  }, [data, devLevel, brushYears, selectedYear]);

  const sparklineData = useMemo(() => {
    if (!sparkline || !data) return null;
    const filtered = data.filter(
      (d) => d.macro_var === sparkline.macro_var && d.asset_class === sparkline.asset_class && d.dev_level === devLevel
    );
    const byYear = d3.rollup(filtered, (v) => d3.mean(v, (d) => +d.correlation), (d) => +d.year);
    return Array.from(byYear, ([year, corr]) => ({ year, corr })).sort((a, b) => a.year - b.year);
  }, [sparkline, data, devLevel]);

  const colorScale = d3.scaleDiverging([-1, 0, 1], d3.interpolateRdYlGn);
  const svgW = LABEL_W + ASSETS.length * CELL_W + 4;
  const svgH = LABEL_H + MACRO_VARS.length * CELL_H + PAD_B;

  return (
    <div>
      <div className="controls-row" style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {groups.map((g) => (
            <button key={g.value} className={`asset-btn ${devLevel === g.value ? "active" : ""}`}
              onClick={() => handleGroupChange(g.value)}
              style={{ fontSize: "0.72rem", padding: "3px 10px" }}>
              {g.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "0.7rem", color: "#ffd54f", background: "rgba(255,213,79,0.08)", border: "1px solid rgba(255,213,79,0.25)", borderRadius: 3, padding: "2px 7px" }}>
          {brushYears ? `${brushYears[0]}–${brushYears[1]}` : (selectedYear ?? "all")}
        </span>
      </div>
      <div style={{ fontSize: "0.7rem", color: "#7986cb", marginBottom: 6, fontStyle: "italic" }}>
        Hover for description · Click for 40-year trend
        {!brushYears && selectedYear < 1990 && (
          <span style={{ marginLeft: 8, color: "#ef9a9a" }}>
            — no data before 1990 (5-yr rolling window)
          </span>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg width={svgW} height={svgH} style={{ display: "block", fontFamily: "inherit" }}>
          {/* Column headers */}
          {ASSETS.map((asset, j) => (
            <text key={asset.key} x={LABEL_W + j * CELL_W + CELL_W / 2} y={LABEL_H - 8}
              textAnchor="middle" fill="#9fa8da" fontSize="10" fontWeight="600">{asset.label}</text>
          ))}

          {MACRO_VARS.map((mv, i) => {
            const rowY = LABEL_H + i * CELL_H;
            return (
              <g key={mv.key}>
                <text x={LABEL_W - 6} y={rowY + CELL_H / 2 + 4} textAnchor="end" fill="#9fa8da" fontSize="10">
                  {mv.label}
                </text>
                {ASSETS.map((asset, j) => {
                  const k = `${mv.key}__${asset.key}`;
                  const corr = matrix[k];
                  const hasVal = corr !== undefined && !isNaN(corr);
                  const fill = hasVal ? colorScale(corr) : "#1e2540";
                  const isSelected = sparkline?.macro_var === mv.key && sparkline?.asset_class === asset.key;
                  return (
                    <g key={asset.key}
                      onClick={() => setSparkline(isSelected ? null : { macro_var: mv.key, asset_class: asset.key })}
                      onMouseEnter={(e) => hasVal && setCellTooltip({ x: e.clientX, y: e.clientY, macroVar: mv.key, assetClass: asset.key, corr })}
                      onMouseLeave={() => setCellTooltip(null)}
                      style={{ cursor: "pointer" }}>
                      <rect
                        x={LABEL_W + j * CELL_W + 1} y={rowY + 1}
                        width={CELL_W - 2} height={CELL_H - 2}
                        fill={fill}
                        stroke={isSelected ? "#ffd54f" : "transparent"}
                        strokeWidth={isSelected ? 2 : 0} rx={2}
                      />
                      {hasVal && (
                        <text x={LABEL_W + j * CELL_W + CELL_W / 2} y={rowY + CELL_H / 2 + 4}
                          textAnchor="middle" fill={Math.abs(corr) > 0.4 ? "#fff" : "#1a2535"}
                          fontSize="10" fontWeight="600" pointerEvents="none">
                          {corr.toFixed(2)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          <defs>
            <linearGradient id="corrLegend" x1="0" x2="1">
              <stop offset="0%" stopColor={colorScale(-1)} />
              <stop offset="50%" stopColor={colorScale(0)} />
              <stop offset="100%" stopColor={colorScale(1)} />
            </linearGradient>
          </defs>
          <text x={LABEL_W} y={svgH - PAD_B + 8} fill="#546e7a" fontSize="9">−1</text>
          <text x={LABEL_W + (ASSETS.length * CELL_W) / 2} y={svgH - PAD_B + 8} fill="#546e7a" fontSize="9" textAnchor="middle">0</text>
          <text x={LABEL_W + ASSETS.length * CELL_W} y={svgH - PAD_B + 8} fill="#546e7a" fontSize="9" textAnchor="end">+1</text>
          <rect x={LABEL_W} y={svgH - PAD_B + 12} width={ASSETS.length * CELL_W} height={9} fill="url(#corrLegend)" rx={3} />
        </svg>
      </div>

      {/* Cell hover tooltip */}
      {cellTooltip && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", left: cellTooltip.x + 14, top: cellTooltip.y - 12,
          background: "rgba(10,14,30,0.96)", border: "1px solid #3a4060",
          borderRadius: 7, padding: "9px 13px", fontSize: "12px",
          pointerEvents: "none", zIndex: 9999, maxWidth: 230,
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        }}>
          <div style={{ fontWeight: 700, color: "#e8eaf6", marginBottom: 3, fontSize: "0.8rem" }}>
            {MACRO_LABEL[cellTooltip.macroVar]} × {ASSET_LABEL[cellTooltip.assetClass]}
          </div>
          <div style={{ color: cellTooltip.corr >= 0 ? "#66bb6a" : "#ef5350", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>
            {cellTooltip.corr >= 0 ? "+" : ""}{cellTooltip.corr.toFixed(3)}
          </div>
          <div style={{ color: "#9fa8da", fontSize: "0.72rem", lineHeight: 1.5 }}>
            {getCellDesc(cellTooltip.macroVar, cellTooltip.assetClass, cellTooltip.corr)}
          </div>
        </div>,
        document.body
      )}

      {/* Sparkline */}
      {sparkline && sparklineData && (
        <SparklinePopup data={sparklineData} macroVar={sparkline.macro_var}
          assetClass={sparkline.asset_class} brushYears={brushYears}
          selectedYear={selectedYear}
          onClose={() => setSparkline(null)} />
      )}
    </div>
  );
}

function SparklinePopup({ data, macroVar, assetClass, brushYears, selectedYear, onClose }) {
  const W = 300, H = 130;
  const m = { top: 18, right: 16, bottom: 24, left: 36 };
  const iW = W - m.left - m.right, iH = H - m.top - m.bottom;
  const years = data.map((d) => d.year);
  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, iW]);
  const y = d3.scaleLinear().domain([-1, 1]).range([iH, 0]);
  const lineGen = d3.line().x((d) => x(d.year)).y((d) => y(d.corr)).curve(d3.curveMonotoneX);
  const areaGen = d3.area().x((d) => x(d.year)).y0(y(0)).y1((d) => y(d.corr)).curve(d3.curveMonotoneX);
  const yTicks = [-1, -0.5, 0, 0.5, 1];
  const xTicks = [1985, 1995, 2005, 2015, 2024];
  const minYear = d3.min(years), maxYear = d3.max(years);
  const bx0 = brushYears ? x(Math.max(brushYears[0], minYear)) : null;
  const bx1 = brushYears ? x(Math.min(brushYears[1], maxYear)) : null;

  return (
    <div style={{ marginTop: 10, background: "#0d1117", border: "1px solid rgba(255,213,79,0.5)", borderRadius: 8, padding: "10px 14px 12px", position: "relative" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 8, right: 10, background: "transparent", border: "none", color: "#546e7a", cursor: "pointer", fontSize: "0.95rem", lineHeight: 1 }}>✕</button>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ffd54f", marginBottom: 2 }}>
        {MACRO_LABEL[macroVar]} × {ASSET_LABEL[assetClass]}
      </div>
      <div style={{ fontSize: "0.68rem", color: "#546e7a", marginBottom: 6 }}>40-year Pearson correlation trend (1985–2024)</div>
      <svg width={W} height={H} style={{ display: "block" }}>
        <g transform={`translate(${m.left},${m.top})`}>
          {brushYears && bx1 > bx0 && (
            <rect x={bx0} width={bx1 - bx0} y={0} height={iH} fill="rgba(255,213,79,0.07)" stroke="rgba(255,213,79,0.3)" strokeWidth={1} />
          )}
          <line x1={0} x2={iW} y1={y(0)} y2={y(0)} stroke="#2a3050" strokeWidth={1} />
          <path d={areaGen(data)} fill="rgba(92,107,192,0.12)" />
          <path d={lineGen(data)} fill="none" stroke="#7986cb" strokeWidth={1.8} />
          {/* Current year marker */}
          {selectedYear && !brushYears && (() => {
            const pt = data.find((d) => d.year === selectedYear);
            if (!pt) return null;
            return (
              <g>
                <line x1={x(selectedYear)} x2={x(selectedYear)} y1={0} y2={iH}
                  stroke="rgba(255,213,79,0.35)" strokeWidth={1} strokeDasharray="3,2" />
                <circle cx={x(selectedYear)} cy={y(pt.corr)} r={4}
                  fill="#ffd54f" stroke="#0d1117" strokeWidth={1.5} />
              </g>
            );
          })()}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={-3} x2={0} y1={y(t)} y2={y(t)} stroke="#2a3050" />
              <text x={-5} y={y(t) + 3} textAnchor="end" fill="#546e7a" fontSize="8">{t}</text>
            </g>
          ))}
          {xTicks.map((yr) => (
            <text key={yr} x={x(yr)} y={iH + 13} textAnchor="middle" fill="#546e7a" fontSize="8">{yr}</text>
          ))}
          <rect x={0} y={0} width={iW} height={iH} fill="none" stroke="#1e2540" strokeWidth={0.5} />
        </g>
      </svg>
    </div>
  );
}
