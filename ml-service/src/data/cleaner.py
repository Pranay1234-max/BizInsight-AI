import pandas as pd


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean business data before feature engineering.
    """

    df = df.copy()

    # Remove completely empty rows and columns
    df = df.dropna(how="all")
    df = df.dropna(axis=1, how="all")

    # Clean column names
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    # Convert date column automatically
    if "date" in df.columns:
        df["date"] = pd.to_datetime(
            df["date"],
            errors="coerce"
        )

    # Convert numeric-looking columns
    for column in df.columns:

        if column == "date":
            continue

        converted = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        # Only replace if most values can be converted
        valid_ratio = converted.notna().mean()

        if valid_ratio >= 0.90:
            df[column] = converted

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Sort by date if available
    if "date" in df.columns:
        df = df.sort_values("date")

    # Reset index
    df = df.reset_index(drop=True)

    return df


if __name__ == "__main__":

    from loader import load_data

    file_path = "data/sample/sales_data.csv"

    df = load_data(file_path)

    print("Before cleaning:")
    print(df.shape)
    print(df.dtypes)

    cleaned_df = clean_data(df)

    print("\nAfter cleaning:")
    print(cleaned_df.shape)
    print(cleaned_df.dtypes)

    print("\nFirst 5 rows:")
    print(cleaned_df.head())