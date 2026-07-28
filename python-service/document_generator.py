"""
Genel amaçlı belge PDF üretici (ReportLab).
proforma_generator.py'ye DOKUNULMADI — bu tamamen ayrı, bağımsız bir modül.
Sipariş formu, bayi cari ekstresi, irsaliye gibi farklı belge türleri için
aynı esnek şablon kullanılabilir (title + companyInfo + customer + metaFields
+ items tablosu + totals + footerNote).
UTF-8 Türkçe karakter desteği vardır.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
import logging
import os

logger = logging.getLogger(__name__)

try:
    if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        pdfmetrics.registerFont(TTFont('DejaVuSans-Doc', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVuSans-Doc-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
        FONT = 'DejaVuSans-Doc'
        FONT_BOLD = 'DejaVuSans-Doc-Bold'
    else:
        FONT = 'Helvetica'
        FONT_BOLD = 'Helvetica-Bold'
except Exception as e:
    logger.warning(f"DejaVuSans yuklenemedi, Helvetica kullanilacak: {e}")
    FONT = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'


class DocumentGenerator:
    """
    Genel amacli belge PDF uretici.
    generate() payload sekli:
    {
      "title": "SİPARİŞ FORMU",
      "documentNumber": "SDK-2026-83506",
      "documentDate": "04.07.2026",
      "companyInfo": {"name": "...", "address": "...", "phone": "...", "email": "..."},
      "customer": {"name": "...", "address": "...", "city": "...", "phone": "...", "email": "..."},
      "metaFields": [{"label": "Durum", "value": "Onaylandı"}, ...],
      "items": [{"sku": "...", "description": "...", "quantity": 2, "unit": "adet", "price": 100.0}],
      "totals": [{"label": "Ara Toplam", "value": "1.000,00 ₺"}, {"label": "Genel Toplam", "value": "1.200,00 ₺", "bold": true}],
      "footerNote": "opsiyonel metin"
    }
    """

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_styles()

    def _setup_styles(self):
        self.styles.add(ParagraphStyle(
            name='DocTitle', fontSize=18, textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=4, alignment=TA_CENTER, fontName=FONT_BOLD,
        ))
        self.styles.add(ParagraphStyle(
            name='DocSubtitle', fontSize=10, textColor=colors.HexColor('#555555'),
            spaceAfter=14, alignment=TA_CENTER, fontName=FONT,
        ))
        self.styles.add(ParagraphStyle(
            name='DocHeading', fontSize=10, textColor=colors.HexColor('#333333'),
            spaceAfter=4, fontName=FONT_BOLD,
        ))
        self.styles.add(ParagraphStyle(
            name='DocNormal', fontSize=9, fontName=FONT, alignment=TA_LEFT, leading=12,
        ))
        self.styles.add(ParagraphStyle(
            name='DocFooter', fontSize=8, textColor=colors.HexColor('#777777'),
            fontName=FONT, alignment=TA_CENTER,
        ))

    def generate(self, title, document_number, document_date, company_info, customer,
                 meta_fields=None, items=None, totals=None, footer_note=None):
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            topMargin=1.5 * cm, bottomMargin=1.5 * cm,
            leftMargin=1.8 * cm, rightMargin=1.8 * cm,
        )
        story = []

        story.append(Paragraph(company_info.get('name', ''), self.styles['DocTitle']))
        addr_line = ' · '.join(filter(None, [company_info.get('address'), company_info.get('phone'), company_info.get('email')]))
        if addr_line:
            story.append(Paragraph(addr_line, self.styles['DocSubtitle']))

        story.append(Paragraph(title, ParagraphStyle(
            name='DocMainTitle', fontSize=14, fontName=FONT_BOLD,
            alignment=TA_CENTER, spaceAfter=10, textColor=colors.HexColor('#0a3d2e'),
        )))

        info_rows = [[
            Paragraph(f"<b>Belge No:</b> {document_number}", self.styles['DocNormal']),
            Paragraph(f"<b>Tarih:</b> {document_date}", self.styles['DocNormal']),
        ]]
        story.append(Table(info_rows, colWidths=['50%', '50%']))
        story.append(Spacer(1, 8))

        cust_lines = [f"<b>{customer.get('name', '')}</b>"]
        for key in ('address', 'city', 'phone', 'email'):
            if customer.get(key):
                cust_lines.append(customer[key])
        story.append(Paragraph('<br/>'.join(cust_lines), self.styles['DocNormal']))
        story.append(Spacer(1, 10))

        if meta_fields:
            meta_row = [Paragraph(f"<b>{m['label']}:</b> {m['value']}", self.styles['DocNormal']) for m in meta_fields]
            # 3'erli satirlara bol
            chunks = [meta_row[i:i + 3] for i in range(0, len(meta_row), 3)]
            for chunk in chunks:
                while len(chunk) < 3:
                    chunk.append(Paragraph('', self.styles['DocNormal']))
                story.append(Table([chunk], colWidths=['33%', '33%', '34%']))
            story.append(Spacer(1, 10))

        if items:
            header = ['Ürün', 'SKU', 'Miktar', 'Birim Fiyat', 'Toplam']
            rows = [header]
            for it in items:
                qty = it.get('quantity', 0)
                price = it.get('price', 0)
                unit = it.get('unit', '')
                rows.append([
                    Paragraph(it.get('description', ''), self.styles['DocNormal']),
                    it.get('sku', ''),
                    f"{qty} {unit}".strip(),
                    f"{price:,.2f} ₺".replace(',', 'X').replace('.', ',').replace('X', '.'),
                    f"{qty * price:,.2f} ₺".replace(',', 'X').replace('.', ',').replace('X', '.'),
                ])
            table = Table(rows, colWidths=['38%', '17%', '13%', '16%', '16%'], repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0a3d2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
                ('FONTNAME', (0, 1), (-1, -1), FONT),
                ('FONTSIZE', (0, 0), (-1, -1), 8.5),
                ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7f7f7')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(table)
            story.append(Spacer(1, 10))

        if totals:
            for t in totals:
                style = self.styles['DocHeading'] if t.get('bold') else self.styles['DocNormal']
                row = Table([[
                    Paragraph('', self.styles['DocNormal']),
                    Paragraph(f"{t['label']}", style),
                    Paragraph(f"{t['value']}", ParagraphStyle(name='r', parent=style, alignment=TA_RIGHT)),
                ]], colWidths=['58%', '21%', '21%'])
                story.append(row)
            story.append(Spacer(1, 14))

        if footer_note:
            story.append(Spacer(1, 10))
            story.append(Paragraph(footer_note, self.styles['DocFooter']))

        doc.build(story)
        buffer.seek(0)
        return buffer
