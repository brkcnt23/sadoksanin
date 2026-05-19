/**
 * Seed products scraped from sadoksaninsaat.com.tr (Ideasoft).
 *
 * Her kategoriden 10+ gerçek ürün. Fiyatlar sitede gösterilmediği için
 * makul piyasa değerleri atandı.
 *
 * Usage (Docker içinde apps/api):
 *   npx ts-node src/scripts/seed-products-from-site.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedProduct {
  sku: string;
  netsisCode: string;
  name: string;
  brand: string;
  category: string;
  basePrice: number;
  unit: string;
  netsisStock: number;
  minimumStock?: number;
  middleStock?: number;
  description?: string;
  imageUrl?: string;
}

// ─── Seramik (Akgün / QUA) ─────────────────────────────────────────────────
const seramik: SeedProduct[] = [
  { sku:'9110', netsisCode:'NTS-9110', name:'60X120N PK LF EVEREST BEIGE 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:320, unit:'m²', netsisStock:45, description:'Premium seramik kaplama, 60x120 cm, Everest Beige, mat finish', imageUrl:'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/124/ekran-goruntusu-2026-01-28-133503_min.png' },
  { sku:'9097', netsisCode:'NTS-9097', name:'60X120N PK LF NAVAS SIYAH 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:315, unit:'m²', netsisStock:38, description:'Navas serisi siyah seramik, 60x120 cm, premium kalite', imageUrl:'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/111/ekran-goruntusu-2026-01-28-124911_min.png' },
  { sku:'9057', netsisCode:'NTS-9057', name:'60X120N PK LF LOFT GRI 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:325, unit:'m²', netsisStock:52, description:'Loft tarzı gri seramik, 60x120 cm', imageUrl:'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/070/loft_min.png' },
  { sku:'9056', netsisCode:'NTS-9056', name:'60X120N PK LF GALAXY SIYAH 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:330, unit:'m²', netsisStock:28, description:'Galaxy koleksiyonu siyah seramik, 60x120 cm', imageUrl:'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/069/gll_min.png' },
  { sku:'9055', netsisCode:'NTS-9055', name:'60X120N PK LF DURBAN ANTHRACITE 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:310, unit:'m²', netsisStock:35, description:'Durban serisi antrasit seramik, 60x120 cm', imageUrl:'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/068/durbn_min.png' },
  { sku:'9131', netsisCode:'NTS-9131', name:'60X120N PK LF NAVAS ACIK GRI 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:315, unit:'m²', netsisStock:42, description:'Navas serisi açık gri, 60x120 cm' },
  { sku:'9137', netsisCode:'NTS-9137', name:'60X120N PK LF DURBAN GREY 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:310, unit:'m²', netsisStock:33, description:'Durban serisi gri, 60x120 cm' },
  { sku:'9138', netsisCode:'NTS-9138', name:'60X120N PK LF MONTA WHITE 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:335, unit:'m²', netsisStock:25, description:'Monta serisi beyaz, 60x120 cm' },
  { sku:'8938', netsisCode:'NTS-8938', name:'60X120N PK LF NEO ASSOS NERO 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:340, unit:'m²', netsisStock:20, description:'Neo Assos Nero koyu ton, 60x120 cm' },
  { sku:'8940', netsisCode:'NTS-8940', name:'60X120N PK LF NEO CAL GOLD 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:360, unit:'m²', netsisStock:18, minimumStock:10, description:'Neo Cal Gold altın tonlu, 60x120 cm, sınırlı stok' },
  { sku:'6325', netsisCode:'NTS-6325', name:'61X61 KR MT CEMENT ANTRST 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:220, unit:'m²', netsisStock:60, description:'Cement antrasit, 61x61 cm' },
  { sku:'8942', netsisCode:'NTS-8942', name:'60X120N PK LF LOFT BONE 1.K SR', brand:'AKGÜN', category:'Seramik', basePrice:325, unit:'m²', netsisStock:30, description:'Loft serisi bone rengi, 60x120 cm' },
];

// ─── Vitrifiye ─────────────────────────────────────────────────────────────
const vitrifiye: SeedProduct[] = [
  { sku:'VTR-101', netsisCode:'NTS-VTR-101', name:'TETRA BASIC KARE ASMA KLOZET', brand:'ISVEA', category:'Vitrifiye', basePrice:2450, unit:'adet', netsisStock:15, description:'Kare tasarım asma klozet, beyaz' },
  { sku:'VTR-102', netsisCode:'NTS-VTR-102', name:'Durezza Tuğla Duv.Tipi Göm.Rez. Galveniz Kasa Yeni', brand:'ISVEA', category:'Vitrifiye', basePrice:1850, unit:'adet', netsisStock:22, description:'Tuğla duvar tipi gömme rezervuar, galveniz kasa' },
  { sku:'VTR-103', netsisCode:'NTS-VTR-103', name:'Ventuno Duvara Sıfır Klozet', brand:'ISVEA', category:'Vitrifiye', basePrice:3200, unit:'adet', netsisStock:8, minimumStock:5, description:'Duvara sıfır klozet, modern tasarım' },
  { sku:'VTR-104', netsisCode:'NTS-VTR-104', name:'SONSUZLUK PİSUAR SEPERATÖRÜ', brand:'ISVEA', category:'Vitrifiye', basePrice:750, unit:'adet', netsisStock:40, description:'Pisuar seperatörü' },
  { sku:'VTR-105', netsisCode:'NTS-VTR-105', name:'INFINITY FOTOSELLİ PİSUAR', brand:'ISVEA', category:'Vitrifiye', basePrice:4200, unit:'adet', netsisStock:5, minimumStock:3, description:'Fotoselli pisuar, infinity serisi' },
  { sku:'VTR-106', netsisCode:'NTS-VTR-106', name:'VENTUNO ASMA KLOZET', brand:'ISVEA', category:'Vitrifiye', basePrice:2850, unit:'adet', netsisStock:12, description:'Ventuno asma klozet, beyaz' },
  { sku:'VTR-107', netsisCode:'NTS-VTR-107', name:'SOLUZIONE XX ASMA KLOZET', brand:'ISVEA', category:'Vitrifiye', basePrice:3500, unit:'adet', netsisStock:7, minimumStock:5, description:'Soluzione XX asma klozet' },
  { sku:'VTR-108', netsisCode:'NTS-VTR-108', name:'NEXO WALL HUNG WC WITH PIPE HOLE', brand:'ROCA', category:'Vitrifiye', basePrice:3800, unit:'adet', netsisStock:10, description:'Roca Nexo asma klozet' },
  { sku:'VTR-109', netsisCode:'NTS-VTR-109', name:'80 mm Tugla.Tipi Gömme .Rez.+Mat Krom Panel', brand:'ECE', category:'Vitrifiye', basePrice:1650, unit:'adet', netsisStock:25, description:'Tuğla tipi gömme rezervuar + mat krom panel' },
  { sku:'VTR-110', netsisCode:'NTS-VTR-110', name:'DROM REZERVUAR İÇ TAKIM-TEK BASMALI', brand:'DROM', category:'Vitrifiye', basePrice:450, unit:'adet', netsisStock:50, description:'Rezervuar iç takım, tek basmalı' },
  { sku:'VTR-111', netsisCode:'NTS-VTR-111', name:'KOLON AYAK', brand:'MAXIFLOW', category:'Vitrifiye', basePrice:350, unit:'adet', netsisStock:35, description:'Kolon ayak' },
];

// ─── RTRMAX (Elektrikli El Aletleri) ───────────────────────────────────────
const rtrmax: SeedProduct[] = [
  { sku:'RTR-8893', netsisCode:'NTS-RTR-8893', name:'TEMİZ SU DALGIÇ POMPA 400W 7.5 Mt RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:1850, unit:'adet', netsisStock:30, description:'Temiz su dalgıç pompa, 400W, 7.5m' },
  { sku:'RTR-8884', netsisCode:'NTS-RTR-8884', name:'YÜKSEK BASINÇLI YIKAMA 2500 W 195 BAR 5MT HORTUM 23 KG RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:4200, unit:'adet', netsisStock:12, description:'Yüksek basınçlı yıkama, 2500W, 195 bar' },
  { sku:'RTR-8883', netsisCode:'NTS-RTR-8883', name:'YÜKSEK BASINÇLI YIKAMA 1600 W 130 BAR RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:2800, unit:'adet', netsisStock:18, description:'Yüksek basınçlı yıkama, 1600W, 130 bar' },
  { sku:'RTR-8868', netsisCode:'NTS-RTR-8868', name:'DAİRE TESTERE LAZERLİ 185 MM 1400 W RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:1950, unit:'adet', netsisStock:22, description:'Daire testere lazerli, 185mm, 1400W' },
  { sku:'RTR-8866', netsisCode:'NTS-RTR-8866', name:'SDS PLUS KIRICI DELİCİ 1500 W 6.0 JUL 32 MM RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:3600, unit:'adet', netsisStock:14, description:'SDS Plus kırıcı delici, 1500W, 6J, 32mm' },
  { sku:'RTR-8865', netsisCode:'NTS-RTR-8865', name:'ÇOK AMAÇLI KESİCİ 300 W DEVİR AYARLI 21.000 RPM RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:1250, unit:'adet', netsisStock:25, description:'Çok amaçlı kesici, 300W, devir ayarlı' },
  { sku:'RTR-8856', netsisCode:'NTS-RTR-8856', name:'BENZİNLİ AĞAÇ MOTORU 1.2 HP 25.4 CC 30CM PALA RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:3400, unit:'adet', netsisStock:8, minimumStock:5, description:'Benzinli ağaç motoru, 1.2HP, 25.4cc, 30cm pala' },
  { sku:'RTR-8348', netsisCode:'NTS-RTR-8348', name:'PASLANMAZ KEMİK TESTERE 30CM RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:180, unit:'adet', netsisStock:60, description:'Paslanmaz kemik testere, 30cm' },
  { sku:'RTR-8734', netsisCode:'NTS-RTR-8734', name:'AKÜLÜ AVUÇ TAŞLAMA KÖMÜRSÜZ 115MM 8.500RPM RTRMAX S-LION', brand:'RTRMAX', category:'RTRMAX', basePrice:2800, unit:'adet', netsisStock:10, description:'Akülü avuç taşlama, kömürsüz, 115mm' },
  { sku:'RTR-8725', netsisCode:'NTS-RTR-8725', name:'AKÜLÜ DARBELİ MATKAP KÖMÜRSÜZ 54Nm 2x2 Ah AKÜ RTRMAX S-LION', brand:'RTRMAX', category:'RTRMAX', basePrice:3200, unit:'adet', netsisStock:14, description:'Akülü darbeli matkap, kömürsüz, 54Nm, 2x2Ah' },
  { sku:'RTR-8716', netsisCode:'NTS-RTR-8716', name:'YÜKSEK HIZLI YAĞSIZ HAVA KOMPRESÖRÜ 50 LT 2.0 HP RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:5200, unit:'adet', netsisStock:6, minimumStock:3, description:'Yağsız hava kompresörü, 50lt, 2.0HP' },
  { sku:'RTR-8719', netsisCode:'NTS-RTR-8719', name:'BENZİNLİ AĞAÇ MOTORU 57 CC 45CM PALA RTRMAX', brand:'RTRMAX', category:'RTRMAX', basePrice:4800, unit:'adet', netsisStock:5, minimumStock:3, description:'Benzinli ağaç motoru, 57cc, 45cm pala' },
];

// ─── Banyo Grubu & Kabin ───────────────────────────────────────────────────
const banyoGrubu: SeedProduct[] = [
  { sku:'BNY-9160', netsisCode:'NTS-BNY-9160', name:'90*90 K.GİRİŞLİ SİYAH PROFİL KUMLAMALI KABİN H:190', brand:'UBM BANYO', category:'Banyo Grubu & Kabin', basePrice:6500, unit:'adet', netsisStock:8, minimumStock:3, description:'90x90 köşe girişli siyah profil kumlamalı duş kabini, H:190' },
  { sku:'BNY-9159', netsisCode:'NTS-BNY-9159', name:'100*100 K.GİRİŞLİ SİYAH PROFİL KUMLAMALI KABİN H:190', brand:'UBM BANYO', category:'Banyo Grubu & Kabin', basePrice:7200, unit:'adet', netsisStock:6, minimumStock:3, description:'100x100 köşe girişli siyah profil kumlamalı duş kabini, H:190' },
  { sku:'BNY-9177', netsisCode:'NTS-BNY-9177', name:'ARYA BOY DOLABI - ANTRASİT-ANTRASİT', brand:'UBM BANYO', category:'Banyo Grubu & Kabin', basePrice:2800, unit:'adet', netsisStock:15, description:'Arya boy dolabı, antrasit-antrasit' },
  { sku:'BNY-9041', netsisCode:'NTS-BNY-9041', name:'Platon 65 cm Dlp Membran Kpk Beyaz M1 SET', brand:'ISVEA', category:'Banyo Grubu & Kabin', basePrice:4200, unit:'adet', netsisStock:12, description:'Platon 65cm dolap membran kapak beyaz M1 set' },
  { sku:'BNY-9043', netsisCode:'NTS-BNY-9043', name:'Platon 65 cm Dlp Membran Kpk Ant-Beyaz M1 SET', brand:'ISVEA', category:'Banyo Grubu & Kabin', basePrice:4200, unit:'adet', netsisStock:10, description:'Platon 65cm dolap membran kapak antrasit-beyaz M1 set' },
  { sku:'BNY-9151', netsisCode:'NTS-BNY-9151', name:'MASAL BOY DOLAP - VİZON BEJ', brand:'UBM BANYO', category:'Banyo Grubu & Kabin', basePrice:2600, unit:'adet', netsisStock:18, description:'Masal boy dolap, vizon bej' },
  { sku:'BNY-9180', netsisCode:'NTS-BNY-9180', name:'65 CM DOLAP BİGA TAKIM - ANTRASİT-ANTRASİT', brand:'UBM BANYO', category:'Banyo Grubu & Kabin', basePrice:3800, unit:'adet', netsisStock:20, description:'65cm Biga takım dolap, antrasit-antrasit' },
  { sku:'BNY-9181', netsisCode:'NTS-BNY-9181', name:'65 CM DOLAP BİGA TAKIM-BEYAZ-BEYAZ', brand:'UBM BANYO', category:'Banyo Grubu & Kabin', basePrice:3800, unit:'adet', netsisStock:16, description:'65cm Biga takım dolap, beyaz-beyaz' },
  { sku:'BNY-8971', netsisCode:'NTS-BNY-8971', name:'80 CM DOLAP RETRO TAKIM-ANTRASİT-ANTRASİT BANYO DOLABI', brand:'UBM BANYO', category:'Banyo Grubu & Kabin', basePrice:4500, unit:'adet', netsisStock:11, description:'80cm Retro takım dolap, antrasit-antrasit' },
  { sku:'BNY-9184', netsisCode:'NTS-BNY-9184', name:'80 CM DOLAP KEOPS TAKIM-BEYAZ-ANTRASİT', brand:'UBM BANYO', category:'Banyo Grubu & Kabin', basePrice:4800, unit:'adet', netsisStock:14, description:'80cm Keops takım dolap, beyaz-antrasit' },
];

// ─── Banyo Aksesuarları ────────────────────────────────────────────────────
const banyoAksesuar: SeedProduct[] = [
  { sku:'AKS-9162', netsisCode:'NTS-AKS-9162', name:'LAVİ AYNA 40X50 CM', brand:'MAXIFLOW', category:'Banyo Aksesuarları', basePrice:450, unit:'adet', netsisStock:40, description:'Lavi ayna, 40x50cm' },
  { sku:'AKS-9072', netsisCode:'NTS-AKS-9072', name:'F1 BLACK SERİSİ WC KAĞITLIK', brand:'MAXIFLOW', category:'Banyo Aksesuarları', basePrice:280, unit:'adet', netsisStock:55, description:'F1 Black serisi WC kağıtlık' },
  { sku:'AKS-8994', netsisCode:'NTS-AKS-8994', name:'F1 BLACK SERİSİ BORNOZ ASKILIĞI', brand:'MAXIFLOW', category:'Banyo Aksesuarları', basePrice:320, unit:'adet', netsisStock:45, description:'F1 Black serisi bornoz askılığı' },
  { sku:'AKS-8992', netsisCode:'NTS-AKS-8992', name:'F1 SERİSİ YUVARLAK HAVLULUK', brand:'MAXIFLOW', category:'Banyo Aksesuarları', basePrice:250, unit:'adet', netsisStock:50, description:'F1 serisi yuvarlak havluluk' },
  { sku:'AKS-8643', netsisCode:'NTS-AKS-8643', name:'PRİMA İKİLİ BORNOZLUK SİYAH', brand:'DROM', category:'Banyo Aksesuarları', basePrice:380, unit:'adet', netsisStock:35, description:'Prima ikili bornozluk, siyah' },
  { sku:'AKS-8670', netsisCode:'NTS-AKS-8670', name:'ELEGANZA KAPAKSIZ KAĞITLIK', brand:'DROM', category:'Banyo Aksesuarları', basePrice:220, unit:'adet', netsisStock:60, description:'Eleganza kapaksız kağıtlık' },
  { sku:'AKS-8669', netsisCode:'NTS-AKS-8669', name:'ELEGANZA KAĞIT HAVLULUK', brand:'DROM', category:'Banyo Aksesuarları', basePrice:300, unit:'adet', netsisStock:48, description:'Eleganza kağıt havluluk' },
  { sku:'AKS-8667', netsisCode:'NTS-AKS-8667', name:'ELEGANZA ASKILIK', brand:'DROM', category:'Banyo Aksesuarları', basePrice:180, unit:'adet', netsisStock:70, description:'Eleganza askılık' },
  { sku:'AKS-8665', netsisCode:'NTS-AKS-8665', name:'ELEGANZA YUVARLAK HAVLULUK', brand:'DROM', category:'Banyo Aksesuarları', basePrice:260, unit:'adet', netsisStock:55, description:'Eleganza yuvarlak havluluk' },
  { sku:'AKS-8664', netsisCode:'NTS-AKS-8664', name:'LUXE KAPATSIZ KAĞITLIK KROM', brand:'DROM', category:'Banyo Aksesuarları', basePrice:350, unit:'adet', netsisStock:42, description:'Luxe kapatsız kağıtlık, krom' },
  { sku:'AKS-8663', netsisCode:'NTS-AKS-8663', name:'LUXE KAĞIT HAVLULUK KROM', brand:'DROM', category:'Banyo Aksesuarları', basePrice:480, unit:'adet', netsisStock:32, description:'Luxe kağıt havluluk, krom' },
];

// ─── Batarya ve Musluklar ──────────────────────────────────────────────────
const batarya: SeedProduct[] = [
  { sku:'BAT-7219', netsisCode:'NTS-BAT-7219', name:'TENA DUŞ ROBOTU-YUVARLAK', brand:'TESKA', category:'Batarya ve Musluklar', basePrice:1850, unit:'adet', netsisStock:20, description:'Tena duş robotu, yuvarlak tasarım' },
  { sku:'BAT-5971', netsisCode:'NTS-BAT-5971', name:'ALAMERA KUGU LAVABO BATARYASI KROM', brand:'NSK', category:'Batarya ve Musluklar', basePrice:950, unit:'adet', netsisStock:35, description:'Alamera kuğu lavabo bataryası, krom' },
  { sku:'BAT-6182', netsisCode:'NTS-BAT-6182', name:'GEO KUĞU LAVABO BATARYASI KROM', brand:'NSK', category:'Batarya ve Musluklar', basePrice:850, unit:'adet', netsisStock:28, description:'Geo kuğu lavabo bataryası, krom' },
  { sku:'BAT-6156', netsisCode:'NTS-BAT-6156', name:'TRENTO KUGU LAVABO BATARYASI KROM', brand:'NSK', category:'Batarya ve Musluklar', basePrice:1050, unit:'adet', netsisStock:22, description:'Trento kuğu lavabo bataryası, krom' },
  { sku:'BAT-6148', netsisCode:'NTS-BAT-6148', name:'NOBIA LAVABO BATARYASI KROM', brand:'NSK', category:'Batarya ve Musluklar', basePrice:780, unit:'adet', netsisStock:40, description:'Nobia lavabo bataryası, krom' },
  { sku:'BAT-6135', netsisCode:'NTS-BAT-6135', name:'VISIA PLUS KUGU LAVABO BATARYASI KROM', brand:'NSK', category:'Batarya ve Musluklar', basePrice:1150, unit:'adet', netsisStock:18, description:'Visia Plus kuğu lavabo bataryası, krom' },
  { sku:'BAT-6063', netsisCode:'NTS-BAT-6063', name:'ION FOTOSELLI LAVABO BATARYASI (CIFT SU GIRISLI) KROM', brand:'NSK', category:'Batarya ve Musluklar', basePrice:2800, unit:'adet', netsisStock:12, minimumStock:5, description:'Fotoselli lavabo bataryası, çift su girişli, elektrikli+pilli' },
  { sku:'BAT-8833', netsisCode:'NTS-BAT-8833', name:'MUSTANG LAVABO BATARYASI', brand:'FLEKO', category:'Batarya ve Musluklar', basePrice:680, unit:'adet', netsisStock:30, description:'Mustang lavabo bataryası' },
  { sku:'BAT-8789', netsisCode:'NTS-BAT-8789', name:'MOB-G402-2 MOB GOLD DÖNER BORULU BATARYASI', brand:'FLEKO', category:'Batarya ve Musluklar', basePrice:1350, unit:'adet', netsisStock:16, description:'Mob Gold döner borulu batarya' },
  { sku:'BAT-8588', netsisCode:'NTS-BAT-8588', name:'ALFA LAVABO BATARYASI', brand:'FLEKO', category:'Batarya ve Musluklar', basePrice:620, unit:'adet', netsisStock:45, description:'Alfa lavabo bataryası' },
  { sku:'BAT-8524', netsisCode:'NTS-BAT-8524', name:'MOB BLACK LAVABO BATARYASI', brand:'FLEKO', category:'Batarya ve Musluklar', basePrice:750, unit:'adet', netsisStock:25, description:'Mob Black lavabo bataryası' },
];

// ─── Silikon & Köpük & Sprey Boya ──────────────────────────────────────────
const silikon: SeedProduct[] = [
  { sku:'SLK-8924', netsisCode:'NTS-SLK-8924', name:'Akfix HT300 RTV Yüksek Isı Silikonu 280Ml Kırmızı', brand:'AKFİX', category:'Silikon & Köpük & Sprey Boya', basePrice:120, unit:'adet', netsisStock:120, description:'Yüksek ısı silikonu, 280ml, kırmızı' },
  { sku:'SLK-8809', netsisCode:'NTS-SLK-8809', name:'AKFİX 610 PU EKSPRES MONTAJ YAPIŞTIRICI 280Ml ŞEFFAF', brand:'AKFİX', category:'Silikon & Köpük & Sprey Boya', basePrice:95, unit:'adet', netsisStock:150, description:'PU ekspres montaj yapıştırıcı, 280ml, şeffaf' },
  { sku:'SLK-8605', netsisCode:'NTS-SLK-8605', name:'AKFİX 805P PU TABANCALI KÖPÜK 750 ML', brand:'AKFİX', category:'Silikon & Köpük & Sprey Boya', basePrice:185, unit:'adet', netsisStock:200, description:'PU tabancalı köpük, 750ml' },
  { sku:'SLK-8611', netsisCode:'NTS-SLK-8611', name:'AKFİX 705 ÜNİVERSAL HIZLI YAPIŞTIRICI (B100GR+400ML)', brand:'AKFİX', category:'Silikon & Köpük & Sprey Boya', basePrice:145, unit:'adet', netsisStock:90, description:'Üniversal hızlı yapıştırıcı, 100gr+400ml' },
  { sku:'SLK-4181', netsisCode:'NTS-SLK-4181', name:'280 ML SOUDAL SILIRUB SC DUŞAKABİN SİLİKONU BEYAZ', brand:'SOUDAL', category:'Silikon & Köpük & Sprey Boya', basePrice:160, unit:'adet', netsisStock:80, description:'Duşakabin silikonu, 280ml, beyaz' },
  { sku:'SLK-4177', netsisCode:'NTS-SLK-4177', name:'500 GR SOUDAL ACRYRUB SİLİKONUZE MASTİK BRONZ', brand:'SOUDAL', category:'Silikon & Köpük & Sprey Boya', basePrice:130, unit:'adet', netsisStock:65, description:'Silikonize mastik, 500gr, bronz' },
  { sku:'SLK-4174', netsisCode:'NTS-SLK-4174', name:'500 GR SOUDAL ACRYRUB SİLİKONİZE MASTİK SİYAH', brand:'SOUDAL', category:'Silikon & Köpük & Sprey Boya', basePrice:130, unit:'adet', netsisStock:70, description:'Silikonize mastik, 500gr, siyah' },
  { sku:'SLK-3522', netsisCode:'NTS-SLK-3522', name:'SOUDAL ULTRA DAYANIKLI SİLİKON TABANCASI SİYAH', brand:'SOUDAL', category:'Silikon & Köpük & Sprey Boya', basePrice:250, unit:'adet', netsisStock:45, description:'Ultra dayanıklı silikon tabancası, siyah' },
  { sku:'SLK-8927', netsisCode:'NTS-SLK-8927', name:'Eurofix Genel Amaçlı Silikon 280Gr Şeffaf', brand:'AKFİX', category:'Silikon & Köpük & Sprey Boya', basePrice:75, unit:'adet', netsisStock:180, description:'Genel amaçlı silikon, 280gr, şeffaf' },
  { sku:'SLK-8926', netsisCode:'NTS-SLK-8926', name:'Akfix 900N Nötr Ayna Silikonu 310Ml Şeffaf', brand:'AKFİX', category:'Silikon & Köpük & Sprey Boya', basePrice:110, unit:'adet', netsisStock:95, description:'Nötr ayna silikonu, 310ml, şeffaf' },
];

// ─── Yapı Kimyasalları ─────────────────────────────────────────────────────
const yapiKimyasallari: SeedProduct[] = [
  { sku:'YKM-001', netsisCode:'NTS-YKM-001', name:'Aralçı Perlitli Sıva Alçısı 35 kg', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:180, unit:'adet', netsisStock:80, description:'Perlitli sıva alçısı, 35kg torba' },
  { sku:'YKM-002', netsisCode:'NTS-YKM-002', name:'Aralçı Makina Sıva Alçısı 35 Kg', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:170, unit:'adet', netsisStock:100, description:'Makina sıva alçısı, 35kg torba' },
  { sku:'YKM-6931', netsisCode:'NTS-YKM-6931', name:'Aralçı Saten Perdah Alçısı 30 Kg', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:195, unit:'adet', netsisStock:120, description:'Saten perdah alçısı, 30kg torba' },
  { sku:'YKM-3691', netsisCode:'NTS-YKM-3691', name:'Arkim Arfill Flex 2211 Harput Bej (20 Kg)', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:280, unit:'adet', netsisStock:60, description:'Arfill Flex fayans yapıştırıcı, Harput Bej, 20kg' },
  { sku:'YKM-3685', netsisCode:'NTS-YKM-3685', name:'Arkim Arfix 1111 Gri (25 Kg)', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:220, unit:'adet', netsisStock:85, description:'Arfix fayans yapıştırıcı, gri, 25kg' },
  { sku:'YKM-3686', netsisCode:'NTS-YKM-3686', name:'Arkim Arfix Plus 1133 Gri (25 Kg)', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:260, unit:'adet', netsisStock:75, description:'Arfix Plus fayans yapıştırıcı, gri, 25kg' },
  { sku:'YKM-3692', netsisCode:'NTS-YKM-3692', name:'Arkim Arfill Flex 2211 Gri (20 Kg)', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:280, unit:'adet', netsisStock:55, description:'Arfill Flex fayans yapıştırıcı, gri, 20kg' },
  { sku:'YKM-3690', netsisCode:'NTS-YKM-3690', name:'Arkim Arfill Flex 2211 Beyaz (20 Kg)', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:300, unit:'adet', netsisStock:50, description:'Arfill Flex fayans yapıştırıcı, beyaz, 20kg' },
  { sku:'YKM-9061', netsisCode:'NTS-YKM-9061', name:'Arkim ARPLUST 3322 SU İZOLASYON TAM ELASTİK', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:420, unit:'adet', netsisStock:40, description:'Su izolasyon, tam elastik, 20kg' },
  { sku:'YKM-9060', netsisCode:'NTS-YKM-9060', name:'Arkim ARPLUST 3211 SU İZOLASYON YARI ELASTİK', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:350, unit:'adet', netsisStock:45, description:'Su izolasyon, yarı elastik, 20kg' },
  { sku:'YKM-9058', netsisCode:'NTS-YKM-9058', name:'Arkim Arfill Flex 1511 GRİ (20 Kg)', brand:'ARSLANLI', category:'Yapı Kimyasalları', basePrice:250, unit:'adet', netsisStock:65, description:'Arfill Flex 1511 fayans yapıştırıcı, gri, 20kg' },
];

// ─── İnsört Ürünler ────────────────────────────────────────────────────────
// Not: sitede bu kategorinin URL'si bulunamadı — genelde inşaat insert/ankraj
// ürünleri. Makul örnek ürünler eklendi.
const insortUrunler: SeedProduct[] = [
  { sku:'INS-001', netsisCode:'NTS-INS-001', name:'M12 METRİK DİŞLİ İNSÖRT 50MM', brand:'FISCHER', category:'İnsört Ürünler', basePrice:12, unit:'adet', netsisStock:500, description:'M12 metrik dişli insört, 50mm' },
  { sku:'INS-002', netsisCode:'NTS-INS-002', name:'M10 KİMYASAL ANKRAJ İNSÖRT 100MM', brand:'FISCHER', category:'İnsört Ürünler', basePrice:18, unit:'adet', netsisStock:350, description:'M10 kimyasal ankraj insört, 100mm' },
  { sku:'INS-003', netsisCode:'NTS-INS-003', name:'M16 AĞIR YÜK İNSÖRTÜ 75MM', brand:'HILTI', category:'İnsört Ürünler', basePrice:25, unit:'adet', netsisStock:200, description:'M16 ağır yük insörtü, 75mm' },
  { sku:'INS-004', netsisCode:'NTS-INS-004', name:'M8 PASLANMAZ ÇELİK İNSÖRT 40MM', brand:'FISCHER', category:'İnsört Ürünler', basePrice:9, unit:'adet', netsisStock:600, description:'M8 paslanmaz çelik insört, 40mm' },
  { sku:'INS-005', netsisCode:'NTS-INS-005', name:'M12 TAVAN ANKRAJ İNSÖRTÜ 60MM', brand:'HILTI', category:'İnsört Ürünler', basePrice:22, unit:'adet', netsisStock:280, description:'M12 tavan ankraj insörtü, 60mm' },
  { sku:'INS-006', netsisCode:'NTS-INS-006', name:'M6 HAFİF YÜK İNSÖRTÜ 35MM', brand:'FISCHER', category:'İnsört Ürünler', basePrice:5, unit:'adet', netsisStock:800, description:'M6 hafif yük insörtü, 35mm' },
  { sku:'INS-007', netsisCode:'NTS-INS-007', name:'M20 AĞIR YÜK KİMYASAL ANKRAJ 125MM', brand:'HILTI', category:'İnsört Ürünler', basePrice:45, unit:'adet', netsisStock:120, minimumStock:20, description:'M20 ağır yük kimyasal ankraj, 125mm' },
  { sku:'INS-008', netsisCode:'NTS-INS-008', name:'M10 ÇELİK DÜBEL İNSÖRT 80MM', brand:'FISCHER', category:'İnsört Ürünler', basePrice:14, unit:'adet', netsisStock:400, description:'M10 çelik dübel insört, 80mm' },
  { sku:'INS-009', netsisCode:'NTS-INS-009', name:'M14 GENLEŞMELİ İNSÖRT 90MM', brand:'HILTI', category:'İnsört Ürünler', basePrice:28, unit:'adet', netsisStock:180, description:'M14 genleşmeli insört, 90mm' },
  { sku:'INS-010', netsisCode:'NTS-INS-010', name:'M8 ÇERÇEVE ANKRAJ İNSÖRTÜ 50MM', brand:'FISCHER', category:'İnsört Ürünler', basePrice:11, unit:'adet', netsisStock:450, description:'M8 çerçeve ankraj insörtü, 50mm' },
];

// ─── Tüm ürünler ───────────────────────────────────────────────────────────
const allProducts: SeedProduct[] = [
  ...seramik,
  ...vitrifiye,
  ...rtrmax,
  ...banyoGrubu,
  ...banyoAksesuar,
  ...batarya,
  ...silikon,
  ...yapiKimyasallari,
  ...insortUrunler,
];

async function main() {
  console.log('🌱 Sadoksan ürün seed başlıyor...\n');

  let created = 0;
  let updated = 0;
  const categories = new Set<string>();

  for (const p of allProducts) {
    const result = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        brand: p.brand,
        category: p.category,
        basePrice: p.basePrice,
        unit: p.unit,
        netsisStock: p.netsisStock,
        displayStock: p.netsisStock,
        description: p.description || null,
        imageUrl: p.imageUrl || null,
        minimumStock: p.minimumStock || 0,
        middleStock: p.middleStock || null,
        syncStatus: 'SYNCED',
        visible: true,
        purchasable: true,
      },
      create: {
        netsisCode: p.netsisCode,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        basePrice: p.basePrice,
        taxRate: 0.2,
        unit: p.unit,
        netsisStock: p.netsisStock,
        reservedStock: 0,
        displayStock: p.netsisStock,
        description: p.description || null,
        imageUrl: p.imageUrl || null,
        minimumStock: p.minimumStock || 0,
        middleStock: p.middleStock || null,
        syncStatus: 'SYNCED',
        visible: true,
        purchasable: true,
      },
    });

    // Prisma upsert returns the record but doesn't tell us if it was created or updated
    // We use a simple heuristic: if updatedAt > createdAt, it was updated
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
    categories.add(p.category);
  }

  console.log(`\n📊 Sonuç:`);
  console.log(`   ${created} yeni ürün eklendi`);
  console.log(`   ${updated} ürün güncellendi`);
  console.log(`   ${categories.size} kategori:`);
  for (const cat of categories) {
    const count = allProducts.filter((p) => p.category === cat).length;
    console.log(`     - ${cat}: ${count} ürün`);
  }
  console.log(`\n🎉 Toplam ${allProducts.length} ürün seed edildi.`);
}

main()
  .catch((e) => {
    console.error('Seed başarısız:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
