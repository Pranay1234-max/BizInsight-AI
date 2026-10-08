import pandas as pd
from pathlib import Path


def load_data(file_path: str) -> pd.DataFrame:
    """
    Load CSV or Excel business data.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    if path.suffix.lower() == ".csv":
        df = pd.read_csv(path)

    elif path.suffix.lower() in [".xlsx", ".xls"]:
        df = pd.read_excel(path)

    else:
        raise ValueError(
            "Unsupported file format. Please upload CSV or Excel."
        )

    if df.empty:
        raise ValueError("The uploaded file contains no data.")

    return df


if __name__ == "__main__":

    file_path = "data/sample/sales_data.csv"

    df = load_data(file_path)

    print("Data loaded successfully!")
    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")
    print("\nColumns:")
    print(df.columns.tolist())

    print("\nFirst 5 rows:")
    print(df.head())