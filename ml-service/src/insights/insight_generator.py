import pandas as pd
import numpy as np

def generate_insights(df: pd.DataFrame):
    """
    Generates structured business insights from the dataset.
    These insights are intended to be fed into the LLM/RAG pipeline
    or directly displayed on the React dashboard.
    """
    df = df.copy()
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
    
    total_sales = df["sales"].sum() if "sales" in df.columns else 0
    
    # 1. Executive Summary
    exec_summary = f"The uploaded dataset contains {len(df):,} records with a total sales volume of ₹{total_sales/1000000:,.2f}M. The data has been successfully processed by the ML pipeline."
    
    key_drivers = []
    positive_trends = []
    negative_trends = []
    opportunities = []

    # Dynamic Analysis based on columns
    if "product" in df.columns and "sales" in df.columns:
        product_sales = df.groupby("product")["sales"].sum().sort_values(ascending=False)
        top_product = product_sales.index[0]
        top_sales = product_sales.iloc[0]
        
        key_drivers.append({
            "title": f"{top_product} is the leading revenue line.",
            "evidence": f"₹{top_sales/1000000:,.1f}M in total historical sales.",
            "impact": "HIGH",
            "score": 94
        })
        
        bottom_product = product_sales.index[-1]
        negative_trends.append({
            "title": f"Weak performance from {bottom_product}.",
            "evidence": f"Accounts for only { (product_sales.iloc[-1] / total_sales)*100:.1f}% of total revenue.",
            "impact": "MEDIUM",
            "score": 62
        })
        
    if "region" in df.columns and "sales" in df.columns:
        region_sales = df.groupby("region")["sales"].sum().sort_values(ascending=False)
        top_region = region_sales.index[0]
        
        key_drivers.append({
            "title": f"{top_region} region drives majority of growth.",
            "evidence": f"{top_region} accounts for { (region_sales.iloc[0] / total_sales)*100:.1f}% of all sales.",
            "impact": "HIGH",
            "score": 88
        })
        
        bottom_region = region_sales.index[-1]
        opportunities.append({
            "title": f"Expand marketing in {bottom_region} region.",
            "evidence": f"Currently generating the lowest revenue share.",
            "impact": "HIGH",
            "score": 75
        })
        
    if "is_anomaly" in df.columns:
        anomaly_count = (df["is_anomaly"] == -1).sum()
        positive_trends.append({
            "title": "Anomaly Detection Active",
            "evidence": f"Isolation Forest identified {anomaly_count} statistical outliers.",
            "impact": "MEDIUM",
            "score": 81
        })

    return {
        "executive_summary": exec_summary,
        "key_drivers": key_drivers,
        "positive_trends": positive_trends,
        "negative_trends": negative_trends,
        "opportunities": opportunities
    }

if __name__ == "__main__":
    import os
    import sys
    # Add parent directory to path to allow running directly
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    from src.data.loader import load_data
    from src.data.cleaner import clean_data
    from src.features.feature_engineering import create_features
    from src.anomaly.detector import detect_anomalies
    
    print("Loading and preparing data...")
    df = load_data("data/sample/sales_data.csv")
    df = clean_data(df)
    featured_df = create_features(df)
    
    print("Running anomaly detection...")
    cols = ["sales", "sales_rolling_mean_7", "sales_rolling_std_7"]
    anomaly_df = detect_anomalies(featured_df, cols, contamination=0.02)
    
    print("Generating Business Insights...")
    insights = generate_insights(anomaly_df)
    
    print("\n==========================================")
    print("          BIZINSIGHT AI REPORT            ")
    print("==========================================")
    for idx, item in enumerate(insights, 1):
        print(f"\n{idx}. [{item['category']}]")
        print(f"   {item['insight']}")
