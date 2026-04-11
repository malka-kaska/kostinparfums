import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();

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
                <span>contact@kostin.com</span>
              </div>
              <div className="contact-item">
                <Phone size={14} />
                <span>+32 (0) 123 456 789</span>
              </div>
              <div className="contact-item">
                <MapPin size={14} />
                <span>Brussels, Belgium</span>
              </div>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">{t('footerShop')}</h4>
            <ul className="footer-links">
              <li><Link to="/products?category=perfumes">{t('perfumes')}</Link></li>
              <li><Link to="/products?category=makeup">{t('makeup')}</Link></li>
              <li><Link to="/products?category=skincare">{t('skincare')}</Link></li>
              <li><Link to="/products?category=haircare">{t('haircare')}</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">{t('footerInfo')}</h4>
            <ul className="footer-links">
              <li><Link to="/about">{t('aboutUs')}</Link></li>
              <li><Link to="/shipping">{t('shippingReturns')}</Link></li>
              <li><Link to="/faq">{t('faq')}</Link></li>
              <li><Link to="/privacy">{t('privacyPolicy')}</Link></li>
              <li><Link to="/terms">{t('termsOfService')}</Link></li>
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
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
