// ─── NetOpenX REST API TypeScript Interfaces ───────────────────────────────
// Maps to NetOpenX REST objects from http://<netsis>:7070/api/v2/help
//
// Nox REST nesne isimleri NetOpenX COM DLL'den FARKLIDIR:
//   COM: Cari          → REST: ARPs
//   COM: Fatura        → REST: ItemSlips
//   COM: Stok          → REST: Items
//   COM: BankaHesTraAna → REST: BankAccountTransaction
//   COM: Kasa          → REST: SafeDeposits
//   COM: Kur           → REST: ExRates

// ─── Token ──────────────────────────────────────────────────────────────────

export interface NetsisLoginRequest {
  BranchCode: number
  NetsisUser: string
  NetsisPassword: string
  DbType: number // 1 = vtMSSQL
  DbName: string
  DbUser: string
  DbPassword: string
}

export interface NetsisTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// ─── Common ─────────────────────────────────────────────────────────────────

export interface NetsisApiResponse<T> {
  Data?: T
  DataList?: T[]
  Count?: number
  IsSuccess: boolean
  Message?: string
}

export interface NetsisSelectFilter {
  limit?: number
  offset?: number
  sort?: string
  fields?: string
  first?: boolean
  last?: boolean
  q?: string // SQL WHERE clause
}

// ─── Items (Stok Kartı) ─────────────────────────────────────────────────────
// GET /api/v2/Items — stok kartı listesi
// GET /api/v2/Items/{id} — tek stok kartı (id = STOK_KODU)
// POST /api/v2/Items — yeni stok kartı
// PUT /api/v2/Items/{id} — stok kartı güncelleme
// GET /api/v2/Items/PrimInfo — özet stok bilgisi

export interface NetsisItem {
  STOK_KODU: string
  STOK_ADI: string
  STOK_BAKIYE?: number      // Güncel stok miktarı
  KDV_ORANI?: number         // 0.20 = %20 KDV
  BIRIM?: string             // adet, kg, m²
  SAT_FIYAT?: number         // Satış fiyatı
  ALIS_FIYAT?: number        // Alış fiyatı
  MARKA?: string             // Marka kodu/adı
  KATEGORI?: string          // Kategori
  ISLETME_KODU?: number
  STOK_ACIKLAMA?: string
  BARKOD?: string
  PARA_BIRIMI?: string       // TL, USD, EUR
  OLCU_BIRIM?: string
  NET_AGIRLIK?: number
  BRUT_AGIRLIK?: number
  [key: string]: unknown     // Diğer Netsis alanları
}

export interface NetsisItemPrimInfo {
  STOK_KODU: string
  STOK_ADI: string
  STOK_BAKIYE: number
  [key: string]: unknown
}

// ─── ARPs (Cari Hesap) ──────────────────────────────────────────────────────
// GET /api/v2/ARPs — cari liste
// GET /api/v2/ARPs/{id} — tek cari (id = CARI_KOD)
// POST /api/v2/ARPs — yeni cari
// PUT /api/v2/ARPs/{id} — cari güncelleme
// GET /api/v2/ARPs/PrimInfo — özet cari bilgisi
// POST /api/v2/ARPs/Risk — risk bilgisi

export interface NetsisARPs {
  CARI_KOD: string
  CARI_ISIM: string          // Cari hesap adı/ünvan
  VERGI_NO?: string
  TC_KIMLIK_NO?: string
  CARI_IL?: string
  CARI_ILCE?: string
  CARI_ADRES?: string
  CARI_TEL?: string
  CARI_TIP?: string           // A = Alıcı, S = Satıcı
  BORCLANAN_TUTAR?: number   // Borç bakiye
  ALACAKLANAN_TUTAR?: number // Alacak bakiye
  KREDI_LIMITI?: number
  DOVIZ_KODU?: string        // TL, USD, EUR
  VERGI_DAIRESI?: string
  E_POSTA?: string
  CARI_ACIKLAMA?: string
  CariTemelBilgi?: NetsisARPsPrimInfo
  [key: string]: unknown
}

