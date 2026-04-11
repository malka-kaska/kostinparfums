import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Hero.css';

const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="hero">
      <div className="hero-image-bg">
        <div className="hero-overlay">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">{t('heroTitle')}</h1>
              <p className="hero-subtitle">{t('heroSubtitle')}</p>
              <Link to="/products" className="hero-button">
                {t('heroButton')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
