/**
 * Auto-generated seed from sadoksaninsaat.com.tr scrape.
 * 192 products, 2026-06-10
 */

import 'dotenv/config';
import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

loadEnv({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const products = [
  {
    "sku": "6304",
    "name": "20 X 120 X 0,7 Sg Marine Rec 1.",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/6304.png"
  },
  {
    "sku": "6305",
    "name": "20 X 120 X 0,7 Sg Trend Wood Oak Rec 1.",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/6305.png"
  },
  {
    "sku": "5804",
    "name": "20x120 Western Honey Rec 1.",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/5804.png"
  },
  {
    "sku": "4181",
    "name": "280 ML SOUDAL SILIRUB SC DUŞAKABİN SİLİKONU BEYAZ",
    "brand": "SOUDAL",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/4181.jpeg"
  },
  {
    "sku": "6925",
    "name": "30x90x0,7cm Saga Rec 1.",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/6925.png"
  },
  {
    "sku": "4174",
    "name": "500 GR SOUDAL ACRYRUB SİLİKONİZE MASTİK SİYAH",
    "brand": "SOUDAL",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/4174.jpg"
  },
  {
    "sku": "4177",
    "name": "500 GR SOUDAL ACRYRUB SİLİKONUZE MASTİK BRONZ",
    "brand": "SOUDAL",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/4177.jpg"
  },
  {
    "sku": "6282",
    "name": "60 X 120 X 0,7 Sg Pulpis Grey Full Lap 1.",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/6282.png"
  },
  {
    "sku": "6283",
    "name": "60 X 120 X 0,7 Sg Pulpis Nero Lappato 1.",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/6283.png"
  },
  {
    "sku": "6292",
    "name": "60 X 120 X 0,7 Sg Sun Onyx Full Lap 1.",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/6292.png"
  },
  {
    "sku": "9101",
    "name": "60X120N PK LF AFEL NIGHT 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9101.png"
  },
  {
    "sku": "9128",
    "name": "60X120N PK LF ARMANI 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9128.png"
  },
  {
    "sku": "8951",
    "name": "60X120N PK LF CARRARA BEYAZ 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8951.jpg"
  },
  {
    "sku": "9055",
    "name": "60X120N PK LF DURBAN ANTHRACITE 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9055.png"
  },
  {
    "sku": "9107",
    "name": "60X120N PK LF DURBAN GREY 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9107.png"
  },
  {
    "sku": "8950",
    "name": "60X120N PK LF DURBAN WHITE 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8950.jpg"
  },
  {
    "sku": "9110",
    "name": "60X120N PK LF EVEREST BEIGE 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9110.png"
  },
  {
    "sku": "9056",
    "name": "60X120N PK LF GALAXY SIYAH 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9056.png"
  },
  {
    "sku": "9130",
    "name": "60X120N PK LF LOFT BONE 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9130.png"
  },
  {
    "sku": "9057",
    "name": "60X120N PK LF LOFT GRI 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9057.png"
  },
  {
    "sku": "8976",
    "name": "60X120N PK LF MARMOL ANTRST 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8976.jpg"
  },
  {
    "sku": "8975",
    "name": "60X120N PK LF MARMOL BONE 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8975.jpg"
  },
  {
    "sku": "9105",
    "name": "60X120N PK LF MONTA WHITE 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9105.png"
  },
  {
    "sku": "9131",
    "name": "60X120N PK LF NAVAS ACIK GRI 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9131.png"
  },
  {
    "sku": "9097",
    "name": "60X120N PK LF NAVAS SIYAH 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9097.png"
  },
  {
    "sku": "8977",
    "name": "60X120N PK LF NEO ASSOS GREY 1.K SR ®",
    "brand": "UBM BANYO",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8977.jpg"
  },
  {
    "sku": "9104",
    "name": "60X120N PK LF NEO ASSOS NERO 1.K SR ®",
    "brand": "UBM BANYO",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9104.png"
  },
  {
    "sku": "8938",
    "name": "60X120N PK LF NEO CAL GOLD 1.K SR ®",
    "brand": "UBM BANYO",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8938.jpg"
  },
  {
    "sku": "8802",
    "name": "60X120N PK LF NEO CAL SILVER 1.K SR",
    "brand": "UBM BANYO",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8802.png"
  },
  {
    "sku": "8939",
    "name": "60X120N PK LF NEO ONIX WHITE 1.K SR",
    "brand": "UBM BANYO",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8939.jpg"
  },
  {
    "sku": "8803",
    "name": "60x120N PK LF NEO PULPIS GREY 1.K SR",
    "brand": "UBM BANYO",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8803.png"
  },
  {
    "sku": "8905",
    "name": "60X120N PK LF NEO PULPIS LIGHT 1.K SR",
    "brand": "UBM BANYO",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8905.jpg"
  },
  {
    "sku": "8804",
    "name": "60X120N PK LF NEO PULPIS NERO 1.K SR",
    "brand": "UBM BANYO",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8804.jpg"
  },
  {
    "sku": "8954",
    "name": "60X120N PK LF PORTORO SIYAH 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8954.jpg"
  },
  {
    "sku": "8903",
    "name": "60X120N PK LF PREAT ANTHRACITE 1.K SR",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8903.png"
  },
  {
    "sku": "9106",
    "name": "60X120N PK LF ROUD SIYAH 1.K SR",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9106.jpg"
  },
  {
    "sku": "8955",
    "name": "60X120N PK LF STATUARIO CLASSIC 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8955.jpg"
  },
  {
    "sku": "8904",
    "name": "60X120N PK MT CEMENT ANTRST 1.K SR",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8904.png"
  },
  {
    "sku": "8906",
    "name": "60X120N PK MT CEMENT GRI 1.K SR",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8906.png"
  },
  {
    "sku": "8979",
    "name": "60X120N PK MT EVEREST ANTHRACITE 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8979.jpg"
  },
  {
    "sku": "8980",
    "name": "60X120N PK MT EVEREST GREY 1.K SR ®",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/8980.jpg"
  },
  {
    "sku": "1",
    "name": "1",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/1.png"
  },
  {
    "sku": "9176",
    "name": "61X61 KR MT CEMENT ANTRST 1.K SR",
    "brand": "Diğer",
    "category": "Seramik",
    "price": 300,
    "unit": "adet",
    "imageUrl": "/images/products/9176.png"
  },
  {
    "sku": "9043",
    "name": "65 cm Dlp Membran Kpk Ant-Beyaz M1 SET",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/9043.jpeg"
  },
  {
    "sku": "9041",
    "name": "65 cm Dlp Membran Kpk Beyaz M1 SET",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/9041.jpeg"
  },
  {
    "sku": "9180",
    "name": "65 CM DOLAP BİGA TAKIM - ANTRASİT-ANTRASİT",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/9180.png"
  },
  {
    "sku": "9181",
    "name": "65 CM DOLAP BİGA TAKIM-BEYAZ-BEYAZ",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/9181.png"
  },
  {
    "sku": "SCP-625D8E",
    "name": "65-cm-keops-takim-ud-beyaz",
    "brand": "UBM BANYO",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/65-cm-keops-takim-ud-beyaz.png"
  },
  {
    "sku": "9044",
    "name": "80 cm Dlp Membran Kpk Ant -Beyaz M1 SET",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/9044.png"
  },
  {
    "sku": "9042",
    "name": "80 cm Dlp Membran Kpk Beyaz M1 SET",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/9042.jpeg"
  },
  {
    "sku": "9178",
    "name": "80 CM DOLAP ARYA TAKIM-ANTRASİT-ANTRASİT",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/9178.png"
  },
  {
    "sku": "9148",
    "name": "80 CM DOLAP ARYA TAKIM - BEYAZ - BEYAZ",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/9148.png"
  },
  {
    "sku": "9182",
    "name": "80 CM DOLAP BİGA TAKIM-ANTRASİT-ANTRASİT",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/9182.png"
  },
  {
    "sku": "9179",
    "name": "80 CM DOLAP BİGA TAKIM-BEYAZ BEYAZ",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/9179.png"
  },
  {
    "sku": "9183",
    "name": "80 CM DOLAP BİGA TAKIM-UD-BEYAZ",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/9183.png"
  },
  {
    "sku": "5860",
    "name": "80 CM DOLAP KEOPS TAKIM-BEYAZ",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/5860.png"
  },
  {
    "sku": "9184",
    "name": "80 CM DOLAP KEOPS TAKIM-BEYAZ-ANTRASİT",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/9184.png"
  },
  {
    "sku": "5855",
    "name": "80 CM DOLAP KEOPS TAKIM-UD/ANTRASİT",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/5855.png"
  },
  {
    "sku": "5861",
    "name": "80 CM DOLAP KEOPS TAKIM-UD/BEYAZ",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/5861.png"
  },
  {
    "sku": "5884",
    "name": "80 CM DOLAP LİSYA TAKIM-ANTRASİT",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/5884.png"
  },
  {
    "sku": "8811",
    "name": "80 mm Tugla.Tipi G.Rez.+Mat Krom Panel",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/8811.png"
  },
  {
    "sku": "8566",
    "name": "AHTAPOT BLACK LAVABO BATARYASI",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8566.png"
  },
  {
    "sku": "8925",
    "name": "Akfix 100AQ Akvaryum Silikonu 280Ml Şeffaf (24)",
    "brand": "AKFİX",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8925.jpg"
  },
  {
    "sku": "8809",
    "name": "AKFİX 610 PU EKSPRES MONTAJ YAPIŞTIRICI 280Ml ŞEFFAF",
    "brand": "AKFİX",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8809.jpg"
  },
  {
    "sku": "288",
    "name": "288",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/288.png"
  },
  {
    "sku": "8611",
    "name": "AKFİX 705 ÜNİVERSAL HIZLI YAPIŞTIRICI (B100GR+400ML)",
    "brand": "AKFİX",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8611.jpg"
  },
  {
    "sku": "8608",
    "name": "AKFİX 705 ÜNİVERSAL HIZLI YAPIŞTIRICI(B25GR+100ML)",
    "brand": "AKFİX",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8608.jpg"
  },
  {
    "sku": "8605",
    "name": "AKFİX 805P PU TABANCALI KÖPÜK 750 ML",
    "brand": "AKFİX",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8605.jpg"
  },
  {
    "sku": "8926",
    "name": "Akfix 900N Nötr Ayna Silikonu 310Ml (B360) Şeffaf (24)",
    "brand": "AKFİX",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8926.jpg"
  },
  {
    "sku": "24",
    "name": "24",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/24.png"
  },
  {
    "sku": "48",
    "name": "48",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/48.png"
  },
  {
    "sku": "8924",
    "name": "Akfix HT300 RTV Yüksek Isı Silikonu 280Ml Kırmızı (24)",
    "brand": "AKFİX",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8924.jpg"
  },
  {
    "sku": "5971",
    "name": "ALAMERA KUGU LAVABO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/5971.png"
  },
  {
    "sku": "8958",
    "name": "ALAMERA PRO BANYO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/8958.jpg"
  },
  {
    "sku": "8960",
    "name": "ALAMERA PRO LAVABO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8960.jpg"
  },
  {
    "sku": "8588",
    "name": "ALFA LAVABO BATARYASI",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8588.jpg"
  },
  {
    "sku": "SCP-6EDB62",
    "name": "ares-3-lu-set-krom-blisterli",
    "brand": "ARES",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/ares-3-lu-set-krom-blisterli.png"
  },
  {
    "sku": "SCP-57FD13",
    "name": "ares-3-lu-set-siyah-blisterli",
    "brand": "ARES",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/ares-3-lu-set-siyah-blisterli.png"
  },
  {
    "sku": "8495",
    "name": "ARES ASKILIK SİYAH",
    "brand": "ARES",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/8495.jpg"
  },
  {
    "sku": "8491",
    "name": "ARTEMİS UZUN HAVLULUK SİYAH",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8491.jpg"
  },
  {
    "sku": "5211",
    "name": "BASIC WC YARIM CERÇEVELİ AYAKLI GÖMME REZERVUAR",
    "brand": "MAXIFLOW",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/5211.png"
  },
  {
    "sku": "5811",
    "name": "BASMA BUTONU KROM (YUVARLAK)",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/5811.png"
  },
  {
    "sku": "6153",
    "name": "DIAMANTINA LAVABO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/6153.png"
  },
  {
    "sku": "6155",
    "name": "DIAMANTINA LAVABO BATARYASI SİYAH",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/6155.png"
  },
  {
    "sku": "8766",
    "name": "DROM REZERVUAR İÇ TAKIM-TEK BASMALI",
    "brand": "DROM",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8766.jpg"
  },
  {
    "sku": "9115",
    "name": "Durezza Tuğla Duv.Tipi Göm.Rez. Galveniz Kasa Yeni",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/9115.png"
  },
  {
    "sku": "SCP-322F67",
    "name": "durezza-tugla-tipi-gomme-rezervuar-basma-butonu",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/durezza-tugla-tipi-gomme-rezervuar-basma-butonu.png"
  },
  {
    "sku": "8667",
    "name": "ELEGANZA ASKILIK",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/8667.jpg"
  },
  {
    "sku": "8668",
    "name": "ELEGANZA GENİŞ KAPAKLI KAĞITLIK",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8668.jpg"
  },
  {
    "sku": "8669",
    "name": "ELEGANZA KAĞIT HAVLULUK",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8669.jpg"
  },
  {
    "sku": "8670",
    "name": "ELEGANZA KAPAKSIZ KAĞITLIK",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8670.jpg"
  },
  {
    "sku": "8666",
    "name": "ELEGANZA UZUN HAVLULUK",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8666.jpg"
  },
  {
    "sku": "8665",
    "name": "ELEGANZA YUVARLAK HAVLULUK",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8665.jpg"
  },
  {
    "sku": "3547",
    "name": "ENGELLİ ALTTAN ÇIKIŞLI KLOZET SET ( 4 PARÇA)",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/3547.png"
  },
  {
    "sku": "3549",
    "name": "ETİ ALTTAN ÇIKIŞLI KLOZET",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/3549.png"
  },
  {
    "sku": "3548",
    "name": "ETİ ARKADAN ÇIKIŞLI KLOZET",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/3548.png"
  },
  {
    "sku": "3552",
    "name": "ETİ TAKIM LAVABO 60 CM",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/3552.jpg"
  },
  {
    "sku": "8927",
    "name": "Eurofix Genel Amaçlı Silikon 280Gr Şeffaf (30)",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8927.jpg"
  },
  {
    "sku": "8994",
    "name": "F1 BLACK SERİSİ BORNOZ ASKILIĞI",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/8994.jpg"
  },
  {
    "sku": "9072",
    "name": "F1 BLACK SERİSİ WC KAĞITLIK",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/9072.png"
  },
  {
    "sku": "8992",
    "name": "F1 SERİSİ YUVARLAK HAVLULUK",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8992.jpg"
  },
  {
    "sku": "3800",
    "name": "GAMA 65 ALT DOLAP BEYAZ SET",
    "brand": "Diğer",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/3800.png"
  },
  {
    "sku": "3769",
    "name": "GAMA 80 ALT DOLAP PARLAK BEYAZSET",
    "brand": "Diğer",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/3769.jpg"
  },
  {
    "sku": "6010",
    "name": "GEO BANYO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/6010.png"
  },
  {
    "sku": "6182",
    "name": "GEO KUĞU LAVABO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/6182.png"
  },
  {
    "sku": "9007",
    "name": "Infinity Clearim Plus Asma Klozet",
    "brand": "INFINITY",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/9007.png"
  },
  {
    "sku": "8832",
    "name": "INFINITY FOTOSELLİ PİSUAR",
    "brand": "INFINITY",
    "category": "Vitrifiye",
    "price": 800,
    "unit": "adet",
    "imageUrl": "/images/products/8832.jpg"
  },
  {
    "sku": "1",
    "name": "1",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 800,
    "unit": "adet",
    "imageUrl": "/images/products/1.png"
  },
  {
    "sku": "SCP-7F0343",
    "name": "infinity-tezgah-ustu-lavabo-marmo-60-cm",
    "brand": "INFINITY",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/infinity-tezgah-ustu-lavabo-marmo-60-cm.png"
  },
  {
    "sku": "6063",
    "name": "ION FOTOSELLI LAVABO BATARYASI (CIFT SU GIRISLI / ELEKTRIKLI+PILLI) KROM",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/6063.png"
  },
  {
    "sku": "6062",
    "name": "ION FOTOSELLI LAVABO BATARYASI (TEK SU GIRISLI / ELEKTRIKLI+PILLI) KROM",
    "brand": "UBM BANYO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/6062.png"
  },
  {
    "sku": "3562",
    "name": "KARİZMA DUVARA SIFIR KLOZET SETİ (PP SOFT)",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/3562.png"
  },
  {
    "sku": "9136",
    "name": "KOLON AYAK",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 800,
    "unit": "adet",
    "imageUrl": "/images/products/9136.png"
  },
  {
    "sku": "6958",
    "name": "KUALA 65 CM ANTRASİT-BEYAZ BANYO DOLABI",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/6958.png"
  },
  {
    "sku": "SCP-1BD3D9",
    "name": "kuala-65-cm-antrasit-dolap",
    "brand": "QUA",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/kuala-65-cm-antrasit-dolap.png"
  },
  {
    "sku": "SCP-1553FD",
    "name": "kuala-65-cm-beyaz-banyo-dolabi",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/kuala-65-cm-beyaz-banyo-dolabi.png"
  },
  {
    "sku": "SCP-562E5F",
    "name": "kuala-80-cm-antrasit-banyo-dolabi",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/kuala-80-cm-antrasit-banyo-dolabi.png"
  },
  {
    "sku": "6962",
    "name": "KUALA 80 CM ANTRASİT-BEYAZ BANYO DOLABI",
    "brand": "UBM BANYO",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/6962.png"
  },
  {
    "sku": "SCP-3272A3",
    "name": "kuala-80-cm-beyaz-dolap",
    "brand": "QUA",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/kuala-80-cm-beyaz-dolap.png"
  },
  {
    "sku": "SCP-6F11EF",
    "name": "kulplu-engelli-aynasi",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/kulplu-engelli-aynasi.png"
  },
  {
    "sku": "5122",
    "name": "L20 MEZZO BANYO BATARYASI",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/5122.png"
  },
  {
    "sku": "9162",
    "name": "LAVİ AYNA 40X50 CM",
    "brand": "Diğer",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/9162.png"
  },
  {
    "sku": "6009",
    "name": "LEGNA PLUS BANYO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/6009.png"
  },
  {
    "sku": "9212",
    "name": "LENA YUVARLAK ASMA KLOZET",
    "brand": "LENA",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/9212.png"
  },
  {
    "sku": "SCP-5C2117",
    "name": "line-10x10-32-yandan-cikisli",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/line-10x10-32-yandan-cikisli.png"
  },
  {
    "sku": "SCP-2A59D0",
    "name": "linea-flat-lavabo-55-cm",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/linea-flat-lavabo-55-cm.png"
  },
  {
    "sku": "SCP-2A4BB9",
    "name": "linea-flat-lavabo-65-cm",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/linea-flat-lavabo-65-cm.png"
  },
  {
    "sku": "8658",
    "name": "LUXE 3 PARÇA SET",
    "brand": "LUXE",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8658.jpg"
  },
  {
    "sku": "8662",
    "name": "LUXE GENİŞ KAPAKLI KAĞITLIK KROM",
    "brand": "LUXE",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8662.jpg"
  },
  {
    "sku": "8661",
    "name": "LUXE İKİLİ BORNOZLUK KROM",
    "brand": "LUXE",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8661.jpg"
  },
  {
    "sku": "8663",
    "name": "LUXE KAĞIT HAVLULUK KROM",
    "brand": "LUXE",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8663.jpg"
  },
  {
    "sku": "8664",
    "name": "LUXE KAPATSIZ KAĞITLIK KROM",
    "brand": "LUXE",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8664.jpg"
  },
  {
    "sku": "8660",
    "name": "LUXE UZUN HAVLULUK KROM",
    "brand": "LUXE",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8660.jpg"
  },
  {
    "sku": "8659",
    "name": "LUXE YUVARLAK HAVLULUK KROM",
    "brand": "LUXE",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8659.jpg"
  },
  {
    "sku": "8789",
    "name": "MOB-G402-2 MOB GOLD DÖNER BORULU BATARYASI",
    "brand": "MOB",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/8789.jpg"
  },
  {
    "sku": "8528",
    "name": "MOB KROM BANYO BATARYASI",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/8528.png"
  },
  {
    "sku": "8522",
    "name": "MOB KROM KUĞU LAVABO BATARYASI",
    "brand": "MOB",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8522.png"
  },
  {
    "sku": "8520",
    "name": "MOB KROM LAVABO BATARYASI",
    "brand": "MOB",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8520.png"
  },
  {
    "sku": "8833",
    "name": "MUSTANG LAVABO BATARYASI",
    "brand": "MUSTANG",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8833.png"
  },
  {
    "sku": "9186",
    "name": "NELIA BANYO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/9186.jpg"
  },
  {
    "sku": "8916",
    "name": "NELIA KUĞU LAVABO BATARYASI KROM",
    "brand": "NELIA",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8916.png"
  },
  {
    "sku": "5116",
    "name": "NEXO WALL HUNG WC WITH PIPE HOLE",
    "brand": "ROCA",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/5116.png"
  },
  {
    "sku": "6148",
    "name": "NOBIA LAVABO BATARYASI KROM",
    "brand": "NOBIA",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/6148.png"
  },
  {
    "sku": "8935",
    "name": "P635 Yapı İnşaat Pu Mastik",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8935.jpg"
  },
  {
    "sku": "8936",
    "name": "P635 Yapı İnşaat Pu Mastik",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8936.jpg"
  },
  {
    "sku": "8934",
    "name": "P635 Yapı İnşaat Pu Mastik-Sosis",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8934.jpg"
  },
  {
    "sku": "8937",
    "name": "P635 Yapı İnşaat Pu Mastik-Sosis",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/8937.jpg"
  },
  {
    "sku": "5220",
    "name": "PL5 A DUAL KROM",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/5220.png"
  },
  {
    "sku": "8643",
    "name": "PRIMA İKİLİ BORNOZLUK SİYAH",
    "brand": "PRIMA",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8643.jpg"
  },
  {
    "sku": "8640",
    "name": "PRIMA KAĞIT HAVLULUK KROM",
    "brand": "PRIMA",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8640.jpg"
  },
  {
    "sku": "3577",
    "name": "PURİTA ASMA KLOZET",
    "brand": "PURİTA",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/3577.png"
  },
  {
    "sku": "8971",
    "name": "RETRO 80 ANTRASİT BEYAZ",
    "brand": "UBM BANYO",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/8971.png"
  },
  {
    "sku": "3522",
    "name": "SAUDAL ULTRA DAYANIKLI SİLİKON TABANCASI SİYAH",
    "brand": "Diğer",
    "category": "Silikon & Köpük & Yapıştırıcı",
    "price": 200,
    "unit": "adet",
    "imageUrl": "/images/products/3522.png"
  },
  {
    "sku": "SCP-4D15AE",
    "name": "selen-65-cm-antasit",
    "brand": "SELEN",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/selen-65-cm-antasit.jpg"
  },
  {
    "sku": "6965",
    "name": "SELEN 65 CM ANTRASİT DOLAP",
    "brand": "SELEN",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/6965.jpg"
  },
  {
    "sku": "6966",
    "name": "SELEN 65 CM BEYAZ DOLAP",
    "brand": "SELEN",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/6966.png"
  },
  {
    "sku": "6969",
    "name": "SELEN 80 CM BEYAZ DOLAP",
    "brand": "SELEN",
    "category": "Banyo Dolabı",
    "price": 2500,
    "unit": "adet",
    "imageUrl": "/images/products/6969.jpg"
  },
  {
    "sku": "8932",
    "name": "Sentimentİ Due Vortex Asma Klozet",
    "brand": "SENTIMENTİ",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/8932.png"
  },
  {
    "sku": "SCP-527B5A",
    "name": "sentimenti-neo-rimless-duvara-sifir-klozet",
    "brand": "SENTIMENTİ",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/sentimenti-neo-rimless-duvara-sifir-klozet.png"
  },
  {
    "sku": "8651",
    "name": "SERENITY 3 PARÇA SET",
    "brand": "SERENITY",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8651.jpg"
  },
  {
    "sku": "8654",
    "name": "SERENITY İKİLİ BORNOZLUK KROM",
    "brand": "SERENITY",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8654.jpg"
  },
  {
    "sku": "8656",
    "name": "SERENITY KAĞIT HAVLULUK KROM",
    "brand": "SERENITY",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8656.jpg"
  },
  {
    "sku": "8657",
    "name": "SERENITY KAPAKSIZ KAĞITLIK",
    "brand": "SERENITY",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8657.jpg"
  },
  {
    "sku": "8653",
    "name": "SERENITY UZUN HAVLULUK KROM",
    "brand": "SERENITY",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8653.jpg"
  },
  {
    "sku": "8652",
    "name": "SERENITY YUVARLAK HAVLULUK KROM",
    "brand": "SERENITY",
    "category": "Banyo Aksesuarları",
    "price": 400,
    "unit": "adet",
    "imageUrl": "/images/products/8652.jpg"
  },
  {
    "sku": "SCP-148DD8",
    "name": "sistema-t-lavabo-50-x-38-cm",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/sistema-t-lavabo-50-x-38-cm.png"
  },
  {
    "sku": "SCP-192F9E",
    "name": "sistemat-flat-lavabo-61-cm",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/sistemat-flat-lavabo-61-cm.png"
  },
  {
    "sku": "SCP-19136F",
    "name": "sistemat-flat-lavabo-81-cm",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/sistemat-flat-lavabo-81-cm.png"
  },
  {
    "sku": "SCP-7FA0F1",
    "name": "sistemaz-compacto-lavabo-51-x-25-cm",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/sistemaz-compacto-lavabo-51-x-25-cm.jpg"
  },
  {
    "sku": "SCP-3547A0",
    "name": "sistemaz-tezgah-ustu-lavabo-50-cm",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/sistemaz-tezgah-ustu-lavabo-50-cm.jpg"
  },
  {
    "sku": "3619",
    "name": "SOLUZİONE 6 DUVARA SIFIR KLOZET",
    "brand": "SOLUZIONE",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/3619.png"
  },
  {
    "sku": "3623",
    "name": "SOLUZİONE I PİSUVAR",
    "brand": "SOLUZIONE",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/3623.jpg"
  },
  {
    "sku": "SCP-4993DA",
    "name": "soluzione-tezgah-alti-lavabo-57-cm",
    "brand": "SOLUZIONE",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/soluzione-tezgah-alti-lavabo-57-cm.png"
  },
  {
    "sku": "8590",
    "name": "SOLUZIONE XX ASMA KLOZET",
    "brand": "SOLUZIONE",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/8590.png"
  },
  {
    "sku": "8985",
    "name": "SONSUZLUK PİSUAR SEPERATÖRÜ",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 800,
    "unit": "adet",
    "imageUrl": "/images/products/8985.png"
  },
  {
    "sku": "8518",
    "name": "STELL INOX BANYO BATARYASI",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/8518.png"
  },
  {
    "sku": "8513",
    "name": "STELL INOX LAVABO BATARYASI",
    "brand": "STELL",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/8513.png"
  },
  {
    "sku": "6095",
    "name": "TAHARETMATİK",
    "brand": "Diğer",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/6095.png"
  },
  {
    "sku": "7219",
    "name": "TENA DUŞ ROBOTU-YUVARLAK",
    "brand": "TENA",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/7219.png"
  },
  {
    "sku": "9137",
    "name": "TETRA BASIC KARE ASMA KLOZET",
    "brand": "TETRA",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/9137.jpeg"
  },
  {
    "sku": "SCP-486A4C",
    "name": "the-gap-wall-hung-wc-clean-rim",
    "brand": "Diğer",
    "category": "Diğer",
    "price": 500,
    "unit": "adet",
    "imageUrl": "/images/products/the-gap-wall-hung-wc-clean-rim.png"
  },
  {
    "sku": "6024",
    "name": "TRENTO APLİKE EVİYE BATARYASI KROM",
    "brand": "TRENTO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/6024.png"
  },
  {
    "sku": "6169",
    "name": "TRENTO BANYO BATARYASI KROM",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/6169.png"
  },
  {
    "sku": "6156",
    "name": "TRENTO KUGU LAVABO BATARYASI KROM",
    "brand": "TRENTO",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/6156.png"
  },
  {
    "sku": "9064",
    "name": "Tutunma Barı Çap 25 8x60 cm",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 800,
    "unit": "adet",
    "imageUrl": "/images/products/9064.png"
  },
  {
    "sku": "SCP-76C70F",
    "name": "tutunma-bari-doner-ayak",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 800,
    "unit": "adet",
    "imageUrl": "/images/products/tutunma-bari-doner-ayak.png"
  },
  {
    "sku": "SCP-6691C5",
    "name": "vea-cubo-rimless-asma-klozet",
    "brand": "Diğer",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/vea-cubo-rimless-asma-klozet.png"
  },
  {
    "sku": "8842",
    "name": "VENOM KROM BANYO BATARYASI",
    "brand": "UBM BANYO",
    "category": "Batarya ve Musluklar",
    "price": 1200,
    "unit": "adet",
    "imageUrl": "/images/products/8842.png"
  },
  {
    "sku": "8616",
    "name": "VENTUNO ASMA KLOZET",
    "brand": "VENTUNO",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/8616.png"
  },
  {
    "sku": "9002",
    "name": "Ventuno Duvara Sıfır Klozet",
    "brand": "VENTUNO",
    "category": "Vitrifiye",
    "price": 3000,
    "unit": "adet",
    "imageUrl": "/images/products/9002.jpg"
  },
  {
    "sku": "6135",
    "name": "VISIA PLUS KUGU LAVABO BATARYASI KROM",
    "brand": "VISIA",
    "category": "Vitrifiye",
    "price": 1500,
    "unit": "adet",
    "imageUrl": "/images/products/6135.png"
  },
  {
    "sku": "3551",
    "name": "YARIM AYAK",
    "brand": "MAXIFLOW",
    "category": "Vitrifiye",
    "price": 800,
    "unit": "adet",
    "imageUrl": "/images/products/3551.png"
  }
];

async function main() {
  console.log('🌱 Seeding 192 products...');
  let created = 0, updated = 0;

  for (const p of products) {
    const result = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        brand: p.brand,
        category: p.category,
        basePrice: p.price,
        unit: p.unit,
        imageUrl: p.imageUrl,
        netsisStock: 100,
        displayStock: 100,
        visible: true,
        purchasable: true,
      },
      create: {
        sku: p.sku,
        netsisCode: `NTS-${p.sku}`,
        name: p.name,
        brand: p.brand,
        category: p.category,
        basePrice: p.price,
        taxRate: 0.2,
        unit: p.unit,
        imageUrl: p.imageUrl,
        netsisStock: 100,
        reservedStock: 0,
        displayStock: 100,
        visible: true,
        purchasable: true,
      },
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
    else updated++;
  }

  console.log(`✅ ${created} created, ${updated} updated`);
  console.log(`📸 ${products.filter(p => p.imageUrl).length} with images`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
