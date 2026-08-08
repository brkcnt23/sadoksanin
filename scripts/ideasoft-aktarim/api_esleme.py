#!/usr/bin/env python3
"""Frontend'in cagirdigi API yollarini backend route'lariyla karsilastirir.

Backend: apps/api/src/**/*.controller.ts  -> @Controller + method dekoratorleri
Frontend: apps/admin + apps/storefront    -> api.get/post/patch/delete, $fetch, useFetch

Cikti: kirik cagrilar (backend'de karsiligi olmayan yollar).
"""
import os
import re
from collections import defaultdict

ROOT = "/home/can/sadoksan"
API_DIR = os.path.join(ROOT, "apps/api/src")
FRONTS = {
    "admin": os.path.join(ROOT, "apps/admin"),
    "storefront": os.path.join(ROOT, "apps/storefront"),
}
SKIP_DIRS = {"node_modules", ".nuxt", ".output", "dist", ".git", "coverage"}


def walk(base, exts):
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(exts):
                yield os.path.join(dirpath, fn)


def norm(p):
    """Yolu karsilastirilabilir hale getir: parametreleri :p yap, sonundaki / sil."""
    p = p.strip().strip('"').strip("'").strip("`")
    p = p.split("?")[0]
    if not p.startswith("/"):
        p = "/" + p
    p = re.sub(r"\$\{[^}]*\}", ":p", p)   # ${id}
    p = re.sub(r":[A-Za-z_][A-Za-z0-9_]*", ":p", p)  # :id
    p = re.sub(r"/\d+(?=/|$)", "/:p", p)  # /123
    p = re.sub(r"//+", "/", p)
    if len(p) > 1:
        p = p.rstrip("/")
    return p


# ---------- 1) backend route'lari ----------
routes = set()
ctrl_re = re.compile(r"@Controller\(\s*['\"`]([^'\"`]*)['\"`]\s*\)")
meth_re = re.compile(r"@(Get|Post|Patch|Put|Delete)\(\s*(?:['\"`]([^'\"`]*)['\"`])?\s*\)")

for f in walk(API_DIR, (".controller.ts",)):
    src = open(f, encoding="utf-8", errors="ignore").read()
    m = ctrl_re.search(src)
    base = m.group(1) if m else ""
    for verb, sub in meth_re.findall(src):
        full = "/" + base.strip("/")
        if sub:
            full += "/" + sub.strip("/")
        routes.add((verb.upper(), norm(full)))

print(f"backend route sayisi: {len(routes)}")

# ---------- 2) frontend cagrilari ----------
call_pats = [
    re.compile(r"\bapi\.(get|post|patch|put|delete)\s*(?:<[^>]*>)?\s*\(\s*([`'\"])([^`'\"]+)\2"),
    re.compile(r"\$fetch\s*(?:<[^>]*>)?\s*\(\s*([`'\"])([^`'\"]+)\1"),
    re.compile(r"useFetch\s*(?:<[^>]*>)?\s*\(\s*([`'\"])([^`'\"]+)\1"),
    re.compile(r"apiFetch\s*(?:<[^>]*>)?\s*\(\s*([`'\"])([^`'\"]+)\1"),
]

bulgular = defaultdict(list)  # (app) -> [(verb, path, dosya)]
for app, base in FRONTS.items():
    for f in walk(base, (".vue", ".ts", ".js")):
        src = open(f, encoding="utf-8", errors="ignore").read()
        rel = os.path.relpath(f, ROOT)
        for pat in call_pats:
            for mt in pat.finditer(src):
                g = mt.groups()
                if len(g) == 3:
                    verb, path = g[0].upper(), g[2]
                else:
                    verb, path = "GET", g[1]
                if path.startswith("http") or path.startswith("//"):
                    continue
                p = path
                for pre in ("/api/", "api/"):
                    if p.startswith(pre):
                        p = "/" + p[len(pre):]
                p = norm(p)
                if p in ("/", ""):
                    continue
                bulgular[app].append((verb, p, rel))

# ---------- 3) karsilastir ----------
route_paths = {p for _, p in routes}
for app, calls in sorted(bulgular.items()):
    tekil = sorted(set((v, p) for v, p, _ in calls))
    kirik = []
    for v, p in tekil:
        if (v, p) in routes:
            continue
        if p in route_paths:
            continue  # yol var, metot farkli olabilir (guard/alias) - kirik sayma
        kirik.append((v, p))
    print()
    print(f"=== {app}: {len(tekil)} tekil cagri, {len(kirik)} eslesmeyen ===")
    for v, p in kirik:
        ornek = next((d for vv, pp, d in calls if vv == v and pp == p), "")
        print(f"  {v:6} {p:48} <- {ornek}")
