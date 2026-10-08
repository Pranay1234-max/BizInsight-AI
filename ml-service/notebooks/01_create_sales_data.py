import pandas as pd
import numpy as np

# Reproducible results
np.random.seed(42)

# 2 years of daily business data
dates = pd.date_range(
    start="2024-01-01",
    end="2025-12-31",
    freq="D"
)

products = ["Product A", "Product B", "Product C", "Product D"]
regions = ["North", "South", "East", "West"]

rows = []

for date in dates:
    for product in products:
        for region in regions:

            # Base customers
            customers = np.random.randint(40, 180)

            # Product effect
            product_factor = {
                "Product A": 1.00,
                "Product B": 1.20,
                "Product C": 0.85,
                "Product D": 1.10
            }[product]

            # Regional effect
            region_factor = {
                "North": 1.00,
                "South": 0.90,
                "East": 1.15,
                "West": 1.25
            }[region]

            # Weekend effect
            weekend_factor = 0.85 if date.dayofweek >= 5 else 1.0

            # Seasonal effect
            seasonal_factor = (
                1
                + 0.15 * np.sin(2 * np.pi * date.dayofyear / 365)
            )

            # Sales calculation
            sales = (
                customers
                * 500
                * product_factor
                * region_factor
                * weekend_factor
                * seasonal_factor
                * np.random.normal(1, 0.08)
            )

            sales = max(0, sales)

            # Profit margin
            profit = sales * np.random.uniform(0.12, 0.25)

            rows.append({
                "date": date,
                "product": product,
                "region": region,
                "customers": customers,
                "sales": round(sales, 2),
                "profit": round(profit, 2)
            })

df = pd.DataFrame(rows)

# Save dataset
output_path = "data/sample/sales_data.csv"
df.to_csv(output_path, index=False)

print(f"Dataset created successfully!")
print(f"Rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(f"Saved to: {output_path}")