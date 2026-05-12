# Proforma Invoice Generator — Complete Specification
**Version**: 1.0  
**Tech Stack**: Python (reportlab) + NestJS API + Nuxt Frontend  
**Status**: Ready to Code

---

## 🎯 Core Concept

Flexible, dynamic proforma generator that supports:
- ✅ International (export) vs Local (domestic) templates
- ✅ Optional logo (user toggles)
- ✅ Existing bayi from list OR one-time customer
- ✅ Product selection from catalog
- ✅ Pre-filled dealer info (but user can override)
- ✅ International shipping details when needed
- ✅ Future-ready for Netsis e-fatura/irsaliye integration

---

## 📊 Data Models

### Database Schema

```prisma
// Proforma template configurations
model ProformaTemplate {
  id              String   @id @default(cuid())
  type            String   // "INTERNATIONAL" | "LOCAL"
  companyName     String   // "Sadoksan İnşaat"
  companyAddress  String
  companyPhone    String?
  companyEmail    String?
  bankName        String?
  bankAccount     String?
  bankCode        String?
  logo            String?  // S3 URL or base64
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// One proforma document
model Proforma {
  id              String    @id @default(cuid())
  templateId      String    @db.String
  template        ProformaTemplate @relation(fields: [templateId], references: [id])
  
  // Template choice
  type            String    // "INTERNATIONAL" | "LOCAL"
  includeLogo     Boolean   @default(true)
  
  // Dealer OR One-time customer
  dealerId        String?   @db.String
  dealer          Dealer?   @relation(fields: [dealerId], references: [id])
  
  // One-time customer (if dealerId is null)
  customerName    String?
  customerAddress String?
  customerPhone   String?
  customerEmail   String?
  customerCity    String?
  
  // International-specific fields
  exporterRef     String?   // IEC NO, GST NO, etc.
  invoiceNumber   String?
  invoiceDate     DateTime  @default(now())
  
  // Shipment details (INTERNATIONAL only)
  preCarriage     String?   // "By Road", "By Sea", etc.
  pickupLocation  String?   // "MORADABAD"
  countryOrigin   String?   // "INDIA"
  countryDest     String?   // "TURKEY"
  portLoading     String?   // "MUNDRA"
  portDischarge   String?   // "ISTANBUL"
  vessel          String?   // "Vessel/Flight No."
  
  // Items
  items           ProformaItem[]
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String   // dealerId or adminId
}

model ProformaItem {
  id          String   @id @default(cuid())
  proformaId  String
  proforma    Proforma @relation(fields: [proformaId], references: [id], onDelete: Cascade)
  
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  // Editable fields
  quantity    Int
  description String  // Can override product description
  price       Float   // Can override product price
  imageUrl    String? // Cached from product
  
  // Calculated
  amount      Float   // quantity * price (auto-calculated)
  
  order       Int     // Line item order
  createdAt   DateTime @default(now())
}

// Extend existing models
model Dealer {
  // ... existing fields
  proformas   Proforma[]
}

model Product {
  // ... existing fields
  proformas   ProformaItem[]
}
```

---

## 🎨 Frontend Flow

### Page: `/dealer/proforma`

**Step 1: Template Type Selection**
```
┌─────────────────────────────────────────┐
│ Proforma Türü Seçin                    │
│                                         │
│ ◉ Uluslararası (Export)                │
│   ├─ Gemi/Uçak bilgileri               │
│   ├─ Gümrük referans numaraları        │
│   ├─ Başlangıç/Varış ülkeleri          │
│                                         │
│ ◯ Yerel (Domestic)                     │
│   ├─ Sadece bayi bilgileri             │
│   ├─ Basit format                      │
│                                         │
│         [İleri]                        │
└─────────────────────────────────────────┘
```

**Step 2: Logo & Template Config**
```
┌─────────────────────────────────────────┐
│ Şablon Ayarları                        │
│                                         │
│ ☑ Logolu proforma (Sadoksan logo)     │
│ ☐ Logosuz proforma                    │
│                                         │
│ Custom template veya default kullan?   │
│                                         │
│     [Geri] [İleri]                    │
└─────────────────────────────────────────┘
```

