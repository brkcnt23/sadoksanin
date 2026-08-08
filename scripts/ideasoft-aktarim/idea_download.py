import json, os, urllib.request, time, mimetypes
DEST = "/home/can/sadoksan/apps/storefront/public/images/products"
os.makedirs(DEST, exist_ok=True)
kod2id = {}
for l in open("/tmp/db_kod_id.txt"):
    l = l.strip()
    if not l: continue
    k, v = l.rsplit("|", 1)
    kod2id[k] = v
idea = json.load(open("/tmp/idea_products.json"))
plan, atlanan = [], 0
for p in idea:
    sku, imgs = p.get("sku"), p.get("images") or []
    if not sku or not imgs or sku not in kod2id:
        if imgs: atlanan += 1
        continue
    pid = kod2id[sku]
    for i, im in enumerate(imgs):
        u = im.get("originalUrl") or im.get("thumbUrl")
        if not u: continue
        if u.startswith("//"): u = "https:" + u
        ext = (im.get("extension") or "jpg").lower().lstrip(".")
        name = f"{pid}.{ext}" if i == 0 else f"{pid}-{i+1}.{ext}"
        plan.append((pid, sku, u, name))
print(f"indirilecek gorsel: {len(plan)} | DB de eslesmeyen gorselli urun: {atlanan}", flush=True)
ok, hata, sonuc = 0, 0, {}
for n, (pid, sku, u, name) in enumerate(plan, 1):
    hedef = os.path.join(DEST, name)
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=45).read()
        if len(data) < 100: raise ValueError("bos dosya")
        open(hedef, "wb").write(data)
        sonuc.setdefault(pid, []).append("/images/products/" + name)
        ok += 1
    except Exception as e:
        hata += 1
        if hata <= 5: print(f"  HATA {name}: {str(e)[:70]}", flush=True)
    if n % 250 == 0: print(f"  ... {n}/{len(plan)} (basarili {ok}, hata {hata})", flush=True)
    time.sleep(0.05)
json.dump(sonuc, open("/tmp/idea_image_map.json", "w"))
print(f"BITTI: basarili {ok}, hata {hata}, gorsel alan urun {len(sonuc)}", flush=True)
