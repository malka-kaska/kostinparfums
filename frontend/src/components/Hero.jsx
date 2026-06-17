import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Hero.css';

// 3 luxury perfume hero images
const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=80',
    alt: 'Luxury Perfume Collection'
  },
  {
    image: 'https://images.unsplash.com/photo-1615160460366-2c9a41771b51?w=1920&q=80',
    alt: 'Premium Fragrances'
  },
  {
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1920&q=80',
    alt: 'Exclusive Perfumes'
  }
];

const Hero = () => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero" data-testid="hero-section">
      {/* Slides */}
      <div className="hero-slides">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
            aria-hidden={index !== currentSlide}
          />
        ))}
      </div>

      {/* Overlay with content */}
      <div className="hero-overlay">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title" data-testid="hero-title">{t('heroTitle')}</h1>
            <p className="hero-subtitle">{t('heroSubtitle')}</p>
            <Link to="/products" className="hero-button" data-testid="hero-button">
              {t('heroButton')}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="hero-indicators">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            className={`hero-indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
