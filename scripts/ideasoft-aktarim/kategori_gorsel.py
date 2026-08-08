#!/usr/bin/env python3
"""Ideasoft kategori gorsellerini indirir ve Category.imageUrl alanina baglar.

Guvenlik: sadece imageUrl'i BOS olan kategoriler guncellenir.

Kullanim:
    python3 kategori_gorsel.py            # analiz
    python3 kategori_gorsel.py --apply    # indir + DB'ye yaz
"""
import json
import os
import re
import subprocess
import sys
import unicodedata
import urllib.request

CONTAINER = "sadoksan-postgres-prod"
DB_USER = "sadoksan"
DB_NAME = "sadoksan"
DEST = "/home/can/sadoksan/apps/storefront/public/images/categories"

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


def norm(s):
    if not s:
        return ""
    s = str(s).replace("İ", "I").replace("ı", "i").replace("Ş", "S").replace("ş", "s")
    s = s.replace("Ğ", "G").replace("ğ", "g").replace("Ü", "U").replace("ü", "u")
    s = s.replace("Ö", "O").replace("ö", "o").replace("Ç", "C").replace("ç", "c")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().upper()
    return re.sub(r"[^A-Z0-9]", "", s)


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


# DB kategorileri: norm(ad) -> (id, imageUrl bos mu)
db_cats = {}
for line in psql('SELECT id, name, coalesce("imageUrl", \'\') FROM "Category";').splitlines():
    line = line.strip()
    if not line:
        continue
    parts = line.split("|")
    cid, cname = parts[0], parts[1]
    img = parts[2] if len(parts) > 2 else ""
    db_cats[norm(cname)] = (cid, img)
print("DB kategori:", len(db_cats))

cats = json.load(open("/tmp/idea_categories.json"))
plan = []
for c in cats:
    url = c.get("imageUrl") or c.get("imageFile")
    if not url:
        continue
    key = norm(c["name"])
    if key not in db_cats:
        continue
    cid, mevcut = db_cats[key]
    if mevcut.strip():
        continue  # zaten gorseli var, dokunma
    if url.startswith("//"):
        url = "https:" + url
    plan.append((cid, c["name"], url))

print("gorsel indirilecek kategori:", len(plan))

if not apply_mode:
    for cid, ad, url in plan[:5]:
        print(f"  {ad[:26]} -> {url[:66]}")
    print("uygulamak icin: --apply")
    sys.exit(0)

os.makedirs(DEST, exist_ok=True)
CT_EXT = {"image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
          "image/webp": "webp", "image/gif": "gif", "image/avif": "avif"}

ok, hata, yazilacak = 0, 0, []
for cid, ad, url in plan:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=45)
        data = resp.read()
        if len(data) < 100:
            raise ValueError("bos dosya")
        ct = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        ext = CT_EXT.get(ct)
        if not ext:
            # uzantiyi URL'den veya imza baytlarindan tahmin et
            if data[:8].startswith(b"\x89PNG"):
                ext = "png"
            elif data[:3] == b"\xff\xd8\xff":
                ext = "jpg"
            elif data[:4] == b"RIFF":
                ext = "webp"
            else:
                ext = "jpg"
        name = f"{cid}.{ext}"
        with open(os.path.join(DEST, name), "wb") as fh:
            fh.write(data)
        yazilacak.append((cid, "/images/categories/" + name))
        ok += 1
    except Exception as e:
        hata += 1
        if hata <= 5:
            print(f"  HATA {ad[:20]}: {str(e)[:60]}")

print(f"indirildi: {ok}, hata: {hata}")

if yazilacak:
    sql = ["BEGIN;"]
    for cid, yol in yazilacak:
        sql.append(
            f'UPDATE "Category" SET "imageUrl" = {q(yol)}, "updatedAt" = now() '
            f"WHERE id = {q(cid)} AND (\"imageUrl\" IS NULL OR \"imageUrl\" = '');"
        )
    sql.append("COMMIT;")
    with open("/tmp/kategori_gorsel.sql", "w") as fh:
        fh.write("\n".join(sql) + "\n")
    with open("/tmp/kategori_gorsel.sql") as fh:
        r = subprocess.run(
            ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
             "-v", "ON_ERROR_STOP=1", "-f", "-"],
            stdin=fh, capture_output=True, text=True,
        )
    print("psql cikis kodu:", r.returncode)
    if r.returncode != 0:
        print("HATA:", r.stderr[-800:])
        sys.exit(1)
    print("KATEGORI GORSELLERI BAGLANDI")
