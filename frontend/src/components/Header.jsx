import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { getCart } from '../mock';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    updateCartCount();
    
    const handleCartUpdate = () => {
      updateCartCount();
    };
    
    window.addEventListener('storage', handleCartUpdate);
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const updateCartCount = () => {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
  };

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
          <p>FREE SHIPPING ON ORDERS OVER €100 | AUTHENTIC LUXURY COSMETICS</p>
        </div>
      </div>
      
      {/* Main Header */}
      <header className="header" data-testid="main-header">
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
                    <Link to="/profile" className="dropdown-link" data-testid="my-profile-link">My Profile</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="dropdown-link" data-testid="admin-panel-link">Admin Panel</Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-link" data-testid="logout-button">Logout</button>
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
          <Link to="/" className="logo-text-link" data-testid="logo-link">
            <h1 className="logo-text">KOSTIN</h1>
            <p className="logo-tagline">CURATED BEAUTY ESSENTIALS</p>
          </Link>

          {/* Navigation */}
          <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`} data-testid="nav-menu">
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
                data-testid="search-input"
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
