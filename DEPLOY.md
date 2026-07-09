# Deploy KOSTIN Parfums

## Emergent / Production
- Production preview: `https://kostin-cosmetics-1.preview.emergentagent.com`
- Backend imports use `emergentintegrations` (Stripe, LLM, etc.)
- `.emergent/emergent.yml` references the base image and job config
- Deploy via pushing to GitHub; Emergent auto-builds from the repo

## Meta apps
- `META_APP_ID`: `1359746189387697`
- Also set `META_APP_SECRET`, `META_PAGE_ID`, `META_INSTAGRAM_BUSINESS_ACCOUNT_ID`, `META_ACCESS_TOKEN`

## Publish content
```bash
python scripts/publish_content.py
```
