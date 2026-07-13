import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, BarChart3, Target, Settings, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Legal.css';

const CookiePolicy = () => {
  const { language } = useLanguage();

  const content = {
    bg: {
      title: 'ПОЛИТИКА ЗА БИСКВИТКИ',
      subtitle: 'Последна актуализация: Юни 2026',
      intro: 'Тази политика обяснява как KOSTIN използва бисквитки и подобни технологии на нашия уебсайт.',
      
      whatAreCookies: 'Какво са бисквитките?',
      whatAreCookiesText: 'Бисквитките са малки текстови файлове, които се съхраняват на вашето устройство (компютър, таблет или телефон), когато посещавате уебсайт. Те позволяват на сайта да запомни вашите действия и предпочитания за определен период от време.',
      
      howWeUse: 'Как използваме бисквитки?',
      howWeUseText: 'Използваме бисквитки за различни цели, включително за функциониране на сайта, анализ на трафика и подобряване на потребителското изживяване.',
      
      cookieTypes: 'Видове бисквитки',
      
      essential: 'Задължителни бисквитки',
      essentialDesc: 'Тези бисквитки са необходими за правилното функциониране на уебсайта. Без тях определени функции няма да работят.',
      essentialList: [
        { name: 'access_token', purpose: 'Автентикация на потребителя', duration: '7 дни' },
        { name: 'refresh_token', purpose: 'Обновяване на сесията', duration: '7 дни' },
        { name: 'cookie_consent', purpose: 'Запазване на избора за бисквитки', duration: 'Постоянно' },
        { name: 'cart', purpose: 'Съхранение на кошница', duration: 'Сесия' },
        { name: 'theme', purpose: 'Тъмен/светъл режим', duration: 'Постоянно' },
        { name: 'language', purpose: 'Езикови предпочитания', duration: 'Постоянно' },
      ],
      
      analytics: 'Аналитични бисквитки',
      analyticsDesc: 'Тези бисквитки ни помагат да разберем как посетителите използват сайта, като събират анонимна статистика.',
      analyticsNote: 'В момента не използваме аналитични услуги на трети страни. Ако в бъдеще добавим такива, ще актуализираме тази политика.',
      
      marketing: 'Маркетингови бисквитки',
      marketingDesc: 'Тези бисквитки се използват за показване на релевантни реклами и измерване на ефективността на рекламни кампании.',
      marketingNote: 'В момента не използваме маркетингови бисквитки. Ако в бъдеще добавим такива, ще поискаме вашето изрично съгласие.',
      
      manageTitle: 'Как да управлявате бисквитките?',
      manageText: 'Можете да управлявате вашите предпочитания за бисквитки по следните начини:',
      manageOptions: [
        'Чрез банера за бисквитки, който се появява при първото посещение',
        'Чрез изтриване на бисквитки от браузъра ви',
        'Чрез настройките на браузъра ви'
      ],
      
      browserSettings: 'Настройки на браузъра',
      browserSettingsText: 'Повечето браузъри ви позволяват да контролирате бисквитките чрез настройките си:',
      browsers: [
        { name: 'Chrome', url: 'https://support.google.com/chrome/answer/95647' },
        { name: 'Firefox', url: 'https://support.mozilla.org/bg/kb/cookies' },
        { name: 'Safari', url: 'https://support.apple.com/bg-bg/guide/safari/sfri11471/mac' },
        { name: 'Edge', url: 'https://support.microsoft.com/bg-bg/microsoft-edge' },
      ],
      
      thirdParty: 'Бисквитки на трети страни',
      thirdPartyText: 'Нашият сайт използва услуги на трети страни, които могат да поставят свои бисквитки:',
      thirdPartyServices: [
        { name: 'Stripe', purpose: 'Обработка на плащания', link: 'https://stripe.com/privacy' },
        { name: 'Cloudinary', purpose: 'Хостинг на изображения', link: 'https://cloudinary.com/privacy' },
      ],
      
      changes: 'Промени в политиката',
      changesText: 'Можем да актуализираме тази политика периодично. Препоръчваме ви да я преглеждате редовно. При съществени промени ще ви уведомим чрез банер на сайта.',
      
      contact: 'Свържете се с нас',
      contactText: 'Ако имате въпроси относно нашата политика за бисквитки, моля свържете се с нас:',
      contactEmail: 'contact@kostinparfums.com',
      
      relatedLinks: 'Свързани документи',
    },
    en: {
      title: 'COOKIE POLICY',
      subtitle: 'Last updated: June 2026',
      intro: 'This policy explains how KOSTIN uses cookies and similar technologies on our website.',
      
      whatAreCookies: 'What are cookies?',
      whatAreCookiesText: 'Cookies are small text files that are stored on your device (computer, tablet, or phone) when you visit a website. They allow the site to remember your actions and preferences over a period of time.',
      
      howWeUse: 'How do we use cookies?',
      howWeUseText: 'We use cookies for various purposes, including site functionality, traffic analysis, and improving user experience.',
      
      cookieTypes: 'Types of Cookies',
      
      essential: 'Essential Cookies',
      essentialDesc: 'These cookies are necessary for the website to function properly. Without them, certain features will not work.',
      essentialList: [
        { name: 'access_token', purpose: 'User authentication', duration: '7 days' },
        { name: 'refresh_token', purpose: 'Session renewal', duration: '7 days' },
        { name: 'cookie_consent', purpose: 'Storing cookie preferences', duration: 'Permanent' },
        { name: 'cart', purpose: 'Shopping cart storage', duration: 'Session' },
        { name: 'theme', purpose: 'Dark/light mode', duration: 'Permanent' },
        { name: 'language', purpose: 'Language preferences', duration: 'Permanent' },
      ],
      
      analytics: 'Analytics Cookies',
      analyticsDesc: 'These cookies help us understand how visitors use the site by collecting anonymous statistics.',
      analyticsNote: 'We currently do not use third-party analytics services. If we add any in the future, we will update this policy.',
      
      marketing: 'Marketing Cookies',
      marketingDesc: 'These cookies are used to display relevant ads and measure the effectiveness of advertising campaigns.',
      marketingNote: 'We currently do not use marketing cookies. If we add any in the future, we will request your explicit consent.',
      
      manageTitle: 'How to manage cookies?',
      manageText: 'You can manage your cookie preferences in the following ways:',
      manageOptions: [
        'Through the cookie banner that appears on your first visit',
        'By deleting cookies from your browser',
        'Through your browser settings'
      ],
      
      browserSettings: 'Browser Settings',
      browserSettingsText: 'Most browsers allow you to control cookies through their settings:',
      browsers: [
        { name: 'Chrome', url: 'https://support.google.com/chrome/answer/95647' },
        { name: 'Firefox', url: 'https://support.mozilla.org/en-US/kb/cookies' },
        { name: 'Safari', url: 'https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac' },
        { name: 'Edge', url: 'https://support.microsoft.com/en-us/microsoft-edge' },
      ],
      
      thirdParty: 'Third-Party Cookies',
      thirdPartyText: 'Our site uses third-party services that may set their own cookies:',
      thirdPartyServices: [
        { name: 'Stripe', purpose: 'Payment processing', link: 'https://stripe.com/privacy' },
        { name: 'Cloudinary', purpose: 'Image hosting', link: 'https://cloudinary.com/privacy' },
      ],
      
      changes: 'Changes to this Policy',
      changesText: 'We may update this policy periodically. We recommend reviewing it regularly. For significant changes, we will notify you via a banner on the site.',
      
      contact: 'Contact Us',
      contactText: 'If you have questions about our cookie policy, please contact us:',
      contactEmail: 'contact@kostinparfums.com',
      
      relatedLinks: 'Related Documents',
    }
  };

  const t = content[language] || content.bg;

  return (
    <div className="legal-page" data-testid="cookie-policy-page">
      <div className="container section-padding">
        <div className="legal-header">
          <Cookie size={40} className="legal-icon" />
          <h1 className="legal-title">{t.title}</h1>
          <p className="legal-subtitle">{t.subtitle}</p>
        </div>

        <div className="legal-content">
          <p className="legal-intro">{t.intro}</p>

          {/* What are cookies */}
          <section className="legal-section">
            <h2>{t.whatAreCookies}</h2>
            <p>{t.whatAreCookiesText}</p>
          </section>

          {/* How we use cookies */}
          <section className="legal-section">
            <h2>{t.howWeUse}</h2>
            <p>{t.howWeUseText}</p>
          </section>

          {/* Cookie Types */}
          <section className="legal-section">
            <h2>{t.cookieTypes}</h2>

            {/* Essential */}
            <div className="cookie-category">
              <div className="cookie-category-header">
                <Shield size={24} />
                <h3>{t.essential}</h3>
              </div>
              <p>{t.essentialDesc}</p>
              <table className="cookie-table">
                <thead>
                  <tr>
                    <th>{language === 'bg' ? 'Име' : 'Name'}</th>
                    <th>{language === 'bg' ? 'Цел' : 'Purpose'}</th>
                    <th>{language === 'bg' ? 'Срок' : 'Duration'}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.essentialList.map((cookie, idx) => (
                    <tr key={idx}>
                      <td><code>{cookie.name}</code></td>
                      <td>{cookie.purpose}</td>
                      <td>{cookie.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Analytics */}
            <div className="cookie-category">
              <div className="cookie-category-header">
                <BarChart3 size={24} />
                <h3>{t.analytics}</h3>
              </div>
              <p>{t.analyticsDesc}</p>
              <p className="cookie-note">{t.analyticsNote}</p>
            </div>

            {/* Marketing */}
            <div className="cookie-category">
              <div className="cookie-category-header">
                <Target size={24} />
                <h3>{t.marketing}</h3>
              </div>
              <p>{t.marketingDesc}</p>
              <p className="cookie-note">{t.marketingNote}</p>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="legal-section">
            <h2><Settings size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />{t.manageTitle}</h2>
            <p>{t.manageText}</p>
            <ul>
              {t.manageOptions.map((option, idx) => (
                <li key={idx}>{option}</li>
              ))}
            </ul>

            <h3>{t.browserSettings}</h3>
            <p>{t.browserSettingsText}</p>
            <ul className="browser-links">
              {t.browsers.map((browser, idx) => (
                <li key={idx}>
                  <a href={browser.url} target="_blank" rel="noopener noreferrer">
                    {browser.name} <ExternalLink size={14} />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Third-Party Cookies */}
          <section className="legal-section">
            <h2>{t.thirdParty}</h2>
            <p>{t.thirdPartyText}</p>
            <ul className="third-party-list">
              {t.thirdPartyServices.map((service, idx) => (
                <li key={idx}>
                  <strong>{service.name}</strong> - {service.purpose}
                  <a href={service.link} target="_blank" rel="noopener noreferrer">
                    {language === 'bg' ? 'Политика за поверителност' : 'Privacy Policy'} <ExternalLink size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Changes */}
          <section className="legal-section">
            <h2>{t.changes}</h2>
            <p>{t.changesText}</p>
          </section>

          {/* Contact */}
          <section className="legal-section">
            <h2>{t.contact}</h2>
            <p>{t.contactText}</p>
            <a href={`mailto:${t.contactEmail}`} className="contact-email">{t.contactEmail}</a>
          </section>

          {/* Related Links */}
          <section className="legal-section related-docs">
            <h2>{t.relatedLinks}</h2>
            <div className="related-links">
              <Link to="/privacy">{language === 'bg' ? 'Политика за поверителност' : 'Privacy Policy'}</Link>
              <Link to="/terms">{language === 'bg' ? 'Общи условия' : 'Terms of Service'}</Link>
              <Link to="/legal">{language === 'bg' ? 'Правна информация' : 'Legal Information'}</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
