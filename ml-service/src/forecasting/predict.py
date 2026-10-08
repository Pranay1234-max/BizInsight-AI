import pandas as pd
import numpy as np
import json
import joblib
import os
import glob
import matplotlib.pyplot as plt
import seaborn as sns

def load_latest_model(models_dir="models"):
    metadata_files = glob.glob(os.path.join(models_dir, "metadata_*.json"))
    if not metadata_files:
        raise FileNotFoundError("No metadata files found in models directory.")
        
    latest_metadata_file = max(metadata_files, key=os.path.getctime)
    with open(latest_metadata_file, 'r') as f:
        metadata = json.load(f)
        
    model_path = os.path.join(models_dir, metadata["filename"])
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file {model_path} not found.")
        
    model = joblib.load(model_path)
    return model, metadata

def prepare_features_for_prediction(df: pd.DataFrame, selected_features: list):
    X = df.copy()
    if "date" in X.columns:
        X = X.drop(columns=["date"])
        
    categorical_columns = X.select_dtypes(include=["object", "category", "string"]).columns.tolist()
    if categorical_columns:
        X = pd.get_dummies(X, columns=categorical_columns, drop_first=True)
        
    boolean_columns = X.select_dtypes(include=["bool"]).columns
    if len(boolean_columns) > 0:
        X[boolean_columns] = X[boolean_columns].astype(int)
        
    X = X.apply(pd.to_numeric, errors="coerce")
    
    for col in selected_features:
        if col not in X.columns:
            X[col] = 0
            
    X = X[selected_features]
    X = X.fillna(0)
    return X

def predict_sales(features_df: pd.DataFrame, model, metadata):
    X_pred = prepare_features_for_prediction(features_df, metadata["selected_features"])
    predictions = model.predict(X_pred)
    return predictions

def generate_future_forecasts(historical_df, model, metadata, horizon=7):
    from src.features.feature_engineering import create_features
    df = historical_df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["is_new"] = False
    
    group_columns = ["product", "region"]
    
    for step in range(horizon):
        last_dates = df.groupby(group_columns)["date"].max().reset_index()
        new_rows = last_dates.copy()
        new_rows["date"] = new_rows["date"] + pd.Timedelta(days=1)
        new_rows["sales"] = 0.0
        new_rows["is_new"] = True
        
        # Fill missing columns
        for col in df.columns:
            if col not in new_rows.columns:
                if df[col].dtype.kind in 'bifc':
                    new_rows[col] = 0
                else:
                    new_rows[col] = df[col].mode()[0] if not df[col].mode().empty else "Unknown"
                    
        df = pd.concat([df, new_rows], ignore_index=True)
        
        # Recalculate features
        featured_df = create_features(df)
        
        # Predict for new rows
        new_featured = featured_df[featured_df["is_new"] == True].copy()
        predictions = predict_sales(new_featured, model, metadata)
        
        # Update df with the predicted values
        for _, row in new_featured.iterrows():
            mask = (df["date"] == row["date"]) & (df["product"] == row["product"]) & (df["region"] == row["region"])
            df.loc[mask, "sales"] = predictions[new_featured.index == row.name][0]
            
        df["is_new"] = False

    future_df = df.groupby(group_columns).tail(horizon).copy()
    return df, future_df

def create_forecast_visualization(full_df, horizon=7):
    """
    Saves a plot of the historical vs forecasted sales.
    """
    sample_product = full_df["product"].iloc[0]
    sample_region = full_df["region"].iloc[0]
    
    plot_df = full_df[(full_df["product"] == sample_product) & (full_df["region"] == sample_region)].copy()
    plot_df = plot_df.sort_values("date")
    
    historical = plot_df.iloc[:-horizon]
    forecast = plot_df.iloc[-horizon-1:]
    
    plt.figure(figsize=(12, 6))
    plt.plot(historical["date"], historical["sales"], label="Historical Sales", color="blue", marker="o")
    plt.plot(forecast["date"], forecast["sales"], label="Forecasted Sales", color="orange", marker="o", linestyle="--")
    
    plt.title(f"Sales Forecast for {sample_product} in {sample_region} (Next {horizon} Days)")
    plt.xlabel("Date")
    plt.ylabel("Sales")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    
    os.makedirs("visualizations", exist_ok=True)
    plt.savefig("visualizations/forecast_sample.png")
    print(f"Visualization saved to visualizations/forecast_sample.png")

if __name__ == "__main__":
    from src.data.loader import load_data
    from src.data.cleaner import clean_data
    
    print("Loading model and metadata...")
    model, metadata = load_latest_model()
    print(f"Loaded model: {metadata['model_name']}")
    
    print("Loading historical data...")
    df = load_data("data/sample/sales_data.csv")
    df = clean_data(df)
    
    print("Generating future forecasts (7 days)...")
    df["date"] = pd.to_datetime(df["date"])
    cutoff = df["date"].max() - pd.Timedelta(days=60)
    recent_data = df[df["date"] >= cutoff].copy()
    
    full_df, future_df = generate_future_forecasts(recent_data, model, metadata, horizon=7)
    
    print("\nFuture Forecasts (Sample):")
    print(future_df[["date", "product", "region", "sales"]].head(14).to_string(index=False))
    
    print("\nCreating forecast visualization...")
    create_forecast_visualization(full_df, horizon=7)
