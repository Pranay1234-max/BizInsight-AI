import pandas as pd


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create automatic time-series features separately
    for each product and region.
    """

    df = df.copy()

    # Make sure date is datetime
    df["date"] = pd.to_datetime(df["date"])

    # Sort each business series chronologically
    group_columns = ["product", "region"]

    df = df.sort_values(
        group_columns + ["date"]
    ).reset_index(drop=True)

    # --------------------------------
    # 1. Date features
    # --------------------------------

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day
    df["day_of_week"] = df["date"].dt.dayofweek
    df["week_of_year"] = (
        df["date"].dt.isocalendar().week.astype(int)
    )

    df["is_weekend"] = (
        df["day_of_week"] >= 5
    ).astype(int)

    # --------------------------------
    # 2. Sales lag features
    # --------------------------------

    grouped_sales = df.groupby(
        group_columns,
        group_keys=False
    )["sales"]

    df["sales_lag_1"] = grouped_sales.shift(1)
    df["sales_lag_7"] = grouped_sales.shift(7)
    df["sales_lag_14"] = grouped_sales.shift(14)

    # --------------------------------
    # 3. Rolling sales features
    # --------------------------------

    df["sales_rolling_mean_7"] = (
        grouped_sales
        .shift(1)
        .groupby(
            [df["product"], df["region"]]
        )
        .rolling(7)
        .mean()
        .reset_index(level=[0, 1], drop=True)
    )

    df["sales_rolling_mean_30"] = (
        grouped_sales
        .shift(1)
        .groupby(
            [df["product"], df["region"]]
        )
        .rolling(30)
        .mean()
        .reset_index(level=[0, 1], drop=True)
    )

    df["sales_rolling_std_7"] = (
        grouped_sales
        .shift(1)
        .groupby(
            [df["product"], df["region"]]
        )
        .rolling(7)
        .std()
        .reset_index(level=[0, 1], drop=True)
    )

    # --------------------------------
    # 4. Customer features
    # --------------------------------

    if "customers" in df.columns:

        grouped_customers = df.groupby(
            group_columns,
            group_keys=False
        )["customers"]

        df["customers_lag_1"] = (
            grouped_customers.shift(1)
        )

        df["customers_rolling_mean_7"] = (
            grouped_customers
            .shift(1)
            .groupby(
                [df["product"], df["region"]]
            )
            .rolling(7)
            .mean()
            .reset_index(level=[0, 1], drop=True)
        )

    # Remove rows where lag/rolling features
    # cannot yet be calculated
    df = df.dropna().reset_index(drop=True)

    return df


if __name__ == "__main__":

    from src.data.loader import load_data
    from src.data.cleaner import clean_data

    file_path = "data/sample/sales_data.csv"

    df = load_data(file_path)
    df = clean_data(df)

    featured_df = create_features(df)

    print("Feature engineering completed!")

    print("\nDataset shape:")
    print(featured_df.shape)

    print("\nColumns:")
    for column in featured_df.columns:
        print(f"- {column}")

    print("\nSample:")
    print(featured_df.head())