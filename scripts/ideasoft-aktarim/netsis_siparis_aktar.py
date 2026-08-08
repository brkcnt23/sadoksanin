#!/usr/bin/env python3
"""Netsis ftSSip siparislerini Order + OrderLine olarak aktarir.

Eslestirme:
    Kalems[].STra_CARI_KOD  -> Dealer.cariNo   (dealerId + customerId)
    Kalems[].StokKodu       -> Product.netsisCode (productId)
    FatUst.PLA_KODU         -> notes alanina plasiyer kodu

Guvenlik:
  - Mevcut siparisler DOKUNULMAZ; orderNo cakisirsa o siparis ATLANIR
  - Cari veya urun eslesmeyen siparisler ATLANIR (raporlanir)
  - Tek transaction; hata olursa hicbir sey yazilmaz

Kullanim:
    python3 netsis_siparis_aktar.py            # analiz
    python3 netsis_siparis_aktar.py --apply    # uygula
"""
import json
import subprocess
import sys
import uuid
from collections import Counter

CONTAINER = "sadoksan-postgres-prod"
DB_USER = "sadoksan"
DB_NAME = "sadoksan"
SIPARIS_FILE = "/tmp/netsis_siparisler.json"

apply_mode = "--apply" in sys.argv


def psql(sql):
    r = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
         "-v", "ON_ERROR_STOP=1", "-t", "-A", "-F", "|", "-c", sql],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        raise RuntimeError("psql: " + r.stderr[-500:])
    return r.stdout