**Step 3: Customer Selection**
```
┌─────────────────────────────────────────┐
│ Müşteri Seçimi                         │
│                                         │
│ ◉ Mevcut Bayiler (Listeden)            │
│   └─ [Dropdown: Bayi Adı v]            │
│      ┌─────────────────────────────┐   │
│      │ Bayi 1 - Istanbul           │   │
│      │ Bayi 2 - Ankara             │   │
│      │ Bayi 3 - Izmir              │   │
│      └─────────────────────────────┘   │
│      [Seçileni Otomatik Doldur]        │
│                                         │
│ ◯ Tek Seferlik Müşteri (Yeni)          │
│   ├─ Müşteri Adı      [_________]      │
│   ├─ Adres            [_________]      │
│   ├─ Şehir            [_________]      │
│   ├─ Telefon          [_________]      │
│   └─ Email            [_________]      │
│                                         │
│     [Geri] [İleri]                    │
└─────────────────────────────────────────┘
```

**Step 4: Product Selection & Quantities**
```
┌──────────────────────────────────────────┐
│ Ürün Seçimi                             │
│                                          │
│ [+ Ürün Ekle]                           │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ Image │ SKU    │ Açıklama │ Qty │ ... ││
│ ├──────────────────────────────────────┤│
│ │ [IMG] │ KP-001 │ Kapı ... │ [5] │ X  ││
│ │ [IMG] │ PC-002 │ Pencere  │ [3] │ X  ││
│ │ [IMG] │ CM-003 │ Çatı...  │[10] │ X  ││
│ └──────────────────────────────────────┘│
│                                          │
│ Her satırı tıkla → Edit Modal:          │
│ ┌────────────────────────────────────┐  │
│ │ Ürün: KP-001 - Kapı 3x2m           │  │
│ │ Fiyat: 1000 TL (değiştir)          │  │
│ │ Miktar: 5                          │  │
│ │ Açıklama: [........................] │  │
│ │           [........................] │  │
│ │                      [Kaydet] [İptal]│
│ └────────────────────────────────────┘  │
│                                          │
│     [Geri] [İleri]                     │
└──────────────────────────────────────────┘
```

**Step 5: International Details** (only if INTERNATIONAL template)
```
┌──────────────────────────────────────────┐
│ Uluslararası Gemi Bilgileri             │
│                                          │
│ Başlangıç Ülkesi        [TURKEY v]      │
│ Varış Ülkesi            [IRAQ v]        │
│                                          │
│ Ön Taşıyıcı Türü        [By Road v]     │
│ Yükleme Limanı          [_______] (opt) │
│ Boşaltma Limanı         [_______] (opt) │
│ Gemi/Uçak No.           [_______] (opt) │
│                                          │
│ Gümrük Referans         [_______]       │
│ │ IEC NO: [_______]                    │
│ │ GST NO: [_______]                    │
│                                          │
│     [Geri] [İleri]                     │
└──────────────────────────────────────────┘
```

