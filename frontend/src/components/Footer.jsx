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
                <span>contact@kostinparfums.com</span>
              </div>
              <div className="contact-item">
                <MapPin size={14} />
                <span>гр. Плевен</span>
              </div>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">{t('footerShop')}</h4>
            <ul className="footer-links">
              <li><Link to="/products">{t('shopAll')}</Link></li>
              <li><Link to="/products?category=perfumes&gender=women">{t('womensFragrances')}</Link></li>
              <li><Link to="/products?category=perfumes&gender=men">{t('mensFragrances')}</Link></li>
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
