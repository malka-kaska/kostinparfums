import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import RecentlyViewed from '../components/RecentlyViewed';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, HelpCircle, ArrowRight, RefreshCw, ShoppingBag, Eye, Heart } from 'lucide-react';
import { pixelAddToCart } from '../utils/metaPixel';
import { toast } from 'sonner';
import './Home.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Fallback category images if admin hasn't uploaded custom ones
const DEFAULT_GENDER_IMAGES = {
  men: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
  women: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80',
};

const MOCK_SOMMELIER_PRODUCTS = [
  {
    id: 'xerjoff-erba-pura',
    name: 'Xerjoff Erba Pura',
    price: 323, // лв (165 EUR)
    image: 'https://res.cloudinary.com/dqce6cuho/image/upload/v1781801509/kostin_products/5yHsW8osXJ4XyhP1GPtYbUJ2dmW_qNFuLgnwGOa4ug8OgUsBMYi1fRCqbXpXM4W6jcooAlZDQRLi-Y_c9jtEjdqMwDP0dcd46ohZyAouF_TOAA3wf4rom3iU8MF_hnYyY9p2HEU9qvkE-vj03s3zpZrL56gltN6qCpmQ7g8XcmjpgGoKgMZbcRHeVmVosktt.jpg',
    accords: 'fruity',
    intensity: 'bold',
    destination: 'beach'
  },
  {
    id: 'pd-marly-delina',
    name: 'Parfums de Marly Delina',
    price: 464, // лв (237 EUR)
    image: 'https://res.cloudinary.com/dqce6cuho/image/upload/v1781801509/kostin_products/5yHsW8osXJ4XyhP1GPtYbUJ2dmW_qNFuLgnwGOa4ug8OgUsBMYi1fRCqbXpXM4W6jcooAlZDQRLi-Y_c9jtEjdqMwDP0dcd46ohZyAouF_TOAA3wf5bZpC9iU8MF_hnYyY9p2HEU9qvkE-vj03s3zpZrL56gltN6qCpmQ7g8XcmjpgGoKgMZbcRHeVmVosktt.jpg',
    accords: 'floral',
    intensity: 'soft',
    destination: 'sunset'
  },
  {
    id: 'creed-aventus',
    name: 'Creed Aventus',
    price: 489, // лв (250 EUR)
    image: 'https://res.cloudinary.com/dqce6cuho/image/upload/v1781801509/kostin_products/5yHsW8osXJ4XyhP1GPtYbUJ2dmW_qNFuLgnwGOa4ug8OgUsBMYi1fRCqbXpXM4W6jcooAlZDQRLi-Y_c9jtEjdqMwDP0dcd46ohZyAouF_TOAA3wf59f_6MiU8MF_hnYyY9p2HEU9qvkE-vj03s3zpZrL56gltN6qCpmQ7g8XcmjpgGoKgMZbcRHeVmVosktt.jpg',
    accords: 'aquatic',
    intensity: 'confident',
    destination: 'beach'
  },
  {
    id: 'xerjoff-naxos',
    name: 'Xerjoff Naxos',
    price: 291, // лв (149 EUR)
    image: 'https://res.cloudinary.com/dqce6cuho/image/upload/v1781801509/kostin_products/5yHsW8osXJ4XyhP1GPtYbUJ2dmW_qNFuLgnwGOa4ug8OgUsBMYi1fRCqbXpXM4W6jcooAlZDQRLi-Y_c9jtEjdqMwDP0dcd46ohZyAouF_TOAA3wf4scZJiU8MF_hnYyY9p2HEU9qvkE-vj03s3zpZrL56gltN6qCpmQ7g8XcmjpgGoKgMZbcRHeVmVosktt.jpg',
    accords: 'warm',
    intensity: 'bold',
    destination: 'sunset'
  }
];

