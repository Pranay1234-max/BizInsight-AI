import pandas as pd


REQUIRED_COLUMNS = {
    "date",
    "sales"
}


def validate_data(df: pd.DataFrame) -> dict:
    """
    Validate business data before sending it to the ML pipeline.
    """

    errors = []
    warnings = []

    # 1. Check empty dataset
    if df.empty:
        errors.append("Dataset is empty.")

    # 2. Check required columns
    columns = {column.lower().strip() for column in df.columns}

    missing_columns = REQUIRED_COLUMNS - columns

    if missing_columns:
        errors.append(
            f"Missing required columns: {sorted(missing_columns)}"
        )

    # 3. Check duplicate rows
    duplicate_count = df.duplicated().sum()

    if duplicate_count > 0:
        warnings.append(
            f"Found {duplicate_count} duplicate rows."
        )

    # 4. Check missing values
    missing_values = df.isnull().sum()

    missing_columns = missing_values[
        missing_values > 0
    ]

    if not missing_columns.empty:
        warnings.append(
            f"Missing values found in: "
            f"{missing_columns.index.tolist()}"
        )

    # 5. Check date column
    if "date" in columns:

        date_column = next(
            column for column in df.columns
            if column.lower().strip() == "date"
        )

        converted_dates = pd.to_datetime(
            df[date_column],
            errors="coerce"
        )

        invalid_dates = converted_dates.isna().sum()

        if invalid_dates > 0:
            errors.append(
                f"Found {invalid_dates} invalid date values."
            )

    # 6. Check sales column
    if "sales" in columns:

        sales_column = next(
            column for column in df.columns
            if column.lower().strip() == "sales"
        )

        numeric_sales = pd.to_numeric(
            df[sales_column],
            errors="coerce"
        )

        invalid_sales = numeric_sales.isna().sum()

        if invalid_sales > 0:
            errors.append(
                f"Found {invalid_sales} non-numeric sales values."
            )

        negative_sales = (numeric_sales < 0).sum()

        if negative_sales > 0:
            warnings.append(
                f"Found {negative_sales} negative sales values."
            )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "rows": len(df),
        "columns": list(df.columns)
    }


if __name__ == "__main__":

    from loader import load_data

    file_path = "data/sample/sales_data.csv"

    df = load_data(file_path)

    result = validate_data(df)

    print("\nValidation Result")
    print("=================")

    print(f"Valid: {result['valid']}")
    print(f"Rows: {result['rows']}")
    print(f"Columns: {result['columns']}")

    print("\nErrors:")

    if result["errors"]:
        for error in result["errors"]:
            print(f"- {error}")
    else:
        print("- None")

    print("\nWarnings:")

    if result["warnings"]:
        for warning in result["warnings"]:
            print(f"- {warning}")
    else:
        print("- None")