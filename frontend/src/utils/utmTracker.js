/**
 * UTM parameter tracker.
 *
 * Captures UTM parameters on the visitor's first landing page and stores them
 * in sessionStorage so they survive navigation within the checkout funnel.
 * The values are retrieved and attached to every order payload so the backend
 * can record the attribution source alongside each order.
 */

const UTM_STORAGE_KEY = 'utm_params';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

/** Read UTM parameters from the current URL query string. */
const readUtmFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  UTM_KEYS.forEach((key) => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });
  return Object.keys(utm).length > 0 ? utm : null;
};

/**
 * Capture UTM params from the landing URL and persist them for the session.
 * Call this once on app mount. Existing values are never overwritten so the
 * first-touch attribution is preserved even if the user navigates around.
 */
export const captureUtm = () => {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(UTM_STORAGE_KEY)) return; // first-touch wins
  const utm = readUtmFromUrl();
  if (utm) {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  }
};

/**
 * Retrieve stored UTM params.
 * Returns an object such as { utm_source, utm_medium, … } or null if the
 * visitor did not arrive via a tracked link.
 */
export const getStoredUtm = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
