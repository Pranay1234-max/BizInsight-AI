FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install basic system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install Python ML dependencies and FastAPI framework
RUN pip install --no-cache-dir -r requirements.txt fastapi uvicorn httpx pydantic

# Copy the application source code and required directories
COPY src/ /app/src/
COPY data/ /app/data/
COPY models/ /app/models/

# Expose the API port
EXPOSE 8000

# Start the FastAPI service
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
