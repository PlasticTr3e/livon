# Production deployment

One VPS running `docker-compose.prod.yml`:

| Service | Role | Exposed |
| --- | --- | --- |
| nginx | TLS, reverse proxy to `app`, serves `/media/*` from MinIO, per-IP rate limit on `/api/` | 80, 443 |
| certbot | Renews Let's Encrypt certificates every 12h | no |
| app | Next.js (standalone build) | no |
| migrate | Runs `prisma migrate deploy`, then exits; `app` waits for it | no |
| db / pgbouncer | PostGIS 18 behind a transaction pooler | no |
| redis | Cache, rate limits, token revocation | no |
| minio / minio-init | Object storage (`pgsty/minio` fork); init creates the bucket, public-read policy and the app's user | console on 127.0.0.1:9001 |
| ai-service | Sentiment model (FastAPI) | no |

All commands below run from the repo root on the server. Shorthand used throughout:

```sh
alias dc='docker compose --env-file .env.production -f docker-compose.prod.yml'
```

## First deploy

1. Install Docker Engine with the compose plugin and open ports 80 and 443.
2. `cp .env.production.example .env.production` and fill in every value. Generate secrets with `openssl rand -hex 32`; they are embedded in connection URLs, so keep them URL-safe.
3. Bring the stack up with TLS:
   - **No domain yet:** set `DOMAIN` to the server IP and `NEXT_PUBLIC_APP_URL=https://<ip>`, then run `deploy/init-tls.sh --self-signed`. Browsers will show a certificate warning.
   - **With a domain:** point an A record at the server, set `DOMAIN` and `LETSENCRYPT_EMAIL`, then run `deploy/init-tls.sh`.
4. Check `curl -k https://<DOMAIN>/api/health`. It returns `{"status":"ok", ...}` once the database is reachable.

### Moving to a real domain later

1. Update `DOMAIN`, `LETSENCRYPT_EMAIL` and `NEXT_PUBLIC_APP_URL` in `.env.production`.
2. Run `deploy/init-tls.sh`. It rebuilds `app`, because `NEXT_PUBLIC_APP_URL` is compiled into the client bundle.
3. Update the Google OAuth redirect URI and the Midtrans notification URL to the new domain.

## Moving off Supabase

Plan a short maintenance window: writes made to Supabase after the dump starts are lost.

### 1. Database

Prisma creates the schema on the new database, so only the data is copied. This keeps Supabase-specific schemas (`auth`, `storage`, `extensions`) out of the dump.

```sh
# Supabase must be on the latest migration. Use the direct connection (port 5432), not the 6543 pooler.
export SUPABASE_DB_URL='postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres'
dc run --rm --no-deps -e DIRECT_URL="$SUPABASE_DB_URL" migrate npx prisma migrate status

# Start the database and apply migrations to it.
dc up -d db && dc run --rm migrate

# Dump data only, then load it with triggers disabled so foreign keys don't care about table order.
docker run --rm -v "$PWD":/backup postgres:18 pg_dump "$SUPABASE_DB_URL" \
  --data-only --schema=public \
  --exclude-table=public._prisma_migrations --exclude-table=public.spatial_ref_sys \
  --format=custom -f /backup/supabase-data.dump

dc cp supabase-data.dump db:/tmp/supabase-data.dump
dc exec db sh -c 'pg_restore --data-only --disable-triggers --no-owner \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/supabase-data.dump && rm /tmp/supabase-data.dump'
```

Spot-check a few row counts against Supabase before continuing.

### 2. Storage

`scripts/migrate-supabase-storage.mjs` copies every object in the `livon-media-prod` and `livon-media-dev` buckets to `legacy/<bucket>/<path>` in MinIO. It then rewrites every `supabase.co/storage` URL in any text or text[] column (including links inside news content) to `/media/legacy/<bucket>/<path>`. It is safe to re-run.

```sh
dc up -d minio minio-init
dc run --rm -e SUPABASE_URL=https://<project-ref>.supabase.co -e SUPABASE_SERVICE_ROLE_KEY=<key> \
  migrate node scripts/migrate-supabase-storage.mjs --dry-run
# Review the counts, then run it again without --dry-run.
```

### 3. Cut over

Run `dc up -d --build`, check `/api/health`, open a few projects and news items to confirm their images load, then shut down the Supabase project.

## Operations

- **Deploy a new version:** `git pull && dc up -d --build`. Migrations run automatically before `app` starts.
- **Logs:** `dc logs -f app` (or `nginx`, `ai-service`, …).
- **MinIO console:** `ssh -L 9001:localhost:9001 <server>`, then open http://localhost:9001 and log in with `MINIO_ROOT_USER`.
- **Database backup:** `dc exec db pg_dump -U livon -Fc livon > backup-$(date +%F).dump`. Run it from cron and copy the file off the server.
- **Media backup:** back up the `livon-prod_minio_data` volume, or mirror the bucket with `mc mirror` to another S3 target.

## How Redis is used

| Feature | Keys | If Redis is down |
| --- | --- | --- |
| Response cache (projects, news, categories, priority, agency dashboard) | `cache:<namespace>:v<n>:*`, invalidated by bumping `cache:version:<namespace>` | Reads go straight to Postgres |
| Rate limits (login, register, password reset, upload, comment, vote, donation, sentiment) | `ratelimit:<rule>:<ip-or-user>:<window>` | Not enforced; nginx's per-IP limit still applies |
| Token revocation (logout, password reset, citizen delete or role change) | `auth:revoked:<jti>`, `auth:revoked-before:<userId>` | Not checked; tokens stay valid until they expire |

Redis runs with `noeviction`. Under memory pressure, cache writes fail instead of revocation entries being evicted. Cache entries expire within an hour, so memory use stays bounded.
