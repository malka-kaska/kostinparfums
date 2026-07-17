# KOSTIN Parfums — Deploy Guide

## Backend deploy
1. Set required env vars from `.env.example` on your host/provider.
2. Install deps: `pip install -r backend/requirements.txt`
3. Validate env: `python scripts/setup_env.py`
4. Start backend: `python scripts/start_server.py --host 0.0.0.0 --port 8000`

## Frontend deploy
- Build frontend: `cd frontend && npm run build`
- Serve `frontend/build` with the backend or a static host pointing to `FRONTEND_URL`

## Meta events checklist
- Pixel ID: `2118783192346725`
- Enable events in Meta Events Manager: `ViewContent`, `AddToCart`, `Purchase`
- Verify cookie consent allows marketing=true on `kostinparfums.com`
- Use `marketing/meta-events-debug-checklist.md` for console validation
