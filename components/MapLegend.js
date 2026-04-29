import * as d3 from "d3";

export function MapLegend({ maxAbs = 50, width = 240, height = 14 }) {
  const steps = 200;
  const colorScale = d3
    .scaleDiverging([-maxAbs, 0, maxAbs], d3.interpolateRdYlGn)
    .clamp(true);

  const rects = Array.from({ length: steps }, (_, i) => {
    const value = -maxAbs + (2 * maxAbs * i) / (steps - 1);
    return { x: (i / steps) * width, color: colorScale(value) };
  });

  const rectW = width / steps + 0.5;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: "0.72rem", color: "#78909c" }}>
        -{maxAbs.toFixed(0)}%
      </span>
      <svg width={width} height={height + 8}>
        <defs>
          <linearGradient id="legendGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={colorScale(-maxAbs)} />
            <stop offset="50%" stopColor={colorScale(0)} />
            <stop offset="100%" stopColor={colorScale(maxAbs)} />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#legendGrad)" rx={2} />
        {/* Zero tick */}
        <line
          x1={width / 2}
          x2={width / 2}
          y1={height}
          y2={height + 6}
          stroke="#9fa8da"
          strokeWidth={1}
        />
        <text
          x={width / 2}
          y={height + 8}
          textAnchor="middle"
          fontSize={9}
          fill="#9fa8da"
          dominantBaseline="hanging"
        >
          0%
        </text>
      </svg>
      <span style={{ fontSize: "0.72rem", color: "#78909c" }}>
        +{maxAbs.toFixed(0)}%
      </span>
    </div>
  );
}
