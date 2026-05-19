"""
Proforma Invoice PDF Generator using ReportLab
Supports INTERNATIONAL and LOCAL template types
UTF-8 Turkish character support enabled
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    Image, PageTemplate, Frame, PageBreak
)
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import datetime
import requests
from PIL import Image as PILImage
import logging
import os
import base64
import re

logger = logging.getLogger(__name__)

# Register Turkish-compatible fonts
try:
    # Try to register DejaVuSans fonts if available on system
    if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
        DEFAULT_FONT = 'DejaVuSans'
        DEFAULT_FONT_BOLD = 'DejaVuSans-Bold'
    else:
        # Fallback to built-in UTF-8 compatible fonts
        DEFAULT_FONT = 'Helvetica'
        DEFAULT_FONT_BOLD = 'Helvetica-Bold'
except Exception as e:
    logger.warning(f"Could not register DejaVuSans fonts: {e}. Using default fonts.")
    DEFAULT_FONT = 'Helvetica'
    DEFAULT_FONT_BOLD = 'Helvetica-Bold'

class ProformaGenerator:
    """Generate production-ready proforma invoices in PDF format with UTF-8 Turkish support"""

    def __init__(self):
        self.page_width, self.page_height = A4
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles with Turkish character support"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName=DEFAULT_FONT_BOLD
        ))

        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=11,
            textColor=colors.HexColor('#333333'),
            spaceAfter=6,
            fontName=DEFAULT_FONT_BOLD
        ))

        self.styles.add(ParagraphStyle(
            name='TableHeader',
            fontSize=10,
            textColor=colors.whitesmoke,
            spaceAfter=6,
            fontName=DEFAULT_FONT_BOLD,
            alignment=TA_CENTER
        ))

        # Add Normal style with Turkish support
        self.styles.add(ParagraphStyle(
            name='TurkishNormal',
            fontSize=9,
            fontName=DEFAULT_FONT,
            alignment=TA_LEFT,
            leading=11
        ))

    def generate(self, template_type, include_logo, customer, items, company_info, international=None):
        """
        Generate proforma PDF

        Args:
            template_type: 'INTERNATIONAL' or 'LOCAL'
            include_logo: bool
            customer: dict with name, address, city, phone, email
            items: list of dicts with imageUrl, sku, description, quantity, price
            company_info: dict with name, address, phone, email, bank details, logo_url
            international: dict with shipping details (for INTERNATIONAL template)

        Returns:
            BytesIO buffer with PDF content
        """
        logger.info(f"Starting PDF generation: {template_type} template, {len(items)} items")

        # Validate inputs
        if not customer or not items or not company_info:
            raise ValueError("Missing required parameters")

        # Create PDF document
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=A4,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )

        # Build elements
        elements = []

        # Title
        elements.append(Paragraph("PROFORMA INVOICE", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.15*inch))

        # Header section (company + customer info)
        if template_type == 'INTERNATIONAL':
            elements.append(self._build_international_header(company_info, customer, international))
        else:
            elements.append(self._build_local_header(company_info, customer))

        elements.append(Spacer(1, 0.2*inch))

        # Items table with images
        elements.append(self._build_items_table(items, template_type))
        elements.append(Spacer(1, 0.15*inch))

        # Totals section
        total_amount = sum(item['quantity'] * item['price'] for item in items)
        elements.append(self._build_totals_section(total_amount, items))
        elements.append(Spacer(1, 0.15*inch))

        # Footer with bank details
        elements.append(self._build_footer(company_info))

        # Build PDF
        try:
            doc.build(elements)
            pdf_buffer.seek(0)
            logger.info("PDF generated successfully")
            return pdf_buffer
        except Exception as e:
            logger.error(f"Error building PDF: {str(e)}")
            raise

    def _build_international_header(self, company_info, customer, international):
        """Build international template header with export details"""
        if not international:
            international = {}

        header_data = [
            [
                Paragraph("<b>EXPORTER</b>", self.styles['CustomHeading']),
                Paragraph("<b>INVOICE & DATE</b>", self.styles['CustomHeading']),
                Paragraph("<b>EXPORTER'S REF.</b>", self.styles['CustomHeading'])
            ],
            [
                Paragraph(f"{company_info['name']}<br/>{company_info['address']}", self.styles['TurkishNormal']),
                Paragraph(
                    f"{international.get('invoiceNumber', 'PROF-')}<br/>DT.{international.get('invoiceDate', datetime.now().strftime('%d-%m-%Y'))}",
                    self.styles['TurkishNormal']
                ),
                Paragraph(f"{international.get('exporterRef', 'N/A')}", self.styles['Normal'])
            ],
            [
                Paragraph("<b>CONSIGNEE</b>", self.styles['CustomHeading']),
                Paragraph("<b>BUYER (if other than consignee)</b>", self.styles['CustomHeading']),
                Paragraph("", self.styles['Normal'])
            ],
            [
                Paragraph(
                    f"{customer['name']}<br/>{customer['address']}<br/>{customer.get('city', '')}",
                    self.styles['TurkishNormal']
                ),
                Paragraph(
                    f"{customer['name']}<br/>{customer['address']}<br/>{customer.get('city', '')}",
                    self.styles['TurkishNormal']
                ),
                Paragraph("", self.styles['Normal'])
            ],
            [
                Paragraph("<b>PRE-CARRIAGE BY</b>", self.styles['CustomHeading']),
                Paragraph("<b>COUNTRY OF ORIGIN</b>", self.styles['CustomHeading']),
                Paragraph("<b>COUNTRY OF DEST.</b>", self.styles['CustomHeading'])
            ],
            [
                Paragraph(international.get('preCarriage', 'N/A'), self.styles['Normal']),
                Paragraph(international.get('countryOrigin', 'TURKEY'), self.styles['Normal']),
                Paragraph(international.get('countryDest', 'N/A'), self.styles['Normal'])
            ],
            [
                Paragraph("<b>PORT OF LOADING</b>", self.styles['CustomHeading']),
                Paragraph("<b>PORT OF DISCHARGE</b>", self.styles['CustomHeading']),
                Paragraph("<b>VESSEL/FLIGHT NO.</b>", self.styles['CustomHeading'])
            ],
            [
                Paragraph(international.get('portLoading', 'N/A'), self.styles['Normal']),
                Paragraph(international.get('portDischarge', 'N/A'), self.styles['Normal']),
                Paragraph(international.get('vessel', 'N/A'), self.styles['Normal'])
            ]
        ]

        table = Table(header_data, colWidths=[2*inch, 2*inch, 2*inch])
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#CCCCCC')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))

        return table

    def _build_local_header(self, company_info, customer):
        """Build local/domestic template header (simplified)"""
        header_data = [
            [
                Paragraph(f"<b>{company_info['name']}</b>", self.styles['CustomHeading']),
                Paragraph("<b>BAYI / MÜŞTERI</b>", self.styles['CustomHeading'])
            ],
            [
                Paragraph(
                    f"{company_info['address']}<br/>Tel: {company_info.get('phone', '')}<br/>Email: {company_info.get('email', '')}",
                    self.styles['TurkishNormal']
                ),
                Paragraph(
                    f"{customer['name']}<br/>{customer['address']}<br/>{customer.get('city', '')}<br/>Tel: {customer.get('phone', '')}",
                    self.styles['TurkishNormal']
                )
            ],
            [
                Paragraph(f"<b>Tarih / Date:</b> {datetime.now().strftime('%d.%m.%Y')}", self.styles['Normal']),
                Paragraph("", self.styles['Normal'])
            ]
        ]

        table = Table(header_data, colWidths=[3.25*inch, 3.25*inch])
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))

        return table

    def _build_items_table(self, items, template_type):
        """Build items table with product images (image column always rendered;
        missing images render a placeholder so columns stay aligned)."""
        header = [
            Paragraph("<b>Image</b>", self.styles['TableHeader']),
            Paragraph("<b>SKU</b>", self.styles['TableHeader']),
            Paragraph("<b>Description</b>", self.styles['TableHeader']),
            Paragraph("<b>Qty.</b>", self.styles['TableHeader']),
            Paragraph("<b>Price</b>", self.styles['TableHeader']),
            Paragraph("<b>Amount</b>", self.styles['TableHeader'])
        ]

        table_data = [header]

        for item in items:
            amount = item.get('quantity', 1) * item.get('price', 0)
            image_cell = self._fetch_and_resize_image(
                item.get('imageUrl'),
                width=0.8 * inch,
                height=0.8 * inch,
            )

            table_data.append([
                image_cell,
                Paragraph(str(item.get('sku', 'N/A')), self.styles['TurkishNormal']),
                Paragraph(str(item.get('description', '')), self.styles['TurkishNormal']),
                Paragraph(str(item.get('quantity', 0)), self.styles['TurkishNormal']),
                Paragraph(f"${item.get('price', 0):.2f}", self.styles['TurkishNormal']),
                Paragraph(f"${amount:.2f}", self.styles['TurkishNormal'])
            ])

        # Image column kept narrow; description takes the remaining slack
        table = Table(
            table_data,
            colWidths=[0.9*inch, 1.0*inch, 2.3*inch, 0.6*inch, 0.9*inch, 0.9*inch],
        )
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F2F2F2')])
        ]))

        return table

    def _build_totals_section(self, total, items):
        """Build totals section"""
        totals_data = [
            [Paragraph("<b>Subtotal:</b>", self.styles['Normal']), Paragraph(f"${total:.2f}", self.styles['Normal'])],
            [Paragraph("<b>Shipping:</b>", self.styles['Normal']), Paragraph("$0.00", self.styles['Normal'])],
            [Paragraph("<b>Tax:</b>", self.styles['Normal']), Paragraph("$0.00", self.styles['Normal'])],
            [Paragraph("<b>TOTAL:</b>", self.styles['Normal']), Paragraph(f"${total:.2f}", self.styles['Normal'])]
        ]

        table = Table(totals_data, colWidths=[3.5*inch, 2.5*inch])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, 2), 10),
            ('FONTSIZE', (0, 3), (-1, 3), 12),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#CCCCCC')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold')
        ]))

        return table

    def _build_footer(self, company_info):
        """Build footer with bank details and declaration"""
        bank = company_info.get('bank', 'N/A')
        account = company_info.get('bankAccount', 'N/A')

        footer_text = f"""
