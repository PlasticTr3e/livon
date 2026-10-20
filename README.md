## LIVON

### Local development

```sh
cp .env.example .env
docker compose up -d          # Postgres + pgbouncer, Redis, MinIO (console at http://localhost:9001)
npm install
npx prisma migrate deploy
npm run dev
```

The AI service is optional locally. Without it, comment sentiment falls back to keyword analysis.

### Production

See [docs/deploy/README.md](docs/deploy/README.md).
