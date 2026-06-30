/**
 * Centralized GA4 (Google Analytics 4) ecommerce analytics layer.
 *
 * The base GA4 tag (gtag.js / G-WTQ4F6F9VR) is loaded in public/index.html.
 * This module provides crash-safe, semantically-correct GA4 ecommerce events
 * (https://developers.google.com/analytics/devguides/collection/ga4/ecommerce).
 *
 * Design goals:
 * - Never break UX: every call is wrapped and no-ops if gtag is unavailable.
 * - Single source of truth: all `gtag('event', ...)` calls live here so the
 *   funnel (view_item -> add_to_cart -> begin_checkout -> purchase) stays consistent.
 * - Fires *alongside* the existing Meta Pixel (fbq) tracking, never replacing it.
 */

const CURRENCY = 'EUR';

const isReady = () =>
  typeof window !== 'undefined' && typeof window.gtag === 'function';

/** Safe gtag invocation — analytics must never throw into the React tree. */
const send = (...args) => {
  if (!isReady()) return;
  try {
    window.gtag(...args);
  } catch {
    /* swallow: a failed analytics call must never affect the user */
  }
};

/** Normalize an app product/cart line into a GA4 `items[]` entry. */
const toItem = (product, quantity = 1) => {
  const item = {
    item_id: String(product?.id ?? ''),
    item_name: product?.name ?? '',
    price: Number(product?.price) || 0,
    quantity: Number(quantity) || 1,
  };
  if (product?.brand) item.item_brand = product.brand;
  if (product?.category) item.item_category = product.category;
  return item;
};

const sumValue = (items) =>
  items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Product detail page view. */
export const trackViewItem = (product) => {
  if (!product) return;
  const items = [toItem(product, 1)];
  send('event', 'view_item', { currency: CURRENCY, value: round2(sumValue(items)), items });
};

/** Add to cart (mirrors Meta Pixel AddToCart). */
export const trackAddToCart = (product, quantity = 1) => {
  if (!product) return;
  const items = [toItem(product, quantity)];
  send('event', 'add_to_cart', { currency: CURRENCY, value: round2(sumValue(items)), items });
};

/** Remove from cart. */
export const trackRemoveFromCart = (product, quantity = 1) => {
  if (!product) return;
  const items = [toItem(product, quantity)];
  send('event', 'remove_from_cart', { currency: CURRENCY, value: round2(sumValue(items)), items });
};

/** Begin checkout (mirrors Meta Pixel InitiateCheckout). */
export const trackBeginCheckout = (cartItems = []) => {
  const items = (cartItems || []).map((i) => toItem(i, i?.quantity || 1));
  if (items.length === 0) return;
  send('event', 'begin_checkout', { currency: CURRENCY, value: round2(sumValue(items)), items });
};

/**
 * Purchase (mirrors Meta Pixel Purchase).
 * @param {Object} opts
 * @param {string|number} [opts.transactionId] - Order number / Stripe session id (dedup key).
 * @param {number} [opts.value] - Order total. Falls back to sum of items.
 * @param {number} [opts.shipping] - Shipping cost.
 * @param {number} [opts.tax] - Tax amount.
 * @param {Array}  [opts.items] - Cart line items.
 */
export const trackPurchase = ({ transactionId, value, shipping = 0, tax = 0, items = [] } = {}) => {
  const gaItems = (items || []).map((i) => toItem(i, i?.quantity || 1));
  const payload = {
    currency: CURRENCY,
    value: round2(value != null ? value : sumValue(gaItems)),
    shipping: round2(shipping),
    tax: round2(tax),
    items: gaItems,
  };
  if (transactionId != null && transactionId !== '') {
    payload.transaction_id = String(transactionId);
  }
  send('event', 'purchase', payload);
};

const analytics = {
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
};

export default analytics;
