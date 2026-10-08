import pandas as pd
import numpy as np
from sklearn.feature_selection import mutual_info_regression
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
import joblib
import json
import os
from datetime import datetime

def prepare_features(
    df: pd.DataFrame,
    target: str = "sales",
    drop_columns: list = None
):
    """
    Prepare business data for machine learning.
    """
    data = df.copy()

    if drop_columns:
        cols_to_drop = [c for c in drop_columns if c in data.columns]
        data = data.drop(columns=cols_to_drop)

    if target not in data.columns:
        raise ValueError(f"Target column '{target}' not found in dataset.")

    y = data[target].copy()
    X = data.drop(columns=[target])

    if "date" in X.columns:
        X = X.drop(columns=["date"])

    categorical_columns = X.select_dtypes(include=["object", "category", "string"]).columns.tolist()

    if categorical_columns:
        X = pd.get_dummies(X, columns=categorical_columns, drop_first=True)

    boolean_columns = X.select_dtypes(include=["bool"]).columns

    if len(boolean_columns) > 0:
        X[boolean_columns] = X[boolean_columns].astype(int)

    X = X.apply(pd.to_numeric, errors="coerce")
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
    Automatically select useful features using Mutual Information and Random Forest.
    """
    if X.empty:
        raise ValueError("No features available for selection.")
    if len(X) != len(y):
        raise ValueError("Feature and target row counts do not match.")

    mi_values = mutual_info_regression(X, y, random_state=42)
    mi_scores = pd.Series(mi_values, index=X.columns).sort_values(ascending=False)

    forest = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    forest.fit(X, y)
    importance_scores = pd.Series(forest.feature_importances_, index=X.columns).sort_values(ascending=False)

    if mi_scores.max() > 0:
        mi_normalized = mi_scores / mi_scores.max()
    else:
        mi_normalized = mi_scores

    if importance_scores.max() > 0:
        importance_normalized = importance_scores / importance_scores.max()
    else:
        importance_normalized = importance_scores

    combined_scores = (0.5 * mi_normalized + 0.5 * importance_normalized).sort_values(ascending=False)
    number_of_features = min(top_n, len(combined_scores))
    selected_features = combined_scores.head(number_of_features).index.tolist()

    return selected_features, combined_scores

def chronological_split(df: pd.DataFrame, test_size: float = 0.2):
    """
    Split the dataset chronologically based on date.
    """
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    
    unique_dates = df["date"].drop_duplicates().sort_values().reset_index(drop=True)
    split_idx = int(len(unique_dates) * (1 - test_size))
    cutoff_date = unique_dates.iloc[split_idx]
    
    train_df = df[df["date"] < cutoff_date].copy().reset_index(drop=True)
    test_df = df[df["date"] >= cutoff_date].copy().reset_index(drop=True)
    
    return train_df, test_df

def train_and_evaluate_models(X_train, y_train, X_test, y_test):
    """
    Trains multiple models and evaluates them using MAE, RMSE, and MAPE.
    Returns the best model based on RMSE.
    """
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
        "XGBoost": XGBRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    }

    results = []
    best_model = None
    best_rmse = float('inf')
    best_model_name = ""
    trained_models = {}

    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        
        mae = mean_absolute_error(y_test, predictions)
        rmse = np.sqrt(mean_squared_error(y_test, predictions))
        mape = mean_absolute_percentage_error(y_test, predictions)
        
        results.append({
            "Model": name,
            "MAE": mae,
            "RMSE": rmse,
            "MAPE": mape
        })
        
        trained_models[name] = model
        
        if rmse < best_rmse:
            best_rmse = rmse
            best_model = model
            best_model_name = name

    results_df = pd.DataFrame(results).sort_values("RMSE")
    return results_df, best_model, best_model_name, trained_models

def save_best_model(model, model_name, metrics_df, selected_features, models_dir="models"):
    """
    Saves the trained model and its metadata.
    """
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_filename = f"best_model_{timestamp}.joblib"
    model_path = os.path.join(models_dir, model_filename)
    
    joblib.dump(model, model_path)
    
    best_metrics = metrics_df[metrics_df["Model"] == model_name].iloc[0].to_dict()
    
    metadata = {
        "model_name": model_name,
        "filename": model_filename,
        "training_date": timestamp,
        "selected_features": selected_features,
        "metrics": best_metrics
    }
    
    metadata_filename = f"metadata_{timestamp}.json"
    metadata_path = os.path.join(models_dir, metadata_filename)
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
        
    return model_path, metadata_path


if __name__ == "__main__":
    from src.data.loader import load_data
    from src.data.cleaner import clean_data
    from src.features.feature_engineering import create_features

    file_path = "data/sample/sales_data.csv"

    # Load & Clean
    df = load_data(file_path)
    df = clean_data(df)

    # Feature engineering
    df = create_features(df)

    # Chronological Split
    train_df, test_df = chronological_split(df, test_size=0.2)

    leaky_columns = ["profit", "customers"]

    # Prepare ML data
    X_train, y_train = prepare_features(train_df, target="sales", drop_columns=leaky_columns)
    X_test, y_test = prepare_features(test_df, target="sales", drop_columns=leaky_columns)

    # Select useful features
    selected_features, scores = select_features(X_train, y_train, top_n=10)
    
    # Ensure test set has the exact same columns after one-hot encoding
    missing_cols = set(X_train.columns) - set(X_test.columns)
    for c in missing_cols:
        X_test[c] = 0
    X_test = X_test[X_train.columns]

    print("\nAutomatic Feature Selection")
    print("===========================")
    for feature in selected_features:
        print(f"- {feature}")

    # Filter data to keep only selected features
    X_train_selected = X_train[selected_features]
    X_test_selected = X_test[selected_features]

    print("\nModel Training and Evaluation")
    print("=============================")
    results_df, best_model, best_model_name, all_models = train_and_evaluate_models(
        X_train_selected, y_train, X_test_selected, y_test
    )

    print("\nEvaluation Results:")
    print(results_df.to_string(index=False))
    
    print(f"\nBest Model selected: {best_model_name} (RMSE: {results_df.iloc[0]['RMSE']:.2f})")
    
    print("\nSaving Best Model and Metadata...")
    model_path, metadata_path = save_best_model(
        best_model, 
        best_model_name, 
        results_df, 
        selected_features, 
        models_dir="models"
    )
    print(f"Model saved to: {model_path}")
    print(f"Metadata saved to: {metadata_path}")