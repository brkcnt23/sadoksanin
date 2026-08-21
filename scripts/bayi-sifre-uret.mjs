#!/usr/bin/env node
/**
 * Bayilere giriş şifresi üretir ve teslim edilecek listeyi CSV olarak yazar.
 *
 * NEDEN GEREKLİ
 *   Netsis'ten aktarılan bayilere import sırasında `randomBytes(16)` ile
 *   rastgele şifre atandı ve hiçbir yere kaydedilmedi. SMTP bağlı olmadığı
 *   ve e-postalar yer tutucu (cari-xxx@netsis.local) olduğu için şifre
 *   sıfırlama yolu da kapalı. Yani hiçbir bayi giriş yapamıyor.
 *
 * NE YAPAR
 *   Her bayiye okunabilir 8 karakterlik şifre üretir, bcrypt hash'ini
 *   User.password'e yazar, düz metni yalnızca CSV'ye koyar.
 *
 * GİRİŞ KİMLİĞİ
 *   Bayi cari no ile giriş yapar (ör. 120.AE.25.0052) — faturasında yazan,
 *   bildiği tek kimlik. Yer tutucu e-posta kullanılmaz.
 *
 * KULLANIM
 *   node bayi-sifre-uret.mjs                     # kuru çalışma, DB'ye yazmaz
 *   node bayi-sifre-uret.mjs --uygula            # şifreleri yazar + CSV üretir
 *   node bayi-sifre-uret.mjs --uygula --gercek-epostali-dahil
 *
 * VARSAYILAN KORUMA
 *   E-postası @netsis.local OLMAYAN hesaplar atlanır — bunlar elle açılmış,
 *   şifresi bilinen hesaplardır (ör. sunum bayisi). --gercek-epostali-dahil
 *   ile bunlar da sıfırlanır; sunum girişleri çalışmaz hale gelir.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { writeFileSync, chmodSync } from 'node:fs'

const UYGULA = process.argv.includes('--uygula')
const GERCEK_EPOSTALI_DAHIL = process.argv.includes('--gercek-epostali-dahil')
/**
 * --sadece-gercek : Netsis'teki CARI_TIP='A' filtresi bankalari, belediyeleri
 * ve kurumlari da bayi yapmisti (1446 kayit). Musteri gercek bayi sayisini
 * 300-400 kusur olarak bildirdi. Bu bayrak, fiilen ticaret yapan firmalari
 * secer: siparis gecmisi VEYA sifirdan farkli cari bakiyesi olanlar,
 * kurumsal gurultu (banka/belediye/universite/emniyet...) haric.
 */
const SADECE_GERCEK = process.argv.includes('--sadece-gercek')

/** Bayi olmayan kurumsal kayitlar. */
const KURUM_DESENI =
  /(bank|bankas|belediye|spor kul|üniversite|universite|valilik|kaymakam|müdürlü|mudurlu|vergi dair|hastane|derne[gğ]|vak[ıi]f|kooperatif)/i
const CIKTI = process.argv.find((a) => a.startsWith('--cikti='))?.split('=')[1]
  || '/app/uploads/bayi-giris-bilgileri.csv'

/** Telefonda okunabilir şifre: karışan karakterler (O/0, I/l/1) yok. */
const ALFABE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function sifreUret(uzunluk = 8) {
  const b = randomBytes(uzunluk)
  let s = ''
  for (let i = 0; i < uzunluk; i++) s += ALFABE[b[i] % ALFABE.length]
  return s
}

/** Excel'in Türkçe yerelinde bozulmaması için: BOM + noktalı virgül + tırnak. */
function csvHucre(v) {
  const s = v === null || v === undefined ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

// Prisma 7: schema.prisma'da datasource.url yok, adapter zorunlu
// (bkz. apps/api/src/common/prisma.service.ts)
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('HATA: DATABASE_URL tanımlı değil.')
  process.exit(1)
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  const bayiler = await prisma.dealer.findMany({
    select: {
      id: true,
      company: true,
      name: true,
      cariNo: true,
      city: true,
      phone: true,
      status: true,
      userId: true,
      cariBalance: true,
      user: { select: { email: true } },
      salesRep: { select: { name: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { company: 'asc' },
  })

  const yerTutucu = (e) => typeof e === 'string' && e.endsWith('@netsis.local')
  let hedef = GERCEK_EPOSTALI_DAHIL
    ? bayiler
    : bayiler.filter((b) => yerTutucu(b.user?.email))
  const atlanan = bayiler.length - hedef.length

  let elenenKurum = 0
  let elenenPasif = 0
  if (SADECE_GERCEK) {
    hedef = hedef.filter((b) => {
      const ad = b.company || b.name || ''
      if (KURUM_DESENI.test(ad)) { elenenKurum++; return false }
      const ticaretVar = b._count.orders > 0 || Number(b.cariBalance) !== 0
      if (!ticaretVar) { elenenPasif++; return false }
      return true
    })
  }

  console.log(`Toplam bayi          : ${bayiler.length}`)
  console.log(`Şifre atanacak       : ${hedef.length}`)
  console.log(`Atlanan (gerçek e-posta): ${atlanan}`)
  if (SADECE_GERCEK) {
    console.log(`Elenen kurum         : ${elenenKurum} (banka/belediye/üniversite…)`)
    console.log(`Elenen hareketsiz    : ${elenenPasif} (siparişi ve bakiyesi yok)`)
  }
  const plasiyersiz = hedef.filter((b) => !b.salesRep).length
  console.log(`Plasiyeri olmayan    : ${plasiyersiz}`)

  if (!UYGULA) {
    console.log('\nKURU ÇALIŞMA — DB değişmedi, CSV yazılmadı.')
    console.log('Uygulamak için: --uygula')
    return
  }

  const satirlar = [
    ['Cari No', 'Ünvan', 'Şehir', 'Telefon', 'Plasiyer', 'Durum', 'Kullanıcı Adı', 'Şifre'],
  ]

  let sayac = 0
  for (const b of hedef) {
    const sifre = sifreUret()
    await prisma.user.update({
      where: { id: b.userId },
      data: { password: await bcrypt.hash(sifre, 10) },
    })
    satirlar.push([
      b.cariNo,
      b.company || b.name,
      b.city || '',
      b.phone || '',
      b.salesRep?.name || 'ATANMAMIŞ',
      b.status,
      b.cariNo, // giriş kimliği = cari no
      sifre,
    ])
    if (++sayac % 200 === 0) console.log(`  ${sayac}/${hedef.length}…`)
  }

  const csv =
    '﻿sep=;\n' +
    satirlar.map((r) => r.map(csvHucre).join(';')).join('\r\n') +
    '\r\n'

  writeFileSync(CIKTI, csv, 'utf8')
  chmodSync(CIKTI, 0o600)

  console.log(`\n${sayac} bayiye şifre atandı.`)
  console.log(`Liste: ${CIKTI} (chmod 600)`)
  console.log('DİKKAT: Dosya düz metin şifre içerir — teslimden sonra silin.')
}

main()
  .catch((e) => {
    console.error('HATA:', e.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
