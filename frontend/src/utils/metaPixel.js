/**
 * Meta Pixel — consent-gated initialization.
 *
 * GDPR requirement: the Meta Pixel (fbevents.js) and any fbq() calls
 * must be executed ONLY after the visitor has granted explicit consent
 * for marketing cookies.  This module is the single place that loads
 * the Pixel script and exposes a safe fbq wrapper.
 *
 * Usage:
 *   import { initializeMetaPixel, trackMetaEvent, initFromStoredConsent } from './metaPixel';
 *
 *   // On app boot (App.js) — respects previously stored consent:
 *   initFromStoredConsent();
 *
 *   // In CookieBanner — when the user accepts marketing cookies:
 *   if (prefs.marketing) initializeMetaPixel();
 *
 *   // Anywhere in the app — replaces raw window.fbq() calls:
 *   trackMetaEvent('track', 'Purchase', { value: 49.90, currency: 'EUR' });
 */

const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID || '2118783192346725';

let _initialized = false;

/** Returns true only after the Pixel script has been loaded and fbq('init') called. */
export const isMetaPixelInitialized = () => _initialized;

/**
 * Load fbevents.js and call fbq('init', PIXEL_ID) + fbq('track', 'PageView').
 * Safe to call multiple times — subsequent calls are no-ops.
 * Must be called only when marketing cookie consent has been granted.
 */
export const initializeMetaPixel = () => {
  if (_initialized || typeof window === 'undefined') return;

  // Inject the Meta Pixel bootstrap snippet
  /* eslint-disable */
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  _initialized = true;
};

/**
 * Safe wrapper around window.fbq().
 * Silently does nothing if the Pixel has not been initialized (no consent yet).
 * A failed analytics call must never propagate into the React component tree.
 */
export const trackMetaEvent = (...args) => {
  if (!_initialized || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    window.fbq(...args);
  } catch {
    /* swallow — analytics must never break UX */
  }
};

/**
 * Called once on app boot (e.g. inside App.js useEffect).
 * Reads the persisted cookie_consent value from localStorage and initializes
 * the Pixel only when the visitor has already given marketing consent.
 */
export const initFromStoredConsent = () => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('cookie_consent');
    if (!raw) return;
    const prefs = JSON.parse(raw);
    if (prefs && prefs.marketing === true) {
      initializeMetaPixel();
    }
  } catch {
    /* invalid localStorage value — do nothing */
  }
};
