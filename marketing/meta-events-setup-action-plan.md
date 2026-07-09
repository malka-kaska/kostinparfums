# Meta Events Setup Action Plan

## Observed state
- Pixel ID: `2118783192346725` (active on kostinparfums.com)
- Pixel helper shows: no events yet
- Events Manager shows: ViewContent missing / Needs attention
- Catalog count mismatch: backend DB has 7,347 visible products; official PDF should expose only ~134 visible products

## Likely blockers
1. cookie_consent gate in `frontend/src/utils/metaPixel.js` prevents Pixel init if marketing cookies are not accepted.
2. `App.js` only calls `initFromStoredConsent()`; if consent was cleared, Pixel never loads and no ViewContent fires.
3. Catalog sync flow may be syncing hidden or placeholder products because `products_backup.json` is not reconciled against official PDFs.
4. Hardcoded popularity / search boosts in `backend/routes/products.py` can reference brands/products outside the official visible set.

## Fixes to apply
### Frontend consent + Pixel init
- Ensure `CookieBanner` and `App.js` initialize Pixel immediately when marketing consent is true.
- Add guard logs for: `cookie_consent` value, `_initialized`, and `fbq('init')` call.

### Catalog reconciliation
- Run `backend/scripts/reconcile_catalog_visibility.py` against local Mongo to set `is_visible=false` for products not present in the official PDFs.
- Re-run full catalog sync after reconciliation to send only ~134 valid items to Meta.

### Meta Events Manager
- In Safari, open Meta Events Manager for Pixel `2118783192346725`.
- Set Test Events using browser Pixel Helper and verify `ViewContent`, `AddToCart`, `Purchase`.
- If using Event Setup Tool, validate website interactions instead of manual URL testing.

## Next steps
1. Apply the code changes for consent/logging.
2. Run reconciliation script against local DB.
3. Trigger a fresh catalog sync from backend admin or script.
4. Re-test with Meta Pixel Helper and Events Manager.
