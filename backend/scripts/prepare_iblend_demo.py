"""
prepare_iblend_demo.py
-----------------------
Prepares a compact, continuous 15-minute demo dataset from the real I-BLEND
energy dataset (IIIT-Delhi) for the ENERSENSE platform.

Source Data:
  - ZIP file: data/iblend/energy_dataset.zip
  - Inner CSV: energy_dataset/all_buildings_power.csv
  - Building: Academic (watts -> kW)

Output:
  - File: data/processed/academic_demo_15min.csv
  - Columns: timestamp, building_name, demand_kw, source
"""

import sys
import zipfile
from pathlib import Path
import pandas as pd


def get_project_root() -> Path:
    """Finds project root directory based on current file location."""
    current = Path(__file__).resolve()
    # If script is in backend/scripts, root is two levels up
    if current.parent.name == "scripts" and current.parent.parent.name == "backend":
        return current.parent.parent.parent
    # Fallback: search upwards for 'data' directory
    for parent in [current] + list(current.parents):
        if (parent / "data" / "iblend").exists():
            return parent
    return Path.cwd()


def prepare_iblend_demo(
    zip_rel_path: str = "data/iblend/energy_dataset.zip",
    csv_inner_path: str = "energy_dataset/all_buildings_power.csv",
    output_rel_path: str = "data/processed/academic_demo_15min.csv",
    start_date: str = "2016-01-01",
    end_date: str = "2016-12-31",
) -> pd.DataFrame:
    """
    Reads 1-minute Academic building demand from I-BLEND ZIP,
    converts to Asia/Kolkata timezone, filters a continuous period,
    aggregates to 15-minute mean kW demand, and exports to CSV.
    """
    root_dir = get_project_root()
    zip_path = root_dir / zip_rel_path
    output_path = root_dir / output_rel_path

    print("=" * 70)
    print("ENERSENSE - I-BLEND Demo Dataset Preparation")
    print("=" * 70)
    print(f"Project root  : {root_dir}")
    print(f"Source ZIP    : {zip_path}")
    print(f"Inner CSV     : {csv_inner_path}")
    print(f"Target Output : {output_path}")
    print(f"Demo Window   : {start_date} to {end_date} (Full Year 2016)")
    print("-" * 70)

    if not zip_path.exists():
        raise FileNotFoundError(f"Source ZIP file not found at: {zip_path}")

    # 1. Read all_buildings_power.csv directly from ZIP without extracting
    print("[1/6] Reading raw 1-minute telemetry directly from ZIP archive...")
    with zipfile.ZipFile(zip_path, mode="r") as z:
        if csv_inner_path not in z.namelist():
            raise KeyError(f"'{csv_inner_path}' not found in ZIP archive.")
        with z.open(csv_inner_path) as f:
            # Read only timestamp and Academic column to optimize memory and speed
            df_raw = pd.read_csv(f, usecols=["timestamp", "Academic"])

    raw_count = len(df_raw)
    print(f"      Loaded {raw_count:,} raw records.")

    # 2. Remove rows where Academic demand is missing
    print("[2/6] Cleaning missing Academic demand readings...")
    null_raw = df_raw["Academic"].isna().sum()
    df_clean = df_raw.dropna(subset=["Academic"]).copy()
    valid_count = len(df_clean)
    print(f"      Removed {null_raw:,} null rows. Valid records: {valid_count:,}.")

    # 3. Convert Unix timestamp into timezone-aware Asia/Kolkata datetime
    print("[3/6] Converting Unix epoch timestamps to Asia/Kolkata (+05:30)...")
    # I-BLEND timestamps are Unix seconds
    df_clean["datetime"] = (
        pd.to_datetime(df_clean["timestamp"], unit="s", utc=True)
        .dt.tz_convert("Asia/Kolkata")
    )

    # 4. Convert Academic power from watts to kW: demand_kw = Academic / 1000
    print("[4/6] Converting power from Watts to Kilowatts (kW)...")
    df_clean["demand_kw"] = df_clean["Academic"] / 1000.0

    # 5. Filter for continuous high-quality demo window (Year 2016)
    print(f"[5/6] Filtering continuous demo window ({start_date} to {end_date})...")
    df_clean = df_clean.set_index("datetime").sort_index()
    df_window = df_clean.loc[start_date:end_date]
    print(f"      Window contains {len(df_window):,} 1-minute data points.")

    # 6. Resample 1-minute data into 15-minute intervals using the mean demand in kW
    print("[6/6] Resampling 1-minute data into 15-minute intervals (mean kW)...")
    # Resample using 15min frequency
    df_15min = (
        df_window["demand_kw"]
        .resample("15min")
        .mean()
        .to_frame()
    )

    total_15min_intervals = len(df_15min)
    missing_15min_count = df_15min["demand_kw"].isna().sum()
    missing_pct = (missing_15min_count / total_15min_intervals) * 100.0

    # Drop any 15-min interval where no raw 1-minute sensor data was present
    df_final = df_15min.dropna(subset=["demand_kw"]).reset_index()

    # Format timestamp in ISO-8601 string format with timezone offset
    df_final["timestamp"] = df_final["datetime"].dt.strftime("%Y-%m-%dT%H:%M:%S%z")
    # Add colon to timezone offset (e.g. +0530 -> +05:30) for standard ISO format
    df_final["timestamp"] = df_final["timestamp"].apply(
        lambda ts: f"{ts[:-2]}:{ts[-2:]}" if len(ts) >= 5 and ts[-5] in ["+", "-"] else ts
    )

    # Round demand_kw to 4 decimal places for clean storage
    df_final["demand_kw"] = df_final["demand_kw"].round(4)

    # Set required static metadata columns
    df_final["building_name"] = "Academic Building"
    df_final["source"] = "I-BLEND"

    # Arrange final column order: timestamp, building_name, demand_kw, source
    columns_order = ["timestamp", "building_name", "demand_kw", "source"]
    df_export = df_final[columns_order]

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save to CSV
    df_export.to_csv(output_path, index=False)
    print(f"\n[SUCCESS] Saved processed dataset to: {output_path}")
    print("=" * 70)

    # Print summary metrics as requested
    num_rows = len(df_export)
    start_ts = df_export["timestamp"].iloc[0]
    end_ts = df_export["timestamp"].iloc[-1]
    min_demand = df_export["demand_kw"].min()
    max_demand = df_export["demand_kw"].max()
    mean_demand = df_export["demand_kw"].mean()

    print("DATASET SUMMARY METRICS:")
    print(f"  - Number of rows     : {num_rows:,}")
    print(f"  - Start timestamp    : {start_ts}")
    print(f"  - End timestamp      : {end_ts}")
    print(f"  - Minimum demand     : {min_demand:.4f} kW")
    print(f"  - Maximum demand     : {max_demand:.4f} kW")
    print(f"  - Mean demand        : {mean_demand:.4f} kW")
    print(f"  - Missing percentage : {missing_pct:.2f}% ({missing_15min_count} of {total_15min_intervals} intervals)")
    print("-" * 70)
    print("FIRST 5 ROWS:")
    print(df_export.head(5).to_string(index=False))
    print("-" * 70)
    print("LAST 5 ROWS:")
    print(df_export.tail(5).to_string(index=False))
    print("=" * 70)

    return df_export


if __name__ == "__main__":
    try:
        prepare_iblend_demo()
    except Exception as e:
        print(f"\n[ERROR] Failed to prepare I-BLEND demo dataset: {e}", file=sys.stderr)
        sys.exit(1)
