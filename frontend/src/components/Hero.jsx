import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Hero.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Default hero slides (fallback)
const DEFAULT_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=80',
    alt: 'Luxury Perfume Collection'
  },
  {
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1920&q=80',
    alt: 'Bleu de Chanel'
  },
  {
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1920&q=80',
    alt: 'Exclusive Perfumes'
  }
];

const Hero = () => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState(DEFAULT_SLIDES);

  // Fetch hero slides from API
  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        const res = await fetch(`${API_URL}/api/homepage/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.hero_slides && data.hero_slides.length > 0) {
            setHeroSlides(data.hero_slides);
          }
        }
      } catch (err) {
        console.error('Failed to fetch hero slides:', err);
      }
    };
    fetchHeroSlides();
  }, []);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  return (
    <section className="hero" data-testid="hero-section">
      {/* Slides */}
      <div className="hero-slides">
        {heroSlides.map((slide, index) => (
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
        {heroSlides.map((_, index) => (
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
