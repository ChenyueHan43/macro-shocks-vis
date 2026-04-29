"""
Global Macro Shocks — Data Processing Pipeline  (v2 — tailored to actual dataset)
================================================
Input:  Raw CSV(s) from Kaggle dataset
        "Macro Indicators, 40 years, 30 countries"
        https://www.kaggle.com/datasets/sergionefedov/macro-indicators-40-years-30-countries

Output: Three tidy CSV files consumed by the Next.js / D3.js app
        public/data/
          ├── annual_returns.csv      → View 1  (choropleth map)
          ├── correlations.csv        → View 2  (heatmap + sparkline)
          └── monthly_indicators.csv  → View 3  (time-series line chart)

Run once, offline:
    pip install pandas numpy scipy
    python process_data.py --input ./raw --output ./public/data
"""

import argparse
import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.stats import pearsonr

# ── Configuration ─────────────────────────────────────────────────────────────

ASSET_COLS = ["Equities", "Bonds", "Real_Estate", "Commodities", "Cash"]

MACRO_COLS = [
    "GDP_Growth",
    "Inflation",
    "Policy_Rate",
    "Unemployment",
    "Current_Account",   # % of GDP
    "Debt_to_GDP",
    "FX_Change",
    "Business_Confidence",
    "Financial_Stress",
]

PANIC_INDICATORS = ["VIX", "Yield_Spread", "Credit_Spread"]

# Known macro crisis events annotated on View 3
CRISIS_EVENTS = [
    {"date": "1987-10-01", "label": "Black Monday"},
    {"date": "1994-12-01", "label": "Tequila Crisis"},
    {"date": "1997-07-01", "label": "Asian Financial Crisis"},
    {"date": "1998-08-01", "label": "Russia / LTCM"},
    {"date": "2000-03-01", "label": "Dot-com Bust"},
    {"date": "2001-09-01", "label": "9/11"},
    {"date": "2008-09-01", "label": "Global Financial Crisis"},
    {"date": "2010-05-01", "label": "Eurozone Crisis"},
    {"date": "2015-08-01", "label": "China Slowdown"},
    {"date": "2020-03-01", "label": "COVID-19"},
    {"date": "2022-02-01", "label": "Ukraine War / Rate Shock"},
]

