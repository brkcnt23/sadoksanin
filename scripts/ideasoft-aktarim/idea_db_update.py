#!/usr/bin/env python3
"""Ideasoft'tan indirilen gorselleri Product.images alanina yazar.

Guvenlik: SADECE images alani bos olan urunleri gunceller (mevcut gorseller korunur).
Kullanim:
    python3 idea_db_update.py            # dry run
    python3 idea_db_update.py --apply    # gercekten uygula
"""
import json
import subprocess
import sys

MAP_FILE = "/tmp/idea_image_map.json"
SQL_FILE = "/tmp/idea_update.sql"
CONTAINER = "sadoksan-postgres-prod"
DB_USER = "sadoksan"
DB_NAME = "sadoksan"

apply_mode = "--apply" in sys.argv
image_map = json.load(open(MAP_FILE))
print("gorsel alan urun sayisi:", len(image_map))

sqls = []
for pid, paths in image_map.items():
    # id ve yollarda tek tirnak olmamali (SQL injection / bozulma korumasi)
    if "'" in pid or any("'" in p for p in paths):
        print("ATLANDI (tirnak iceriyor):", pid)
        continue
    arr = json.dumps(paths)
    sqls.append(
        'UPDATE "Product" SET images = \'' + arr + '\'::jsonb, "updatedAt" = now() '
        "WHERE id = '" + pid + "' AND (images IS NULL OR images::text IN ('[]', 'null'));"
    )

print("uretilen UPDATE sayisi:", len(sqls))

if not apply_mode:
    print("--- DRY RUN — ornek 2 sorgu ---")
    for s in sqls[:2]:
        print(s[:220])
    print("uygulamak icin: --apply")
    sys.exit(0)

with open(SQL_FILE, "w") as fh:
    fh.write("BEGIN;\n" + "\n".join(sqls) + "\nCOMMIT;\n")

with open(SQL_FILE) as fh:
    r = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
         "-v", "ON_ERROR_STOP=1", "-f", "-"],
        stdin=fh, capture_output=True, text=True,
    )

print("psql cikis kodu:", r.returncode)
if r.returncode != 0:
    print("HATA:", r.stderr[-1000:])
    sys.exit(1)
print("GUNCELLEME TAMAM")