def q(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def num(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


# ---- DB eslestirme tablolari ----
cari2dealer = {}
for line in psql('SELECT "cariNo", id, "userId", city, address FROM "Dealer" WHERE "cariNo" <> \'\';').splitlines():
    line = line.strip()
    if not line:
        continue
    parts = line.split("|")
    if len(parts) < 5:
        parts += [""] * (5 - len(parts))
    cari, did, uid, city, addr = parts[0], parts[1], parts[2], parts[3], parts[4]
    cari2dealer[cari.strip()] = (did, uid, city or "Belirtilmedi", addr or "Belirtilmedi")

kod2urun = {}
for line in psql('SELECT "netsisCode", id FROM "Product" WHERE "netsisCode" IS NOT NULL;').splitlines():
    line = line.strip()
    if not line:
        continue
    kod, pid = line.rsplit("|", 1)
    kod2urun[kod.strip()] = pid

mevcut_no = set()
for line in psql('SELECT "orderNo" FROM "Order";').splitlines():
    line = line.strip()
    if line:
        mevcut_no.add(line)

print("DB: cari kodlu bayi:", len(cari2dealer), "| netsis kodlu urun:", len(kod2urun),
      "| mevcut siparis no:", len(mevcut_no))

# ---- Netsis siparisleri ----
siparisler = json.load(open(SIPARIS_FILE))
print("Netsis siparis:", len(siparisler))

sebep = Counter()
plan = []  # (order_dict, [line_dict])

for s in siparisler:
    fu = s.get("FatUst") or {}
    kalems = s.get("Kalems") or []
    if not kalems:
        sebep["kalem yok"] += 1
        continue

    cari = (kalems[0].get("STra_CARI_KOD") or fu.get("CariKod") or "").strip()
    if not cari:
        sebep["cari kod yok"] += 1
        continue
    if cari not in cari2dealer:
        sebep["cari DB de yok"] += 1
        continue

    belge = (kalems[0].get("STra_FATIRSNO") or fu.get("FATIRS_NO") or "").strip()
    if not belge:
        sebep["belge no yok"] += 1
        continue
    order_no = "NTS-" + belge
    if order_no in mevcut_no:
        sebep["zaten aktarilmis"] += 1
        continue

    did, uid, city, addr = cari2dealer[cari]
    tarih = (fu.get("Tarih") or kalems[0].get("STra_TAR") or "").strip() or None

    lines, subtotal, tax_total = [], 0.0, 0.0
    for k in kalems:
        stok = (k.get("StokKodu") or "").strip()
        if stok not in kod2urun:
            continue
        miktar = num(k.get("STra_GCMIK"), 0)
        if miktar <= 0:
            continue
        birim = num(k.get("STra_NF") or k.get("STra_BF"), 0)
        kdv = num(k.get("STra_KDV"), 0) / 100.0
        adet = max(1, int(round(miktar)))
        satir_toplam = adet * birim
        lines.append({
            "productId": kod2urun[stok],
            "quantity": adet,
            "unitPrice": birim,
            "taxRate": kdv,
            "total": satir_toplam,
        })
        subtotal += satir_toplam
        tax_total += satir_toplam * kdv

    if not lines:
        sebep["hicbir urun eslesmedi"] += 1
        continue

    plan.append(({
        "orderNo": order_no,
        "customerId": uid,
        "dealerId": did,
        "city": city,
        "address": addr,
        "subtotal": round(subtotal, 2),
        "tax": round(tax_total, 2),
        "total": round(subtotal + tax_total, 2),
        "tarih": tarih,
        "plasiyer": (fu.get("PLA_KODU") or "").strip(),
        "netsisNo": belge,
    }, lines))
    mevcut_no.add(order_no)

print("aktarilacak siparis:", len(plan), "| toplam satir:", sum(len(l) for _, l in plan))
print("atlananlar:", dict(sebep))

if not apply_mode:
    print()
    print("--- DRY RUN ---")
    for o, l in plan[:3]:
        print(f"  {o['orderNo']} | bayi {o['dealerId'][:10]}... | {len(l)} kalem | "
              f"ara {o['subtotal']} + kdv {o['tax']} = {o['total']} | plasiyer {o['plasiyer']}")
    print("uygulamak icin: --apply")
    sys.exit(0)

sql = ["BEGIN;"]
for o, lines in plan:
    oid = str(uuid.uuid4())
    tarih_sql = q(o["tarih"]) + "::timestamp" if o["tarih"] else "now()"
    notes = "Netsis'ten aktarildi. Belge: " + o["netsisNo"]
    if o["plasiyer"]:
        notes += " | Plasiyer: " + o["plasiyer"]
    sql.append(
        'INSERT INTO "Order" (id, "orderNo", "customerId", "customerType", "dealerId", '
        '"shippingCity", "shippingAddress", subtotal, tax, "logisticsSurcharge", total, '
        'status, "eIrsaliyeNo", notes, "createdAt", "updatedAt", "completedAt", "discountAmount") VALUES ('
        f"{q(oid)}, {q(o['orderNo'])}, {q(o['customerId'])}, 'B2B', {q(o['dealerId'])}, "
        f"{q(o['city'])}, {q(o['address'])}, {o['subtotal']}, {o['tax']}, 0, {o['total']}, "
        f"'COMPLETED', {q(o['netsisNo'])}, {q(notes)}, {tarih_sql}, now(), {tarih_sql}, 0) "
        "ON CONFLICT DO NOTHING;"
    )
    for ln in lines:
        sql.append(
            'INSERT INTO "OrderLine" (id, "orderId", "productId", quantity, "unitPrice", '
            '"taxRate", total, "createdAt") VALUES ('
            f"{q(str(uuid.uuid4()))}, {q(oid)}, {q(ln['productId'])}, {ln['quantity']}, "
            f"{ln['unitPrice']}, {ln['taxRate']}, {ln['total']}, {tarih_sql});"
        )
sql.append("COMMIT;")

with open("/tmp/netsis_siparis.sql", "w") as fh:
    fh.write("\n".join(sql) + "\n")
print("SQL satiri:", len(sql))

with open("/tmp/netsis_siparis.sql") as fh:
    r = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
         "-v", "ON_ERROR_STOP=1", "-f", "-"],
        stdin=fh, capture_output=True, text=True,
    )
print("psql cikis kodu:", r.returncode)
if r.returncode != 0:
    print("HATA:", r.stderr[-1500:])
    sys.exit(1)
print("SIPARIS AKTARIMI TAMAM")
