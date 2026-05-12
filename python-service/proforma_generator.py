"""
Proforma Invoice PDF Generator using ReportLab
Supports INTERNATIONAL and LOCAL template types
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
from io import BytesIO
from datetime import datetime
import requests
from PIL import Image as PILImage
import logging

logger = logging.getLogger(__name__)

class ProformaGenerator:
    """Generate production-ready proforma invoices in PDF format"""

    def __init__(self):
        self.page_width, self.page_height = A4
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=11,
            textColor=colors.HexColor('#333333'),
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))

        self.styles.add(ParagraphStyle(
            name='TableHeader',
            fontSize=10,
            textColor=colors.whitesmoke,
            spaceAfter=6,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER
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
                Paragraph(f"{company_info['name']}<br/>{company_info['address']}", self.styles['Normal']),
                Paragraph(
                    f"{international.get('invoiceNumber', 'PROF-')}<br/>DT.{international.get('invoiceDate', datetime.now().strftime('%d-%m-%Y'))}",
                    self.styles['Normal']
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
                    self.styles['Normal']
                ),
                Paragraph(
                    f"{customer['name']}<br/>{customer['address']}<br/>{customer.get('city', '')}",
                    self.styles['Normal']
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
                    self.styles['Normal']
                ),
                Paragraph(
                    f"{customer['name']}<br/>{customer['address']}<br/>{customer.get('city', '')}<br/>Tel: {customer.get('phone', '')}",
                    self.styles['Normal']
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
        """Build items table with product images"""
        # Prepare table data
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
            try:
                # Fetch and resize image
                img = self._fetch_and_resize_image(item.get('imageUrl'), width=0.8*inch, height=0.8*inch)
            except Exception as e:
                logger.warning(f"Failed to load image for {item.get('sku', 'N/A')}: {str(e)}")
                img = Paragraph("[No Image]", self.styles['Normal'])

            amount = item['quantity'] * item['price']

            table_data.append([
                img,
                Paragraph(item.get('sku', 'N/A'), self.styles['Normal']),
                Paragraph(item.get('description', ''), self.styles['Normal']),
                Paragraph(str(item['quantity']), self.styles['Normal']),
                Paragraph(f"${item['price']:.2f}", self.styles['Normal']),
                Paragraph(f"${amount:.2f}", self.styles['Normal'])
            ])

        table = Table(table_data, colWidths=[1*inch, 0.9*inch, 2.5*inch, 0.6*inch, 0.8*inch, 0.8*inch])
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
            [Paragraph("<b>TOTAL:</b>", self.styles['CustomHeading']), Paragraph(f"<b>${total:.2f}</b>", self.styles['CustomHeading'])]
        ]

        table = Table(totals_data, colWidths=[4*inch, 2*inch])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#CCCCCC')),
            ('GRID', (0, -1), (-1, -1), 0.5, colors.grey)
        ]))

        return table

    def _build_footer(self, company_info):
        """Build footer with bank details and declaration"""
        footer_text = f"""
        <b>Bank Details:</b><br/>
        Bank: {company_info.get('bank', 'N/A')}<br/>
        Account: {company_info.get('bankAccount', 'N/A')}<br/>
        <br/>
        <b>Declaration:</b><br/>
        <i>We declare that this invoice shows the actual price of the goods described
        and that all particulars are true and correct.</i>
        """

        return Paragraph(footer_text, self.styles['Normal'])

    def _fetch_and_resize_image(self, url, width=1*inch, height=1*inch):
        """Fetch image from URL and resize for PDF"""
        if not url:
            return Paragraph("[No Image]", self.styles['Normal'])

        try:
            # Fetch image
            response = requests.get(url, timeout=5)
            response.raise_for_status()

            # Load and resize
            img = PILImage.open(BytesIO(response.content))
            img.thumbnail((width, height), PILImage.Resampling.LANCZOS)

            # Convert to bytes
            img_byte_arr = BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)

            # Return ReportLab Image
            return Image(img_byte_arr, width=width, height=height)

        except Exception as e:
            logger.warning(f"Could not fetch/resize image from {url}: {str(e)}")
            return Paragraph("[Image Error]", self.styles['Normal'])