**Step 6: Preview & Download**
```
┌──────────────────────────────────────────┐
│ Ön İzleme                               │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ [PDF Preview - Full Page]          │  │
│ │                                    │  │
│ │ SADOKSAN İNŞAAT                    │  │
│ │ [LOGO]                             │  │
│ │                                    │  │
│ │ Tarih: 12.05.2026                 │  │
│ │ Bayi: Bayi İstanbul                │  │
│ │                                    │  │
│ │ [Items table with images...]        │  │
│ │                                    │  │
│ │ Toplam: 15,000 TL                  │  │
│ │                                    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [← Geri]  [PDF İndir ↓]  [E-Posta Gönder] │
└──────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### Request

**POST `/api/proforma/generate`**

```json
{
  "templateType": "INTERNATIONAL",  // or "LOCAL"
  "includeLogo": true,
  "templateId": "tpl_123",           // or use default
  
  "customerId": {
    "dealerId": "dealer_123"         // OR
  },
  
  "customer": {                      // If one-time
    "name": "CASALUCCA DERYA COBAN",
    "address": "SENLIKKOY MAH. FLORYA CARD. NO 33",
    "city": "ISTANBUL",
    "phone": "+90 212 123 4567",
    "email": "contact@example.com"
  },
  
  "items": [
    {
      "productId": "prod_001",
      "quantity": 5,
      "price": 1000.00,              // Override if needed
      "description": "Kapı 3x2m"     // Override if needed
    },
    {
      "productId": "prod_002",
      "quantity": 3
      // Uses default product price/description
    }
  ],
  
  "international": {                 // Only if INTERNATIONAL
    "invoiceNumber": "PROF-2026-001",
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

### Response

```json
{
  "status": "success",
  "data": {
    "proformaId": "prof_abc123",
    "pdfUrl": "https://cdn.sadoksan.com/proformas/prof_abc123.pdf",
    "pdfBlob": "<base64 PDF data>",
    "createdAt": "2026-05-12T10:30:00Z"
  }
}
```

---

## 🐍 Backend: NestJS Service

### File Structure
```
apps/api/src/modules/proforma/
├── proforma.controller.ts       // POST /api/proforma/generate
├── proforma.service.ts          // Business logic
├── proforma.generator.ts        // Calls Python service
├── dto/
│   └── generate-proforma.dto.ts
└── entities/
    └── proforma.entity.ts
```

### proforma.service.ts (Pseudocode)

```typescript
@Injectable()
export class ProformaService {
  
  async generateProforma(dto: GenerateProformaDto): Promise<Buffer> {
    // 1. Validate customer (bayi or one-time)
    const customer = dto.dealerId 
      ? await this.dealerService.findById(dto.dealerId)
      : dto.customer;
    
    // 2. Fetch products & images
    const items = await Promise.all(
      dto.items.map(item => this.productService.findById(item.productId))
    );
    
    // 3. Build payload for Python service
    const payload = {
      templateType: dto.templateType,
      includeLogo: dto.includeLogo,
      customer: {
        name: customer.name,
        address: customer.address,
        city: customer.city,
        phone: customer.phone,
        email: customer.email
      },
      items: items.map((prod, idx) => ({
        imageUrl: prod.imageUrl,
        sku: prod.sku,
        description: dto.items[idx].description || prod.description,
        quantity: dto.items[idx].quantity,
        price: dto.items[idx].price || prod.price,
        amount: dto.items[idx].quantity * (dto.items[idx].price || prod.price)
      })),
      international: dto.international,
      companyInfo: this.getCompanyInfo()
    };
    
    // 4. Call Python service
    const pdfBuffer = await this.callPythonGenerator(payload);
    
    // 5. Save proforma record to DB (optional, for history)
    await this.saveProformaRecord(dto, pdfBuffer);
    
    return pdfBuffer;
  }
  
  private async callPythonGenerator(payload: any): Promise<Buffer> {
    // Call Python HTTP service or subprocess
    const response = await fetch('http://python-service:5000/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return response.buffer();
  }
}
```

---

## 🐍 Python Service: reportlab Generator

### File Structure
```
python-service/
├── app.py                    # Flask server
├── proforma_generator.py     # ReportLab PDF generation
├── requirements.txt
└── templates/
    ├── international.py      # International template
    └── local.py              # Local template
```

### app.py (Flask Server)

```python
from flask import Flask, request, jsonify
from proforma_generator import ProformaGenerator

app = Flask(__name__)
generator = ProformaGenerator()

@app.route('/generate', methods=['POST'])
def generate_proforma():
    payload = request.json
    
    try:
        pdf_bytes = generator.generate(
            template_type=payload['templateType'],
            include_logo=payload['includeLogo'],
            customer=payload['customer'],
            items=payload['items'],
            company_info=payload['companyInfo'],
            international=payload.get('international')
        )
        
        return jsonify({
            'status': 'success',
            'pdf': pdf_bytes.decode('base64')  # or send as file
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### proforma_generator.py (Core Logic)

```python
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib import colors

class ProformaGenerator:
    def generate(self, template_type, include_logo, customer, items, company_info, international=None):
        """
        Generate PDF proforma using reportlab
        """
        pdf_path = "/tmp/proforma.pdf"
        doc = SimpleDocTemplate(pdf_path, pagesize=A4)
        elements = []
        
        # 1. Header Section
        if include_logo and company_info.get('logo_url'):
            elements.append(self._add_logo(company_info['logo_url']))
        
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph("PROFORMA INVOICE", self._get_title_style()))
        elements.append(Spacer(1, 0.2*inch))
        
        # 2. Company & Customer Info (different layouts for INTERNATIONAL vs LOCAL)
        if template_type == "INTERNATIONAL":
            elements.append(self._international_header(company_info, customer, international))
        else:
            elements.append(self._local_header(company_info, customer))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # 3. Items Table with Images
        elements.append(self._build_items_table(items, template_type))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # 4. Totals Section
        total = sum(item['amount'] for item in items)
        elements.append(self._build_totals_section(total, items))
        
        # 5. Footer
        elements.append(Spacer(1, 0.3*inch))
        elements.append(self._build_footer(company_info))
        
        # Build PDF
        doc.build(elements)
        
        # Read and return as bytes
        with open(pdf_path, 'rb') as f:
            return f.read()
    
    def _international_header(self, company_info, customer, international):
        """International template with export fields"""
        header_data = [
            ['EXPORTER', 'INVOICE & DATE', 'EXPORTER\'S REF.'],
            [
                f"{company_info['name']}\n{company_info['address']}",
                f"{international.get('invoiceNumber', '')}\nDT.{international.get('invoiceDate', '')}",
                f"IEC NO: {international.get('exporterRef', '')}"
            ],
            ['CONSIGNEE', 'BUYER (if other than consignee)', ''],
            [
                f"{customer['name']}\n{customer['address']}\n{customer['city']}",
                f"{customer['name']}\n{customer['address']}\n{customer['city']}",
                ''
            ],
            ['PRE-CARRIAGE BY', 'COUNTRY OF ORIGIN', 'COUNTRY OF FINAL DESTINATION', ''],
            [
                international.get('preCarriage', ''),
                international.get('countryOrigin', ''),
                international.get('countryDest', ''),
                ''
            ],
            # ... more rows for vessel, ports, etc.
        ]
        
        table = Table(header_data, colWidths=[2*inch, 2*inch, 2*inch])
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ]))
        
        return table
    
    def _local_header(self, company_info, customer):
        """Local/domestic template - simpler format"""
        # Simpler header without shipping details
        pass
    
    def _build_items_table(self, items, template_type):
        """Build items table with product images"""
        # Create table with Image | SKU | Description | Qty | Price | Amount
        # Use reportlab.platypus.Image to embed product images
        pass
    
    def _build_totals_section(self, total, items):
        """Build totals, subtotal, tax, etc."""
        pass
    
    def _build_footer(self, company_info):
        """Bank details, signature line, declaration"""
        pass
