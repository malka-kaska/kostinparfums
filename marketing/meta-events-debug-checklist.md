# Meta Events Debug & Verification Checklist

## Code changes pushed
- `frontend/src/App.js`: logs `[App][initFromStoredConsent] calling initFromStoredConsent`
- `frontend/src/utils/metaPixel.js`: logs `[metaPixel][initFromStoredConsent] raw=...`, parsed prefs, marketing flag, invalid localStorage
- `frontend/src/components/CookieBanner.jsx`: logs `[CookieBanner][saveConsent] ...`, marketing=true/false, Pixel init

## How to verify without Mac automation
1. Open `kostinparfums.com` in any browser with DevTools open.
2. In DevTools Console, watch for:
   - `[App][initFromStoredConsent] calling initFromStoredConsent`
   - `[metaPixel][initFromStoredConsent] raw= ...`
   - `[metaPixel][initFromStoredConsent] parsed= ... marketing= true/false`
3. Accept cookies with marketing enabled.
4. Watch for:
   - `[CookieBanner][saveConsent] {essential: true, analytics: true, marketing: true}`
   - `[CookieBanner][saveConsent] marketing=true, initializing Meta Pixel`
5. Reload and verify:
   - `fbq('init', '2118783192346725')`
   - `fbq('track', 'PageView')`
   - `fbq('track', 'ViewContent', ...)` on a product page

## If logs don't appear
- Check `localStorage.getItem('cookie_consent')` in DevTools
- Check React build has `REACT_APP_META_PIXEL_ID=2118783192346725`
- Check Network tab for POST `/api/meta-capi/event`

## Catalog reconciliation
- Run `python backend/scripts/reconcile_catalog_visibility.py` with local MongoDB running
- This will set `is_visible=false` for products not in the official PDFs
- Re-run catalog sync from backend
