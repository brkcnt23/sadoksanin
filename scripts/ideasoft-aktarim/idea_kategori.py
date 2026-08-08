#!/usr/bin/env python3
"""Ideasoft kategorilerini DB'ye aktarir ve urunleri kategorilere baglar.

Guvenlik kurallari:
  - Mevcut kategoriler DEGISTIRILMEZ (isim eslesirse o kategori kullanilir)
  - Sadece categoryId'si BOS olan urunler guncellenir (mevcut 285 kategorili urun korunur)
  - Ideasoft kategori hiyerarsisi (parent) korunur

Kullanim:
    python3 idea_kategori.py            # analiz (dry run)
    python3 idea_kategori.py --apply    # uygula
"""
import json
import re
import subprocess
import sys
import unicodedata
import urllib.request

CONTAINER = "sadoksan-postgres-prod"
DB_USER = "sadoksan"
DB_NAME = "sadoksan"
BASE = "https://sadoksaninsaat.myideasoft.com/admin-api"
TOKEN_FILE = "/home/can/sadoksan/scripts/.ideasoft-token.json"

apply_mode = "--apply" in sys.argv


def psql(sql, capture=True):
    r = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
         "-v", "ON_ERROR_STOP=1", "-t", "-A", "-F", "|", "-c", sql],
        capture_output=capture, text=True,
    )
    if r.returncode != 0:
        raise RuntimeError("psql hatasi: " + r.stderr[-600:])
    return r.stdout


def psql_file(path):
    with open(path) as fh:
        r = subprocess.run(
            ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
             "-v", "ON_ERROR_STOP=1", "-f", "-"],
            stdin=fh, capture_output=True, text=True,
        )
    return r


def norm(s):
    """Kategori adi karsilastirmasi icin normalize: aksan/bosluk/noktalama yok, buyuk harf."""
    if not s:
        return ""
    s = str(s).replace("İ", "I").replace("ı", "i").replace("Ş", "S").replace("ş", "s")
    s = s.replace("Ğ", "G").replace("ğ", "g").replace("Ü", "U").replace("ü", "u")
    s = s.replace("Ö", "O").replace("ö", "o").replace("Ç", "C").replace("ç", "c")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().upper()
    return re.sub(r"[^A-Z0-9]", "", s)


def slugify(s):
    s = str(s).replace("İ", "i").replace("ı", "i").replace("Ş", "s").replace("ş", "s")
    s = s.replace("Ğ", "g").replace("ğ", "g").replace("Ü", "u").replace("ü", "u")
    s = s.replace("Ö", "o").replace("ö", "o").replace("Ç", "c").replace("ç", "c")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "kategori"


def q(s):
    """SQL string literal (tek tirnak kacisi)."""
    return "'" + str(s).replace("'", "''") + "'"


# ---- 1. Ideasoft kategorileri ----
tok = json.load(open(TOKEN_FILE))["access_token"]


def api(path):
    req = urllib.request.Request(BASE + path, headers={"Authorization": "Bearer " + tok})
    return json.load(urllib.request.urlopen(req, timeout=60))


idea_cats, page = [], 1
while True:
    d = api(f"/categories?limit=100&page={page}")
    if not d:
        break
    idea_cats.extend(d)
    if len(d) < 100:
        break
    page += 1
print("Ideasoft kategori sayisi:", len(idea_cats))

# ---- 2. DB kategorileri ----
db_cats = {}
for line in psql('SELECT id, name FROM "Category";').splitlines():
    line = line.strip()
    if not line:
        continue
    cid, cname = line.split("|", 1)
    db_cats[norm(cname)] = cid
print("DB mevcut kategori:", len(db_cats))

# ---- 3. Eslestirme plani ----
eslesen = [c for c in idea_cats if norm(c["name"]) in db_cats]
yeni = [c for c in idea_cats if norm(c["name"]) not in db_cats]
print(f"  isim eslesen (mevcut kullanilacak): {len(eslesen)}")
print(f"  yeni olusturulacak: {len(yeni)}")

