import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Heart, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './AboutUs.css';

// Safe text renderer that handles <strong> tags without dangerouslySetInnerHTML
const SafeText = ({ text }) => {
  if (!text) return null;
  
  // Split by <strong> tags and render safely
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        const strongMatch = part.match(/<strong>(.*?)<\/strong>/);
        if (strongMatch) {
          return <strong key={index}>{strongMatch[1]}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

const AboutUs = () => {
  const { t, lang } = useLanguage();

  // Inject SEO meta + Organization JSON-LD
  const setMeta = (attr, value, content) => {
    if (typeof document === 'undefined') return;
    let el = document.querySelector(`meta[${attr}="${value}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, value);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };
  if (typeof document !== 'undefined') {
    document.title = (lang === 'bg'
      ? 'За KOSTIN | Автентични луксозни парфюми — доставка в България'
      : 'About KOSTIN | Authentic luxury perfumes — delivery in Bulgaria');
    setMeta('name', 'description', lang === 'bg'
      ? 'KOSTIN — премиум онлайн магазин за 100% автентични луксозни парфюми от Chanel, Dior, YSL, Tom Ford и още. Директни партньорства, батч проверка, доставка чрез Speedy.'
      : 'KOSTIN — premium online store for 100% authentic luxury perfumes from Chanel, Dior, YSL, Tom Ford and more. Direct partnerships, batch verification, delivery via Speedy.');
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://kostinparfums.com/about');
  }

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "KOSTIN",
    "url": "https://kostinparfums.com",
    "logo": "https://kostinparfums.com/logo.png",
    "description": "Luxury perfume boutique offering authentic designer fragrances with delivery across Bulgaria via Speedy.",
    "email": "contact@kostin.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "бул. Чаталджа №4, вх. А, ет. 4, ап. 10",
      "addressLocality": "Плевен",
      "postalCode": "5800",
      "addressCountry": "BG"
    },
    "founder": { "@type": "Person", "name": "Konstantin Kirchev" }
  };

  return (
    <div className="about-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <section className="about-hero">
        <div className="container">
          <h1 className="about-title">{t('aboutTitle')}</h1>
          <p className="about-subtitle">{t('aboutSubtitle')}</p>
        </div>
      </section>

      <div className="container section-padding">
        <section className="about-intro">
          <p className="intro-text">{t('aboutIntro1')}</p>
          <p className="intro-text"><SafeText text={t('aboutIntro2')} /></p>
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
            <p className="section-text"><SafeText text={t('aboutPhilosophy1')} /></p>
            <p className="section-text">{t('aboutPhilosophy2')}</p>
          </div>
        </section>

        {/* Extended SEO content sections */}
        <section className="about-section">
          <h2 className="section-heading">{t('aboutStoryTitle')}</h2>
          <p className="section-text">{t('aboutStoryText1')}</p>
          <p className="section-text">{t('aboutStoryText2')}</p>
          <p className="section-text">{t('aboutStoryText3')}</p>
        </section>

        <section className="about-section">
          <h2 className="section-heading">{t('aboutAuthTitle')}</h2>
          <p className="section-text">{t('aboutAuthText1')}</p>
          <p className="section-text">{t('aboutAuthText2')}</p>
          <p className="section-text">{t('aboutAuthText3')}</p>
          <p className="section-text">{t('aboutAuthText4')}</p>
        </section>

        <section className="about-section">
          <h2 className="section-heading">{t('aboutDeliveryTitle')}</h2>
          <p className="section-text">{t('aboutDeliveryText1')}</p>
          <p className="section-text">{t('aboutDeliveryText2')}</p>
          <p className="section-text">{t('aboutDeliveryText3')}</p>
          <p className="section-text">{t('aboutDeliveryText4')}</p>
        </section>

        <section className="about-section">
          <h2 className="section-heading">{t('aboutGuideTitle')}</h2>
          <p className="section-text">{t('aboutGuideText1')}</p>
          <p className="section-text">{t('aboutGuideText2')}</p>
          <p className="section-text">{t('aboutGuideText3')}</p>
          <p className="section-text">{t('aboutGuideText4')}</p>
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

        <section className="about-legal">
          <h2 className="section-heading">{t('legalInfo')}</h2>
          <div className="legal-info-box">
            <p><strong>{t('companyName')}:</strong> ГРИИН ПОТЕНШЪЛ ЕООД / GREEN POTENTIAL LTD</p>
            <p><strong>{t('companyEik')}:</strong> 208341137</p>
            <p><strong>{t('companyAddress')}:</strong> гр. Плевен 5800, бул. Чаталджа № 4, вх. А, ет. 4, ап. 10</p>
            <p><strong>{t('companyManager')}:</strong> Константин Валериев Кирчев</p>
            <p><strong>{t('companyActivity')}:</strong> {t('companyActivityDesc')}</p>
            <p className="legal-link">
              <Link to="/legal">{t('fullLegalInfo')} →</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
