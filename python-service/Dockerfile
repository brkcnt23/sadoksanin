# Python Proforma PDF Generator Service
# Supports both development and production builds

FROM python:3.11-slim

LABEL maintainer="Sadoksan <info@sadoksan.com>"
LABEL description="Proforma Invoice PDF Generator using ReportLab"

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Development: Flask dev server with hot-reload (CMD overridden in docker-compose.dev.yml)
# Production: Create non-root user for security

ARG BUILD_ENV=production

RUN if [ "$BUILD_ENV" = "production" ]; then \
      useradd -m -u 1000 appuser && chown -R appuser:appuser /app && \
      echo "Production build: non-root user created"; \
    else \
      echo "Development build: running as root (for volume mounts)"; \
    fi

# Only apply USER directive for production
RUN if [ "$BUILD_ENV" = "production" ]; then echo "appuser"; else echo "root"; fi > /tmp/run_user

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Default: production with gunicorn
# Development: overridden by docker-compose.dev.yml to use `flask run --reload`
CMD ["gunicorn", \
     "--bind", "0.0.0.0:5000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--worker-tmp-dir", "/dev/shm", \
     "--timeout", "30", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info", \
     "app:app"]