```

---

## 🔄 Integration with Netsis (Future)

When Netsis integration is ready:

1. **Replace product images**: Fetch from Netsis product master
2. **Auto-populate prices**: From Netsis price list
3. **One-time customer**: Validate against Netsis cari account
4. **Auto-generate e-fatura**: After proforma → order → fulfillment

For now: Use local product data ✅

---

## 📦 Deliverables (This Week)

**Frontend (Nuxt):**
- [ ] `/dealer/proforma` page with 6-step wizard
- [ ] Product selection modal
- [ ] Item editor modal
- [ ] International shipment form (conditional)
- [ ] PDF preview component
- [ ] Download button

**Backend (NestJS):**
- [ ] ProformaController: POST /api/proforma/generate
- [ ] ProformaService: business logic
- [ ] Prisma migrations (add Proforma, ProformaItem tables)
- [ ] DTOs and validation

**Python Service:**
- [ ] Flask app setup
- [ ] reportlab generator (international template)
- [ ] reportlab generator (local template)
- [ ] Image embedding logic
- [ ] Totals & calculations

**Database:**
- [ ] ProformaTemplate table
- [ ] Proforma table
- [ ] ProformaItem table

---

## ✅ Success Criteria

- ✅ Dealer can generate proforma with existing bayi info
- ✅ Dealer can generate proforma with one-time customer
- ✅ Product images auto-embedded in PDF
- ✅ International & Local formats work
- ✅ Logo toggle works
- ✅ All fields editable and pre-filled appropriately
- ✅ PDF downloads successfully
- ✅ Data saved to database for future Netsis integration

---

## 🚀 Let's Code!

Start with frontend skeleton + API setup. Let's ship this! 💪

