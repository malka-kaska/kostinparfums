import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { t, lang } = useLanguage();

  const faqs = [
    { question: t('faqQ1'), answer: t('faqA1') },
    { question: t('faqQ2'), answer: t('faqA2') },
    { question: t('faqQ3'), answer: t('faqA3') },
    { question: t('faqQ4'), answer: t('faqA4') },
    { question: t('faqQ5'), answer: t('faqA5') },
    { question: t('faqQ6'), answer: t('faqA6') },
    { question: t('faqQ7'), answer: t('faqA7') },
    { question: t('faqQ8'), answer: t('faqA8') },
    { question: t('faqQ9'), answer: t('faqA9') },
    { question: t('faqQ10'), answer: t('faqA10') },
    { question: t('faqQ11'), answer: t('faqA11') },
    { question: t('faqQ12'), answer: t('faqA12') },
    { question: t('faqQ13'), answer: t('faqA13') },
    { question: t('faqQ14'), answer: t('faqA14') },
    { question: t('faqQ15'), answer: t('faqA15') },
    { question: t('faqQ16'), answer: t('faqA16') },
    { question: t('faqQ17'), answer: t('faqA17') },
    { question: t('faqQ18'), answer: t('faqA18') },
    { question: t('faqQ19'), answer: t('faqA19') },
    { question: t('faqQ20'), answer: t('faqA20') },
    { question: t('faqQ21'), answer: t('faqA21') },
    { question: t('faqQ22'), answer: t('faqA22') },
    { question: t('faqQ23'), answer: t('faqA23') },
    { question: t('faqQ24'), answer: t('faqA24') },
    { question: t('faqQ25'), answer: t('faqA25') },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // FAQPage structured data — enables Google Rich Snippets
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer }
    }))
  };

  // Inject page SEO meta
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
    document.title = lang === 'bg'
      ? 'Често задавани въпроси | KOSTIN парфюми'
      : 'Frequently Asked Questions | KOSTIN Perfumes';
    setMeta('name', 'description', lang === 'bg'
      ? '25 отговора за автентичността, доставката, връщането, съхранението и избора на луксозен парфюм в KOSTIN.'
      : '25 answers on authenticity, delivery, returns, storage, and choosing a luxury perfume at KOSTIN.');
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://kostinparfums.com/faq');
  }

  return (
    <div className="faq-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="container section-padding-small">
        <div className="page-header">
          <h1 className="section-title">{t('faqTitle')}</h1>
          <p className="page-subtitle">{t('faqSubtitle')}</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <ChevronDown 
                  size={20} 
                  className={`faq-icon ${openIndex === index ? 'rotated' : ''}`}
                />
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-contact">
          <h2 className="heading-3">{t('faqStillQuestions')}</h2>
          <p className="body-regular mt-2">
            {t('faqContact')}{' '}
            <a href="mailto:contact@kostin.com">contact@kostin.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
