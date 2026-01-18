FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for Pillow, OpenCV, and building C extensions
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY services/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY services/api/api.py .
COPY services/api/model/ model/
COPY packages/database/prisma/schema.prisma schema.prisma
RUN prisma generate --schema=schema.prisma

# Expose API port
EXPOSE 8000

# Default to running the API server
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
