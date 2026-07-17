import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useBrandBackground } from '../context/BrandBackgroundContext';
import SmartSearch from './SmartSearch';
import DynamicHeaderBackground from './DynamicHeaderBackground';
import './Header.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [navCollections, setNavCollections] = useState([]);
  const navigate = useNavigate();
  const { user, logout, getCartCount } = useAuth();
  const { lang, t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { hasActiveBackground, getTextColor } = useBrandBackground();
  
  const hasBrandBg = hasActiveBackground();
  const textColor = getTextColor();

  useEffect(() => {
    const updateCount = () => setCartCount(getCartCount());
    updateCount();
    window.addEventListener('cartUpdated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [getCartCount]);

  // Fetch navigation collections
  useEffect(() => {
    const fetchNavCollections = async () => {
      try {
        const res = await fetch(`${API_URL}/api/homepage/nav-collections`);
        if (res.ok) {
          const data = await res.json();
          const collections = data.collections || [];
          // If no collections from API, use default Dubai
          if (collections.length === 0) {
            setNavCollections([{
              slug: 'dubai',
              name: 'Dubai Fragrances',
              name_bg: 'Дубайски аромати',
              path: '/dubai-perfumes'
            }]);
          } else {
            setNavCollections(collections);
          }
        } else {
          // API error - use default
          setNavCollections([{
            slug: 'dubai',
            name: 'Dubai Fragrances',
            name_bg: 'Дубайски аромати',
            path: '/dubai-perfumes'
          }]);
        }
      } catch (err) {
        console.error('Failed to fetch nav collections:', err);
        // Fallback to default Dubai collection
        setNavCollections([{
          slug: 'dubai',
          name: 'Dubai Fragrances',
          name_bg: 'Дубайски аромати',
          path: '/dubai-perfumes'
        }]);
      }
    };
    fetchNavCollections();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <div className="container">
          <p>{t('announcement')}</p>
        </div>
      </div>
      
      {/* Main Header */}
      <header 
        className={`header ${hasBrandBg ? 'has-brand-bg' : ''} ${hasBrandBg && textColor ? `text-${textColor}` : ''}`} 
        data-testid="main-header"
      >
        {hasBrandBg && <DynamicHeaderBackground />}
        <div className="container">
          {/* Icons Row */}
          <div className="header-icons-row">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="header-icons">
              <button
                className="icon-button theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                data-testid="theme-toggle"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              <button
                className="icon-button lang-toggle"
                onClick={toggleLanguage}
                aria-label="Toggle language"
                data-testid="language-toggle"
                title={lang === 'en' ? 'Switch to Bulgarian' : 'Превключи на английски'}
              >
                <Globe size={18} />
                <span className="lang-label">{lang === 'en' ? 'BG' : 'EN'}</span>
              </button>

              <button 
                className="icon-button"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                data-testid="search-toggle"
              >
                <Search size={22} />
              </button>
              
              {user ? (
                <div className="user-menu">
                  <button className="icon-button" aria-label="User menu" data-testid="user-menu-button">
                    <User size={22} />
                  </button>
                  <div className="user-dropdown" data-testid="user-dropdown">
                    <p className="user-name">{user.name}</p>
                    <Link to="/profile" className="dropdown-link" data-testid="my-profile-link">{t('myProfile')}</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="dropdown-link" data-testid="admin-panel-link">{t('adminPanel')}</Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-link" data-testid="logout-button">{t('logout')}</button>
                  </div>
                </div>
              ) : (
                <Link to="/auth" className="icon-button" data-testid="login-link">
                  <User size={22} />
                </Link>
              )}
              
              <Link to="/cart" className="icon-button cart-button" data-testid="cart-link">
                <ShoppingCart size={22} />
                {cartCount > 0 && <span className="cart-badge" data-testid="cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>

          {/* Logo - Centered Above Navigation */}
          <Link to="/" className="logo-text-link" data-testid="logo-link" aria-label="KOSTIN - Homepage">
            <span className="logo-text">KOSTIN</span>
            <p className="logo-tagline">{t('curatedBeautyEssentials')}</p>
          </Link>

          {/* Navigation */}
          <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`} data-testid="nav-menu">
            <Link to="/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('shopAll')}
            </Link>
            <Link to="/products?category=perfumes&gender=women" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('womensFragrances')}
            </Link>
            <Link to="/products?category=perfumes&gender=men" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('mensFragrances')}
            </Link>
            {/* Dynamic navigation collections */}
            {navCollections.map(col => (
              <Link 
                key={col.slug} 
                to={col.path} 
                className="nav-link" 
                onClick={() => setMobileMenuOpen(false)}
              >
                {lang === 'bg' && col.name_bg ? col.name_bg : col.name}
              </Link>
            ))}
          </nav>
          
          {/* Smart Search Bar */}
          {searchOpen && (
            <div className="search-bar fade-in">
              <SmartSearch 
                isOpen={searchOpen} 
                onClose={() => setSearchOpen(false)} 
              />
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
