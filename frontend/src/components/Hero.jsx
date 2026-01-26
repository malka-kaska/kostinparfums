import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-large fade-in">
            Discover Luxury
            <br />
            in Every Detail
          </h1>
          <p className="body-large mt-4 fade-in" style={{ animationDelay: '0.2s' }}>
            Curated collection of the world's finest cosmetics and fragrances.
            <br />
            From iconic brands to exclusive discoveries.
          </p>
          <div className="hero-actions mt-5 fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/products" className="btn-primary">
              Explore Collection
            </Link>
            <Link to="/products?category=perfumes" className="btn-secondary">
              Shop Fragrances
              <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </Link>
          </div>
        </div>
        
        <div className="hero-stats fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="stat-item">
            <div className="stat-number">200+</div>
            <div className="stat-label">Luxury Products</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">40+</div>
            <div className="stat-label">Premium Brands</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Authentic Guarantee</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;