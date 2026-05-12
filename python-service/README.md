# Sadoksan Proforma PDF Generator Service

Production-ready Flask service for generating proforma invoices in PDF format using ReportLab.

## Features

- ✅ INTERNATIONAL (export) template with shipping details
- ✅ LOCAL (domestic) template 
- ✅ Auto-embedding of product images
- ✅ Dynamic pricing and quantities
- ✅ Professional styling
- ✅ Full error handling and logging
- ✅ Health checks for container orchestration
- ✅ Production-ready with Gunicorn

## Technology Stack

- **Framework**: Flask 3.0.0
- **PDF Generation**: ReportLab 4.0.9
- **Image Processing**: Pillow 10.1.0
- **WSGI Server**: Gunicorn 21.2.0
- **Python**: 3.11

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Flask development server
python app.py

# Access service
curl http://localhost:5000/health
```

### Docker

```bash
# Build image
docker build -t sadoksan-python-service .

# Run container
docker run -d \
  -p 5000:5000 \
  --name python-service \
  sadoksan-python-service

# Check health
curl http://localhost:5000/health
```

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "proforma-generator",
  "timestamp": "2026-05-12T10:30:00.000000",
  "version": "1.0.0"
}
```

### Generate Proforma

```http
POST /generate
Content-Type: application/json
```

**Request Body:**

```json
{
  "templateType": "INTERNATIONAL",
  "includeLogo": true,
  "customer": {
    "name": "Bayi İstanbul",
    "address": "Adres Sokak No:1",
    "city": "Istanbul",
    "phone": "+90 212 123 4567",
    "email": "bayi@example.com"
  },
  "items": [
    {
      "imageUrl": "https://cdn.sadoksan.com/products/kapı-001.jpg",
      "sku": "KP-001",
      "description": "Kapı 3x2m - Çelik",
      "quantity": 5,
      "price": 1000.00
    },
    {
      "imageUrl": "https://cdn.sadoksan.com/products/pencere-002.jpg",
      "sku": "PC-002",
      "description": "Pencere 2x1m",
      "quantity": 3,
      "price": 500.00
    }
  ],
  "companyInfo": {
    "name": "Sadoksan İnşaat",
    "address": "Şirketi Sokak No:5, Istanbul",
    "phone": "+90 212 999 9999",
    "email": "info@sadoksan.com",
    "bank": "Akbank",
    "bankAccount": "123456789",
    "logo_url": "https://cdn.sadoksan.com/logo.png"
  },
  "international": {
    "invoiceNumber": "PROF-2026-001",
    "invoiceDate": "2026-05-12",
    "exporterRef": "IEC NO: 0910000907",
    "countryOrigin": "TURKEY",
    "countryDest": "IRAQ",
    "preCarriage": "By Road",
    "pickupLocation": "ISTANBUL",
    "portLoading": "ISTANBUL",
    "portDischarge": "UMM QASR",
    "vessel": "MV Shipping Line"
  }
}
```

**Response:**

PDF file sent as download attachment named `proforma_20260512_103000.pdf`

**Error Response:**

```json
{
  "status": "error",
  "message": "Error description"
}
```

## Configuration

### Environment Variables

```bash
FLASK_ENV=production      # production or development
LOG_LEVEL=INFO           # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### Request Limits

- Maximum request size: 50MB
- Timeout: 30 seconds

## Integration with NestJS API

The service is called from `POST /api/proforma/generate` in NestJS:

```typescript
// apps/api/src/modules/proforma/proforma.service.ts
const response = await fetch('http://python-service:5000/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

## Production Deployment

### Docker Compose

See `docker-compose.prod.yml` at project root.

### Kubernetes (Future)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: python-service
spec:
  selector:
    app: python-service
  ports:
    - port: 5000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-service
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: python-service
        image: sadoksan/python-service:1.0.0
        ports:
        - containerPort: 5000
```

## Monitoring

### Logs

```bash
# Docker
docker logs python-service

# Kubernetes
kubectl logs -f deployment/python-service
```

### Metrics

- Container memory: ~150MB
- Startup time: ~2-3 seconds
- Response time: 500ms - 5s (depending on image sizes)

## Troubleshooting

### Image Download Fails

If product images fail to download:
- Check image URLs are publicly accessible
- Verify timeout settings (currently 5 seconds per image)
- Check network connectivity

### PDF Generation Fails

- Check all required fields are present in request
- Verify item prices are valid numbers
- Check customer data is complete

### Service Won't Start

```bash
# Check logs
docker logs python-service

# Verify container is running
docker ps | grep python-service

# Test health endpoint
curl -v http://localhost:5000/health
```

## Performance Optimization

- Images are cached in memory during request
- Gunicorn uses 4 workers for concurrency
- Uses async image fetching via requests library
- Production logging minimal (set LOG_LEVEL=WARNING)

## Security

- Runs as non-root user (uid 1000)
- No sensitive data logged
- Request size limited to 50MB
- Timeout on external requests (5s)

## License

Proprietary - Sadoksan İnşaat
