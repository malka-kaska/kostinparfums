import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { getCart, getCurrentUser, logout } from '../mock';
import './Header.css';

const Header = () => {
  const [cartCount, setCartCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updateCartCount();
    setCurrentUser(getCurrentUser());
    
    const handleStorageChange = () => {
      updateCartCount();
      setCurrentUser(getCurrentUser());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
    };
  }, []);

  const updateCartCount = () => {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <div className="container">
          <p>FREE SHIPPING ON ORDERS OVER €100 | AUTHENTIC LUXURY COSMETICS</p>
        </div>
      </div>
      
      {/* Main Header */}
      <header className="header">
        <div className="container">
          {/* Icons Row */}
          <div className="header-icons-row">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="header-icons">
              <button 
                className="icon-button"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <Search size={22} />
              </button>
              
              {currentUser ? (
                <div className="user-menu">
                  <button className="icon-button" aria-label="User menu">
                    <User size={22} />
                  </button>
                  <div className="user-dropdown">
                    <p className="user-name">{currentUser.name}</p>
                    {currentUser.role === 'admin' && (
                      <Link to="/admin" className="dropdown-link">Admin Panel</Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-link">Logout</button>
                  </div>
                </div>
              ) : (
                <Link to="/auth" className="icon-button">
                  <User size={22} />
                </Link>
              )}
              
              <Link to="/cart" className="icon-button cart-button">
                <ShoppingCart size={22} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>

          {/* Logo - Centered Above Navigation */}
          <Link to="/" className="logo-text-link">
            <h1 className="logo-text">KOSTIN</h1>
            <p className="logo-tagline">CURATED BEAUTY ESSENTIALS</p>
          </Link>

          {/* Navigation */}
          <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <Link to="/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              SHOP ALL
            </Link>
            <Link to="/products?category=perfumes" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              PERFUMES
            </Link>
            <Link to="/products?category=makeup" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              MAKEUP
            </Link>
            <Link to="/products?category=skincare" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              SKINCARE
            </Link>
            <Link to="/products?category=haircare" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              HAIRCARE
            </Link>
          </nav>
          
          {/* Search Bar */}
          {searchOpen && (
            <div className="search-bar fade-in">
              <input 
                type="text" 
                placeholder="Search products, brands..."
                className="search-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    navigate(`/products?search=${e.target.value}`);
                    setSearchOpen(false);
                  }
                }}
              />
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;