import json, urllib.request, time
tok = json.load(open("/home/can/sadoksan/scripts/.ideasoft-token.json"))["access_token"]
BASE = "https://sadoksaninsaat.myideasoft.com/admin-api"
def get(path):
    r = urllib.request.Request(BASE+path, headers={"Authorization":"Bearer "+tok})
    return json.load(urllib.request.urlopen(r, timeout=60))
out, page = [], 1
while True:
    d = get(f"/products?limit=100&page={page}")
    if not d: break
    out.extend(d)
    if len(d) < 100: break
    page += 1
    time.sleep(0.15)
json.dump(out, open("/tmp/idea_products.json","w"))
gorselli = [p for p in out if p.get("images")]
print("cekilen urun:", len(out))
print("gorseli olan:", len(gorselli))
print("toplam gorsel:", sum(len(p["images"]) for p in gorselli))
kat = sum(1 for p in out if p.get("categories"))
print("kategorisi olan:", kat)
