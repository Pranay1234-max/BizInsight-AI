import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import os

def detect_anomalies(df: pd.DataFrame, columns_to_analyze: list, contamination: float = 0.05):
    """
    Detects anomalies in the dataset using an Isolation Forest.
    contamination: The expected proportion of outliers in the data set.
    """
    data = df.copy()
    
    # Filter out rows with missing values in the analysis columns
    valid_data = data.dropna(subset=columns_to_analyze).copy()
    
    if valid_data.empty:
        raise ValueError("No valid data to perform anomaly detection.")
        
    # Initialize Isolation Forest
    model = IsolationForest(contamination=contamination, random_state=42, n_jobs=-1)
    
    # Fit and predict (-1 indicates an anomaly, 1 indicates normal)
    preds = model.fit_predict(valid_data[columns_to_analyze])
    
    # Calculate anomaly scores (lower/negative means more abnormal)
    scores = model.decision_function(valid_data[columns_to_analyze])
    
    # Map predictions back to the original dataframe
    data["is_anomaly"] = False
    valid_data["is_anomaly"] = (preds == -1)
    
    data["anomaly_score"] = np.nan
    valid_data["anomaly_score"] = scores
    
    # Update original dataframe
    data.update(valid_data[["is_anomaly", "anomaly_score"]])
    data["is_anomaly"] = data["is_anomaly"].astype(bool)
    
    return data

if __name__ == "__main__":
    import sys
    # Add parent directory to path to allow running directly
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    from src.data.loader import load_data
    from src.data.cleaner import clean_data
    from src.features.feature_engineering import create_features
    
    print("Loading historical data for Anomaly Detection...")
    df = load_data("data/sample/sales_data.csv")
    df = clean_data(df)
    
    print("Running feature engineering...")
    featured_df = create_features(df)
    
    print("Detecting anomalies using Isolation Forest...")
    # Analyze based on sales and their rolling statistics to catch contextual anomalies
    columns_for_anomaly = ["sales", "sales_rolling_mean_7", "sales_rolling_std_7"]
    
    # Assuming 2% of our data might be anomalous
    anomaly_df = detect_anomalies(featured_df, columns_for_anomaly, contamination=0.02)
    
    anomalies = anomaly_df[anomaly_df["is_anomaly"] == True]
    
    print(f"\nDetected {len(anomalies)} anomalies out of {len(anomaly_df)} records.")
    print("\nSample Contextual Anomalies (Spikes, Dips, or unusual volatility):")
    cols_to_show = ["date", "product", "region", "sales", "sales_rolling_mean_7", "anomaly_score"]
    # Sort by how severe the anomaly is
    anomalies_sorted = anomalies.sort_values("anomaly_score").head(15)
    print(anomalies_sorted[cols_to_show].to_string(index=False))
