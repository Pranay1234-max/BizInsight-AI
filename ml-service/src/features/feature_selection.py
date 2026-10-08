import pandas as pd

from sklearn.feature_selection import mutual_info_regression
from sklearn.ensemble import RandomForestRegressor


def prepare_features(
    df: pd.DataFrame,
    target: str = "sales"
):
    """
    Convert categorical columns to numeric features
    and prepare the dataset for ML.
    """

    data = df.copy()

    # Remove date from ML features
    if "date" in data.columns:
        data = data.drop(columns=["date"])

    # Separate target
    y = data[target].copy()
    X = data.drop(columns=[target])

    # Convert categorical columns to one-hot encoding
    categorical_columns = X.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()

    if categorical_columns:
        X = pd.get_dummies(
            X,
            columns=categorical_columns,
            drop_first=True
        )

    # Convert boolean columns to integers
    bool_columns = X.select_dtypes(
        include=["bool"]
    ).columns

    if len(bool_columns) > 0:
        X[bool_columns] = X[bool_columns].astype(int)

    # Make sure everything is numeric
    X = X.apply(pd.to_numeric, errors="coerce")

    # Remove rows containing missing values
    valid_rows = X.notna().all(axis=1) & y.notna()

    X = X.loc[valid_rows].reset_index(drop=True)
    y = y.loc[valid_rows].reset_index(drop=True)

    return X, y


def select_features(
    X: pd.DataFrame,
    y: pd.Series,
    top_n: int = 10
):
    """
    Automatically select useful features using
    Mutual Information + Random Forest importance.
    """

    # Mutual Information
    mi_scores = mutual_info_regression(
        X,
        y,
        random_state=42
    )

    mi_scores = pd.Series(
        mi_scores,
        index=X.columns
    ).sort_values(ascending=False)

    # Random Forest importance
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

    # Normalize scores
    if mi_scores.max() > 0:
        mi_normalized = mi_scores / mi_scores.max()
    else:
        mi_normalized = mi_scores

    if importance_scores.max() > 0:
        importance_normalized = (
            importance_scores / importance_scores.max()
        )
    else:
        importance_normalized = importance_scores

    # Combined score
    combined_score = (
        0.5 * mi_normalized
        + 0.5 * importance_normalized
    ).sort_values(ascending=False)

    selected_features = combined_score.head(
        min(top_n, len(combined_score))
    ).index.tolist()

    return selected_features, combined_score


if __name__ == "__main__":

    from src.data.loader import load_data
    from src.data.cleaner import clean_data
    from src.features.feature_engineering import create_features

    file_path = "data/sample/sales_data.csv"

    df = load_data(file_path)
    df = clean_data(df)
    df = create_features(df)

    X, y = prepare_features(
        df,
        target="sales"
    )

    selected_features, scores = select_features(
        X,
        y,
        top_n=10
    )

    print("\nAutomatic Feature Selection")
    print("===========================")

    print("\nSelected features:")

    for feature in selected_features:
        print(f"- {feature}")

    print("\nFeature scores:")
    print(scores.head(15))