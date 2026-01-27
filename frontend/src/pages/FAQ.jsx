import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Are all your products authentic?",
      answer: "Yes, 100% of our products are authentic and sourced directly from authorized distributors and trusted suppliers. We guarantee the authenticity of every item we sell."
    },
    {
      question: "How long does shipping take?",
      answer: "Orders are typically processed within 1-2 business days. Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days. Free shipping is available on orders over $100."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 30 days of delivery for unopened products in their original packaging. The item must be unused and in the same condition that you received it. Please see our Shipping & Returns page for complete details."
    },
    {
      question: "Do you ship internationally?",
      answer: "Currently, we only ship within the United States. We are working on expanding our international shipping options in the near future."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order ships, you will receive a confirmation email with a tracking number. You can use this number to track your package on the carrier's website."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and Apple Pay. All transactions are secured with industry-standard encryption."
    },
    {
      question: "Can I cancel or modify my order?",
      answer: "Orders can be cancelled or modified within 24 hours of placement. Please contact us immediately at contact@kostin.com if you need to make changes to your order."
    },
    {
      question: "Do you offer gift wrapping?",
      answer: "Yes, we offer complimentary gift wrapping for all orders. Simply select the gift wrap option at checkout and include your personalized message."
    },
    {
      question: "How do I know which fragrance is right for me?",
      answer: "We offer sample sizes for many of our fragrances so you can try before committing to a full bottle. Check out our Samples section to explore different scents."
    },
    {
      question: "What if I receive a damaged or defective product?",
      answer: "If you receive a damaged or defective product, please contact us within 7 days of delivery with photos of the item. We will provide a full refund or replacement immediately."
    },
    {
      question: "Do you have a loyalty program?",
      answer: "Yes! Our loyalty program rewards customers with points on every purchase. Points can be redeemed for discounts on future orders. Sign up for an account to start earning rewards."
    },
    {
      question: "How should I store my cosmetics and fragrances?",
      answer: "Store your products in a cool, dry place away from direct sunlight. Fragrances should be kept in their original packaging to preserve their quality. Avoid storing products in bathrooms where humidity can affect their integrity."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="container section-padding-small">
        <div className="page-header">
          <h1 className="section-title">FREQUENTLY ASKED QUESTIONS</h1>
          <p className="page-subtitle">
            Find answers to common questions about our products, shipping, and policies.
          </p>
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
          <h2 className="heading-3">Still have questions?</h2>
          <p className="body-regular mt-2">
            Our customer service team is here to help. Contact us at{' '}
            <a href="mailto:contact@kostin.com">contact@kostin.com</a> or call{' '}
            <a href="tel:+15551234567">+1 (555) 123-4567</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;