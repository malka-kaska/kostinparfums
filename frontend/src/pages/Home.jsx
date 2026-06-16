import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORY_IMAGES } from '../utils/imageUtils';
import './Home.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_URL}/api/products?limit=20`),
          fetch(`${API_URL}/api/products/categories`),
        ]);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData || []);
        }
      } catch {
        setProducts([]);
        setCategories([]);
      }
    };
    fetchData();
  }, []);

  const categoryNames = {
    perfumes: t('perfumes'),
    makeup: t('makeup'),
    skincare: t('skincare'),
    haircare: t('haircare'),
    bodycare: t('bodyCare'),
    menscare: t('mensCare'),
    other: t('other') || 'Other',
  };

  const newArrivals = products.slice(0, 8);
  const bestSellers = products.slice(8, 16);

  return (
    <div className="home-page">
      <Hero />

      <section className="section-padding-small">
        <div className="container">
          <h2 className="section-title">{t('newArrivals')}</h2>
          <div className="grid-product-showcase" data-testid="new-arrivals-grid">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="section-cta">
            <Link to="/products" className="btn-secondary">
              {t('viewAllProducts')}
            </Link>
          </div>
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="section-padding-small best-sellers-section">
          <div className="container">
            <h2 className="section-title">{t('bestSellers')}</h2>
            <div className="grid-product-showcase" data-testid="best-sellers-grid">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-padding categories-section">
        <div className="container">
          <h2 className="section-title">{t('shopByCategory')}</h2>
          <div className="categories-grid single-category" data-testid="categories-grid">
            {categories.filter(c => c.id === 'perfumes').map(category => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="category-card"
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url(${CATEGORY_IMAGES[category.id] || CATEGORY_IMAGES.other})`,
                }}
              >
                <div className="category-content">
                  <h3 className="category-name">{categoryNames[category.id] || category.name}</h3>
                  <p className="category-count">
                    {category.product_count} {category.product_count === 1 ? t('productSingular') : t('productsCount')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <h3>{t('trustAuthentic')}</h3>
              <p>{t('trustAuthenticDesc')}</p>
            </div>
            <div className="trust-item">
              <h3>{t('trustShipping')}</h3>
              <p>{t('trustShippingDesc')}</p>
            </div>
            <div className="trust-item">
              <h3>{t('trustPayments')}</h3>
              <p>{t('trustPaymentsDesc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
