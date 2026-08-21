#!/usr/bin/env bash
#
# Sadoksan — gerçek domain'e geçiş.
#
# KULLANIM
#   ./scripts/domain-gecisi.sh sadoksan.com.tr            # kuru çalışma
#   ./scripts/domain-gecisi.sh sadoksan.com.tr --uygula   # gerçekten yap
#
# NE YAPAR (sırayla)
#   1. DNS bu sunucuya bakıyor mu, kontrol eder
#   2. nginx'e yeni domain için server bloğu yazar (önce sadece :80)
#   3. certbot ile sertifika alır
#   4. .env'de üç adresi günceller: CORS_ORIGINS, NUXT_PUBLIC_API_BASE,
#      STOREFRONT_URL
#   5. storefront'u YENİDEN DERLER (SSR — adres build'e gömülür, restart yetmez)
#   6. api + storefront + admin'i yeniden başlatır
#
# ESKİ DOMAIN'E DOKUNMAZ. sadoksan.smartinnventory.com çalışmaya devam eder;
# geçiş doğrulandıktan sonra elle kaldırılır.
set -euo pipefail

PROJE="/home/can/sadoksan"
ESKI="sadoksan.smartinnventory.com"
YENI="${1:-}"
UYGULA="${2:-}"

if [[ -z "$YENI" ]]; then
  echo "Kullanım: $0 <yeni-domain> [--uygula]" >&2
  exit 1
fi

KURU=1
[[ "$UYGULA" == "--uygula" ]] && KURU=0

adim() { echo; echo "── $* ─────────────────────────────────"; }
yap()  { if [[ $KURU -eq 1 ]]; then echo "  [kuru] $*"; else echo "  + $*"; eval "$@"; fi; }

[[ $KURU -eq 1 ]] && echo "*** KURU ÇALIŞMA — hiçbir şey değişmeyecek. Uygulamak için: --uygula ***"

# ── 1. DNS ──────────────────────────────────────────────────────────────
adim "1. DNS kontrolü"
SUNUCU_IP=$(curl -s --max-time 10 https://api.ipify.org || echo "?")
DOMAIN_IP=$(getent hosts "$YENI" | awk '{print $1}' | head -1 || echo "")
echo "  sunucu IP : $SUNUCU_IP"
echo "  $YENI -> ${DOMAIN_IP:-(çözümlenmedi)}"
if [[ "$DOMAIN_IP" != "$SUNUCU_IP" ]]; then
  echo "  !! DNS henüz bu sunucuya bakmıyor."
  echo "     Sertifika alınamaz. A kaydını $SUNUCU_IP yapıp yayılmasını bekleyin."
  [[ $KURU -eq 0 ]] && exit 1
fi

# ── 2. nginx (önce :80 — certbot doğrulaması için) ──────────────────────
adim "2. nginx :80 bloğu"
CONF="/etc/nginx/sites-available/${YENI}.conf"
yap "sudo tee $CONF >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name $YENI;

    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
        allow all;
    }
    location / { return 301 https://\\\$host\\\$request_uri; }
}
NGINX"
yap "sudo ln -sf $CONF /etc/nginx/sites-enabled/${YENI}.conf"
yap "sudo nginx -t && sudo systemctl reload nginx"

# ── 3. sertifika ────────────────────────────────────────────────────────
adim "3. Let's Encrypt sertifikası"
yap "sudo certbot certonly --webroot -w /var/lib/letsencrypt -d $YENI --non-interactive --agree-tos --email brkcnt6@gmail.com"

# ── 4. nginx tam blok (mevcut conf'u yeni domain'e kopyala) ─────────────
adim "4. nginx :443 bloğu — mevcut yapılandırma yeni domain'e uyarlanıyor"
yap "sudo sed -e 's/${ESKI}/${YENI}/g' /etc/nginx/sites-available/${ESKI}.conf | sudo tee $CONF >/dev/null"
yap "sudo nginx -t && sudo systemctl reload nginx"

# ── 5. .env ─────────────────────────────────────────────────────────────
adim "5. .env adresleri"
yap "cp $PROJE/.env $PROJE/.env.domain-oncesi-\$(date +%s)"
yap "sed -i 's|https://${ESKI}|https://${YENI}|g' $PROJE/.env"
echo "  güncellenecek: CORS_ORIGINS, NUXT_PUBLIC_API_BASE, STOREFRONT_URL"
[[ $KURU -eq 1 ]] && grep -nE 'CORS_ORIGINS|NUXT_PUBLIC_API_BASE|STOREFRONT_URL' "$PROJE/.env" | sed 's/^/    şu an: /'

# ── 6. yeniden derleme ──────────────────────────────────────────────────
adim "6. storefront yeniden derleniyor (SSR — adres build'e gömülü)"
yap "cd $PROJE && docker compose -f docker-compose.prod.yml build storefront admin api"

adim "7. servisler yeniden başlatılıyor"
yap "cd $PROJE && docker compose -f docker-compose.prod.yml up -d storefront admin api"

# ── 8. doğrulama ────────────────────────────────────────────────────────
adim "8. Doğrulama"
if [[ $KURU -eq 0 ]]; then
  sleep 20
  for yol in "" "sadoksan-panel/" "api/health"; do
    kod=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://${YENI}/${yol}" || echo "---")
    printf "  https://%s/%-18s -> %s\n" "$YENI" "$yol" "$kod"
  done
  echo
  echo "  Eski domain hâlâ çalışıyor olmalı:"
  printf "  https://%s/ -> %s\n" "$ESKI" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 https://$ESKI/ || echo '---')"
fi

echo
echo "SONRAKİ ADIMLAR (elle):"
echo "  - Bayi girişini yeni domain'de dene"
echo "  - SMTP bilgilerini .env'e gir (SMTP_HOST/USER/PASS/MAIL_FROM), api'yi yeniden başlat"
echo "  - Her şey doğrulanınca eski domain bloğunu kaldır:"
echo "      sudo rm /etc/nginx/sites-enabled/${ESKI}.conf && sudo systemctl reload nginx"