const REEL_VIDEOS = [
  {
    id: 1,
    title: 'Xerjoff Erba Pura Unboxing',
    handle: '@luxury_scents_eu',
    views: '42.8K',
    likes: 1845,
    userLiked: false,
    poster: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80'
  },
  {
    id: 2,
    title: 'Unboxing Delina by Parfums de Marly',
    handle: '@sillage_queen',
    views: '112.5K',
    likes: 4912,
    userLiked: false,
    poster: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80'
  }
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const { t, lang } = useLanguage();

  // --- Quiz States ---
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({ destination: '', accords: '', intensity: '' });
  const [matchedProducts, setMatchedProducts] = useState([]);

  // --- Reels States ---
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [reels, setReels] = useState(REEL_VIDEOS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin-selected featured products (for "Best Sellers" section)
        const featuredRes = await fetch(`${API_URL}/api/homepage/featured-products`);
        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeaturedProducts(featuredData);
        }
        
        // Fetch real best sellers based on orders
        const bestSellersRes = await fetch(`${API_URL}/api/homepage/best-sellers?limit=8`);
        if (bestSellersRes.ok) {
          const bestSellersData = await bestSellersRes.json();
          setBestSellers(bestSellersData);
        }

        // Fetch homepage settings (campaign banner + gender images)
        const settingsRes = await fetch(`${API_URL}/api/homepage/settings`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setCampaignBanner(settingsData.campaign_banner || null);
          if (settingsData.gender_images) {
            setGenderImages({
              men: settingsData.gender_images.men || DEFAULT_GENDER_IMAGES.men,
              women: settingsData.gender_images.women || DEFAULT_GENDER_IMAGES.women,
            });
          }
        }
      } catch {
        setFeaturedProducts([]);
        setBestSellers([]);
      }
    };
    fetchData();
  }, []);

  // Auto-progress reels every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReelIndex((prev) => (prev + 1) % reels.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [reels.length]);

  // Use admin-selected featured products, or fall back to real best sellers
  const displayedBestSellers = featuredProducts.length > 0 ? featuredProducts : bestSellers;

  // --- Quiz Handlers ---
  const selectOption = (key, value) => {
    const newAnswers = { ...quizAnswers, [key]: value };
    setQuizAnswers(newAnswers);

    if (quizStep < 3) {
      setQuizStep(prev => prev + 1);
    } else {
      // Complete & filter products
      const matches = MOCK_SOMMELIER_PRODUCTS.filter(p => {
        return p.destination === newAnswers.destination || 
               p.accords === newAnswers.accords || 
               p.intensity === newAnswers.intensity;
      });
      setMatchedProducts(matches.length > 0 ? matches : MOCK_SOMMELIER_PRODUCTS.slice(0, 2));
      setQuizStep(4);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({ destination: '', accords: '', intensity: '' });
    setQuizStep(1);
    setMatchedProducts([]);
  };

  const handleQuickAdd = (product) => {
    pixelAddToCart(product, 1);
    toast.success(
      lang === 'bg'
        ? `${product.name} е добавен в количката!`
        : `${product.name} added to shopping cart!`,
      { icon: '🛒' }
    );
  };

  const toggleReelLike = (id) => {
    setReels(prev => prev.map(r => {
      if (r.id === id) {
        const liked = !r.userLiked;
        return {
          ...r,
          userLiked: liked,
          likes: liked ? r.likes + 1 : r.likes - 1
        };
      }
      return r;
    }));
  };

  return (
    <div className="home-page">
      <Hero />

      {/* Shop by Gender Section */}
      <section className="section-padding gender-section">
        <div className="container">
          <h2 className="section-title">{t('shopByCategory')}</h2>
          <div className="gender-grid" data-testid="gender-grid">
            <Link
              to="/products?gender=men"
              className="gender-card"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url(${genderImages.men})`,
              }}
            >
              <div className="gender-content">
                <h3 className="gender-name">{t('mensFragrances')}</h3>
                <span className="gender-cta">{t('shopNow') || 'Shop Now'}</span>
              </div>
            </Link>
            <Link
              to="/products?gender=women"
              className="gender-card"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), url(${genderImages.women})`,
              }}
            >
              <div className="gender-content">
                <h3 className="gender-name">{t('womensFragrances')}</h3>
                <span className="gender-cta">{t('shopNow') || 'Shop Now'}</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 🔮 HOOK 5: INTEGRATED AI SCENT SOMMELIER QUIZ */}
      <section className="section-padding home-quiz-section">
        <div className="container">
          <div className="quiz-glass-panel">
            <div className="quiz-heading">
              <Sparkles size={24} className="gold-sparkle-icon" />
              <h2>{lang === 'bg' ? 'Открийте Вашия Сигнатурен Аромат' : 'AI Scent Sommelier'}</h2>
              <p>{lang === 'bg' ? 'Оговорете на 3 бързи въпроса и намерете перфектния луксозен парфюм.' : 'Our sommelier matching algorithm pairs your vibes to luxury niche notes.'}</p>
            </div>

            {quizStep === 1 && (
              <div className="quiz-step-view fade-in">
                <span className="quiz-indicators">1 / 3 — {lang === 'bg' ? 'Дестинация' : 'Ideal Location'}</span>
                <h3>{lang === 'bg' ? 'Къде прекарвате перфектния си летен ден?' : 'Where would you spend your perfect summer afternoon?'}</h3>
                <div className="quiz-options-grid">
                  <button onClick={() => selectOption('destination', 'beach')}>🌊 {lang === 'bg' ? 'Лазурен плажен клуб' : 'Azure Beach Club'}</button>
                  <button onClick={() => selectOption('destination', 'sunset')}>🌇 {lang === 'bg' ? 'Тераса на покрива по залез' : 'Golden Sunset Terrace'}</button>
                </div>
              </div>
            )}

            {quizStep === 2 && (
              <div className="quiz-step-view fade-in">
                <span className="quiz-indicators">2 / 3 — {lang === 'bg' ? 'Нотен Акорд' : 'Olfactory Accords'}</span>
                <h3>{lang === 'bg' ? 'Каква ароматна аура предпочитате?' : 'Which scent aura matches your style today?'}</h3>
                <div className="quiz-options-grid">
                  <button onClick={() => selectOption('accords', 'fruity')}>🍓 {lang === 'bg' ? 'Свежа, сочна и плодова' : 'Sweet Fruits & Citrus Burst'}</button>
                  <button onClick={() => selectOption('accords', 'warm')}>🍯 {lang === 'bg' ? 'Топла, медена и тютюнева' : 'Warm Tobacco & Sweet Honey'}</button>
                  <button onClick={() => selectOption('accords', 'aquatic')}>🍍 {lang === 'bg' ? 'Екзотичен свеж ананас и дървесни нотки' : 'Smoky Pineapple & Dry Woods'}</button>
                </div>
              </div>
            )}

            {quizStep === 3 && (
              <div className="quiz-step-view fade-in">
                <span className="quiz-indicators">3 / 3 — {lang === 'bg' ? 'Интензивност' : 'Sillage Statement'}</span>
                <h3>{lang === 'bg' ? 'Как искате хората да реагират на парфюма ви?' : 'How bold of a statement do you want to project?'}</h3>
                <div className="quiz-options-grid">
                  <button onClick={() => selectOption('intensity', 'soft')}>🌸 {lang === 'bg' ? 'Стилен и нежен шлейф' : 'Soft, Elegant Sillage'}</button>
                  <button onClick={() => selectOption('intensity', 'bold')}>👑 {lang === 'bg' ? 'Мощен, хипнотизиращ и ярък' : 'Beastmode, Magnetic Scent Trail'}</button>
                </div>
              </div>
            )}

            {quizStep === 4 && (
              <div className="quiz-results-view fade-in">
                <h3>✨ {lang === 'bg' ? 'Вашите съвпадения от Сомелиера:' : 'Your Curated Niche Matches:'}</h3>
                <div className="sommelier-results-grid">
                  {matchedProducts.map((p) => (
                    <div key={p.id} className="quiz-product-result-card">
                      <img src={p.image} alt={p.name} />
                      <div className="result-card-info">
                        <h4>{p.name}</h4>
                        <span className="result-price">{p.price} лв</span>
                        <div className="result-action-row">
                          <button className="quiz-btn-add" onClick={() => handleQuickAdd(p)}>
                            <ShoppingBag size={14} /> {lang === 'bg' ? 'Добави в количката' : 'Quick Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="quiz-btn-retry" onClick={resetQuiz}>
                  <RefreshCw size={14} /> {lang === 'bg' ? 'Начни отначало' : 'Reset Sommelier'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recently Viewed Section - above Best Sellers */}
      <RecentlyViewed />

      {/* Best Sellers Section */}
      {displayedBestSellers.length > 0 && (
        <section className="section-padding-small">
          <div className="container">
            <h2 className="section-title">{t('bestSellers')}</h2>
            <div className="grid-product-showcase" data-testid="best-sellers-grid">
              {displayedBestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="section-cta">
              <Link to="/products" className="btn-secondary">
                {t('viewAllProducts')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 📹 HOOK 8: AUTOPLAY UGC REELS CAROUSEL */}
      <section className="section-padding home-reels-section">
        <div className="container">
          <div className="reels-intro">
            <h2>✨ {lang === 'bg' ? 'Клиенти обичат KOSTIN' : 'Real Reviews. Real Reactions.'}</h2>
            <p>{lang === 'bg' ? 'Гледайте реални ревюта и разопаковане от нашите почитатели.' : 'Browse unfiltered unboxing, sillage tests, and fragrance reviews.'}</p>
          </div>

          <div className="reels-mockup-wrapper">
            <div className="smartphone-body">
              <div className="smartphone-screen">
                <div className="reel-progress-track">
                  {reels.map((r, idx) => (
                    <div 
                      key={r.id} 
                      className={`progress-bar-segment ${idx === activeReelIndex ? 'active-bar' : ''}`}
                    />
                  ))}
                </div>

                <div 
                  className="reel-video-container"
                  style={{ backgroundImage: `url(${reels[activeReelIndex].poster})` }}
                >
                  <div className="reel-overlay-content">
                    <div className="reel-header-badge">
                      <span className="live-pill">LIVE</span>
                      <span className="views-stat"><Eye size={12} /> {reels[activeReelIndex].views}</span>
                    </div>

                    <div className="reel-footer-details">
                      <span className="reel-handle">{reels[activeReelIndex].handle}</span>
                      <h4>{reels[activeReelIndex].title}</h4>
                    </div>

                    {/* Social validation actions inside reels */}
                    <div className="reel-interaction-pane">
                      <button 
                        className={`reel-heart-btn ${reels[activeReelIndex].userLiked ? 'liked' : ''}`}
                        onClick={() => toggleReelLike(reels[activeReelIndex].id)}
                      >
                        <Heart size={20} fill={reels[activeReelIndex].userLiked ? '#e74c3c' : 'none'} />
                        <span>{reels[activeReelIndex].likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <h3>{t('trustAuthentic')}</h3>
              <p>{t('trustAuthenticDesc')}</p>
            </div>
            <div className="trust-item">
              <h3>{t('trustShipping')}</h3>
              <p>{t('trustShippingDesc')}</p>
            </div>
            <div className="trust-item">
              <h3>{t('trustPayments')}</h3>
              <p>{t('trustPaymentsDesc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
