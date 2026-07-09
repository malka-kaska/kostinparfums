# Deploy KOSTIN Parfums

## Emergent / Production
- Production preview: `https://kostin-cosmetics-1.preview.emergentagent.com`
- Backend imports use `emergentintegrations` (Stripe, LLM, etc.)
- `.emergent/emergent.yml` references the base image and job config

### Typical deploy path
1. Merge PRs into `main`
2. Emergent preview build/deploy from GitHub
3. Set required env vars in Emergent dashboard/secret store:
   - `MONGO_URL`
   - `STRIPE_API_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `FRONTEND_URL`
   - `META_APP_ID=1359746189387697`
   - `META_APP_SECRET`
   - `META_PAGE_ID`
   - `META_INSTAGRAM_BUSINESS_ACCOUNT_ID`
   - `META_ACCESS_TOKEN`
   - `EMAIL_FROM`
   - `EMAIL_PASSWORD`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
4. Rebuild preview if needed from GitHub/repo settings

## Docker/VPS fallback
```bash
cp .env.example .env
# fill real secrets
docker-compose up -d --build
```

## Publish content
```bash
python scripts/publish_content.py
```
