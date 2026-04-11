import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Heart, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './AboutUs.css';

const AboutUs = () => {
  const { t } = useLanguage();

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1 className="about-title">{t('aboutTitle')}</h1>
          <p className="about-subtitle">{t('aboutSubtitle')}</p>
        </div>
      </section>

      <div className="container section-padding">
        <section className="about-intro">
          <p className="intro-text">{t('aboutIntro1')}</p>
          <p className="intro-text" dangerouslySetInnerHTML={{ __html: t('aboutIntro2') }} />
        </section>

        <section className="about-values">
          <div className="value-card">
            <Shield className="value-icon" size={32} strokeWidth={1.5} />
            <h3>{t('aboutAuth')}</h3>
            <p>{t('aboutAuthDesc')}</p>
          </div>
          <div className="value-card">
            <Award className="value-icon" size={32} strokeWidth={1.5} />
            <h3>{t('aboutQuality')}</h3>
            <p>{t('aboutQualityDesc')}</p>
          </div>
          <div className="value-card">
            <Heart className="value-icon" size={32} strokeWidth={1.5} />
            <h3>{t('aboutTrust')}</h3>
            <p>{t('aboutTrustDesc')}</p>
          </div>
        </section>

        <section className="about-section">
          <h2 className="section-heading">{t('aboutCollectionTitle')}</h2>
          <p className="section-text">{t('aboutCollectionText')}</p>
          <div className="features-list">
            <div className="feature-item">
              <Check size={20} />
              <span>{t('aboutFeature1')}</span>
            </div>
            <div className="feature-item">
              <Check size={20} />
              <span>{t('aboutFeature2')}</span>
            </div>
            <div className="feature-item">
              <Check size={20} />
              <span>{t('aboutFeature3')}</span>
            </div>
            <div className="feature-item">
              <Check size={20} />
              <span>{t('aboutFeature4')}</span>
            </div>
          </div>
        </section>

        <section className="about-philosophy">
          <div className="philosophy-content">
            <h2 className="section-heading">{t('aboutPhilosophyTitle')}</h2>
            <p className="section-text" dangerouslySetInnerHTML={{ __html: t('aboutPhilosophy1') }} />
            <p className="section-text">{t('aboutPhilosophy2')}</p>
          </div>
        </section>

        <section className="about-mission">
          <div className="mission-box">
            <p className="mission-text">{t('aboutMission1')}</p>
            <p className="mission-text highlight">{t('aboutMission2')}</p>
            <p className="mission-tagline">{t('aboutMissionTagline')}</p>
          </div>
        </section>

        <section className="about-cta">
          <h2>{t('aboutDiscoverTitle')}</h2>
          <p>{t('aboutDiscoverText')}</p>
          <Link to="/products" className="btn-primary">
            {t('shopNow')}
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
