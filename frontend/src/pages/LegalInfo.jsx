import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, FileText, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Legal.css';

const LegalInfo = () => {
  const { lang } = useLanguage();

  return (
    <div className="legal-page">
      <div className="container section-padding">
        <div className="legal-header">
          <h1 className="section-title">
            {lang === 'bg' ? 'ПРАВНА ИНФОРМАЦИЯ' : 'LEGAL INFORMATION'}
          </h1>
          <p className="legal-subtitle">
            {lang === 'bg' 
              ? 'Пълна информация за търговеца съгласно Закона за електронната търговия'
              : 'Complete merchant information pursuant to the E-Commerce Act'}
          </p>
        </div>

        <div className="legal-content">
          <section className="legal-section company-hero-section">
            <div className="company-logo-section">
              <h2 className="company-brand">KOSTIN</h2>
              <p className="company-tagline">
                {lang === 'bg' ? 'Селекция от луксозни аромати' : 'Selection of Luxury Fragrances'}
              </p>
            </div>
          </section>

          <section className="legal-section">
            <h2>
              <Building2 size={24} className="section-icon" />
              {lang === 'bg' ? 'Данни за търговеца' : 'Merchant Information'}
            </h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">{lang === 'bg' ? 'Наименование' : 'Company Name'}:</span>
                <span className="info-value">ГРИИН ПОТЕНШЪЛ ЕООД</span>
              </div>
              <div className="info-item">
                <span className="info-label">{lang === 'bg' ? 'Изписване на латиница' : 'Latin Name'}:</span>
                <span className="info-value">GREEN POTENTIAL LTD</span>
              </div>
              <div className="info-item">
                <span className="info-label">{lang === 'bg' ? 'Правна форма' : 'Legal Form'}:</span>
                <span className="info-value">
                  {lang === 'bg' 
                    ? 'Еднолично дружество с ограничена отговорност (ЕООД)'
                    : 'Single-member Limited Liability Company'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">{lang === 'bg' ? 'ЕИК' : 'Company Registration No.'}:</span>
                <span className="info-value highlight">208341137</span>
              </div>
              <div className="info-item">
                <span className="info-label">{lang === 'bg' ? 'Управител' : 'Manager'}:</span>
                <span className="info-value">Константин Валериев Кирчев</span>
              </div>
              <div className="info-item">
                <span className="info-label">{lang === 'bg' ? 'Едноличен собственик на капитала' : 'Sole Owner'}:</span>
                <span className="info-value">Константин Валериев Кирчев</span>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>
              <MapPin size={24} className="section-icon" />
              {lang === 'bg' ? 'Седалище и адрес на управление' : 'Registered Address'}
            </h2>
            <div className="address-block">
              <p><strong>{lang === 'bg' ? 'Държава' : 'Country'}:</strong> {lang === 'bg' ? 'България' : 'Bulgaria'}</p>
              <p><strong>{lang === 'bg' ? 'Област' : 'Region'}:</strong> {lang === 'bg' ? 'Плевен' : 'Pleven'}</p>
              <p><strong>{lang === 'bg' ? 'Община' : 'Municipality'}:</strong> {lang === 'bg' ? 'Плевен' : 'Pleven'}</p>
              <p><strong>{lang === 'bg' ? 'Населено място' : 'City'}:</strong> {lang === 'bg' ? 'гр. Плевен' : 'Pleven'}</p>
              <p><strong>{lang === 'bg' ? 'Пощенски код' : 'Postal Code'}:</strong> 5800</p>
              <p><strong>{lang === 'bg' ? 'Адрес' : 'Address'}:</strong> {lang === 'bg' ? 'бул. Чаталджа № 4, вх. А, ет. 4, ап. 10' : '4 Chataldzha Blvd., Entrance A, Floor 4, Apt. 10'}</p>
            </div>
          </section>

          <section className="legal-section">
            <h2>
              <Phone size={24} className="section-icon" />
              {lang === 'bg' ? 'Данни за контакт' : 'Contact Information'}
            </h2>
            <div className="contact-grid">
              <div className="contact-item-large">
                <Phone size={20} />
                <div>
                  <span className="contact-label">{lang === 'bg' ? 'Телефон' : 'Phone'}:</span>
                  <a href="tel:+359889567870">+359 889 567 870</a>
                </div>
              </div>
              <div className="contact-item-large">
                <Mail size={20} />
                <div>
                  <span className="contact-label">{lang === 'bg' ? 'Имейл' : 'Email'}:</span>
                  <a href="mailto:contact@kostinparfums.com">contact@kostinparfums.com</a>
                </div>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>
              <Scale size={24} className="section-icon" />
              {lang === 'bg' ? 'Предмет на дейност' : 'Business Activity'}
            </h2>
            <div className="activity-block">
              <p className="activity-main">
                <strong>{lang === 'bg' ? 'Основна дейност (КИД 47.75)' : 'Main Activity (NACE 47.75)'}:</strong><br />
                {lang === 'bg' 
                  ? 'Търговия на дребно с парфюмерийни и козметични стоки и тоалетни принадлежности'
                  : 'Retail trade in perfumery and cosmetic products and toilet articles'}
              </p>
              <p className="activity-full">
                <strong>{lang === 'bg' ? 'Пълен предмет на дейност' : 'Full Business Scope'}:</strong><br />
                {lang === 'bg'
                  ? 'Търговска дейност, покупка на стоки или други вещи с цел да ги продаде в първоначален, преработен или обработен вид, производство на стоки с цел продажба, комисионна, спедиционна, складова, лизингова дейност, търговско представителство и посредничество.'
                  : 'Commercial activity, purchase of goods or other items for resale in original, processed or modified form, production of goods for sale, commission, forwarding, warehousing, leasing activities, commercial representation and intermediation.'}
              </p>
            </div>
          </section>

          <section className="legal-section">
            <h2>
              <FileText size={24} className="section-icon" />
              {lang === 'bg' ? 'Правни документи' : 'Legal Documents'}
            </h2>
            <div className="legal-links-grid">
              <Link to="/terms" className="legal-link-card">
                <FileText size={24} />
                <span>{lang === 'bg' ? 'Общи условия' : 'Terms of Service'}</span>
              </Link>
              <Link to="/privacy" className="legal-link-card">
                <FileText size={24} />
                <span>{lang === 'bg' ? 'Политика за поверителност' : 'Privacy Policy'}</span>
              </Link>
              <Link to="/shipping" className="legal-link-card">
                <FileText size={24} />
                <span>{lang === 'bg' ? 'Доставка и връщане' : 'Shipping & Returns'}</span>
              </Link>
            </div>
          </section>

          <section className="legal-section registry-section">
            <p className="registry-note">
              {lang === 'bg'
                ? 'Дружеството е вписано в Търговския регистър и регистъра на юридическите лица с нестопанска цел към Агенцията по вписванията.'
                : 'The company is registered in the Commercial Register and the Register of Non-Profit Legal Entities at the Registry Agency.'}
            </p>
            <a 
              href="https://portal.registryagency.bg/CR/Reports/ActiveConditionTabResult?uic=208341137" 
              target="_blank" 
              rel="noopener noreferrer"
              className="registry-link"
            >
              {lang === 'bg' ? 'Проверка в Търговски регистър →' : 'Verify in Commercial Register →'}
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalInfo;
