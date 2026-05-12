"""
Sadoksan Proforma PDF Generator Service
Flask server for generating production-ready proforma invoices
"""

import os
import logging
from flask import Flask, request, jsonify, send_file
from proforma_generator import ProformaGenerator
from datetime import datetime
import io

# Configure logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max request size
generator = ProformaGenerator()

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'status': 'error', 'message': 'Bad request'}), 400

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """Health check for container orchestration"""
    return jsonify({
        'status': 'healthy',
        'service': 'proforma-generator',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

# Main endpoint
@app.route('/generate', methods=['POST'])
def generate_proforma():
    """
    Generate proforma PDF

    Request JSON:
    {
      "templateType": "INTERNATIONAL" | "LOCAL",
      "includeLogo": true|false,
      "customer": {
        "name": "Bayi İstanbul",
        "address": "Adres Sokak No:1",
        "city": "Istanbul",
        "phone": "+90 212 123 4567",
        "email": "bayi@example.com"
      },
      "items": [
        {
          "imageUrl": "https://cdn.../product.jpg",
          "sku": "KP-001",
          "description": "Kapı 3x2m",
          "quantity": 5,
          "price": 1000.00
        }
      ],
      "companyInfo": {
        "name": "Sadoksan İnşaat",
        "address": "Şirketi Sokak No:5",
        "phone": "+90 212 999 9999",
        "email": "info@sadoksan.com",
        "bank": "Akbank",
        "bankAccount": "123456789",
        "logo_url": "https://cdn.../logo.png" (optional)
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
        "vessel": "MV Shipping"
      }
    }
    """
    try:
        payload = request.get_json()

        # Validate required fields
        if not payload:
            return jsonify({
                'status': 'error',
                'message': 'Request body is empty'
            }), 400

        required_fields = ['templateType', 'customer', 'items', 'companyInfo']
        missing = [f for f in required_fields if f not in payload]
        if missing:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {", ".join(missing)}'
            }), 400

        # Validate template type
        if payload['templateType'] not in ['INTERNATIONAL', 'LOCAL']:
            return jsonify({
                'status': 'error',
                'message': 'Invalid templateType. Must be INTERNATIONAL or LOCAL'
            }), 400

        # Generate PDF
        logger.info(f"Generating {payload['templateType']} proforma with {len(payload['items'])} items")

        pdf_buffer = generator.generate(
            template_type=payload['templateType'],
            include_logo=payload.get('includeLogo', True),
            customer=payload['customer'],
            items=payload['items'],
            company_info=payload['companyInfo'],
            international=payload.get('international')
        )

        logger.info("PDF generated successfully")

        # Return PDF as file download
        pdf_buffer.seek(0)
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"proforma_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

    except ValueError as ve:
        logger.warning(f"Validation error: {str(ve)}")
        return jsonify({
            'status': 'error',
            'message': f'Validation error: {str(ve)}'
        }), 400

    except Exception as e:
        logger.error(f"Error generating proforma: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate PDF. Please check your request and try again.'
        }), 500

# Debug endpoint (remove in production)
@app.route('/debug/info', methods=['GET'])
def debug_info():
    """Debug information (disable in production)"""
    if os.getenv('FLASK_ENV') != 'development':
        return jsonify({'status': 'error', 'message': 'Not available'}), 404

    return jsonify({
        'flask_env': os.getenv('FLASK_ENV'),
        'log_level': os.getenv('LOG_LEVEL'),
        'timestamp': datetime.utcnow().isoformat()
    }), 200

if __name__ == '__main__':
    # Production: use gunicorn (see Dockerfile)
    # Development: python app.py
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('FLASK_ENV') == 'development')
