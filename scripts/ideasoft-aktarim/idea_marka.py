#!/usr/bin/env python3
"""Ideasoft markalarini Brand tablosuna ekler, urunlerin brand/brandId alanini doldurur.

Guvenlik:
  - Sadece brand alani BOS olan urunler guncellenir (mock urunlerin markasi korunur)
  - Brand tablosuna ON CONFLICT DO NOTHING ile eklenir (mevcut kayit bozulmaz)

Kullanim:
    python3 idea_marka.py            # analiz
    python3 idea_marka.py --apply    # uygula
"""
import json
import re
import subprocess
import sys
import unicodedata

CONTAINER = "sadoksan-postgres-prod"
DB_USER = "sadoksan"
DB_NAME = "sadoksan"

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


def slugify(s):
    s = str(s).replace("İ", "i").replace("ı", "i").replace("Ş", "s").replace("ş", "s")
    s = s.replace("Ğ", "g").replace("ğ", "g").replace("Ü", "u").replace("ü", "u")
    s = s.replace("Ö", "o").replace("ö", "o").replace("Ç", "c").replace("ç", "c")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "marka"


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


# Ideasoft urunleri (daha once cekildi)
urunler = json.load(open("/tmp/idea_products.json"))

# markalar: id -> (ad, logo)
markalar = {}
for p in urunler:
    b = p.get("brand")
    if isinstance(b, dict) and b.get("id") and b.get("name"):
        logo = b.get("imageUrl") or ""
        if logo.startswith("//"):
            logo = "https:" + logo
        markalar[b["id"]] = (b["name"].strip(), logo)
print("Ideasoft marka sayisi:", len(markalar))

# DB: markasi bos + netsis kodlu urunler
kod2id = {}
for line in psql('SELECT "netsisCode", id FROM "Product" WHERE "netsisCode" IS NOT NULL '
                 "AND (brand IS NULL OR brand = '');").splitlines():
    line = line.strip()
    if not line:
        continue
    kod, pid = line.rsplit("|", 1)
    kod2id[kod] = pid
print("DB de markasi bos + netsis kodlu urun:", len(kod2id))

# eslesenler
plan = []
for p in urunler:
    sku = p.get("sku")
    b = p.get("brand")
    if not sku or not isinstance(b, dict) or not b.get("id"):
        continue
    if sku not in kod2id:
        continue
    plan.append((kod2id[sku], b["id"], b["name"].strip()))
print("marka atanacak urun:", len(plan))

if not apply_mode:
    print()
    print("--- DRY RUN ---")
    for pid, bid, ad in plan[:5]:
        print(f"  urun {pid[:14]}... -> {ad}")
    print("uygulamak icin: --apply")
    sys.exit(0)

lines = ["BEGIN;"]
for bid, (ad, logo) in markalar.items():
    db_id = "idea-brand-" + str(bid)
    slug = slugify(ad) + "-" + str(bid)
    logo_sql = q(logo) if logo else "NULL"
    lines.append(
        'INSERT INTO "Brand" (id, name, slug, "logoUrl", "createdAt", "updatedAt") '
        f"VALUES ({q(db_id)}, {q(ad)}, {q(slug)}, {logo_sql}, now(), now()) "
        "ON CONFLICT (name) DO NOTHING;"
    )

for pid, bid, ad in plan:
    db_id = "idea-brand-" + str(bid)
    lines.append(
        f'UPDATE "Product" SET brand = {q(ad)}, "brandId" = '
        f'(SELECT id FROM "Brand" WHERE name = {q(ad)} LIMIT 1), "updatedAt" = now() '
        f"WHERE id = {q(pid)} AND (brand IS NULL OR brand = '');"
    )
lines.append("COMMIT;")

with open("/tmp/idea_marka.sql", "w") as fh:
    fh.write("\n".join(lines) + "\n")
print("SQL satiri:", len(lines))

with open("/tmp/idea_marka.sql") as fh:
    r = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
         "-v", "ON_ERROR_STOP=1", "-f", "-"],
        stdin=fh, capture_output=True, text=True,
    )
print("psql cikis kodu:", r.returncode)
if r.returncode != 0:
    print("HATA:", r.stderr[-1000:])
    sys.exit(1)
print("MARKA AKTARIMI TAMAM")
