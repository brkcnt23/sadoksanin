#!/usr/bin/env python3
"""
Sadoksan ürün görsellerini sadoksaninsaat.com.tr'den indirir.

1. Kategori sayfalarından tüm ürün URL'lerini toplar
2. Her ürün detay sayfasından gerçek görseli bulup indirir
3. Görselleri public/images/products/{SKU}.{ext} altına kaydeder
4. Ürün JSON dökümünü çıkarır

Usage: python3 scripts/download-product-images.py
"""

import requests
import re
import os
import json
import time
import hashlib
from pathlib import Path
from urllib.parse import urljoin, urlparse
from html.parser import HTMLParser

# ─── Config ──────────────────────────────────────────────────────────────────
BASE_URL = "https://www.sadoksaninsaat.com.tr"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "apps" / "storefront" / "public" / "images" / "products"
JSON_OUT = Path(__file__).resolve().parent.parent / "docs" / "urun-katalogu.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) SadoksanBot/1.0",
    "Accept": "text/html,application/xhtml+xml",
}
REQUEST_DELAY = 0.3  # saniye

# ─── Kategoriler ─────────────────────────────────────────────────────────────
CATEGORIES = [
    "/kategori/seramik",
    "/kategori/vitrifiye",
    "/kategori/klozetler",
    "/kategori/banyo-dolaplari-1",
    "/kategori/banyo-aksesuarlari",
    "/kategori/batarya-ve-musluklar",
    "/kategori/insort-urunler",
    "/kategori/yapi-kimyasallari",
    "/kategori/silikon-ve-kopuk",
    "/kategori/elektrikli-el-aletleri",
    "/kategori/60-120",
    "/kategori/banyo-grubu-kabin",
]


class ProductLinkParser(HTMLParser):
    """Kategori sayfasındaki ürün linklerini toplar."""

    def __init__(self):
        super().__init__()
        self.product_urls = set()

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href", "")
            if href.startswith("/urun/"):
                self.product_urls.add(href.split("?")[0])


class ProductPageParser(HTMLParser):
    """Ürün detay sayfasındaki görseli ve ismi çıkarır."""

    def __init__(self):
        super().__init__()
        self.image_url = None
        self.title = None
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        # Görsel: myassets/products içeren, loader.gif olmayan, _min olmayan ilk src
        if tag == "img" and self.image_url is None:
            src = attrs_dict.get("src", "")
            if "myassets/products" in src and "loader.gif" not in src:
                if "_min" not in src:
                    self.image_url = src
                elif self.image_url is None:
                    # fallback: _min'li olanı al, sonra _min'i kaldırırız
                    self.image_url = src
        if tag == "title":
            self.in_title = True

    def handle_data(self, data):
        if self.in_title and self.title is None:
            self.title = data.strip()
            self.in_title = False


def fetch(url):
    """HTTP GET, düz metin döner."""
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def extract_sku(product_url):
    """Ürün URL'sinden SKU çıkarır: /urun/slug-1234 → 1234"""
    # URL'nin son segmentindeki son tireli kısmı al
    slug = product_url.rstrip("/").split("/")[-1]
    # Son tireyi bul
    last_dash = slug.rfind("-")
    if last_dash >= 0:
        candidate = slug[last_dash + 1:]
        # Sadece rakamlardan oluşuyorsa SKU budur
        if candidate.isdigit():
            return candidate
    return slug


def extract_product_id(image_url):
    """Görsel URL'sinden Ideasoft product ID'sini çıkarır:
    /products/124/filename.png → 124"""
    m = re.search(r"/products/(\d+)/", image_url)
    return m.group(1) if m else None


def image_ext(image_url):
    """Görsel URL'sinden dosya uzantısını alır."""
    path = urlparse(image_url).path
    _, ext = os.path.splitext(path)
    return ext.lower() if ext else ".png"


