import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sun, Flame, Sparkles, Award, Sliders, Eye, Play, Pause, 
  ArrowRight, Share2, Heart, Bell, ShoppingBag, TrendingUp, 
  Compass, Gift, RefreshCw, Check, CheckCircle2, Volume2, 
  VolumeX, Clock, ArrowUpRight, ShieldCheck, Zap, MessageSquare, Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  pixelAddToCart, 
  pixelDiscountApplied, 
  pixelViewContent, 
  pixelViewCategory 
} from '../utils/metaPixel';
import './SummerCampaign.css';

// 12 Shortlisted Products with rich details and premium summer mood imagery
const SUMMER_PRODUCTS = [
  {
    id: 'xerjoff-erba-pura',
    name: 'Xerjoff Erba Pura',
    brand: 'Xerjoff',
    price: 165.00,
    original_price: 195.00,
    category: 'Niche / Unisex',
    scent_profile: 'citrus',
    vibes: 'Citrusy, Fruit-cocktail, Vibrant Sweetness',
    stock: 3,
    likes: 382,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    description: 'A vibrant Mediterranean fruit-basket of sweet citrus, warm amber, and sensuous musk. The ultimate summer niche statement.',
    bg_gradient: 'linear-gradient(135deg, #FF9E7D 0%, #FF3D68 100%)'
  },
  {
    id: 'pdm-delina',
    name: 'Parfums de Marly Delina',
    brand: 'Parfums de Marly',
    price: 237.27,
    original_price: 265.00,
    category: 'Niche / Women',
    scent_profile: 'floral',
    vibes: 'Turkish Rose, Lychee, Soft Sweet Vanilla',
    stock: 4,
    likes: 512,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
    description: 'A premium floral bouquet dominated by Turkish rose, lily of the valley, peony, and creamy vanilla. Extremely viral and irresistible.',
    bg_gradient: 'linear-gradient(135deg, #FFB7D5 0%, #E26E9E 100%)'
  },
  {
    id: 'creed-aventus',
    name: 'Creed Aventus',
    brand: 'Creed',
    price: 180.00,
    original_price: 220.00,
    category: 'Niche / Men',
    scent_profile: 'fresh',
    vibes: 'Pineapple, Birchwood, Fresh Oakmoss',
    stock: 2,
    likes: 624,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
    description: 'The legendary masterpiece combining juicy pineapple, blackcurrant, smoky birch, and patchouli. Sophisticated and high-performing.',
    bg_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'dior-sauvage-elixir',
    name: 'Christian Dior Sauvage Elixir',
    brand: 'Christian Dior',
    price: 139.95,
    original_price: 165.00,
    category: 'Premium / Men',
    scent_profile: 'spicy',
    vibes: 'Lavender, Grapefruit, Deep Rich Spices',
    stock: 2,
    likes: 477,
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&q=80',
    description: 'An ultra-concentrated elixir featuring raw spices, lavender essence, and rich, ambery woods. Unprecedented sillage and high demand.',
    bg_gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
  },
  {
    id: 'xerjoff-naxos',
    name: 'Xerjoff Naxos',
    brand: 'Xerjoff',
    price: 149.00,
    original_price: 180.00,
    category: 'Niche / Unisex',
    scent_profile: 'sweet',
    vibes: 'Honey, Sweet Tobacco, Lavender & Vanilla',
    stock: 6,
    likes: 311,
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',
    description: 'A deep, sweet blend of honey, rich tobacco leaves, lavender, and sweet vanilla. Brings the warmth of Sicily straight to your skin.',
    bg_gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
  },
  {
    id: 'tf-black-orchid',
    name: 'Tom Ford Black Orchid Parfum',
    brand: 'Tom Ford',
    price: 159.99,
    original_price: 185.00,
    category: 'Premium / Women',
    scent_profile: 'woody',
    vibes: 'Black Truffle, Ylang-Ylang, Dark Gourmand Patchouli',
    stock: 5,
    likes: 298,
    image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80',
    description: 'A dark, sensual perfume featuring black orchids, heavy truffles, rum-soaked plums, and rich patchouli. Absolute dark-luxury appeal.',
    bg_gradient: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)'
  },
  {
    id: 'ysl-black-opium',
    name: 'YSL Black Opium',
    brand: 'YSL',
    price: 105.00,
    original_price: 125.00,
    category: 'Designer / Women',
    scent_profile: 'sweet',
    vibes: 'Black Coffee, Vanilla, Sweet Pear & Orange Blossom',
    stock: 8,
    likes: 419,
    image: 'https://images.unsplash.com/photo-1615655096345-61a54750068d?w=800&q=80',
    description: 'A seductive energy dose of black coffee, sweet vanilla, white florals, and pear. Designed for the bold and hypnotic summer night.',
    bg_gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
  },
  {
    id: 'montale-aoud-night',
    name: 'Montale Aoud Night',
    brand: 'Montale',
    price: 76.31,
    original_price: 95.00,
    category: 'Dubai / Men',
    scent_profile: 'oriental',
    vibes: 'Mysterious Oud, Leather, Warm Amber & Rose',
    stock: 7,
    likes: 188,
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&q=80',
    description: 'Deep, dense Malaysian Aoud blended with rich leather, patchouli, and warm amber. An exotic, high-potency entry into Dubai-style perfumery.',
    bg_gradient: 'linear-gradient(135deg, #373b44 0%, #4286f4 100%)'
  }
];