<b>Bank Details:</b><br/>
Bank: {bank}<br/>
Account: {account}<br/>
<br/>
<b>Declaration:</b><br/>
<i>We declare that this invoice shows the actual price of the goods described
and that all particulars are true and correct.</i>
        """

        return Paragraph(footer_text, self.styles['Normal'])

    def _fetch_and_resize_image(self, url, width=1*inch, height=1*inch):
        """Resolve an image source and return a ReportLab Image flowable.

        Supports three input shapes (in priority order):
          1. data: URI — ``data:image/<type>;base64,<payload>`` (inline upload)
          2. http(s):// URL — fetched via requests
          3. local path — relative or absolute filesystem path

        Falls back to a neutral placeholder Paragraph on any failure so the
        PDF still renders. Never raises.
        """
        if not url:
            return Paragraph("—", self.styles['TurkishNormal'])

        raw_bytes = None
        try:
            url_str = str(url).strip()

            # 1. data: URI (manual upload from admin form via FileReader)
            if url_str.startswith('data:'):
                match = re.match(r'^data:image/[\w+.-]+;base64,(.+)$', url_str, re.DOTALL)
                if not match:
                    logger.warning("Malformed data URI for product image")
                    return Paragraph("—", self.styles['TurkishNormal'])
                raw_bytes = base64.b64decode(match.group(1))

            # 2. Remote URL
            elif url_str.startswith('http://') or url_str.startswith('https://'):
                response = requests.get(url_str, timeout=5)
                response.raise_for_status()
                raw_bytes = response.content

            # 3. Local file path (e.g. /uploads/proforma/abc.png mounted into container)
            elif os.path.exists(url_str):
                with open(url_str, 'rb') as f:
                    raw_bytes = f.read()
            else:
                logger.warning(f"Unrecognised image source: {url_str[:60]}")
                return Paragraph("—", self.styles['TurkishNormal'])

            # Load + resize (Pillow handles JPEG/PNG/WebP)
            img = PILImage.open(BytesIO(raw_bytes))
            if img.mode in ('RGBA', 'LA', 'P'):
                # Flatten transparency onto white for clean PDF rendering
                background = PILImage.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            img.thumbnail((width, height), PILImage.Resampling.LANCZOS)

            img_byte_arr = BytesIO()
            img.save(img_byte_arr, format='PNG', optimize=True)
            img_byte_arr.seek(0)

            return Image(img_byte_arr, width=width, height=height)

        except Exception as e:
            logger.warning(f"Could not render image: {str(e)}")
            return Paragraph("—", self.styles['TurkishNormal'])
