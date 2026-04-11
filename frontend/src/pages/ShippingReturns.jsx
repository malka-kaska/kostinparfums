import React from 'react';
import { Package, RefreshCw, Clock, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './ShippingReturns.css';

const ShippingReturns = () => {
  const { t } = useLanguage();

  return (
    <div className="shipping-page">
      <div className="container section-padding-small">
        <div className="page-header">
          <h1 className="section-title">{t('shippingTitle')}</h1>
          <p className="page-subtitle">{t('shippingSubtitle')}</p>
        </div>

        <section className="info-section">
          <div className="section-icon">
            <Package size={32} />
          </div>
          <h2 className="heading-2">{t('shippingInfoTitle')}</h2>
          
          <div className="info-content">
            <h3 className="info-subtitle">{t('processingTime')}</h3>
            <p>{t('processingTimeText')}</p>
            
            <h3 className="info-subtitle">{t('shippingOptions')}</h3>
            <div className="shipping-options">
              <div className="option-card">
                <Clock size={20} />
                <div>
                  <h4>{t('standardShipping')}</h4>
                  <p>{t('standardShippingPrice')}</p>
                </div>
              </div>
              <div className="option-card">
                <Package size={20} />
                <div>
                  <h4>{t('expressShipping')}</h4>
                  <p>{t('expressShippingPrice')}</p>
                </div>
              </div>
              <div className="option-card">
                <Shield size={20} />
                <div>
                  <h4>{t('freeShippingOption')}</h4>
                  <p>{t('freeShippingOptionDesc')}</p>
                </div>
              </div>
            </div>
            
            <h3 className="info-subtitle">{t('europeanShipping')}</h3>
            <p>{t('europeanShippingText')}</p>
            
            <h3 className="info-subtitle">{t('trackingTitle')}</h3>
            <p>{t('trackingText')}</p>
          </div>
        </section>

        <section className="info-section">
          <div className="section-icon">
            <RefreshCw size={32} />
          </div>
          <h2 className="heading-2">{t('returnsTitle')}</h2>
          
          <div className="info-content">
            <h3 className="info-subtitle">{t('returnWindow')}</h3>
            <p>{t('returnWindowText')}</p>
            
            <h3 className="info-subtitle">{t('returnProcess')}</h3>
            <ol className="process-list">
              <li>{t('returnStep1')}</li>
              <li>{t('returnStep2')}</li>
              <li>{t('returnStep3')}</li>
              <li>{t('returnStep4')}</li>
              <li>{t('returnStep5')}</li>
            </ol>
            
            <h3 className="info-subtitle">{t('nonReturnable')}</h3>
            <ul className="list-standard">
              <li>{t('nonReturn1')}</li>
              <li>{t('nonReturn2')}</li>
              <li>{t('nonReturn3')}</li>
              <li>{t('nonReturn4')}</li>
            </ul>
            
            <h3 className="info-subtitle">{t('exchanges')}</h3>
            <p>{t('exchangesText')}</p>
            
            <h3 className="info-subtitle">{t('damagedProducts')}</h3>
            <p>{t('damagedText')}</p>
            
            <h3 className="info-subtitle">{t('refundMethod')}</h3>
            <p>{t('refundText')}</p>
          </div>
        </section>

        <div className="contact-section">
          <h2 className="heading-3">{t('needHelp')}</h2>
          <p className="body-regular mt-2">
            {t('needHelpText')}
            <br />
            Email: <a href="mailto:contact@kostin.com">contact@kostin.com</a>
            <br />
            Phone: <a href="tel:+3201234567890">+32 (0) 123 456 789</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingReturns;