def clean_image_url(url):
    """URL'yi temizler: protokol ekler, revizyon parametresini kaldırır."""
    if url.startswith("//"):
        url = "https:" + url
    # _min varsa full-size'a çevir
    url = url.replace("_min.png", ".png").replace("_min.jpg", ".jpg").replace("_min.jpeg", ".jpeg")
    # ?revision=... kaldır
    url = url.split("?")[0]
    return url


def scrape_product(product_url):
    """Ürün detay sayfasından {sku, name, image_url, product_id} döndürür."""
    full_url = urljoin(BASE_URL, product_url)
    html = fetch(full_url)

    parser = ProductPageParser()
    parser.feed(html)

    sku = extract_sku(product_url)
    name = parser.title or sku
    img = clean_image_url(parser.image_url) if parser.image_url else None
    pid = extract_product_id(parser.image_url) if parser.image_url else None

    return {
        "sku": sku,
        "name": name,
        "product_url": full_url,
        "image_url": img,
        "product_id": pid,
    }


def download_image(url, filepath):
    """Görseli indirip dosyaya kaydeder."""
    if filepath.exists():
        return True  # zaten var
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_bytes(resp.content)
        return True
    except Exception as e:
        print(f"      ⚠️  İndirme hatası: {e}")
        return False


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ─── 1. Tüm kategorilerden ürün URL'lerini topla ─────────────────────
    all_product_urls = set()
    for cat_path in CATEGORIES:
        cat_url = urljoin(BASE_URL, cat_path)
        print(f"\n📂 Kategori: {cat_path}")
        try:
            html = fetch(cat_url)
            parser = ProductLinkParser()
            parser.feed(html)
            # Pagination kontrolü — sayfada "toplam X ürün" veya sayfalama var mı?
            # Şimdilik ilk sayfayı al, sonra sayfalama varsa ekleriz
            page = 1
            while True:
                new_urls = parser.product_urls - all_product_urls
                print(f"   Sayfa {page}: {len(parser.product_urls)} ürün (yeni: {len(new_urls)})")
                all_product_urls.update(parser.product_urls)
                # Sonraki sayfa var mı?
                next_match = re.search(rf'href="({re.escape(cat_path)}\?sayfa=(\d+))"', html)
                if next_match:
                    page += 1
                    html = fetch(urljoin(BASE_URL, next_match.group(1)))
                    parser = ProductLinkParser()
                    parser.feed(html)
                else:
                    break
        except Exception as e:
            print(f"   ⚠️  Kategori hatası: {e}")
        time.sleep(REQUEST_DELAY)

    print(f"\n🎯 Toplam benzersiz ürün URL'si: {len(all_product_urls)}")

    # ─── 2. Her ürünün detay sayfasına git, görsel al ───────────────────
    products = []
    total = len(all_product_urls)
    images_downloaded = 0

    for i, product_url in enumerate(sorted(all_product_urls)):
        try:
            prod = scrape_product(product_url)
            products.append(prod)

            if prod["image_url"]:
                ext = image_ext(prod["image_url"])
                filename = f"{prod['sku']}{ext}"
                filepath = OUTPUT_DIR / filename
                ok = download_image(prod["image_url"], filepath)
                status = "✅" if ok else "⚠️"
                if ok:
                    images_downloaded += 1
            else:
                status = "❌"

            print(f"[{i+1}/{total}] {status} {prod['sku']:12s} {prod['name'][:50]}")
        except Exception as e:
            print(f"[{i+1}/{total}] 💥 {product_url}: {e}")
            products.append({"sku": extract_sku(product_url), "name": "", "product_url": product_url, "image_url": None, "product_id": None})

        time.sleep(REQUEST_DELAY)

    # ─── 3. JSON dökümü ─────────────────────────────────────────────────
    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    json.dump(products, open(str(JSON_OUT), "w"), ensure_ascii=False, indent=2)
    print(f"\n📄 {len(products)} ürün JSON'a yazıldı: {JSON_OUT}")
    print(f"🖼️  {images_downloaded} görsel indirildi → {OUTPUT_DIR}")
    print(f"❌ {len([p for p in products if not p['image_url']])} görsel eksik")


if __name__ == "__main__":
    main()
