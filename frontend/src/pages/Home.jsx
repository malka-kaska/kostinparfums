import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import RecentlyViewed from '../components/RecentlyViewed';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Fallback category images if admin hasn't uploaded custom ones
const DEFAULT_GENDER_IMAGES = {
  men: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
  women: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80',
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [campaignBanner, setCampaignBanner] = useState(null);
  const [genderImages, setGenderImages] = useState(DEFAULT_GENDER_IMAGES);
  const { t, lang } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin-selected featured products (for "Best Sellers" section)
        const featuredRes = await fetch(`${API_URL}/api/homepage/featured-products`);
        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeaturedProducts(featuredData);
        }
        
        // Fetch real best sellers based on orders
        const bestSellersRes = await fetch(`${API_URL}/api/homepage/best-sellers?limit=8`);
        if (bestSellersRes.ok) {
          const bestSellersData = await bestSellersRes.json();
          setBestSellers(bestSellersData);
        }

        // Fetch homepage settings (campaign banner + gender images)
        const settingsRes = await fetch(`${API_URL}/api/homepage/settings`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setCampaignBanner(settingsData.campaign_banner || null);
          if (settingsData.gender_images) {
            setGenderImages({
              men: settingsData.gender_images.men || DEFAULT_GENDER_IMAGES.men,
              women: settingsData.gender_images.women || DEFAULT_GENDER_IMAGES.women,
            });
          }
        }
      } catch {
        setFeaturedProducts([]);
        setBestSellers([]);
      }
    };
    fetchData();
  }, []);

  // Use admin-selected featured products, or fall back to real best sellers
  const displayedBestSellers = featuredProducts.length > 0 ? featuredProducts : bestSellers;

  return (
    <div className="home-page">
      <Hero />

      {/* Shop by Gender Section */}
      <section className="section-padding gender-section">
        <div className="container">
          <h2 className="section-title">{t('shopByCategory')}</h2>
          <div className="gender-grid" data-testid="gender-grid">
            <Link
              to="/products?gender=men"
              className="gender-card"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url(${genderImages.men})`,
              }}
            >
              <div className="gender-content">
                <h3 className="gender-name">{t('mensFragrances')}</h3>
                <span className="gender-cta">{t('shopNow') || 'Shop Now'}</span>
              </div>
            </Link>
            <Link
              to="/products?gender=women"
              className="gender-card"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url(${genderImages.women})`,
              }}
            >
              <div className="gender-content">
                <h3 className="gender-name">{t('womensFragrances')}</h3>
                <span className="gender-cta">{t('shopNow') || 'Shop Now'}</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Campaign Banner Section (admin controlled) - directly under Shop by Category */}
      {campaignBanner && campaignBanner.enabled && campaignBanner.image && (
        <section className="campaign-banner-section" data-testid="campaign-banner-section">
          <Link
            to={campaignBanner.button_link || '#'}
            className="campaign-banner"
            style={{ backgroundImage: `url(${campaignBanner.image})` }}
          >
            <div className="campaign-banner-overlay" />
            <div className="campaign-banner-content">
              {(lang === 'en' ? campaignBanner.title_en : campaignBanner.title) && (
                <h2 className="campaign-banner-title" data-testid="campaign-banner-title">
                  {lang === 'en' ? (campaignBanner.title_en || campaignBanner.title) : (campaignBanner.title || campaignBanner.title_en)}
                </h2>
              )}
              {(lang === 'en' ? campaignBanner.description_en : campaignBanner.description) && (
                <p className="campaign-banner-description" data-testid="campaign-banner-description">
                  {lang === 'en' ? (campaignBanner.description_en || campaignBanner.description) : (campaignBanner.description || campaignBanner.description_en)}
                </p>
              )}
              {(lang === 'en' ? campaignBanner.button_text_en : campaignBanner.button_text) && (
                <span className="campaign-banner-cta" data-testid="campaign-banner-cta">
                  {lang === 'en' ? (campaignBanner.button_text_en || campaignBanner.button_text) : (campaignBanner.button_text || campaignBanner.button_text_en)}
                </span>
              )}
            </div>
          </Link>
        </section>
      )}

      {/* Recently Viewed Section - above Best Sellers */}
      <RecentlyViewed />

      {/* Best Sellers Section - uses admin selected or real sales data */}
      {displayedBestSellers.length > 0 && (
        <section className="section-padding-small">
          <div className="container">
            <h2 className="section-title">{t('bestSellers')}</h2>
            <div className="grid-product-showcase" data-testid="best-sellers-grid">
              {displayedBestSellers.map(product => (
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
      )}

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
