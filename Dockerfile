# Dockerfile for Video2MP3 Backend on Render
FROM python:3.11-slim

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY app.py .

# Environment Defaults
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Expose server port
EXPOSE ${PORT}

# Run Gunicorn WSGI HTTP server with environment PORT
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --timeout 300 app:app"]
