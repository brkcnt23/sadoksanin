#!/usr/bin/env python3
"""admin@admin.com sifresini sifirlar (sunum icin).

Sifre bcrypt ile API container'inda hash'lenir, DB'ye yazilir.
Kullanim: python3 admin_sifre.py "YENI_SIFRE"
"""
import subprocess
import sys

YENI = sys.argv[1] if len(sys.argv) > 1 else "admin2026"
EMAIL = "admin@admin.com"

# 1) bcrypt hash uret (API container'inda bcryptjs var)
hash_cmd = (
    'const b=require("bcryptjs"); '
    f'console.log(b.hashSync(process.argv[1], 10));'
)
r = subprocess.run(
    ["docker", "exec", "sadoksan-api-prod", "node", "-e", hash_cmd, YENI],
    capture_output=True, text=True,
)
if r.returncode != 0 or not r.stdout.strip().startswith("$2"):
    print("HASH URETILEMEDI:", r.stderr[-300:])
    sys.exit(1)
hashed = r.stdout.strip()
print("hash uretildi:", hashed[:12] + "...")

# 2) DB'ye yaz
sql = (
    'UPDATE "User" SET password = \'' + hashed + '\', "updatedAt" = now() '
    "WHERE email = '" + EMAIL + "'; "
    'SELECT email, role::text FROM "User" WHERE email = \'' + EMAIL + "';"
)
r2 = subprocess.run(
    ["docker", "exec", "-i", "sadoksan-postgres-prod", "psql", "-U", "sadoksan",
     "-d", "sadoksan", "-v", "ON_ERROR_STOP=1", "-c", sql],
    capture_output=True, text=True,
)
print(r2.stdout.strip() or r2.stderr[-400:])
if r2.returncode != 0:
    sys.exit(1)
print("SIFRE GUNCELLENDI ->", YENI)
