import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Footer = () => {
  const { t, lang } = useLanguage();
  const [navCollections, setNavCollections] = useState([]);

  // Fetch navigation collections
  useEffect(() => {
    const fetchNavCollections = async () => {
      try {
        const res = await fetch(`${API_URL}/api/homepage/nav-collections`);
        if (res.ok) {
          const data = await res.json();
          const collections = data.collections || [];
          // If no collections from API, use default Dubai
          if (collections.length === 0) {
            setNavCollections([{
              slug: 'dubai',
              name: 'Dubai Fragrances',
              name_bg: 'Дубайски аромати',
              path: '/dubai-perfumes'
            }]);
          } else {
            setNavCollections(collections);
          }
        } else {
          // API error - use default
          setNavCollections([{
            slug: 'dubai',
            name: 'Dubai Fragrances',
            name_bg: 'Дубайски аромати',
            path: '/dubai-perfumes'
          }]);
        }
      } catch (err) {
        console.error('Failed to fetch nav collections:', err);
        // Fallback to default Dubai collection
        setNavCollections([{
          slug: 'dubai',
          name: 'Dubai Fragrances',
          name_bg: 'Дубайски аромати',
          path: '/dubai-perfumes'
        }]);
      }
    };
    fetchNavCollections();
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section footer-brand">
            <div className="footer-logo-text">
              <h2>KOSTIN</h2>
              <p className="footer-tagline">{t('curatedBeautyEssentials')}</p>
            </div>
            <p className="footer-description">
              {t('footerAbout')}
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <Mail size={14} />
                <span>contact@kostinparfums.com</span>
              </div>
              <div className="contact-item">
                <MapPin size={14} />
                <span>гр. Плевен</span>
              </div>
            </div>
            <div className="footer-social">
              <a 
                href="https://www.instagram.com/kostin.parfums/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.facebook.com/profile.php?id=61591235952620" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">{t('footerShop')}</h4>
            <ul className="footer-links">
              <li><Link to="/products">{t('shopAll')}</Link></li>
              <li><Link to="/products?category=perfumes&gender=women">{t('womensFragrances')}</Link></li>
              <li><Link to="/products?category=perfumes&gender=men">{t('mensFragrances')}</Link></li>
              {/* Dynamic navigation collections */}
              {navCollections.map(col => (
                <li key={col.slug}>
                  <Link to={col.path}>
                    {lang === 'bg' && col.name_bg ? col.name_bg : col.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">{t('footerInfo')}</h4>
            <ul className="footer-links">
              <li><Link to="/about">{t('aboutUs')}</Link></li>
              <li><Link to="/shipping">{t('shippingReturns')}</Link></li>
              <li><Link to="/faq">{t('faq')}</Link></li>
              <li><Link to="/legal">{t('legalInfo')}</Link></li>
              <li><Link to="/privacy">{t('privacyPolicy')}</Link></li>
              <li><Link to="/terms">{t('termsOfService')}</Link></li>
              <li><Link to="/cookies">{t('cookiePolicy')}</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">{t('footerAccount')}</h4>
            <ul className="footer-links">
              <li><Link to="/auth">{t('signInFooter')}</Link></li>
              <li><Link to="/cart">{t('shoppingCartFooter')}</Link></li>
              <li><Link to="/profile">{t('myProfile')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} KOSTIN. {t('allRightsReserved')}
          </p>
          <div className="footer-legal">
            <Link to="/privacy">{t('privacyPolicy')}</Link>
            <span className="separator">|</span>
            <Link to="/terms">{t('termsOfService')}</Link>
            <span className="separator">|</span>
            <Link to="/cookies">{t('cookiePolicy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