const LOCAL_TRANSLATIONS = {
  en: {
    heroTitle: 'KOSTIN Summer Scent Hub',
    heroSubtitle: 'The UX Psychology Behind Apps People Can\'t Stop Using',
    heroDesc: 'Explore our Summer Collection through the lens of the 8 powerful psychological hooks that drive human behavior. Interact with each demo to see how we build digital desire.',
    psychologyExplain: 'Psychology Insight',
    interactiveDemo: 'Interactive Demo',
    quickAdd: 'Quick Add to Cart',
    addedToCart: 'Added to cart!',
    fomoAlert: 'Live FOMO Alerts',
    fomoDesc: 'Toggle real-time shopping activity to simulate social momentum.',
    streakTitle: 'Your Summer Scent Journey Streak',
    streakDesc: 'Maintain your olfactory streak to unlock exclusive niche decants. Loss aversion at work.',
    streakBtn: 'Claim Today\'s Scent Check-in',
    aiSommelier: 'AI Scent Sommelier',
    aiDesc: 'Let our behavioral algorithm curate your personalized summer feed.',
    scarcityTitle: 'Summer Melt-Down Pricing',
    scarcityDesc: 'High demand triggers live inventory decay. Scarcity forces swift action.',
    socialProofTitle: 'Scent Love & Validation',
    socialProofDesc: 'Primal copying behavior: we desire what others validate.',
    autoplayTitle: 'Endless Scent Reels (Autoplay)',
    autoplayDesc: 'Eliminate stopping-friction. Seamless video transitions keep you immersed.'
  },
  bg: {
    heroTitle: 'KOSTIN Лятна Scent Платформа',
    heroSubtitle: 'UX Психологията зад приложенията, които не можем да спрем',
    heroDesc: 'Изследвайте нашата Лятна Колекция през призмата на 8-те мощни психологически куки, които движат човешкото поведение. Изпробвайте всяко демо.',
    psychologyExplain: 'Психологически Анализ',
    interactiveDemo: 'Интерактивно Демо',
    quickAdd: 'Бърза Поръчка',
    addedToCart: 'Добавено в количката!',
    fomoAlert: 'FOMO Известия на Живо',
    fomoDesc: 'Включете симулацията на реална активност на купувачи за социално увлечение.',
    streakTitle: 'Вашата Лятна Ароматна Серия (Streak)',
    streakDesc: 'Поддържайте ежедневния си прогрес, за да отключите нишови мостри. Страх от загуба на веригата.',
    streakBtn: 'Отбележи Днешния Ден',
    aiSommelier: 'AI Ароматен Сомелиер',
    aiDesc: 'Позволете на алгоритъма да персонализира Вашия фийд според Вашето настроение.',
    scarcityTitle: 'Лятно Топене на Цените & Наличностите',
    scarcityDesc: 'Високото търсене изчерпва бройките. Ограниченото количество ускорява избора.',
    socialProofTitle: 'Социално Доказателство & Валидация',
    socialProofDesc: 'Копиращ инстинкт: желаем това, което другите вече са харесали.',
    autoplayTitle: 'Безкрайни Ароматни Видеа (Autoplay)',
    autoplayDesc: 'Премахнете спирачките. Автоматичното пускане на видео държи вниманието ангажирано.'
  }
};