# ---- 4. Urun-kategori eslesmesi ----
urunler = json.load(open("/tmp/idea_products.json"))
kod2id = {}
for line in psql('SELECT "netsisCode", id FROM "Product" WHERE "netsisCode" IS NOT NULL AND "categoryId" IS NULL;').splitlines():
    line = line.strip()
    if not line:
        continue
    kod, pid = line.rsplit("|", 1)
    kod2id[kod] = pid
print("DB de kategorisiz + netsis kodlu urun:", len(kod2id))

# Ideasoft kategori id -> ad
ideacat_by_id = {c["id"]: c for c in idea_cats}

baglanacak = []  # (product_id, ideasoft_category_id)
for p in urunler:
    sku = p.get("sku")
    cats = p.get("categories") or []
    if not sku or not cats or sku not in kod2id:
        continue
    # ilk gecerli kategori
    for c in cats:
        cid = c.get("id") if isinstance(c, dict) else c
        if cid in ideacat_by_id:
            baglanacak.append((kod2id[sku], cid))
            break
print("kategoriye baglanacak urun:", len(baglanacak))

if not apply_mode:
    print()
    print("--- DRY RUN ---")
    print("yeni kategori ornekleri:", [c["name"] for c in yeni[:8]])
    print("eslesen ornekleri:", [c["name"] for c in eslesen[:8]])
    print("uygulamak icin: --apply")
    sys.exit(0)

# ---- 5. Uygula ----
sql_lines = ["BEGIN;"]

# Yeni kategoriler: iki gecis (once kayit, sonra parent baglama) — id cakismasini onlemek icin
# Ideasoft id'sini kalici kimlik olarak kullaniyoruz: idea-<id>
for c in yeni:
    cid = "idea-" + str(c["id"])
    name = c["name"].strip()
    slug = slugify(name) + "-" + str(c["id"])
    order = c.get("sortOrder") or 0
    sql_lines.append(
        'INSERT INTO "Category" (id, name, slug, "order", "createdAt", "updatedAt") '
        f"VALUES ({q(cid)}, {q(name)}, {q(slug)}, {int(order)}, now(), now()) "
        "ON CONFLICT (id) DO NOTHING;"
    )

# parent baglama (hem yeni hem eslesenler icin Ideasoft hiyerarsisi)
def db_id_of(idea_id):
    c = ideacat_by_id.get(idea_id)
    if not c:
        return None
    n = norm(c["name"])
    return db_cats.get(n) or ("idea-" + str(idea_id))

for c in yeni:
    parent = c.get("parent")
    pid_idea = parent.get("id") if isinstance(parent, dict) else parent
    if not pid_idea:
        continue
    parent_db = db_id_of(pid_idea)
    if not parent_db:
        continue
    sql_lines.append(
        f'UPDATE "Category" SET "parentId" = {q(parent_db)}, "updatedAt" = now() '
        f"WHERE id = {q('idea-' + str(c['id']))} AND \"parentId\" IS NULL;"
    )

# urun baglama — SADECE categoryId BOS olanlar
for prod_id, idea_cid in baglanacak:
    target = db_id_of(idea_cid)
    if not target:
        continue
    sql_lines.append(
        f'UPDATE "Product" SET "categoryId" = {q(target)}, "updatedAt" = now() '
        f"WHERE id = {q(prod_id)} AND \"categoryId\" IS NULL;"
    )

sql_lines.append("COMMIT;")
with open("/tmp/idea_kategori.sql", "w") as fh:
    fh.write("\n".join(sql_lines) + "\n")
print("uretilen SQL satiri:", len(sql_lines))

r = psql_file("/tmp/idea_kategori.sql")
print("psql cikis kodu:", r.returncode)
if r.returncode != 0:
    print("HATA:", r.stderr[-1200:])
    sys.exit(1)
print("KATEGORI AKTARIMI TAMAM")
