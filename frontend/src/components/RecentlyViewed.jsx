import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { getRecentlyViewed } from '../utils/recentlyViewed';

const RecentlyViewed = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const viewed = getRecentlyViewed();
    setProducts(viewed);
  }, []);

  // Don't render anything if no products viewed
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="section-padding-small" data-testid="recently-viewed-section">
      <div className="container">
        <h2 className="section-title">{t('recentlyViewed')}</h2>
        <div className="grid-product-showcase" data-testid="recently-viewed-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