export interface NetsisARPsPrimInfo {
  CARI_KOD: string
  CARI_ISIM: string
  CARI_IL?: string
  CARI_ILCE?: string
  VERGI_NO?: string
  [key: string]: unknown
}

// ─── ItemSlips (Fatura / Sipariş / İrsaliye) ────────────────────────────────
// GET /api/v2/ItemSlips?docType={docType} — fatura/irsaliye/sipariş listesi
// GET /api/v2/ItemSlips/{id} — tek belge
// POST /api/v2/ItemSlips — yeni belge
// POST /api/v2/ItemSlips/SiparisToIrsFat — siparişten irsaliye/fatura

export enum NetsisDocType {
  Siparis = 'ftSSip',
  Irsaliye = 'ftIrs',
  SatisFaturasi = 'ftSFat',
  AlisFaturasi = 'ftAFat',
  IadeFaturasi = 'ftIade',
}

export interface NetsisItemSlipsHeader {
  CariKod: string
  Tarih: string               // ISO date
  TIPI?: string               // ft_Acik, ft_Ihracat
  KDV_DAHILMI?: boolean
  Tip?: string                // ftSFat, ftAFat, ftSSip, ftIrs
  DepoKodu?: number
  ProjeKodu?: string
  PlasiyerKodu?: string
  YetkiKodu?: string
  DovizTipi?: string          // TL, USD, EUR
  DovizKuru?: number
  SevkAdresi?: string
  Aciklama?: string
  [key: string]: unknown
}

export interface NetsisItemSlipLines {
  StokKodu: string
  Gir_Depo_Kodu?: number
  STra_NF?: number            // Net fiyat
  STra_BF?: number            // Brüt fiyat
  DEPO_KODU?: number
  STra_GCMIK?: number         // Miktar
  Birim?: string
  KdvOrani?: number
  Aciklama?: string
  ProjeKodu?: string
  [key: string]: unknown
}

export interface NetsisItemSlips {
  FaturaTip?: string
  SeriliHesapla?: boolean
  KayitliNumaraOtomatikGuncellensin?: boolean
  FatUst?: NetsisItemSlipsHeader
  Kalems?: NetsisItemSlipLines[]
  [key: string]: unknown
}

// ─── ExRates (Döviz Kuru) ───────────────────────────────────────────────────
// GET /api/v2/ExRates — kur listesi

export interface NetsisExRate {
  ISIM: string               // USD, EUR, GBP
  DOV_ALIS: number           // Döviz alış
  DOV_SATIS: number          // Döviz satış
  BIRIM: number              // 1, 100
  SIRA: number
  [key: string]: unknown
}

// ─── Stock Operations ───────────────────────────────────────────────────────
// GET /api/v2/ItemCounting — stok sayım
// GET /api/v2/DynamicWarehsSlips — depo hareketleri

export interface NetsisItemCounting {
  SAYIM_KODU: string
  SAYIM_TARIHI?: string
  STOK_KODU: string
  MIKTAR: number
  DEPO_KODU?: number
  [key: string]: unknown
}

export interface NetsisDynamicWarehsSlip {
  FISNO: string
  TARIH: string
  STOK_KODU: string
  MIKTAR: number
  DEPO_KODU?: number
  HAREKET_TIPI?: string       // Giriş/Çıkış
  [key: string]: unknown
}

// ─── BankAccountTransaction ─────────────────────────────────────────────────
// GET /api/v2/BankAccountTransaction

export interface NetsisBankTransaction {
  NETHESKODU: string
  OTOSIRANO?: number
  TUTAR: number
  TARIH: string
  ACIKLAMA?: string
  CARI_KOD?: string
  [key: string]: unknown
}

// ─── Sync Result ────────────────────────────────────────────────────────────

export interface NetsisSyncResult {
  syncType: string
  status: 'success' | 'error' | 'skipped'
  itemsSynced: number
  errors: number
  duration: number            // milliseconds
  errorMessage?: string
}
