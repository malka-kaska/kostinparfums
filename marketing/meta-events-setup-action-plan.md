# Meta Events Diagnostic Flow
## Pixel status
- Pixel ID: `2118783192346725`
- Pixel helper: Active on kostinparfums.com
- Issue: no events recorded, ViewContent missing in Events Manager

## Exact test flow
1. Open `kostinparfums.com` in Safari with Meta Pixel Helper enabled.
2. Accept cookie banner with marketing enabled (or ensure localStorage `cookie_consent = {"essential":true,"analytics":...,"marketing":true}`).
3. Reload page and watch for:
   - `fbq('init', '2118783192346725')`
   - `fbq('track', 'PageView')`
4. Navigate to any product page. Expected:
   - `fbq('track', 'ViewContent', ...)` with `content_ids` and `value`
5. Add to cart. Expected:
   - `fbq('track', 'AddToCart', ...)`
6. Checkout success. Expected:
   - `fbq('track', 'Purchase', ...)`

## If events still missing
- Confirm `localStorage.getItem('cookie_consent')` is set and `prefs.marketing === true`
- Confirm `localStorage.getItem('cookie_consent_date')` exists
- Check Network tab for POST to `/api/meta-capi/event`
- If backend returns 401/403, CAPI token/pixel ID env vars are missing

## Next actions
- Run catalog reconciliation script to reduce catalog from 7347 to ~134 PDF-visible products
- Re-test events after catalog is clean
