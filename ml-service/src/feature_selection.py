import pandas as pd

from sklearn.feature_selection import mutual_info_regression
from sklearn.ensemble import RandomForestRegressor


def select_features(
    df: pd.DataFrame,
    target: str = "sales",
    top_n: int = 10
):
    """
    Automatically select useful numeric features
    for the target variable.
    """

    data = df.copy()

    # Remove columns that should not directly enter the model
    excluded_columns = [
        target,
        "date"
    ]

    # Convert categorical columns using one-hot encoding
    categorical_columns = data.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()

    categorical_columns = [
        col for col in categorical_columns
        if col != target
    ]

    if categorical_columns:
        data = pd.get_dummies(
            data,
            columns=categorical_columns,
            drop_first=True
        )

    # Keep numeric columns only
    numeric_columns = data.select_dtypes(
        include=["number", "bool"]
    ).columns.tolist()

    feature_columns = [
        col for col in numeric_columns
        if col not in excluded_columns
    ]

    X = data[feature_columns].copy()
    y = data[target].copy()

    # Remove invalid rows
    valid_rows = X.notna().all(axis=1) & y.notna()

    X = X.loc[valid_rows]
    y = y.loc[valid_rows]

    # Convert boolean columns to integers
    X = X.astype(float)

    # -----------------------------
    # Mutual Information
    # -----------------------------

    mi_scores = mutual_info_regression(
        X,
        y,
        random_state=42
    )

    mi_scores = pd.Series(
        mi_scores,
        index=X.columns
    ).sort_values(ascending=False)

    # -----------------------------
    # Random Forest importance
    # -----------------------------

    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X, y)

    importance_scores = pd.Series(
        model.feature_importances_,
        index=X.columns
    ).sort_values(ascending=False)

    # -----------------------------
    # Combined ranking
    # -----------------------------

    mi_normalized = (
        mi_scores / mi_scores.max()
        if mi_scores.max() > 0
        else mi_scores
    )

    importance_normalized = (
        importance_scores / importance_scores.max()
        if importance_scores.max() > 0
        else importance_scores
    )

    combined_score = (
        0.5 * mi_normalized
        + 0.5 * importance_normalized
    )

    combined_score = combined_score.sort_values(
        ascending=False
    )

    selected_features = combined_score.head(
        min(top_n, len(combined_score))
    ).index.tolist()

    return selected_features, combined_score


if __name__ == "__main__":

    from src.data.loader import load_data
    from src.data.cleaner import clean_data
    from src.features.feature_engineering import create_features

    file_path = "data/sample/sales_data.csv"

    # Load
    df = load_data(file_path)

    # Clean
    df = clean_data(df)

    # Feature engineering
    df = create_features(df)

    # Feature selection
    selected_features, scores = select_features(
        df,
        target="sales",
        top_n=10
    )

    print("\nAutomatic Feature Selection")
    print("===========================")

    print("\nSelected features:")

    for feature in selected_features:
        print(f"- {feature}")

    print("\nFeature scores:")

    print(scores.head(15))