export function SummerCampaign() {
  const { lang } = useLanguage();
  const { addToCart } = useAuth();
  const text = LOCAL_TRANSLATIONS[lang] || LOCAL_TRANSLATIONS.en;

  // 1. Infinite Scroll States
  const [infiniteItems, setInfiniteItems] = useState(() => SUMMER_PRODUCTS.slice(0, 3));
  const [isInfiniteLoading, setInfiniteLoading] = useState(false);
  const infiniteSentinelRef = useRef(null);

  // 2. Variable Rewards States
  const [dopaminePoints, setDopaminePoints] = useState(0);
  const [rewardClaims, setRewardClaims] = useState(0);
  const [isMysterySpinning, setMysterySpinning] = useState(false);
  const [mysteryReward, setMysteryReward] = useState(null);
  const [revealedCodes, setRevealedCodes] = useState([]);

  // 3. Notifications & Badges States
  const [fomoEnabled, setFomoEnabled] = useState(true);
  const [floatingCartCount, setFloatingCartCount] = useState(0);
  const [pulsingBadge, setPulsingBadge] = useState(false);

  // 4. Streak States
  const [streakCount, setStreakCount] = useState(5);
  const [streakClaimed, setStreakClaimed] = useState(false);
  const [streakDays, setStreakDays] = useState([
    { day: 1, name: 'Citrus Spark 🍋', claimed: true },
    { day: 2, name: 'Coastal Aquatic 🌊', claimed: true },
    { day: 3, name: 'Niche Amber 🪵', claimed: true },
    { day: 4, name: 'Royal Floral 🌸', claimed: true },
    { day: 5, name: 'Sweet Honey Naxos 🍯', claimed: true },
    { day: 6, name: 'Midnight Oud 🌙', claimed: false },
    { day: 7, name: 'Ultimate Gold Scent 🎁', claimed: false }
  ]);

  // 5. Personalized Feed States
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizStyle] = useState({ setting: '', note: '', strength: '' });
  const [isAiMatching, setAiMatching] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState([]);

  // 6. Scarcity & Urgency States
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 32, seconds: 15 });
  const [liveStocks, setLiveStocks] = useState({
    'xerjoff-erba-pura': 3,
    'pdm-delina': 4,
    'creed-aventus': 2,
    'dior-sauvage-elixir': 2
  });

  // 7. Social Proof States
  const [likesState, setLikesState] = useState(
    SUMMER_PRODUCTS.reduce((acc, p) => ({ ...acc, [p.id]: p.likes }), {})
  );
  const [userLiked, setUserLiked] = useState({});

  // 8. Autoplay Reels States
  const [autoplayActive, setAutoplayActive] = useState(true);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [reelProgress, setReelProgress] = useState(0);

  const REEL_VIDEOS = [
    {
      id: 1,
      title: 'Unboxing Xerjoff Erba Pura Gold',
      productName: 'Erba Pura Gold',
      gradient: 'linear-gradient(45deg, #f39c12, #f1c40f)',
      tagline: 'Sunkissed luxury inside a velvet golden box.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
      creator: 'Elena_Reviews'
    },
    {
      id: 2,
      title: 'Dior Sauvage Elixir - Performance Test',
      productName: 'Sauvage Elixir',
      gradient: 'linear-gradient(45deg, #1e3c72, #2a5298)',
      tagline: 'One spray lasted 24+ hours on active beach days.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
      creator: 'Dimitar_Scent'
    },
    {
      id: 3,
      title: 'Parfums de Marly Delina Seductive Sillage',
      productName: 'Delina EDP',
      gradient: 'linear-gradient(45deg, #e26e9e, #ffb7d5)',
      tagline: 'The absolute lychee-rose dream for hot summer nights.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      creator: 'Niki_Olfactory'
    }
  ];

  // Global Cart Addition Handler (bridges to real state and Meta Pixel)
  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1);
      setFloatingCartCount(prev => prev + 1);
      setPulsingBadge(true);
      setTimeout(() => setPulsingBadge(false), 800);
      
      // Meta Pixel Addition Trigger
      pixelAddToCart(product, 1);
      toast.success(`${product.name} ${text.addedToCart}`, {
        icon: '🛍️',
        style: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #e2a25d'
        }
      });
    } catch (err) {
      toast.error('Could not add to cart.');
    }
  };

  // 1. Infinite Scroll Observer Effect
  useEffect(() => {
    const sentinel = infiniteSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isInfiniteLoading) {
        if (infiniteItems.length >= SUMMER_PRODUCTS.length) return; // All loaded
        setInfiniteLoading(true);
        setTimeout(() => {
          setInfiniteItems(prev => {
            const nextBatch = SUMMER_PRODUCTS.slice(prev.length, prev.length + 2);
            return [...prev, ...nextBatch];
          });
          setInfiniteLoading(false);
        }, 1200);
      }
    }, { threshold: 0.1 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [infiniteItems, isInfiniteLoading]);

  // 2. Mystery Box / Variable Rewards Spin Handler
  const spinMysteryBox = () => {
    if (isMysterySpinning) return;
    setMysterySpinning(true);
    setMysteryReward(null);

    // Unpredictability / variable payout dopamine sound & delay
    setTimeout(() => {
      const rewardsList = [
        { name: 'Xerjoff Erba Pura 2ml Sample', discount: '10% OFF', code: 'ERBAPURASUMMER10' },
        { name: 'Dior Sauvage Elixir 2ml Vial', discount: 'Free Express Shipping', code: 'SAUVAGETODAY' },
        { name: 'PD Marly Delina 1.5ml Decant', discount: '15% OFF', code: 'DELINALUXE' },
        { name: 'Creed Aventus Travel Spray', discount: 'Premium Gift Set Packaging', code: 'AVENTUSGOLD' }
      ];

      const selected = rewardsList[Math.floor(Math.random() * rewardsList.length)];
      setMysteryReward(selected);
      setDopaminePoints(prev => prev + Math.floor(Math.random() * 80) + 40);
      setRewardClaims(prev => prev + 1);
      setMysterySpinning(false);

      if (!revealedCodes.some(c => c.code === selected.code)) {
        setRevealedCodes(prev => [...prev, selected]);
      }

      toast.success(`You unlocked a mystery payout: ${selected.name}!`, {
        icon: '🎁'
      });
    }, 1800);
  };

  const claimDiscountCode = (reward) => {
    navigator.clipboard.writeText(reward.code);
    toast.success(`Discount Code ${reward.code} copied!`, { icon: '📋' });
    
    // Custom Meta Pixel Event
    pixelDiscountApplied({
      code: reward.code,
      discountAmount: 15.00,
      cartTotal: 150.00
    });
  };

  // 3. FOMO Alerts Engine Effect
  useEffect(() => {
    if (!fomoEnabled) return;

    const names = ['Vasil', 'Stefan', 'Desislava', 'Elena', 'Radostin', 'Gergana', 'Kaloyan', 'Maria'];
    const cities = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora'];
    const actions = ['purchased', 'added to cart', 'claimed free decant of', 'is viewing'];

    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const prod = SUMMER_PRODUCTS[Math.floor(Math.random() * SUMMER_PRODUCTS.length)];

      toast(`⚡ ${name} from ${city} ${action} ${prod.name}!`, {
        position: 'bottom-right',
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#fff',
          border: '1px solid #f39c12',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)'
        }
      });
    }, 9000);

    return () => clearInterval(interval);
  }, [fomoEnabled]);

  // 4. Scent Streak Journey Check-in
  const handleStreakCheckIn = () => {
    if (streakClaimed) return;
    setStreakClaimed(true);
    setStreakCount(prev => prev + 1);
    setDopaminePoints(prev => prev + 150);
    
    setStreakDays(prev => 
      prev.map(d => d.day === 6 ? { ...d, claimed: true } : d)
    );

    toast.success('Day 6 Check-in Claimed! Scent streak alive! +150 Scent Points', {
      icon: '🔥'
    });
  };

  // 5. AI Scent Quiz Selection
  const handleQuizAnswer = (field, value) => {
    setQuizStyle(prev => ({ ...prev, [field]: value }));
    setQuizStep(prev => prev + 1);
  };

  useEffect(() => {
    if (quizStep === 3) {
      setAiMatching(true);
      setTimeout(() => {
        // Simple matchmaking logic based on answers
        let filtered = [...SUMMER_PRODUCTS];
        if (quizAnswers.note) {
          filtered = filtered.filter(p => p.scent_profile === quizAnswers.note);
        }
        // Fallback to top rated if too strict
        if (filtered.length === 0) {
          filtered = SUMMER_PRODUCTS.slice(0, 3);
        } else {
          filtered = filtered.slice(0, 3);
        }
        setMatchedProducts(filtered);
        setAiMatching(false);

        // Pixel View Category dynamic hook
        pixelViewCategory(`personalized_${quizAnswers.note}`);
      }, 2000);
    }
  }, [quizStep, quizAnswers]);

  const resetScentQuiz = () => {
    setQuizStep(0);
    setQuizStyle({ setting: '', note: '', strength: '' });
    setMatchedProducts([]);
  };

  // 6. Countdown Timer Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 4, minutes: 32, seconds: 15 }; // Reset loop for endless urgency
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Live Stock Decrement Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStocks(prev => {
        const keys = Object.keys(prev);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const currentVal = prev[randomKey];
        if (currentVal > 1) {
          toast(`⚠️ Only ${currentVal - 1} bottles remaining of ${SUMMER_PRODUCTS.find(p => p.id === randomKey)?.name}!`, {
            icon: '🔥',
            position: 'top-right'
          });
          return { ...prev, [randomKey]: currentVal - 1 };
        }
        return prev;
      });
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  // 7. Interactive Like Social Proof
  const toggleLike = (productId) => {
    const liked = !!userLiked[productId];
    setUserLiked(prev => ({ ...prev, [productId]: !liked }));
    setLikesState(prev => ({
      ...prev,
      [productId]: liked ? prev[productId] - 1 : prev[productId] + 1
    }));

    if (!liked) {
      toast.success('Your vote has been added to social validation!', { icon: '❤️' });
    }
  };

  // 8. Autoplay Reels Progression
  useEffect(() => {
    if (!autoplayActive) return;

    const interval = setInterval(() => {
      setReelProgress(prev => {
        if (prev >= 100) {
          setCurrentReelIndex(curr => (curr + 1) % REEL_VIDEOS.length);
          return 0;
        }
        return prev + 1.67; // approx 6 seconds full fill
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoplayActive, currentReelIndex]);

  const handleNextReel = () => {
    setReelProgress(0);
    setCurrentReelIndex(curr => (curr + 1) % REEL_VIDEOS.length);
  };

  return (
    <div className="summer-campaign-container">
      {/* Premium Ambient Background */}
      <div className="campaign-ambient-bg" />

      {/* Floating Status Bar - Gaming Dopamine Feed */}
      <div className="campaign-floating-status">
        <div className="status-badge points">
          <Zap size={16} className="text-warning-glow" />
          <span>Scent Dopamine: <strong>{dopaminePoints} pts</strong></span>
        </div>
        <div className="status-badge rewards">
          <Gift size={16} />
          <span>Unlocked Perks: <strong>{revealedCodes.length}</strong></span>
        </div>
        <div className={`status-badge cart ${pulsingBadge ? 'pulse' : ''}`}>
          <ShoppingBag size={16} />
          <span>Summer Cart: <strong>{floatingCartCount} items</strong></span>
        </div>
      </div>

      {/* Beautiful Hero Section */}
      <section className="campaign-hero">
        <div className="container text-center">
          <div className="sun-pulse-aura">
            <Sun className="hero-sun-icon" />
          </div>
          <h1 className="hero-glow-title">{text.heroTitle}</h1>
          <p className="hero-subtitle">{text.heroSubtitle}</p>
          <div className="hero-desc-wrapper">
            <p className="hero-description">{text.heroDesc}</p>
          </div>
          <div className="hero-tag-container">
            <span className="hero-tag">✨ luxury</span>
            <span className="hero-tag">🔥 psychology</span>
            <span className="hero-tag">🏖️ summer 2026</span>
          </div>
        </div>
      </section>

      {/* 8 Psychological Hooks Interactive Playground Grid */}
      <div className="container playground-grid">

        {/* HOOK 1: INFINITE SCROLL */}
        <div className="playground-card" id="hook-infinite-scroll">
          <div className="card-header-bar">
            <div className="hook-num">1</div>
            <div>
              <h3>Infinite Scroll</h3>
              <p className="hook-subtitle">Endless feed — no natural stopping point</p>
            </div>
          </div>

          <div className="card-body">
            {/* Interactive Demo */}
            <div className="demo-box border-glow">
              <h4 className="demo-title"><TrendingUp size={16} /> Endless Scent Stream</h4>
              <p className="demo-instructions">Scroll within the box below to simulate infinite retail discovery.</p>
              
              <div className="scroll-stream-container">
                {infiniteItems.map((prod) => (
                  <div key={prod.id} className="stream-product-card" style={{ borderLeft: `4px solid ${prod.bg_gradient.split(' ')[2] || '#e2a25d'}` }}>
                    <img src={prod.image} alt={prod.name} className="stream-img" />
                    <div className="stream-details">
                      <span className="stream-brand">{prod.brand}</span>
                      <h5>{prod.name}</h5>
                      <p className="stream-desc">{prod.description}</p>
                      <div className="stream-footer">
                        <span className="stream-price">&euro;{prod.price.toFixed(2)}</span>
                        <button className="stream-add-btn" onClick={() => handleAddToCart(prod)}>
                          <ShoppingBag size={14} /> {text.quickAdd}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isInfiniteLoading && (
                  <div className="stream-loader">
                    <RefreshCw className="spin-icon" />
                    <span>Loading fresh summer vibes...</span>
                  </div>
                )}
                
                <div ref={infiniteSentinelRef} style={{ height: 10 }} />
              </div>
            </div>

            {/* Psychology Analysis */}
            <div className="psychology-box">
              <span className="psych-label"><Info size={14} /> {text.psychologyExplain}</span>
              <p>
                By removing page numbers and traditional pagination, we bypass natural cognitive boundaries.
                The brain experiences a continuous "information loop." We scroll because the next visual card promises a dopamine reward (novelty).
              </p>
            </div>
          </div>
        </div>

        {/* HOOK 2: VARIABLE REWARDS */}
        <div className="playground-card" id="hook-variable-rewards">
          <div className="card-header-bar">
            <div className="hook-num">2</div>
            <div>
              <h3>Variable Rewards</h3>
              <p className="hook-subtitle">Dopamine — unpredictable payout (slot-machine effect)</p>
            </div>
          </div>

          <div className="card-body">
            {/* Interactive Demo */}
            <div className="demo-box border-glow text-center">
              <h4 className="demo-title"><Gift size={16} /> Scent Dopamine Box</h4>
              <p className="demo-instructions">Click the mystery gold box to reveal an unpredictable summer reward.</p>

              <div className="mystery-box-wrapper">
                <button 
                  className={`mystery-gift-button ${isMysterySpinning ? 'spinning' : ''}`}
                  onClick={spinMysteryBox}
                  disabled={isMysterySpinning}
                >
                  <div className="gift-lid" />
                  <div className="gift-box" />
                  <span className="gift-icon">🎁</span>
                </button>
              </div>

              {mysteryReward && (
                <div className="reward-reveal-card fade-in">
                  <h4>🎉 You Unlocked!</h4>
                  <h3>{mysteryReward.name}</h3>
                  <div className="payout-badge">{mysteryReward.discount}</div>
                  <div className="discount-code-block">
                    <code>{mysteryReward.code}</code>
                    <button className="copy-code-btn" onClick={() => claimDiscountCode(mysteryReward)}>
                      Claim Code & Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="dopamine-score-bar">
                <span>Total Spins: <strong>{rewardClaims}</strong></span>
                <span className="glow-bullet">•</span>
                <span>Unlocked Codes: <strong>{revealedCodes.length}</strong></span>
              </div>
            </div>

            {/* Psychology Analysis */}
            <div className="psychology-box">
              <span className="psych-label"><Info size={14} /> {text.psychologyExplain}</span>
              <p>
                The anticipation of a reward activates more dopamine than the reward itself. 
                By providing random sample decants, gift packaging, and discount tiers instead of uniform pricing, 
                we keep user curiosity at an absolute maximum.
              </p>
            </div>
          </div>
        </div>

        {/* HOOK 3: NOTIFICATIONS & BADGES */}
        <div className="playground-card" id="hook-notifications-badges">
          <div className="card-header-bar">
            <div className="hook-num">3</div>
            <div>
              <h3>Notifications & Badges</h3>
              <p className="hook-subtitle">Red badges and real-time FOMO alerts</p>
            </div>
          </div>

          <div className="card-body">
            {/* Interactive Demo */}
            <div className="demo-box border-glow">
              <h4 className="demo-title"><Bell size={16} /> {text.fomoAlert}</h4>
              <p className="demo-instructions">{text.fomoDesc}</p>

              <div className="fomo-control-panel">
                <div className="fomo-switch-row">
                  <span>Enable Scent Live Feed alerts:</span>
                  <button 
                    className={`fomo-toggle-switch ${fomoEnabled ? 'active' : ''}`}
                    onClick={() => setFomoEnabled(!fomoEnabled)}
                  >
                    <span className="switch-knob" />
                  </button>
                </div>
                <div className="alert-status-indicator">
                  <span className={`status-dot ${fomoEnabled ? 'pulse' : ''}`} />
                  <span>{fomoEnabled ? 'Engine Active: sending live purchasing signals' : 'Engine Idle'}</span>
                </div>
              </div>

              {/* Red Badge Sandbox */}
              <div className="red-badge-sandbox text-center">
                <h5>Red Badge Attention Anchor:</h5>
                <div className="cart-badge-showcase">
                  <div className={`mock-header-cart-icon ${pulsingBadge ? 'wiggle' : ''}`}>
                    <ShoppingBag size={32} />
                    <span className="mock-cart-badge">3</span>
                  </div>
                </div>
                <p className="badge-caption">A glowing red number commands cognitive priority, driving urgent checkout actions.</p>
              </div>
            </div>

            {/* Psychology Analysis */}
            <div className="psychology-box">
              <span className="psych-label"><Info size={14} /> {text.psychologyExplain}</span>
              <p>
                Humans are highly responsive to environmental threats and alerts. 
                A red notification dot simulates an urgent indicator. Combined with live purchasing activity, 
                it signals high safety (social proof) and high demand (scarcity).
              </p>
            </div>
          </div>
        </div>

        {/* HOOK 4: STREAKS & DAILY REWARDS */}
        <div className="playground-card" id="hook-streaks-daily">
          <div className="card-header-bar">
            <div className="hook-num">4</div>
            <div>
              <h3>Streaks & Daily Rewards</h3>
              <p className="hook-subtitle">Loss aversion — fear of breaking the chain</p>
            </div>
          </div>

          <div className="card-body">
            {/* Interactive Demo */}
            <div className="demo-box border-glow">
              <h4 className="demo-title"><Award size={16} /> {text.streakTitle}</h4>
              <p className="demo-instructions">{text.streakDesc}</p>

              <div className="streak-stats-row">
                <div className="streak-stat">
                  <span className="stat-label">Your Scent Streak:</span>
                  <span className="stat-value text-gold-glow">{streakCount} Days</span>
                </div>
                <div className="streak-stat">
                  <span className="stat-label">Next Reward:</span>
                  <span className="stat-value text-gold-glow">Day 7 Golden Gift</span>
                </div>
              </div>

              <div className="streak-calendar-grid">
                {streakDays.map((day) => (
                  <div 
                    key={day.day} 
                    className={`streak-day-card ${day.claimed ? 'claimed' : ''} ${day.day === 6 && !streakClaimed ? 'current' : ''}`}
                  >
                    <span className="day-num">Day {day.day}</span>
                    <span className="day-name">{day.name}</span>
                    <div className="day-status-icon">
                      {day.claimed ? <CheckCircle2 size={16} className="text-success" /> : <Clock size={16} />}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="btn-streak-checkin shadow-gold-glow"
                onClick={handleStreakCheckIn}
                disabled={streakClaimed}
              >
                {streakClaimed ? 'Today\'s Check-in Complete!' : text.streakBtn}
              </button>
            </div>

            {/* Psychology Analysis */}
            <div className="psychology-box">
              <span className="psych-label"><Info size={14} /> {text.psychologyExplain}</span>
              <p>
                Loss Aversion (Kahneman & Tversky): Humans feel the pain of losing something twice as intensively as the pleasure of gaining it. 
                Once a user builds a 5-day "scent routine," they will return simply to protect their accumulated effort.
              </p>
            </div>
          </div>
        </div>

        {/* HOOK 5: PERSONALIZED FEED */}
        <div className="playground-card" id="hook-personalized-feed">
          <div className="card-header-bar">
            <div className="hook-num">5</div>
            <div>
              <h3>Personalized Feed</h3>
              <p className="hook-subtitle">Algorithm learns your olfactory signature</p>
            </div>
          </div>

          <div className="card-body">
            {/* Interactive Demo */}
            <div className="demo-box border-glow">
              <h4 className="demo-title"><Compass size={16} /> {text.aiSommelier}</h4>
              <p className="demo-instructions">{text.aiDesc}</p>

              {quizStep < 3 ? (
                <div className="scent-quiz-flow">
                  <div className="quiz-progress-track">
                    <div className="quiz-progress-bar" style={{ width: `${(quizStep / 3) * 100}%` }} />
                  </div>

                  {quizStep === 0 && (
                    <div className="quiz-step-panel fade-in">
                      <h5>1. Choose your ideal Summer Vibe:</h5>
                      <div className="quiz-options-list">
                        <button className="quiz-opt" onClick={() => handleQuizAnswer('setting', 'monaco')}>
                          🏖️ Sun-soaked Yacht Party in Monaco
                        </button>
                        <button className="quiz-opt" onClick={() => handleQuizAnswer('setting', 'capri')}>
                          🍋 Sunrise Terrace in Capri
                        </button>
                        <button className="quiz-opt" onClick={() => handleQuizAnswer('setting', 'riviera')}>
                          🌸 Sunset Walk on the French Riviera
                        </button>
                      </div>
                    </div>
                  )}

                  {quizStep === 1 && (
                    <div className="quiz-step-panel fade-in">
                      <h5>2. What scent family speaks to you?</h5>
                      <div className="quiz-options-list">
                        <button className="quiz-opt" onClick={() => handleQuizAnswer('note', 'citrus')}>
                          🍋 Vibrant Citrus & Med Fruits
                        </button>
                        <button className="quiz-opt" onClick={() => handleQuizAnswer('note', 'floral')}>
                          🌸 Romantic Lychee, Peony & Roses
                        </button>
                        <button className="quiz-opt" onClick={() => handleQuizAnswer('note', 'spicy')}>
                          🪵 Warm Amber, Tobacco & Spices
                        </button>
                      </div>
                    </div>
                  )}

                  {quizStep === 2 && (
                    <div className="quiz-step-panel fade-in">
                      <h5>3. Desired Sillage presence (Strength):</h5>
                      <div className="quiz-options-list">
                        <button className="quiz-opt" onClick={() => handleQuizAnswer('strength', 'subtle')}>
                          ✨ Subtle, romantic skin-scent
                        </button>
                        <button className="quiz-opt" onClick={() => handleQuizAnswer('strength', 'beast')}>
                          ⚡ Magnetic, room-filling Elixir projection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isAiMatching ? (
                <div className="ai-calculating-box text-center">
                  <RefreshCw className="spin-icon ai-spin text-gold-glow" size={48} />
                  <h5>Calibrating Scent Profiles...</h5>
                  <p>Our algorithm is aligning your notes with the summer collection.</p>
                </div>
              ) : (
                <div className="personalized-results-box fade-in">
                  <div className="results-header">
                    <h4>✨ Your Personalized Selection</h4>
                    <button className="btn-reset-quiz" onClick={resetScentQuiz}>
                      <RefreshCw size={12} /> Retake Quiz
                    </button>
                  </div>

                  <div className="matched-grid">
                    {matchedProducts.map(p => (
                      <div key={p.id} className="matched-product-card">
                        <img src={p.image} alt={p.name} />
                        <div className="matched-info">
                          <h5>{p.name}</h5>
                          <span className="matched-tag">{p.vibes}</span>
                          <div className="matched-footer">
                            <span className="matched-price">&euro;{p.price.toFixed(2)}</span>
                            <button className="btn-matched-add" onClick={() => handleAddToCart(p)}>
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Psychology Analysis */}
            <div className="psychology-box">
              <span className="psych-label"><Info size={14} /> {text.psychologyExplain}</span>
              <p>
                Personalization creates high relevance and ownership. 
                Users feel the selection is uniquely theirs, reducing purchasing friction by 60%. 
                It leverages "Egoic Fit" — we prioritize products that mirror our self-identity.
              </p>
            </div>
          </div>
        </div>

        {/* HOOK 6: SCARCITY & URGENCY */}
        <div className="playground-card" id="hook-scarcity-urgency">
          <div className="card-header-bar">
            <div className="hook-num">6</div>
            <div>
              <h3>Scarcity & Urgency</h3>
              <p className="hook-subtitle">Countdown timers & dwindling stock (FOMO)</p>
            </div>
          </div>

          <div className="card-body">
            {/* Interactive Demo */}
            <div className="demo-box border-glow">
              <h4 className="demo-title"><Clock size={16} /> {text.scarcityTitle}</h4>
              <p className="demo-instructions">{text.scarcityDesc}</p>

              {/* Dynamic Countdown */}
              <div className="ticking-countdown-timer">
                <div className="time-block">
                  <span className="time-val">{String(countdown.hours).padStart(2, '0')}</span>
                  <span className="time-lbl">Hours</span>
                </div>
                <span className="time-colon">:</span>
                <div className="time-block">
                  <span className="time-val">{String(countdown.minutes).padStart(2, '0')}</span>
                  <span className="time-lbl">Mins</span>
                </div>
                <span className="time-colon">:</span>
                <div className="time-block">
                  <span className="time-val">{String(countdown.seconds).padStart(2, '0')}</span>
                  <span className="time-lbl">Secs</span>
                </div>
              </div>

              {/* Stock Depletion Indicators */}
              <div className="stock-depletion-list">
                {Object.entries(liveStocks).map(([id, stock]) => {
                  const prod = SUMMER_PRODUCTS.find(p => p.id === id);
                  if (!prod) return null;
                  const percentClaimed = 100 - (stock * 12);
                  const isLow = stock <= 2;

                  return (
                    <div key={id} className="stock-row">
                      <div className="stock-row-info">
                        <strong>{prod.name}</strong>
                        <span className={`stock-badge ${isLow ? 'low' : ''}`}>
                          {stock} bottles left!
                        </span>
                      </div>
                      <div className="stock-progress-track">
                        <div 
                          className={`stock-progress-bar ${isLow ? 'danger-glow' : ''}`}
                          style={{ width: `${percentClaimed}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Psychology Analysis */}
            <div className="psychology-box">
              <span className="psych-label"><Info size={14} /> {text.psychologyExplain}</span>
              <p>
                Urgency (ticking clock) forces heuristic decision-making, bypassing critical buying friction. 
                Scarcity (stock count) triggers loss aversion: we assign a higher value to items that we fear will become unavailable.
              </p>
            </div>
          </div>
        </div>

        {/* HOOK 7: SOCIAL PROOF */}
        <div className="playground-card" id="hook-social-proof">
          <div className="card-header-bar">
            <div className="hook-num">7</div>
            <div>
              <h3>Social Proof</h3>
              <p className="hook-subtitle">Likes & validation as a purchasing shortcut</p>
            </div>
          </div>

          <div className="card-body">
            {/* Interactive Demo */}
            <div className="demo-box border-glow">
              <h4 className="demo-title"><Heart size={16} /> {text.socialProofTitle}</h4>
              <p className="demo-instructions">{text.socialProofDesc}</p>

              <div className="social-proof-stream">
                {SUMMER_PRODUCTS.slice(0, 3).map((prod) => {
                  const liked = !!userLiked[prod.id];
                  return (
                    <div key={prod.id} className="proof-card">
                      <div className="proof-header">
                        <img src={prod.image} alt={prod.name} className="proof-avatar" />
                        <div>
                          <strong>Verified Buyer Scent Review</strong>
                          <div className="stars-row">⭐⭐⭐⭐⭐</div>
                        </div>
                      </div>
                      <p className="proof-text">
                        "The absolute best fragrance for hot summer days. I have been asked three times today what scent I am wearing. {prod.name} is stunning!"
                      </p>
                      <div className="proof-footer">
                        <button 
                          className={`btn-proof-like ${liked ? 'liked' : ''}`}
                          onClick={() => toggleLike(prod.id)}
                        >
                          <Heart size={14} fill={liked ? '#e74c3c' : 'none'} />
                          <span>{likesState[prod.id]} Love Votes</span>
                        </button>
                        <span className="proof-time">Verified purchase</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Psychology Analysis */}
            <div className="psychology-box">
              <span className="psych-label"><Info size={14} /> {text.psychologyExplain}</span>
              <p>
                Informational Social Influence (Sherif): When a buyer is evaluating a premium purchase like a perfume, 
                they look to others to define "correct" behavior. Seeing hundreds of likes and verified reviews provides a safe shortcut to trust.
              </p>
            </div>
          </div>
        </div>

        {/* HOOK 8: AUTOPLAY */}
        <div className="playground-card" id="hook-autoplay">
          <div className="card-header-bar">
            <div className="hook-num">8</div>
            <div>
              <h3>Autoplay</h3>
              <p className="hook-subtitle">Seamless next — eliminate decision points</p>
            </div>
          </div>

          <div className="card-body">
            {/* Interactive Demo */}
            <div className="demo-box border-glow">
              <h4 className="demo-title"><Play size={16} /> {text.autoplayTitle}</h4>
              <p className="demo-instructions">{text.autoplayDesc}</p>

              {/* Phone Frame Simulator */}
              <div className="mock-phone-wrapper">
                <div className="phone-screen-container">
                  
                  {/* Reel Player Screen */}
                  <div className="reel-player-box" style={{ background: REEL_VIDEOS[currentReelIndex].gradient }}>
                    <div className="reel-video-overlay">
                      <div className="reel-top-row">
                        <div className="creator-profile">
                          <img src={REEL_VIDEOS[currentReelIndex].avatar} alt="Creator" />
                          <span>@{REEL_VIDEOS[currentReelIndex].creator}</span>
                        </div>
                        <div className="live-pill">LIVE</div>
                      </div>

                      <div className="reel-mid-row text-center">
                        <Sparkles className="unboxing-sparkle-icon animate-pulse" size={48} />
                        <h4>{REEL_VIDEOS[currentReelIndex].title}</h4>
                        <p>{REEL_VIDEOS[currentReelIndex].tagline}</p>
                      </div>

                      <div className="reel-bottom-row">
                        <div className="reel-text-info">
                          <strong className="product-match-tag">🔥 Summer Hit: {REEL_VIDEOS[currentReelIndex].productName}</strong>
                        </div>
                        <button 
                          className="btn-reel-shop"
                          onClick={() => {
                            const productObj = SUMMER_PRODUCTS.find(p => p.name.includes(REEL_VIDEOS[currentReelIndex].productName)) || SUMMER_PRODUCTS[0];
                            handleAddToCart(productObj);
                          }}
                        >
                          Shop Now
                        </button>
                      </div>

                      {/* Reel Progress Bar */}
                      <div className="reel-progress-track">
                        <div className="reel-progress-fill" style={{ width: `${reelProgress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="phone-controls-row">
                    <button className="control-btn" onClick={() => setAutoplayActive(!autoplayActive)}>
                      {autoplayActive ? <Pause size={14} /> : <Play size={14} />}
                      <span>{autoplayActive ? 'Autoplay On' : 'Paused'}</span>
                    </button>
                    <button className="control-btn" onClick={handleNextReel}>
                      <ArrowRight size={14} />
                      <span>Next Clip</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Psychology Analysis */}
            <div className="psychology-box">
              <span className="psych-label"><Info size={14} /> {text.psychologyExplain}</span>
              <p>
                Click friction is the largest barrier to user engagement. 
                By automatically loading and transitioning to the next luxury video, 
                we create an effortless viewing loop that completely eliminates decision boundaries, driving higher product exposure.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Trust Badges Footer */}
      <footer className="summer-campaign-footer text-center">
        <div className="container">
          <div className="footer-trust-wrapper">
            <div className="trust-col">
              <ShieldCheck size={32} className="text-gold-glow" />
              <h4>100% Original Products</h4>
              <p>Direct from authorized European distributors only.</p>
            </div>
            <div className="trust-col border-left-right">
              <Zap size={32} className="text-gold-glow" />
              <h4>Express BG Delivery</h4>
              <p>Arrives to your doorstep in 1-2 working days.</p>
            </div>
            <div className="trust-col">
              <MessageSquare size={32} className="text-gold-glow" />
              <h4>Premium Experience</h4>
              <p>Free sample decants and luxury packaging with every order.</p>
            </div>
          </div>
          <p className="copyright-tag">© 2026 kostinparfums.com • High-End Niche Fragrance Retailer</p>
        </div>
      </footer>
    </div>
  );
}

export default SummerCampaign;
