#!/bin/sh
# First-time TLS setup. Run from the repo root on the server:
#   deploy/init-tls.sh               Let's Encrypt cert for $DOMAIN (DNS must already point here)
#   deploy/init-tls.sh --self-signed self-signed cert, for testing before you have a domain
set -eu

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"

DOMAIN=$(grep -E '^DOMAIN=' "$ENV_FILE" | cut -d= -f2-)
EMAIL=$(grep -E '^LETSENCRYPT_EMAIL=' "$ENV_FILE" | cut -d= -f2- || true)
LIVE="/etc/letsencrypt/live/$DOMAIN"

[ -n "$DOMAIN" ] || { echo "DOMAIN is not set in $ENV_FILE"; exit 1; }

make_self_signed() {
  $COMPOSE run --rm --no-deps --entrypoint sh certbot -c "
    mkdir -p '$LIVE' &&
    openssl req -x509 -nodes -newkey rsa:2048 -days $1 \
      -keyout '$LIVE/privkey.pem' -out '$LIVE/fullchain.pem' -subj '/CN=$DOMAIN'"
}

if [ "${1:-}" = "--self-signed" ]; then
  make_self_signed 365
  $COMPOSE up -d --build
  echo "Running with a self-signed certificate for $DOMAIN"
  exit 0
fi

[ -n "$EMAIL" ] || { echo "LETSENCRYPT_EMAIL is not set in $ENV_FILE"; exit 1; }

# nginx refuses to start without a certificate, so start it on a throwaway one first.
make_self_signed 1
$COMPOSE up -d --build

$COMPOSE run --rm --no-deps --entrypoint sh certbot -c "
  rm -rf '/etc/letsencrypt/live/$DOMAIN' '/etc/letsencrypt/archive/$DOMAIN' '/etc/letsencrypt/renewal/$DOMAIN.conf'"
$COMPOSE run --rm --no-deps --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot -d "$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email --non-interactive

$COMPOSE exec nginx nginx -s reload
echo "Let's Encrypt certificate installed for $DOMAIN"