# Country metadata: ISO-3 code + development group
COUNTRY_META = {
    "United States":    {"iso3": "USA", "group": "Developed"},
    "United Kingdom":   {"iso3": "GBR", "group": "Developed"},
    "Germany":          {"iso3": "DEU", "group": "Developed"},
    "France":           {"iso3": "FRA", "group": "Developed"},
    "Japan":            {"iso3": "JPN", "group": "Developed"},
    "Canada":           {"iso3": "CAN", "group": "Developed"},
    "Australia":        {"iso3": "AUS", "group": "Developed"},
    "Italy":            {"iso3": "ITA", "group": "Developed"},
    "Spain":            {"iso3": "ESP", "group": "Developed"},
    "Netherlands":      {"iso3": "NLD", "group": "Developed"},
    "Switzerland":      {"iso3": "CHE", "group": "Developed"},
    "Sweden":           {"iso3": "SWE", "group": "Developed"},
    "South Korea":      {"iso3": "KOR", "group": "Developed"},
    "Singapore":        {"iso3": "SGP", "group": "Developed"},
    "New Zealand":      {"iso3": "NZL", "group": "Developed"},
    "China":            {"iso3": "CHN", "group": "Emerging"},
    "India":            {"iso3": "IND", "group": "Emerging"},
    "Brazil":           {"iso3": "BRA", "group": "Emerging"},
    "Mexico":           {"iso3": "MEX", "group": "Emerging"},
    "Russia":           {"iso3": "RUS", "group": "Emerging"},
    "South Africa":     {"iso3": "ZAF", "group": "Emerging"},
    "Turkey":           {"iso3": "TUR", "group": "Emerging"},
    "Indonesia":        {"iso3": "IDN", "group": "Emerging"},
    "Thailand":         {"iso3": "THA", "group": "Emerging"},
    "Malaysia":         {"iso3": "MYS", "group": "Emerging"},
    "Poland":           {"iso3": "POL", "group": "Emerging"},
    "Argentina":        {"iso3": "ARG", "group": "Emerging"},
    "Chile":            {"iso3": "CHL", "group": "Emerging"},
    "Colombia":         {"iso3": "COL", "group": "Emerging"},
    "Nigeria":          {"iso3": "NGA", "group": "Emerging"},
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_raw(input_dir: Path) -> pd.DataFrame:
    """
    Try to load the Kaggle dataset.
    Acceptable file layouts:
      - A single CSV with columns: Country, Year, Month (optional), + asset/macro cols
      - Multiple CSVs (one per country or one per variable) — concat vertically
    Column names are normalised to snake_case and matched against ASSET_COLS / MACRO_COLS.
    """
    csv_files = sorted(input_dir.glob("*.csv"))
    if not csv_files:
        sys.exit(f"[ERROR] No CSV files found in {input_dir}")

    frames = []
    for f in csv_files:
        df = pd.read_csv(f, low_memory=False)
        df.columns = (
            df.columns.str.strip()
                      .str.replace(r"[\s\-/]+", "_", regex=True)
                      .str.replace(r"[^A-Za-z0-9_]", "", regex=True)
                      .str.title()          # Title_Case
        )
        frames.append(df)

    raw = pd.concat(frames, ignore_index=True)
    print(f"[load] Combined shape: {raw.shape}")
    print(f"[load] Columns: {list(raw.columns)}")
    return raw


def normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Map whatever column names appear in the raw data onto our canonical names.
    Edit the `aliases` dict if your CSV uses different spellings.
    """
    aliases = {
        # Country / time keys
        "Country_Name": "Country",
        "Nation": "Country",
        "Date": "Month",
        "Period": "Month",
        # Assets
        "Equity": "Equities",
        "Stock": "Equities",
        "Bond": "Bonds",
        "Fixed_Income": "Bonds",
        "Real_Estate_Return": "Real_Estate",
        "Property": "Real_Estate",
        "Commodity": "Commodities",
        "Commodities_Return": "Commodities",
        "Money_Market": "Cash",
        # Macro
        "Gdp_Growth": "GDP_Growth",
        "Gdp_Growth_Rate": "GDP_Growth",
        "Cpi_Inflation": "Inflation",
        "Inflation_Rate": "Inflation",
        "Policy_Interest_Rate": "Policy_Rate",
        "Interest_Rate": "Policy_Rate",
        "Unemployment_Rate": "Unemployment",
        "Current_Account_Balance": "Current_Account",
        "Government_Debt": "Debt_to_GDP",
        "Exchange_Rate_Change": "FX_Change",
        "Fx_Return": "FX_Change",
        "Business_Sentiment": "Business_Confidence",
        "Financial_Stress_Index": "Financial_Stress",
        # Panic indicators
        "Vix": "VIX",
        "Vix_Index": "VIX",
        "Yield_Curve_Spread": "Yield_Spread",
        "Term_Spread": "Yield_Spread",
        "Credit_Default_Spread": "Credit_Spread",
        "Oas_Spread": "Credit_Spread",
    }
    return df.rename(columns=aliases)


def parse_dates(df: pd.DataFrame) -> pd.DataFrame:
    """Add Year and Month_dt columns; handle YYYY, YYYY-MM, and YYYY-MM-DD formats."""
    if "Year" not in df.columns:
        if "Month" in df.columns:
            df["Month_dt"] = pd.to_datetime(df["Month"], infer_datetime_format=True, errors="coerce")
            df["Year"] = df["Month_dt"].dt.year
        else:
            sys.exit("[ERROR] Dataset has no 'Year' or 'Month'/'Date' column.")
    else:
        df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
        if "Month" in df.columns:
            df["Month_dt"] = pd.to_datetime(df["Month"], infer_datetime_format=True, errors="coerce")
        else:
            # Annual data — synthesise a mid-year date
            df["Month_dt"] = pd.to_datetime(df["Year"].astype(str) + "-06-01", errors="coerce")

    df = df.dropna(subset=["Year"])
    df["Year"] = df["Year"].astype(int)
    return df


def ensure_country_col(df: pd.DataFrame) -> pd.DataFrame:
    """Make sure there is a 'Country' column."""
    if "Country" not in df.columns:
        # Possibly embedded in filename or index — fall back to a placeholder
        print("[WARN] No 'Country' column found. Assuming single-country dataset.")
        df["Country"] = "Unknown"
    return df


def coerce_numeric(df: pd.DataFrame, cols: list) -> pd.DataFrame:
    for c in cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


# ── Output 1: annual_returns.csv ──────────────────────────────────────────────

def build_annual_returns(df: pd.DataFrame) -> pd.DataFrame:
    """
    One row per (Country, Year, Asset).
    Columns: country, iso3, group, year, asset, return_pct
    Used by View 1 (choropleth map).
    """
    available_assets = [c for c in ASSET_COLS if c in df.columns]
    if not available_assets:
        sys.exit("[ERROR] No asset return columns found. Check column names.")

    # Aggregate to annual if monthly data exists
    annual = (
        df.groupby(["Country", "Year"])[available_assets]
          .mean()   # mean of monthly returns within a year
          .reset_index()
    )

    # Melt to long format
    long = annual.melt(
        id_vars=["Country", "Year"],
        value_vars=available_assets,
        var_name="asset",
        value_name="return_pct",
    )

    # Attach ISO3 and group
    long["iso3"]  = long["Country"].map(lambda c: COUNTRY_META.get(c, {}).get("iso3", ""))
    long["group"] = long["Country"].map(lambda c: COUNTRY_META.get(c, {}).get("group", "Unknown"))
    long = long.rename(columns={"Country": "country", "Year": "year"})

    # Round for compact JSON
    long["return_pct"] = long["return_pct"].round(4)

    # Only keep 1985–2024
    long = long[(long["year"] >= 1985) & (long["year"] <= 2024)]

    print(f"[annual_returns] Shape: {long.shape}")
    return long[["country", "iso3", "group", "year", "asset", "return_pct"]]


# ── Output 2: correlations.csv ────────────────────────────────────────────────

def rolling_corr_series(x: pd.Series, y: pd.Series, window: int = 60) -> pd.Series:
    """
    Compute rolling Pearson correlation (month-by-month, window = 60 months = 5 years).
    Returns a Series aligned to x.index.
    """
    result = []
    for i in range(len(x)):
        if i < window - 1:
            result.append(np.nan)
        else:
            xi = x.iloc[i - window + 1 : i + 1].values
            yi = y.iloc[i - window + 1 : i + 1].values
            mask = ~(np.isnan(xi) | np.isnan(yi))
            if mask.sum() < 10:
                result.append(np.nan)
            else:
                r, _ = pearsonr(xi[mask], yi[mask])
                result.append(round(r, 4))
    return pd.Series(result, index=x.index)


def build_correlations(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rolling 5-year Pearson correlation between each (macro_var × asset) pair,
    computed for each country group + 'All'.

    Columns: group, macro_var, asset, date, correlation
    Used by View 2 (heatmap) and the sparkline drill-down.
    """
    available_assets = [c for c in ASSET_COLS if c in df.columns]
    available_macros  = [c for c in MACRO_COLS if c in df.columns]

    if not available_assets or not available_macros:
        print("[WARN] Missing asset or macro columns — correlations.csv will be empty.")
        return pd.DataFrame(columns=["group", "macro_var", "asset", "date", "correlation"])

    # Ensure monthly date column
    if "Month_dt" not in df.columns:
        df["Month_dt"] = pd.to_datetime(df["Year"].astype(str) + "-06-01")

    records = []
    groups = {"All": list(COUNTRY_META.keys()),
              "Developed": [c for c, v in COUNTRY_META.items() if v["group"] == "Developed"],
              "Emerging":  [c for c, v in COUNTRY_META.items() if v["group"] == "Emerging"]}

    for grp_name, countries in groups.items():
        subset = df[df["Country"].isin(countries)].copy()
        if subset.empty:
            continue

        # Average across countries within group → one time series per variable
        ts = (
            subset.groupby("Month_dt")[available_assets + available_macros]
                  .mean()
                  .sort_index()
        )

        for macro in available_macros:
            for asset in available_assets:
                roll = rolling_corr_series(ts[macro], ts[asset], window=60)
                for date, corr in zip(ts.index, roll):
                    if not np.isnan(corr):
                        records.append({
                            "group":       grp_name,
                            "macro_var":   macro,
                            "asset":       asset,
                            "date":        date.strftime("%Y-%m-%d"),
                            "correlation": corr,
                        })

    out = pd.DataFrame(records)
    print(f"[correlations] Shape: {out.shape}")
    return out


# ── Output 3: monthly_indicators.csv ─────────────────────────────────────────

def build_monthly_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Global (cross-country average) monthly panic indicators.

    Columns: date, VIX, Yield_Spread, Credit_Spread
    Used by View 3 (time-series line chart).
    """
    available = [c for c in PANIC_INDICATORS if c in df.columns]

    if not available:
        print("[WARN] No panic indicator columns found (VIX, Yield_Spread, Credit_Spread).")
        print("       Generating synthetic placeholder data from Financial_Stress if available.")

        if "Financial_Stress" in df.columns and "Month_dt" in df.columns:
            ts = (
                df.groupby("Month_dt")["Financial_Stress"]
                  .mean()
                  .reset_index()
                  .rename(columns={"Month_dt": "date", "Financial_Stress": "VIX"})
            )
            ts["Yield_Spread"]  = np.nan
            ts["Credit_Spread"] = np.nan
            ts["date"] = pd.to_datetime(ts["date"]).dt.strftime("%Y-%m-%d")
            ts = ts[(ts["date"] >= "1985-01-01") & (ts["date"] <= "2024-12-31")]
            print(f"[monthly_indicators] Shape (synthetic): {ts.shape}")
            return ts
        else:
            # Return empty with crisis annotations embedded as metadata
            return pd.DataFrame(columns=["date", "VIX", "Yield_Spread", "Credit_Spread"])

    if "Month_dt" not in df.columns:
        df["Month_dt"] = pd.to_datetime(df["Year"].astype(str) + "-06-01")

    ts = (
        df.groupby("Month_dt")[available]
          .mean()
          .reset_index()
          .rename(columns={"Month_dt": "date"})
    )
    ts["date"] = pd.to_datetime(ts["date"]).dt.strftime("%Y-%m-%d")

    # Ensure all three columns exist (fill missing with NaN)
    for col in PANIC_INDICATORS:
        if col not in ts.columns:
            ts[col] = np.nan

    ts = ts[(ts["date"] >= "1985-01-01") & (ts["date"] <= "2024-12-31")]
    ts = ts.sort_values("date")

    # Round
    for col in PANIC_INDICATORS:
        ts[col] = ts[col].round(4)

    print(f"[monthly_indicators] Shape: {ts.shape}")
    return ts[["date", "VIX", "Yield_Spread", "Credit_Spread"]]


# ── Output 4: crisis_events.json (bonus) ─────────────────────────────────────

def write_crisis_events(output_dir: Path):
    import json
    path = output_dir / "crisis_events.json"
    with open(path, "w") as f:
        json.dump(CRISIS_EVENTS, f, indent=2)
    print(f"[crisis_events] Written → {path}")


def write_country_meta(output_dir: Path):
    import json
    meta_list = [
        {"country": k, "iso3": v["iso3"], "group": v["group"]}
        for k, v in COUNTRY_META.items()
    ]
    path = output_dir / "country_meta.json"
    with open(path, "w") as f:
        json.dump(meta_list, f, indent=2)
    print(f"[country_meta] Written → {path}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Process macro data for InfoVis project.")
    parser.add_argument("--input",  default="./raw",         help="Directory containing raw CSV(s)")
    parser.add_argument("--output", default="./public/data", help="Directory to write processed CSVs")
    args = parser.parse_args()

    input_dir  = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # ── 1. Load ──────────────────────────────────────────────────────────────
    print("\n=== Loading raw data ===")
    raw = load_raw(input_dir)
    raw = normalise_columns(raw)
    raw = ensure_country_col(raw)
    raw = parse_dates(raw)

    all_numeric = ASSET_COLS + MACRO_COLS + PANIC_INDICATORS
    raw = coerce_numeric(raw, all_numeric)

    # Filter to 30 known countries (drop rows not in our metadata list)
    known = list(COUNTRY_META.keys())
    filtered = raw[raw["Country"].isin(known)].copy()
    print(f"[filter] Rows after country filter: {len(filtered):,} "
          f"(dropped {len(raw) - len(filtered):,})")

    if filtered.empty:
        print("[WARN] No rows matched known country names.")
        print("       Countries found in data:", raw["Country"].unique()[:20])
        print("       Check COUNTRY_META keys and update if needed.")
        filtered = raw.copy()   # proceed anyway

    # ── 2. Build outputs ─────────────────────────────────────────────────────
    print("\n=== Building annual_returns.csv ===")
    annual = build_annual_returns(filtered)
    annual.to_csv(output_dir / "annual_returns.csv", index=False)
    print(f"  → {output_dir / 'annual_returns.csv'}")

    print("\n=== Building correlations.csv ===")
    corrs = build_correlations(filtered)
    corrs.to_csv(output_dir / "correlations.csv", index=False)
    print(f"  → {output_dir / 'correlations.csv'}")

    print("\n=== Building monthly_indicators.csv ===")
    monthly = build_monthly_indicators(filtered)
    monthly.to_csv(output_dir / "monthly_indicators.csv", index=False)
    print(f"  → {output_dir / 'monthly_indicators.csv'}")

    print("\n=== Writing metadata JSON files ===")
    write_crisis_events(output_dir)
    write_country_meta(output_dir)

    print("\n✅ All outputs written to:", output_dir)
    print("   annual_returns.csv       — View 1 (choropleth map)")
    print("   correlations.csv         — View 2 (heatmap + sparkline)")
    print("   monthly_indicators.csv   — View 3 (time-series line chart)")
    print("   crisis_events.json       — View 3 (crisis annotations)")
    print("   country_meta.json        — shared lookup")


if __name__ == "__main__":
    main()
