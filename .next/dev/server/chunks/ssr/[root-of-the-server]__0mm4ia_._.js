module.exports = [
"[project]/components/ChoroplethMap.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "ChoroplethMap",
    ()=>ChoroplethMap
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__ = __turbopack_context__.i("[externals]/d3 [external] (d3, esm_import, [project]/node_modules/d3)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$topojson$2d$client__$5b$external$5d$__$28$topojson$2d$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$topojson$2d$client$29$__ = __turbopack_context__.i("[externals]/topojson-client [external] (topojson-client, cjs, [project]/node_modules/topojson-client)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
const MAP_URL = "https://cdn.jsdelivr.net/npm/visionscarto-world-atlas@1/world/110m.json";
function useWorldMap() {
    const [map, setMap] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["json"](MAP_URL).then((topoData)=>{
            setMap(__TURBOPACK__imported__module__$5b$externals$5d2f$topojson$2d$client__$5b$external$5d$__$28$topojson$2d$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$topojson$2d$client$29$__["feature"](topoData, topoData.objects.countries));
        });
    }, []);
    return map;
}
function ChoroplethMap({ data, selectedYear, selectedAsset, onCountryClick, highlightedIso }) {
    const map = useWorldMap();
    const [tooltip, setTooltip] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const WIDTH = 960;
    const HEIGHT = 500;
    // Build lookup from iso3 → { return_pct, shock_event } for selected year+asset
    const { returnByIso, shockByIso, colorScale } = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>{
        if (!data) return {
            returnByIso: {},
            shockByIso: {},
            colorScale: null
        };
        const yearData = data.filter((d)=>+d.year === +selectedYear && d.asset === selectedAsset);
        const returnByIso = {};
        const shockByIso = {};
        yearData.forEach((d)=>{
            returnByIso[d.iso3] = +d.return_pct;
            if (d.shock_event && d.shock_event.trim()) shockByIso[d.iso3] = d.shock_event.trim();
        });
        const values = Object.values(returnByIso);
        const maxAbs = Math.max(__TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["max"](values.map(Math.abs)) ?? 30, 10);
        const colorScale = __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["scaleDiverging"]([
            -maxAbs,
            0,
            maxAbs
        ], __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["interpolateRdYlGn"]).clamp(true);
        return {
            returnByIso,
            shockByIso,
            colorScale
        };
    }, [
        data,
        selectedYear,
        selectedAsset
    ]);
    if (!map || !data) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                height: HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5c6bc0",
                fontSize: "0.85rem"
            },
            children: "Loading world map…"
        }, void 0, false, {
            fileName: "[project]/components/ChoroplethMap.js",
            lineNumber: 59,
            columnNumber: 7
        }, this);
    }
    const projection = __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["geoNaturalEarth1"]().fitSize([
        WIDTH,
        HEIGHT
    ], map);
    const path = __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["geoPath"](projection);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            position: "relative",
            lineHeight: 0
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                width: "100%",
                viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
                style: {
                    display: "block",
                    maxWidth: 720
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                        d: path({
                            type: "Sphere"
                        }),
                        fill: "#1a2340",
                        stroke: "#2a3a5a",
                        strokeWidth: 0.8
                    }, void 0, false, {
                        fileName: "[project]/components/ChoroplethMap.js",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                        d: path(__TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["geoGraticule"]()()),
                        fill: "none",
                        stroke: "#243050",
                        strokeWidth: 0.4
                    }, void 0, false, {
                        fileName: "[project]/components/ChoroplethMap.js",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    map.features.map((feature)=>{
                        const iso = feature.properties.a3;
                        const ret = returnByIso[iso];
                        const hasData = ret !== undefined && !isNaN(ret);
                        const fill = hasData ? colorScale(ret) : "#2a3050";
                        const isHighlighted = highlightedIso === iso;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                            d: path(feature),
                            fill: fill,
                            stroke: isHighlighted ? "#ffd54f" : "#0f1424",
                            strokeWidth: isHighlighted ? 2 : 0.5,
                            style: {
                                cursor: hasData ? "pointer" : "default"
                            },
                            onMouseEnter: (e)=>setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    iso,
                                    name: feature.properties.name,
                                    ret,
                                    hasData,
                                    shock: shockByIso[iso]
                                }),
                            onMouseMove: (e)=>setTooltip((prev)=>prev ? {
                                        ...prev,
                                        x: e.clientX,
                                        y: e.clientY
                                    } : null),
                            onMouseLeave: ()=>setTooltip(null),
                            onClick: ()=>hasData && onCountryClick && onCountryClick(iso)
                        }, feature.id ?? iso, false, {
                            fileName: "[project]/components/ChoroplethMap.js",
                            lineNumber: 109,
                            columnNumber: 13
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/components/ChoroplethMap.js",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            tooltip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "map-tooltip",
                style: {
                    left: tooltip.x + 14,
                    top: tooltip.y - 20
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "country-name",
                        children: tooltip.name || tooltip.iso
                    }, void 0, false, {
                        fileName: "[project]/components/ChoroplethMap.js",
                        lineNumber: 145,
                        columnNumber: 11
                    }, this),
                    tooltip.hasData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: `return-value ${tooltip.ret >= 0 ? "positive" : "negative"}`,
                        children: [
                            tooltip.ret >= 0 ? "+" : "",
                            tooltip.ret.toFixed(1),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ChoroplethMap.js",
                        lineNumber: 147,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: "0.75rem",
                            color: "#546e7a"
                        },
                        children: "No data"
                    }, void 0, false, {
                        fileName: "[project]/components/ChoroplethMap.js",
                        lineNumber: 154,
                        columnNumber: 13
                    }, this),
                    tooltip.shock && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "crisis-badge",
                        children: tooltip.shock
                    }, void 0, false, {
                        fileName: "[project]/components/ChoroplethMap.js",
                        lineNumber: 159,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ChoroplethMap.js",
                lineNumber: 141,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ChoroplethMap.js",
        lineNumber: 78,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/components/MapLegend.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "MapLegend",
    ()=>MapLegend
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__ = __turbopack_context__.i("[externals]/d3 [external] (d3, esm_import, [project]/node_modules/d3)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
function MapLegend({ maxAbs = 50, width = 240, height = 14 }) {
    const steps = 200;
    const colorScale = __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["scaleDiverging"]([
        -maxAbs,
        0,
        maxAbs
    ], __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["interpolateRdYlGn"]).clamp(true);
    const rects = Array.from({
        length: steps
    }, (_, i)=>{
        const value = -maxAbs + 2 * maxAbs * i / (steps - 1);
        return {
            x: i / steps * width,
            color: colorScale(value)
        };
    });
    const rectW = width / steps + 0.5;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            display: "flex",
            alignItems: "center",
            gap: 10
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                style: {
                    fontSize: "0.72rem",
                    color: "#78909c"
                },
                children: [
                    "-",
                    maxAbs.toFixed(0),
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/components/MapLegend.js",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                width: width,
                height: height + 8,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("linearGradient", {
                            id: "legendGrad",
                            x1: "0",
                            x2: "1",
                            y1: "0",
                            y2: "0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: colorScale(-maxAbs)
                                }, void 0, false, {
                                    fileName: "[project]/components/MapLegend.js",
                                    lineNumber: 24,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "50%",
                                    stopColor: colorScale(0)
                                }, void 0, false, {
                                    fileName: "[project]/components/MapLegend.js",
                                    lineNumber: 25,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "100%",
                                    stopColor: colorScale(maxAbs)
                                }, void 0, false, {
                                    fileName: "[project]/components/MapLegend.js",
                                    lineNumber: 26,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/MapLegend.js",
                            lineNumber: 23,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/MapLegend.js",
                        lineNumber: 22,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("rect", {
                        width: width,
                        height: height,
                        fill: "url(#legendGrad)",
                        rx: 2
                    }, void 0, false, {
                        fileName: "[project]/components/MapLegend.js",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                        x1: width / 2,
                        x2: width / 2,
                        y1: height,
                        y2: height + 6,
                        stroke: "#9fa8da",
                        strokeWidth: 1
                    }, void 0, false, {
                        fileName: "[project]/components/MapLegend.js",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                        x: width / 2,
                        y: height + 8,
                        textAnchor: "middle",
                        fontSize: 9,
                        fill: "#9fa8da",
                        dominantBaseline: "hanging",
                        children: "0%"
                    }, void 0, false, {
                        fileName: "[project]/components/MapLegend.js",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/MapLegend.js",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                style: {
                    fontSize: "0.72rem",
                    color: "#78909c"
                },
                children: [
                    "+",
                    maxAbs.toFixed(0),
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/components/MapLegend.js",
                lineNumber: 50,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/MapLegend.js",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/pages/index.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__ = __turbopack_context__.i("[externals]/d3 [external] (d3, esm_import, [project]/node_modules/d3)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ChoroplethMap$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ChoroplethMap.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$MapLegend$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/MapLegend.js [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ChoroplethMap$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$MapLegend$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ChoroplethMap$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$MapLegend$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
const ASSETS = [
    {
        value: "equities",
        label: "Equities"
    },
    {
        value: "bonds",
        label: "Bonds"
    },
    {
        value: "real_estate",
        label: "Real Estate"
    },
    {
        value: "commodities",
        label: "Commodities"
    },
    {
        value: "cash",
        label: "Cash"
    }
];
const MIN_YEAR = 1985;
const MAX_YEAR = 2024;
function useCSV(path) {
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["csv"](path).then(setData);
    }, [
        path
    ]);
    return data;
}
function Home() {
    const [selectedYear, setSelectedYear] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(2008);
    const [selectedAsset, setSelectedAsset] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("equities");
    const [highlightedIso, setHighlightedIso] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [isAnimating, setIsAnimating] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const animRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const annualData = useCSV("/data/annual_returns.csv");
    // Animation logic
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (isAnimating) {
            animRef.current = setInterval(()=>{
                setSelectedYear((y)=>{
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
        return ()=>clearInterval(animRef.current);
    }, [
        isAnimating
    ]);
    // Find crisis event for selected year (any country)
    const crisisThisYear = annualData ? [
        ...new Set(annualData.filter((d)=>+d.year === selectedYear && d.shock_event?.trim()).map((d)=>d.shock_event.trim()))
    ] : [];
    // Compute maxAbs for the legend (consistent with the map)
    const maxAbs = (()=>{
        if (!annualData) return 50;
        const vals = annualData.filter((d)=>+d.year === selectedYear && d.asset === selectedAsset).map((d)=>Math.abs(+d.return_pct));
        return Math.max(__TURBOPACK__imported__module__$5b$externals$5d2f$d3__$5b$external$5d$__$28$d3$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$d3$29$__["max"](vals) ?? 30, 10);
    })();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "app-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                        children: "Global Macro Shocks: 1985 – 2024"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: "40-year interactive visualization of economic crises across 30 countries"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.js",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "view-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "view-title",
                        children: "View 1 — Geographic Asset Returns"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "controls-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: 6
                                },
                                children: ASSETS.map((a)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        className: `asset-btn ${selectedAsset === a.value ? "active" : ""}`,
                                        onClick: ()=>setSelectedAsset(a.value),
                                        children: a.label
                                    }, a.value, false, {
                                        fileName: "[project]/pages/index.js",
                                        lineNumber: 90,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 88,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "year-label",
                                        children: MIN_YEAR
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.js",
                                        lineNumber: 102,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "range",
                                        className: "year-slider",
                                        min: MIN_YEAR,
                                        max: MAX_YEAR,
                                        value: selectedYear,
                                        onChange: (e)=>setSelectedYear(+e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.js",
                                        lineNumber: 103,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "year-label",
                                        children: MAX_YEAR
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.js",
                                        lineNumber: 111,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "year-value",
                                        children: selectedYear
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.js",
                                        lineNumber: 112,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        className: "animate-btn",
                                        onClick: ()=>setIsAnimating((v)=>!v),
                                        children: isAnimating ? "⏸ Pause" : "▶ Play"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.js",
                                        lineNumber: 113,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    crisisThisYear.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: 8
                        },
                        children: crisisThisYear.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                style: {
                                    display: "inline-block",
                                    background: "rgba(255,213,79,0.15)",
                                    border: "1px solid rgba(255,213,79,0.4)",
                                    color: "#ffd54f",
                                    borderRadius: 4,
                                    padding: "2px 8px",
                                    fontSize: "0.76rem",
                                    marginRight: 6
                                },
                                children: [
                                    "⚠ ",
                                    c
                                ]
                            }, c, true, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 126,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ChoroplethMap$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["ChoroplethMap"], {
                        data: annualData,
                        selectedYear: selectedYear,
                        selectedAsset: selectedAsset,
                        onCountryClick: (iso)=>setHighlightedIso((prev)=>prev === iso ? null : iso),
                        highlightedIso: highlightedIso
                    }, void 0, false, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 8
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$MapLegend$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["MapLegend"], {
                            maxAbs: maxAbs
                        }, void 0, false, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 158,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 6,
                            fontSize: "0.72rem",
                            color: "#546e7a",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                style: {
                                    display: "inline-block",
                                    width: 12,
                                    height: 12,
                                    background: "#2a3050",
                                    borderRadius: 2
                                }
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 172,
                                columnNumber: 11
                            }, this),
                            "No data available"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 162,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.js",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: 0
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "view-panel",
                        style: {
                            flex: 1
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "view-title",
                                children: "View 2 — Correlation Heatmap"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    height: 200,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#3a4060",
                                    fontSize: "0.8rem"
                                },
                                children: "Coming soon (teammate's view)"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "view-panel",
                        style: {
                            flex: 1
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "view-title",
                                children: "View 3 — Monthly Time-Series"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 203,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    height: 200,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#3a4060",
                                    fontSize: "0.8rem"
                                },
                                children: "Coming soon (shared view)"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 204,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.js",
                        lineNumber: 202,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.js",
                lineNumber: 186,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/index.js",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0mm4ia_._.js.map