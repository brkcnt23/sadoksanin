// ─── NetOpenX REST API TypeScript Interfaces ───────────────────────────────
// Gerçek API yanıtlarından doğrulandı (ENTEGRE9 DB, 2026-07-08)
//
// Önemli: API PascalCase_underscore kullanır (Stok_Kodu, Stok_Adi)
//          Netsis COM DLL'den (uppercase) FARKLIDIR.
//          Nox REST nesne isimleri de COM'dan farklıdır:
//            COM: Cari → REST: ARPs, Fatura → REST: ItemSlips, Stok → REST: Items
//
// Response wrapper: { IsSuccessful, Data: [...], TotalCount, Offset, Limit }
// Item/ARPs için Data elemanları: { StokTemelBilgi: {...}, StokEkBilgi: {...} }
// PrimInfo için Data elemanları: flat (direkt alanlar)

// ─── Token ──────────────────────────────────────────────────────────────────

export interface NetsisLoginRequest {
  BranchCode: number
  NetsisUser: string
  NetsisPassword: string
  DbType: number // 1 = vtMSSQL, 0 olabilir
  DbName: string
  DbUser: string
  DbPassword: string
}

export interface NetsisTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  username?: string
  dbname?: string
  branchcode?: string
}

// ─── Generic API Response Wrapper ───────────────────────────────────────────

export interface NetsisApiResponse<T> {
  Offset: number
  TotalCount: number
  Limit: number
  IsSuccessful: boolean
  Data: T[]
  ErrorDesc?: string
  First?: { Href: string; MediaType?: string; ApiVersion?: string }
  Next?: Record<string, unknown>
  Previous?: Record<string, unknown>
  Meta?: { Href: string; MediaType?: string; ApiVersion?: string }
}

// ─── Items / Stok Kartı ─────────────────────────────────────────────────────
// GET /api/v2/Items — stok kartları
// GET /api/v2/Items/PrimInfo — özet stok bilgisi

/** Items endpoint — her kayıtta StokTemelBilgi + StokEkBilgi iç içe */
export interface NetsisItemResponse {
  StokTemelBilgi: NetsisItemTemelBilgi
  StokEkBilgi: NetsisItemEkBilgi
}

/** StokTemelBilgi — ana stok kartı alanları */
export interface NetsisItemTemelBilgi {
  Stok_Kodu: string
  Sube_Kodu: number
  ISLETME_KODU: number
  Stok_Adi: string
  KDV_Orani: number           // 0.20 = %20
  Miktar: number              // Güncel stok miktarı (bakiyedir)
  Satis_Fiat1: number         // Satış fiyatı 1
  Satis_Fiat2: number         // Satış fiyatı 2
  Satis_Fiat3: number
  Satis_Fiat4: number
  Alis_Fiat1: number          // Alış fiyatı 1
  Alis_Fiat2: number
  Alis_Fiat3: number
  Alis_Fiat4: number
  Fiat_birimi: string         // "1" = TL
  DEPO_KODU: number
  DOV_TUR: number             // Döviz türü (0=TL)
  Sat_Dov_Tip: number
  Alis_Dov_Tip: number
  Dov_Alis_Fiat: number
  Dov_Satis_Fiat: number
  Dov_Mal_Fiat: number
  Azami_Stok: number
  Asgari_Stok: number
  Temin_Suresi: number
  Kul_Mik: number
  Risk_Suresi: number
  Muh_DetayKodu: number
  Birim_Agirlik: number
  Nakliyet_Tut: number
  Uret_Olcu_Br: number
  Bilesenmi: string           // "H" / "E"
  Mamulmu: string             // "H" / "E"
  Formul_Toplami: number
  Update_Kodu: string
  Max_Iskonto: number
  Eczaci_Kari: number
  Mal_Fazlasi: number
  Kdv_Tenzil_Oran: number
  Kilit: string               // "H" / "E"
  Alis_Kdv_Kodu: number
  Lot_Size: number
  Min_Sip_Miktar: number
  Sabit_Sip_Aralik: number
  Sip_Politikasi: string
  Eski_Recete: string
  PLANLANACAK: string
  EN: number
  BOY: number
  GENISLIK: number
  OnayTipi: string
  OnayNum: number
  FIKTIF_MAM: string
  YAPILANDIR: string
  ATIK_URUN: string
  // Kullanıcı tanımlı alanlar
  Ozellik_Kodu1: number
  Ozellik_Kodu2: number
  Ozellik_Kodu3: number
  Ozellik_Kodu4: number
  Ozellik_Kodu5: number
  Opsiyon_Kodu1: number
  Opsiyon_Kodu2: number
  Opsiyon_Kodu3: number
  Opsiyon_Kodu4: number
  Opsiyon_Kodu5: number
  Bilesen_Op_Kodu: number
  Sip_Ver_Mal: number
  Elde_Bul_Mal: number
  Yil_Tah_Kul_Mik: number
  Ekon_Sip_Miktar: number
  LOT_SIZECUSTOMER: number
  MIN_SIP_MIKTARCUSTOMER: number
  SATICISIPKILIT: string
  MUSTERISIPKILIT: string
  SATINALMAKILIT: string
  SatisKilit: string
  SIPLIMITVAR: string
  SBOMVARMI: string
  ALISTALTEKKILIT: string
  SATISTALTEKKILIT: string
  OTVTEVKIFAT: string
  Pay_1: number
  Payda_1: number
  Pay2: number
  Payda2: number

}

