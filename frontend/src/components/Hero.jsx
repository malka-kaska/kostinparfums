import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-image-bg">
        <div className="hero-overlay">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">THE LUXURY COSMETICS DESTINATION</h1>
              <p className="hero-subtitle">Curated beauty essentials from the world's finest brands</p>
              <Link to="/products" className="hero-button">
                EXPLORE OUR COLLECTION
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;