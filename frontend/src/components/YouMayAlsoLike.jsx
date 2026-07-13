import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * "You may also like" section.
 *
 * Modes:
 * - mode="product":  fetches GET /api/products/{productId}/related?limit=6
 *                    (admin picks + frequently bought together + brand + category)
 * - mode="cart":     POST /api/products/related-bulk with list of product IDs
 *                    (co-occurrence across cart items + brand + category)
 *
 * If less than `minToShow` items are returned, the section renders nothing.
 */
const YouMayAlsoLike = ({
  mode = 'product',
  productId = null,
  productIds = [],
  limit = 6,
  minToShow = 3,
  className = '',
  testId = 'you-may-also-like',
}) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let res;
        if (mode === 'product' && productId) {
          res = await fetch(
            `${API_URL}/api/products/${productId}/related?limit=${limit}`
          );
        } else if (mode === 'cart' && productIds && productIds.length > 0) {
          res = await fetch(`${API_URL}/api/products/related-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_ids: productIds, limit }),
          });
        } else {
          if (!cancelled) setProducts([]);
          return;
        }
        if (res && res.ok) {
          const data = await res.json();
          if (!cancelled) setProducts(data.products || []);
        } else if (!cancelled) {
          setProducts([]);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [mode, productId, JSON.stringify(productIds), limit]);

  if (loading) return null;
  if (!products || products.length < minToShow) return null;

  return (
    <section
      className={`you-may-also-like section-padding ${className}`.trim()}
      data-testid={testId}
    >
      <div className="container">
        <h2 className="section-title">{t('youMayAlsoLike')}</h2>
        <div className="grid-product-showcase" data-testid={`${testId}-grid`}>
          {products.slice(0, limit).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default YouMayAlsoLike;