/** StokEkBilgi — ek stok bilgileri */
export interface NetsisItemEkBilgi {
  Stok_Kodu: string
  Tur: string                 // "D", "M", etc.
  Birim_Maliyet: number
  Kull1N: number
  Kull2N: number
  Kull3N: number
  Kull4N: number
  Kull5N: number
  Kull6N: number
  Kull7N: number
  Kull8N: number
  Son_Satal_Fiat: number
  F_Yedek1: number
  B_Yedek1: number
  CURBIRIM_MALIYET: number
}

/** PrimInfo — flat, direkt alanlar (StokTemelBilgi wrapper YOK) */
export interface NetsisItemPrimInfo {
  Stok_Kodu: string
  Sube_Kodu: number
  ISLETME_KODU: number
  Stok_Adi: string
  KDV_Orani: number
  Miktar: number              // ← stok bakiyesi bu alanda!
  Satis_Fiat1: number
  Satis_Fiat2: number
  Satis_Fiat3: number
  Satis_Fiat4: number
  Alis_Fiat1: number
  DEPO_KODU: number
  // ... (tüm TemelBilgi alanları aynen flat olarak gelir)
  [key: string]: unknown
}

// ─── ARPs / Cari Hesap ──────────────────────────────────────────────────────
// GET /api/v2/ARPs

export interface NetsisARPsResponse {
  CariTemelBilgi: NetsisCariTemelBilgi
  CariEkBilgi?: NetsisCariEkBilgi
}

export interface NetsisCariTemelBilgi {
  Cari_Kod: string
  Sube_Kodu: number
  ISLETME_KODU: number
  Cari_Isim: string           // Cari hesap adı/ünvan
  Cari_Tip: string            // "A" = Alıcı, "S" = Satıcı
  Vergi_No?: string
  TC_Kimlik_No?: string
  Cari_Il?: string
  Cari_Ilce?: string
  Cari_Adres?: string
  Cari_Tel?: string
  Vergi_Dairesi?: string
  E_Posta?: string
  Cari_Aciklama?: string
  Borclanan_Tutar?: number    // Borç bakiye
  Alacaklanan_Tutar?: number  // Alacak bakiye
  Kredi_Limiti?: number
  Doviz_Kodu?: string         // TL, USD, EUR
  [key: string]: unknown
}

export interface NetsisCariEkBilgi {
  Cari_Kod: string
  [key: string]: unknown
}

// ─── ExRates / Döviz Kurları ────────────────────────────────────────────────
// GET /api/v2/ExRates

export interface NetsisExRate {
  Tarih: string               // "2025-01-15 00:00:00"
  Sira: number                // 1=USD, 2=EURO (ForExs.Sira ile eşleşir)
  DOV_ALIS: number            // Döviz alış
  DOV_SATIS: number           // Döviz satış
  EFF_ALIS: number            // Efektif alış
  EFF_SATIS: number           // Efektif satış
}

// ─── ForExs / Döviz Tanımları ───────────────────────────────────────────────
// GET /api/v2/ForExs — döviz birimi tanımları (USD, EURO vs.)

export interface NetsisForEx {
  Sira: number                // 1, 2 (ExRates.Sira ile eşleşir)
  BIRIM: number               // 1
  ISIM: string                // "USD", "EURO"
  NETSISSIRA: number          // Netsis içi sıra
}

// ─── GLAccounts / Muhasebe Hesapları ────────────────────────────────────────
// GET /api/v2/GLAccounts

export interface NetsisGLAccountResponse {
  MuPlanTemelBilgi: NetsisGLAccountTemelBilgi
  MuPlanEkBilgi: NetsisGLAccountEkBilgi | null
}

export interface NetsisGLAccountTemelBilgi {
  Hesap_Kodu: string
  Sube_Kodu: number
  ISLETME_KODU: number
  Agm: string
  Hs_Adi: string
  Hs_Yd_Adi?: string
  Hs_Grkod: string
  Olcu_Birim: string
  Hs_Blkz: string
  OnayTipi: string
  OnayNum: number
}

export interface NetsisGLAccountEkBilgi {
  [key: string]: unknown
}

// ─── ItemSlips / Fatura-İrsaliye-Sipariş ────────────────────────────────────
// GET /api/v2/ItemSlips

export enum NetsisDocType {
  Siparis = 'ftSSip',
  Irsaliye = 'ftIrs',
  SatisFaturasi = 'ftSFat',
  AlisFaturasi = 'ftAFat',
  IadeFaturasi = 'ftIade',
}

export interface NetsisItemSlipsHeader {
  CariKod: string
  Tarih: string
  TIPI?: string
  KDV_DAHILMI?: boolean
  Tip?: string
  DepoKodu?: number
  ProjeKodu?: string
  PlasiyerKodu?: string
  YetkiKodu?: string
  DovizTipi?: string
  DovizKuru?: number
  SevkAdresi?: string
  Aciklama?: string
  [key: string]: unknown
}

export interface NetsisItemSlipLines {
  StokKodu: string
  Gir_Depo_Kodu?: number
  STra_NF?: number
  STra_BF?: number
  DEPO_KODU?: number
  STra_GCMIK?: number
  Birim?: string
  KdvOrani?: number
  Aciklama?: string
  ProjeKodu?: string
  [key: string]: unknown
}

// ─── Sync Result ────────────────────────────────────────────────────────────

export interface NetsisSyncResult {
  syncType: string
  status: 'success' | 'error' | 'skipped' | 'running'
  itemsSynced: number
  errors: number
  duration: number
  errorMessage?: string
}
