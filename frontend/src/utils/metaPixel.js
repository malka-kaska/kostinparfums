/**
 * Centralized Meta Pixel + Conversions API (CAPI) event layer.
 *
 * The Pixel base code (fbq) is loaded in public/index.html using the
 * REACT_APP_META_PIXEL_ID environment variable.
 *
 * Each event fires:
 *  1. Browser-side fbq() call (Meta Pixel)
 *  2. Server-side CAPI request via the backend /api/meta-capi/* endpoint
 *
 * Both calls share the same event_id so Meta can deduplicate them
 * and avoid double-counting in Events Manager.
 *
 * Design goals:
 *  - Never break UX: every call is wrapped and no-ops if fbq is unavailable.
 *  - Stateless: event_id is generated fresh per call using crypto.randomUUID().
 *  - No secrets in the browser: the CAPI token lives only in the backend.
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Crash-safe fbq wrapper — analytics must never throw into the React tree. */
const fbq = (...args) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    window.fbq(...args);
  } catch {
    /* swallow */
  }
};

/** Generate a unique event ID for Pixel ↔ CAPI deduplication. */
const newEventId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

/**
 * Forward the event to the backend CAPI endpoint.
 * Failures are silently swallowed so the UX is never affected.
 */
const sendCapi = async (eventName, payload) => {
  if (!API_URL) return;
  try {
    await fetch(`${API_URL}/api/meta-capi/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ event_name: eventName, ...payload }),
    });
  } catch {
    /* swallow: CAPI failures must not affect the user */
  }
};

// ─── event helpers ────────────────────────────────────────────────────────────

/** Build a content_ids + contents array from a product object. */
const productContents = (product, quantity = 1) => ({
  content_ids: [String(product?.id ?? '')],
  contents: [{ id: String(product?.id ?? ''), quantity, item_price: product?.price ?? 0 }],
  content_name: product?.name ?? '',
  content_category: product?.category ?? '',
  value: (product?.price ?? 0) * quantity,
  currency: 'EUR',
});

// ─── 10 events ────────────────────────────────────────────────────────────────

/**
 * 1. ViewContent — fired when a product detail page is viewed.
 */
export const pixelViewContent = (product) => {
  if (!product) return;
  const eventId = newEventId();
  const params = productContents(product, 1);
  fbq('track', 'ViewContent', params, { eventID: eventId });
  sendCapi('ViewContent', {
    event_id: eventId,
    product_id: String(product.id),
    value: params.value,
    content_name: params.content_name,
    category: params.content_category,
    currency: 'EUR',
  });
};

/**
 * 2. Search — fired when the user submits a search query on the Products page.
 */
export const pixelSearch = (query) => {
  if (!query) return;
  const eventId = newEventId();
  fbq('track', 'Search', { search_string: query }, { eventID: eventId });
  sendCapi('Search', { event_id: eventId, search_string: query });
};

/**
 * 3. AddToWishlist — custom event fired when the wishlist button is clicked.
 */
export const pixelAddToWishlist = (product) => {
  if (!product) return;
  const eventId = newEventId();
  const params = productContents(product, 1);
  fbq('track', 'AddToWishlist', params, { eventID: eventId });
  sendCapi('AddToWishlist', {
    event_id: eventId,
    product_id: String(product.id),
    value: params.value,
    content_name: params.content_name,
    category: params.content_category,
    currency: 'EUR',
  });
};

/**
 * 4. AddToCart — fired when a product is added to the shopping cart.
 */
export const pixelAddToCart = (product, quantity = 1) => {
  if (!product) return;
  const eventId = newEventId();
  const params = productContents(product, quantity);
  fbq('track', 'AddToCart', params, { eventID: eventId });
  sendCapi('AddToCart', {
    event_id: eventId,
    product_id: String(product.id),
    quantity,
    value: params.value,
    content_name: params.content_name,
    category: params.content_category,
    currency: 'EUR',
  });
};

/**
 * 5. InitiateCheckout — fired when the user lands on the checkout page.
 */
export const pixelInitiateCheckout = (cartItems = []) => {
  if (!cartItems.length) return;
  const eventId = newEventId();
  const value = cartItems.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const contentIds = cartItems.map((i) => String(i.id));
  fbq(
    'track',
    'InitiateCheckout',
    { content_ids: contentIds, content_type: 'product', num_items: cartItems.length, value, currency: 'EUR' },
    { eventID: eventId },
  );
  sendCapi('InitiateCheckout', {
    event_id: eventId,
    num_items: cartItems.length,
    value,
    currency: 'EUR',
  });
};

/**
 * 6. Purchase — fired after a successful payment.
 */
export const pixelPurchase = ({ orderId, value, cartItems = [] }) => {
  const eventId = newEventId();
  const contentIds = cartItems.map((i) => String(i.id));
  fbq(
    'track',
    'Purchase',
    { content_ids: contentIds, content_type: 'product', num_items: cartItems.length, value, currency: 'EUR' },
    { eventID: eventId },
  );
  sendCapi('Purchase', {
    event_id: eventId,
    order_id: orderId,
    value,
    num_items: cartItems.length,
    currency: 'EUR',
  });
};

/**
 * 7. Lead — fired when a user subscribes to the newsletter during registration.
 */
export const pixelLead = () => {
  const eventId = newEventId();
  fbq('track', 'Lead', {}, { eventID: eventId });
  sendCapi('Lead', { event_id: eventId });
};

/**
 * 8. CompleteRegistration — fired after a successful user account registration.
 */
export const pixelCompleteRegistration = () => {
  const eventId = newEventId();
  fbq('track', 'CompleteRegistration', { status: true }, { eventID: eventId });
  sendCapi('CompleteRegistration', { event_id: eventId });
};

/**
 * 9. ViewCategory — custom event fired when the user selects a product category.
 */
export const pixelViewCategory = (category) => {
  if (!category || category === 'all') return;
  const eventId = newEventId();
  fbq('trackCustom', 'ViewCategory', { content_category: category }, { eventID: eventId });
  sendCapi('ViewCategory', { event_id: eventId, category });
};

/**
 * 10. DiscountApplied — custom event fired when a discount code is successfully applied.
 */
export const pixelDiscountApplied = ({ code, discountAmount, cartTotal }) => {
  const eventId = newEventId();
  fbq(
    'trackCustom',
    'DiscountApplied',
    { discount_code: code, discount_amount: discountAmount, cart_total: cartTotal, currency: 'EUR' },
    { eventID: eventId },
  );
  sendCapi('DiscountApplied', { event_id: eventId, discount_code: code, discount_amount: discountAmount, cart_total: cartTotal });
};

const metaPixel = {
  pixelViewContent,
  pixelSearch,
  pixelAddToWishlist,
  pixelAddToCart,
  pixelInitiateCheckout,
  pixelPurchase,
  pixelLead,
  pixelCompleteRegistration,
  pixelViewCategory,
  pixelDiscountApplied,
};

export default metaPixel;
