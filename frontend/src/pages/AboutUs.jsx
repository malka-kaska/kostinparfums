import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Heart, Check } from 'lucide-react';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <h1 className="about-title">ABOUT KOSTIN</h1>
          <p className="about-subtitle">Because true luxury begins with authenticity</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container section-padding">
        {/* Introduction */}
        <section className="about-intro">
          <p className="intro-text">
            KOSTIN is a premium online destination for authentic, branded cosmetics, luxury skincare, and original perfume products from globally recognized beauty brands.
          </p>
          <p className="intro-text">
            We are founded on one essential principle — <strong>uncompromising authenticity</strong>. In an industry where trust defines quality, KOSTIN is committed to offering only original beauty products sourced from established, world-renowned brands. Every skincare formula, cosmetic product, and fragrance available in our store reflects the highest standards of performance, elegance, and reliability.
          </p>
        </section>

        {/* Values */}
        <section className="about-values">
          <div className="value-card">
            <Shield className="value-icon" size={32} strokeWidth={1.5} />
            <h3>Authenticity</h3>
            <p>100% genuine products sourced directly from authorized distributors</p>
          </div>
          <div className="value-card">
            <Award className="value-icon" size={32} strokeWidth={1.5} />
            <h3>Quality</h3>
            <p>Only premium brands that meet our strict quality standards</p>
          </div>
          <div className="value-card">
            <Heart className="value-icon" size={32} strokeWidth={1.5} />
            <h3>Trust</h3>
            <p>Building lasting relationships through transparency and reliability</p>
          </div>
        </section>

        {/* Curated Portfolio */}
        <section className="about-section">
          <h2 className="section-heading">Our Curated Collection</h2>
          <p className="section-text">
            Our curated portfolio includes luxury beauty and skincare essentials designed for individuals who value certified quality, brand heritage, and premium self-care. From daily skincare routines to high-end fragrances and professional-grade cosmetics, KOSTIN ensures that every product you receive is 100% genuine and carefully selected.
          </p>
          <div className="features-list">
            <div className="feature-item">
              <Check size={20} />
              <span>Luxury skincare essentials</span>
            </div>
            <div className="feature-item">
              <Check size={20} />
              <span>High-end fragrances</span>
            </div>
            <div className="feature-item">
              <Check size={20} />
              <span>Professional-grade cosmetics</span>
            </div>
            <div className="feature-item">
              <Check size={20} />
              <span>Certified brand heritage</span>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="about-philosophy">
          <div className="philosophy-content">
            <h2 className="section-heading">Our Philosophy</h2>
            <p className="section-text">
              At KOSTIN, luxury is defined by <strong>trust, authenticity, and consistency</strong>. We believe that true confidence begins with using products that are not only effective, but also verified in origin and reputation.
            </p>
            <p className="section-text">
              By providing access to original, branded beauty products online, we aim to make premium self-care more accessible, secure, and convenient — without compromising on quality or authenticity.
            </p>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="about-mission">
          <div className="mission-box">
            <p className="mission-text">
              KOSTIN is more than an online beauty store.
            </p>
            <p className="mission-text highlight">
              It is a trusted source for luxury skincare, branded cosmetics, and original perfumes.
            </p>
            <p className="mission-tagline">
              Because true luxury begins with authenticity.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <h2>Discover Our Collection</h2>
          <p>Explore our curated selection of authentic luxury beauty products</p>
          <Link to="/products" className="btn-primary">
            Shop Now
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
