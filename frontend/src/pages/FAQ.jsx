import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { t } = useLanguage();

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
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
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
