import React from 'react';
import { Package, RefreshCw, Clock, Shield } from 'lucide-react';
import './ShippingReturns.css';

const ShippingReturns = () => {
  return (
    <div className="shipping-page">
      <div className="container section-padding-small">
        <div className="page-header">
          <h1 className="section-title">SHIPPING & RETURNS</h1>
          <p className="page-subtitle">
            We want you to love your purchase. Here's everything you need to know about our shipping and return policies.
          </p>
        </div>

        {/* Shipping Information */}
        <section className="info-section">
          <div className="section-icon">
            <Package size={32} />
          </div>
          <h2 className="heading-2">Shipping Information</h2>
          
          <div className="info-content">
            <h3 className="info-subtitle">Processing Time</h3>
            <p>Orders are processed within 1-2 business days (Monday-Friday, excluding holidays). You will receive a confirmation email with tracking information once your order ships.</p>
            
            <h3 className="info-subtitle">Shipping Options</h3>
            <div className="shipping-options">
              <div className="option-card">
                <Clock size={20} />
                <div>
                  <h4>Standard Shipping</h4>
                  <p>3-5 business days - €6.99</p>
                </div>
              </div>
              <div className="option-card">
                <Package size={20} />
                <div>
                  <h4>Express Shipping</h4>
                  <p>1-2 business days - €14.99</p>
                </div>
              </div>
              <div className="option-card">
                <Shield size={20} />
                <div>
                  <h4>Free Shipping</h4>
                  <p>On orders over €100</p>
                </div>
              </div>
            </div>
            
            <h3 className="info-subtitle">European Shipping</h3>
            <p>We currently ship to all countries within Europe. Delivery times may vary depending on your location. All prices are in Euros (€) and include VAT where applicable.</p>
            
            <h3 className="info-subtitle">Tracking Your Order</h3>
            <p>Once your order ships, you will receive a tracking number via email. You can track your package using this number on the carrier's website.</p>
          </div>
        </section>

        {/* Returns Policy */}
        <section className="info-section">
          <div className="section-icon">
            <RefreshCw size={32} />
          </div>
          <h2 className="heading-2">Returns Policy</h2>
          
          <div className="info-content">
            <h3 className="info-subtitle">30-Day Return Window</h3>
            <p>We accept returns within 30 days of delivery. Products must be unopened, unused, and in their original packaging with all tags and labels attached.</p>
            
            <h3 className="info-subtitle">Return Process</h3>
            <ol className="process-list">
              <li>Contact our customer service team at <a href="mailto:contact@kostin.com">contact@kostin.com</a> to initiate a return</li>
              <li>Receive your return authorization and prepaid shipping label</li>
              <li>Pack your items securely in the original packaging</li>
              <li>Attach the prepaid label and drop off at any authorized carrier location</li>
              <li>Receive your refund within 5-7 business days after we receive your return</li>
            </ol>
            
            <h3 className="info-subtitle">Non-Returnable Items</h3>
            <ul className="list-standard">
              <li>Opened or used cosmetics and fragrances (for hygiene reasons)</li>
              <li>Gift cards</li>
              <li>Sale or clearance items marked as final sale</li>
              <li>Products without original packaging or labels</li>
            </ul>
            
            <h3 className="info-subtitle">Exchanges</h3>
            <p>We currently do not offer direct exchanges. If you need a different product, please return the original item for a refund and place a new order.</p>
            
            <h3 className="info-subtitle">Damaged or Defective Products</h3>
            <p>If you receive a damaged or defective product, please contact us within 7 days of delivery with photos of the item and packaging. We will provide a full refund or replacement immediately at no additional cost.</p>
            
            <h3 className="info-subtitle">Refund Method</h3>
            <p>Refunds will be issued to your original payment method. Please allow 5-7 business days for the refund to appear in your account after we process your return.</p>
          </div>
        </section>

        {/* Contact Section */}
        <div className="contact-section">
          <h2 className="heading-3">Need Help?</h2>
          <p className="body-regular mt-2">
            Our customer service team is available Monday-Friday, 9AM-6PM CET.
            <br />
            Email: <a href="mailto:contact@kostin.com">contact@kostin.com</a>
            <br />
            Phone: <a href="tel:+15551234567">+1 (555) 123-4567</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingReturns;