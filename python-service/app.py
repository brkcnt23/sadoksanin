"""
Sadoksan Proforma PDF Generator Service
Flask server for generating production-ready proforma invoices
"""

import os
import logging
from flask import Flask, request, jsonify, send_file
from proforma_generator import ProformaGenerator
from excel_generator import ExcelGenerator
from document_generator import DocumentGenerator
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
document_generator = DocumentGenerator()

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



# --- Genel Amacli Belge Ureticisi (Siparis formu, ileride cari ekstre/irsaliye) ---
@app.route('/generate-document', methods=['POST'])
def generate_document():
    """Genel amacli PDF belge uretimi. proforma /generate endpointinden BAGIMSIZ."""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({'status': 'error', 'message': 'Request body is empty'}), 400

        required_fields = ['title', 'documentNumber', 'companyInfo', 'customer']
        missing = [f for f in required_fields if f not in payload]
        if missing:
            return jsonify({'status': 'error', 'message': f'Missing required fields: {", ".join(missing)}'}), 400

        logger.info(f"Generating document '{payload['title']}' ({payload['documentNumber']})")

        pdf_buffer = document_generator.generate(
            title=payload['title'],
            document_number=payload['documentNumber'],
            document_date=payload.get('documentDate', ''),
            company_info=payload['companyInfo'],
            customer=payload['customer'],
            meta_fields=payload.get('metaFields'),
            items=payload.get('items'),
            totals=payload.get('totals'),
            footer_note=payload.get('footerNote'),
        )

        logger.info("Document PDF generated successfully")
        pdf_buffer.seek(0)
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=False,
            download_name=f"{payload['documentNumber']}.pdf"
        )

    except ValueError as ve:
        logger.warning(f"Validation error: {str(ve)}")
        return jsonify({'status': 'error', 'message': f'Validation error: {str(ve)}'}), 400

    except Exception as e:
        logger.error(f"Error generating document: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': 'Failed to generate PDF. Please check your request and try again.'}), 500

# Debug endpoint (remove in production)
@app.route('/generate-excel', methods=['POST'])
def generate_excel():
    """
    Genel Excel (.xlsx) uretimi.

    CSV ciktilari Turkce/Avrupa yerel ayarli Excel'de tek sutunda aciliyordu;
    gercek xlsx uretilince ayrac sorunu ortadan kalkiyor, sutunlar her yerde
    dogru ayriliyor ve sayi/tarih/para bicimleri korunuyor.

    Beklenen govde:
    {
      "filename": "urunler",
      "title": "Urun Listesi",
      "sheets": [{
        "name": "Urunler",
        "columns": [{"key":"sku","label":"SKU","type":"text","width":18}],
        "rows": [{"sku":"A123", ...}]
      }]
    }
    Tip degerleri: text | number | decimal | money | usd | percent | date | datetime
    """
    try:
        payload = request.get_json(silent=True) or {}
        sheets = payload.get('sheets')

        # Tek sayfalik kisa kullanim: {"columns": [...], "rows": [...]}
        if not sheets and (payload.get('rows') is not None):
            sheets = [{
                'name': payload.get('sheetName') or 'Sayfa1',
                'columns': payload.get('columns') or [],
                'rows': payload.get('rows') or [],
            }]

        if not sheets:
            return jsonify({'status': 'error', 'message': 'sheets veya rows alani gerekli'}), 400

        toplam = sum(len(sh.get('rows') or []) for sh in sheets)
        logger.info(f"Excel uretiliyor: {len(sheets)} sayfa, {toplam} satir")

        buf = ExcelGenerator().generate(sheets=sheets, title=payload.get('title'))

        ad = (payload.get('filename') or 'rapor').replace('"', '').strip() or 'rapor'
        if not ad.lower().endswith('.xlsx'):
            ad += '.xlsx'

        return send_file(
            buf,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=ad,
        )
    except Exception as e:
        logger.error(f"Excel uretiminde hata: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': 'Excel olusturulamadi'}), 500


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
