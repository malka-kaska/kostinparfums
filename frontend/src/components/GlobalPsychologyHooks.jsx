import React, { useState, useEffect } from 'react';
import { Gift, Zap, Bell, CheckCircle2, Clock, X, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { pixelDiscountApplied } from '../utils/metaPixel';
import './GlobalPsychologyHooks.css';

const REWARDS_TIERS = [
  { name: 'Xerjoff Erba Pura 2ml Sample', discount: '10% OFF', code: 'ERBAPURASUMMER10' },
  { name: 'Dior Sauvage Elixir 2ml Vial', discount: 'Free Express Shipping', code: 'SAUVAGETODAY' },
  { name: 'PD Marly Delina 1.5ml Decant', discount: '15% OFF', code: 'DELINALUXE' },
  { name: 'Creed Aventus Travel Spray', discount: 'Premium Gift Packaging', code: 'AVENTUSGOLD' }
];

export default function GlobalPsychologyHooks() {
  const { lang } = useLanguage();

  // 1. Variable Reward States
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isSpinning, setIsMysterySpinning] = useState(false);
  const [revealedReward, setRevealedReward] = useState(null);
  const [dopaminePoints, setDopaminePoints] = useState(() => {
    return parseInt(localStorage.getItem('kostin_dopamine_pts') || '0', 10);
  });
  const [unlockedCount, setUnlockedCount] = useState(() => {
    return JSON.parse(localStorage.getItem('kostin_unlocked_rewards') || '[]').length;
  });

  // 2. Scent Streak States
  const [showStreakPanel, setShowStreakPanel] = useState(false);
  const [streakCount, setStreakCount] = useState(() => {
    return parseInt(localStorage.getItem('kostin_scent_streak') || '5', 10);
  });
  const [streakClaimed, setStreakClaimed] = useState(() => {
    return localStorage.getItem('kostin_streak_claimed_today') === 'true';
  });

  const [streakDays, setStreakDays] = useState([
    { day: 1, name: 'Citrus Spark 🍋', claimed: true },
    { day: 2, name: 'Coastal Aquatic 🌊', claimed: true },
    { day: 3, name: 'Niche Amber 🪵', claimed: true },
    { day: 4, name: 'Royal Floral 🌸', claimed: true },
    { day: 5, name: 'Sweet Honey Naxos 🍯', claimed: true },
    { day: 6, name: 'Midnight Oud 🌙', claimed: false },
    { day: 7, name: 'Ultimate Gold Scent 🎁', claimed: false }
  ]);

  // Sync state to local storage on points change
  useEffect(() => {
    localStorage.setItem('kostin_dopamine_pts', dopaminePoints.toString());
  }, [dopaminePoints]);

  // Adjust Streak Day 6 check-in state on load
  useEffect(() => {
    if (streakClaimed) {
      setStreakDays(prev => prev.map(d => d.day === 6 ? { ...d, claimed: true } : d));
    }
  }, [streakClaimed]);

  // 3. FOMO Alerts Engine
  useEffect(() => {
    const names = ['Stefan', 'Mariela', 'Yordan', 'Dimitar', 'Petya', 'Krasimir', 'Raya', 'Gergana', 'Nikolay'];
    const cities = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Veliko Tarnovo'];
    const actions = [
      { en: 'purchased', bg: 'закупи' },
      { en: 'added to cart', bg: 'добави в количката' },
      { en: 'claimed free sample decant of', bg: 'взе безплатна мостра от' },
      { en: 'is currently viewing', bg: 'разглежда в момента' }
    ];
    const products = [
      'Xerjoff Erba Pura', 'Parfums de Marly Delina', 'Creed Aventus', 
      'Christian Dior Sauvage Elixir', 'Xerjoff Naxos', 'Tom Ford Black Orchid'
    ];

    const triggerFomoAlert = () => {
      const name = names[Math.floor(Math.random() * names.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const product = products[Math.floor(Math.random() * products.length)];

      const actionText = lang === 'bg' ? action.bg : action.en;
      const cityPrefix = lang === 'bg' ? 'от' : 'from';

      toast(`⚡ ${name} ${cityPrefix} ${city} ${actionText} ${product}!`, {
        position: 'bottom-right',
        style: {
          background: 'rgba(15, 23, 42, 0.96)',
          color: '#ffffff',
          border: '1px solid #e2a25d',
          boxShadow: '0 8px 30px rgba(226, 162, 93, 0.25)',
          backdropFilter: 'blur(10px)',
          fontFamily: "'Outfit', sans-serif"
        }
      });
    };

    // Trigger initial toast after 10s, then repeat every 18s
    const timer = setTimeout(triggerFomoAlert, 10000);
    const interval = setInterval(triggerFomoAlert, 18000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [lang]);

  // Variable Reward Spinner
  const spinGiftBox = () => {
    if (isSpinning) return;
    setIsMysterySpinning(true);
    setRevealedReward(null);

    setTimeout(() => {
      const selection = REWARDS_TIERS[Math.floor(Math.random() * REWARDS_TIERS.length)];
      setRevealedReward(selection);
      setIsMysterySpinning(false);

      // Save unlocked rewards
      const unlocked = JSON.parse(localStorage.getItem('kostin_unlocked_rewards') || '[]');
      if (!unlocked.some(c => c.code === selection.code)) {
        unlocked.push(selection);
        localStorage.setItem('kostin_unlocked_rewards', JSON.stringify(unlocked));
        setUnlockedCount(unlocked.length);
      }

      setDopaminePoints(prev => prev + Math.floor(Math.random() * 50) + 50);

      toast.success(
        lang === 'bg' 
          ? `Отключихте: ${selection.name}!` 
          : `You unlocked: ${selection.name}!`,
        { icon: '🎁' }
      );
    }, 1800);
  };

  const copyCode = (reward) => {
    navigator.clipboard.writeText(reward.code);
    toast.success(
      lang === 'bg'
        ? `Кодът ${reward.code} е копиран!`
        : `Promo code ${reward.code} copied!`,
      { icon: '📋' }
    );

    pixelDiscountApplied({
      code: reward.code,
      discountAmount: 15.00,
      cartTotal: 150.00
    });
  };

  // Streak Journey check-in
  const checkInToday = () => {
    if (streakClaimed) return;
    setStreakClaimed(true);
    localStorage.setItem('kostin_streak_claimed_today', 'true');
    
    const nextStreak = streakCount + 1;
    setStreakCount(nextStreak);
    localStorage.setItem('kostin_scent_streak', nextStreak.toString());

    setDopaminePoints(prev => prev + 150);
    setStreakDays(prev => prev.map(d => d.day === 6 ? { ...d, claimed: true } : d));

    toast.success(
      lang === 'bg'
        ? 'Успешно отбелязване за Ден 6! +150 точки!'
        : 'Day 6 Scent Streak claimed! +150 Points!',
      { icon: '🔥' }
    );
  };

  return (
    <>
      {/* Floating Interactive Dashboard Widget */}
      <div className="global-hooks-floating-dock">
        <button 
          className="dock-bubble streak-bubble" 
          onClick={() => setShowStreakPanel(true)}
          title={lang === 'bg' ? 'Серия от аромати' : 'Daily Scent Streak'}
        >
          <span className="dock-badge">🔥 {streakCount}</span>
        </button>

        <button 
          className="dock-bubble gift-bubble pulse-gift-bubble" 
          onClick={() => setShowGiftModal(true)}
          title={lang === 'bg' ? 'Мистериозен подарък' : 'Mystery Scent Box'}
        >
          <Gift size={20} />
          {unlockedCount > 0 && <span className="gift-count-dot">{unlockedCount}</span>}
        </button>
      </div>

      {/* 1. VARIABLE REWARD MYSTERY MODAL */}
      {showGiftModal && (
        <div className="hooks-modal-overlay">
          <div className="hooks-glass-modal fade-in">
            <button className="modal-close-btn" onClick={() => setShowGiftModal(false)}>
              <X size={18} />
            </button>

            <div className="modal-header-wrapper">
              <div className="modal-icon-badge">
                <Gift size={24} className="text-gold" />
              </div>
              <h3>{lang === 'bg' ? 'Лятна кутия на Допамина' : 'Summer Scent Dopamine Box'}</h3>
              <p className="modal-sub">
                {lang === 'bg' 
                  ? 'Изпробвайте късмета си за безплатна нишова мостра.' 
                  : 'Spin to unlock a randomized premium sample decant.'}
              </p>
            </div>

            <div className="modal-content-area">
              <div className="gift-shaker-zone">
                <button 
                  className={`interactive-gift-box ${isSpinning ? 'shake-animation' : ''}`}
                  onClick={spinGiftBox}
                  disabled={isSpinning}
                >
                  <span className="gift-emoji">🎁</span>
                </button>
              </div>

              {revealedReward && (
                <div className="unlocked-reward-card fade-in">
                  <h4>🎉 {lang === 'bg' ? 'Вие Отключихте!' : 'You Unlocked!'}</h4>
                  <h3>{revealedReward.name}</h3>
                  <span className="reward-discount-badge">{revealedReward.discount}</span>
                  
                  <div className="unlocked-code-row">
                    <code>{revealedReward.code}</code>
                    <button onClick={() => copyCode(revealedReward)}>
                      {lang === 'bg' ? 'Копирай' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              <div className="hooks-pts-row">
                <span>⭐ {lang === 'bg' ? 'Натрупан Допамин:' : 'Scent Dopamine:'} <strong>{dopaminePoints} pts</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SCENT STREAK SLIDE-OUT PANEL */}
      {showStreakPanel && (
        <div className="hooks-panel-overlay" onClick={() => setShowStreakPanel(false)}>
          <div className="hooks-slide-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header-row">
              <h3>🔥 {lang === 'bg' ? 'Вашата Ароматна Серия' : 'Your Scent Streak'}</h3>
              <button onClick={() => setShowStreakPanel(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="panel-body-content">
              <div className="streak-hero-stat">
                <div className="streak-big-val">{streakCount}</div>
                <p>{lang === 'bg' ? 'Дни последователна серия' : 'Days Active Scent Journey'}</p>
                <span>{lang === 'bg' ? 'Останете активни за Нишов Парфюм!' : 'Protect your streak to secure golden rewards.'}</span>
              </div>

              <div className="streak-days-track">
                {streakDays.map((d) => (
                  <div key={d.day} className={`streak-day-row ${d.claimed ? 'complete' : ''} ${d.day === 6 && !streakClaimed ? 'active' : ''}`}>
                    <div className="streak-day-indicators">
                      <div className="day-circle">
                        {d.claimed ? <CheckCircle2 size={14} /> : d.day}
                      </div>
                      <span className="day-label">{lang === 'bg' ? `Ден ${d.day}` : `Day ${d.day}`}</span>
                    </div>
                    <span className="day-scent-name">{d.name}</span>
                  </div>
                ))}
              </div>

              <button 
                className="btn-claim-streak-global"
                onClick={checkInToday}
                disabled={streakClaimed}
              >
                {streakClaimed 
                  ? (lang === 'bg' ? 'Днешното отбелязване е успешно!' : 'Checked in for today!') 
                  : (lang === 'bg' ? 'Отбележи днешния ден (Ден 6)' : 'Check In Today (Day 6)')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
