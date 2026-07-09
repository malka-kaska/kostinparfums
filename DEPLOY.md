# Deploy KOSTIN Parfums

## Render
1. New + -> Deploy from GitHub -> `malka-kaska/kostinparfums`
2. Runtime: Docker
3. Build command: leave default
4. Start command: `uvicorn backend.server:app --host 0.0.0.0 --port $PORT`
5. Add env vars from `.env.example`
6. Deploy

## Docker/VPS
```bash
cp .env.example .env
# fill real secrets
docker compose up -d --build
```

## Meta apps
- `META_APP_ID`: `1359746189387697`
- Also set `META_APP_SECRET`, `META_PAGE_ID`, `META_INSTAGRAM_BUSINESS_ACCOUNT_ID`, `META_ACCESS_TOKEN`

## Publish content
```bash
python scripts/publish_content.py
```
