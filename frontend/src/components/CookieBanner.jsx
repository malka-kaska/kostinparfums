import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, Settings } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { initializeMetaPixel } from '../utils/metaPixel';
import './CookieBanner.css';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { language } = useLanguage();

  const translations = {
    bg: {
      title: 'Използваме бисквитки',
      description: 'Използваме бисквитки, за да подобрим вашето изживяване. Задължителните бисквитки са необходими за работата на сайта.',
      essential: 'Задължителни',
      essentialDesc: 'Необходими за работата на сайта (сесия, кошница, автентикация)',
      analytics: 'Аналитични',
      analyticsDesc: 'Помагат ни да разберем как използвате сайта',
      marketing: 'Маркетингови',
      marketingDesc: 'Използват се за персонализирани реклами',
      acceptAll: 'Приеми всички',
      acceptEssential: 'Само задължителни',
      customize: 'Настрой',
      save: 'Запази настройки',
      privacyLink: 'Политика за поверителност',
      alwaysOn: 'Винаги активни',
    },
    en: {
      title: 'We use cookies',
      description: 'We use cookies to enhance your experience. Essential cookies are required for the site to function.',
      essential: 'Essential',
      essentialDesc: 'Required for site functionality (session, cart, authentication)',
      analytics: 'Analytics',
      analyticsDesc: 'Help us understand how you use the site',
      marketing: 'Marketing',
      marketingDesc: 'Used for personalized advertising',
      acceptAll: 'Accept All',
      acceptEssential: 'Essential Only',
      customize: 'Customize',
      save: 'Save Preferences',
      privacyLink: 'Privacy Policy',
      alwaysOn: 'Always on',
    }
  };

  const t = translations[language] || translations.bg;

  const [preferences, setPreferences] = useState({
    essential: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
      } catch (e) {
        // Invalid stored data, show banner again
        setIsVisible(true);
      }
    }
  }, []);

  const saveConsent = (prefs) => {
    localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setPreferences(prefs);
    setIsVisible(false);
    setShowDetails(false);
    console.log('[CookieBanner][saveConsent]', prefs);
    // Initialize Meta Pixel only when marketing cookies are accepted (GDPR)
    if (prefs.marketing) {
      console.log('[CookieBanner][saveConsent] marketing=true, initializing Meta Pixel');
      initializeMetaPixel();
    } else {
      console.log('[CookieBanner][saveConsent] marketing=false, Pixel not initialized');
    }
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleAcceptEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner-overlay" data-testid="cookie-banner">
      <div className={`cookie-banner ${showDetails ? 'expanded' : ''}`}>
        <button 
          className="cookie-close-btn" 
          onClick={handleAcceptEssential}
          aria-label="Close"
          data-testid="cookie-close-btn"
        >
          <X size={20} />
        </button>

        <div className="cookie-header">
          <Cookie size={28} className="cookie-icon" />
          <h3>{t.title}</h3>
        </div>

        <p className="cookie-description">{t.description}</p>

        {showDetails && (
          <div className="cookie-details" data-testid="cookie-details">
            {/* Essential Cookies */}
            <div className="cookie-option">
              <div className="cookie-option-header">
                <div className="cookie-option-info">
                  <Shield size={18} />
                  <span className="cookie-option-title">{t.essential}</span>
                </div>
                <span className="cookie-always-on">{t.alwaysOn}</span>
              </div>
              <p className="cookie-option-desc">{t.essentialDesc}</p>
            </div>

            {/* Analytics Cookies */}
            <div className="cookie-option">
              <div className="cookie-option-header">
                <div className="cookie-option-info">
                  <Settings size={18} />
                  <span className="cookie-option-title">{t.analytics}</span>
                </div>
                <label className="cookie-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    data-testid="cookie-analytics-toggle"
                  />
                  <span className="cookie-toggle-slider"></span>
                </label>
              </div>
              <p className="cookie-option-desc">{t.analyticsDesc}</p>
            </div>

            {/* Marketing Cookies */}
            <div className="cookie-option">
              <div className="cookie-option-header">
                <div className="cookie-option-info">
                  <Cookie size={18} />
                  <span className="cookie-option-title">{t.marketing}</span>
                </div>
                <label className="cookie-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    data-testid="cookie-marketing-toggle"
                  />
                  <span className="cookie-toggle-slider"></span>
                </label>
              </div>
              <p className="cookie-option-desc">{t.marketingDesc}</p>
            </div>
          </div>
        )}

        <div className="cookie-actions">
          {showDetails ? (
            <>
              <button 
                className="cookie-btn cookie-btn-secondary" 
                onClick={() => setShowDetails(false)}
              >
                ← {language === 'bg' ? 'Назад' : 'Back'}
              </button>
              <button 
                className="cookie-btn cookie-btn-primary" 
                onClick={handleSavePreferences}
                data-testid="cookie-save-btn"
              >
                {t.save}
              </button>
            </>
          ) : (
            <>
              <button 
                className="cookie-btn cookie-btn-outline" 
                onClick={() => setShowDetails(true)}
                data-testid="cookie-customize-btn"
              >
                {t.customize}
              </button>
              <button 
                className="cookie-btn cookie-btn-secondary" 
                onClick={handleAcceptEssential}
                data-testid="cookie-essential-btn"
              >
                {t.acceptEssential}
              </button>
              <button 
                className="cookie-btn cookie-btn-primary" 
                onClick={handleAcceptAll}
                data-testid="cookie-accept-all-btn"
              >
                {t.acceptAll}
              </button>
            </>
          )}
        </div>

        <a href="/cookies" className="cookie-privacy-link">
          {t.privacyLink} →
        </a>
      </div>
    </div>
  );
};

export default CookieBanner;
