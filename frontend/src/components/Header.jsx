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
    
    // Listen for storage events to update cart count
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
    <header className="header">
      <div className="container">
        <div className="header-content">
          <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              All Products
            </Link>
            <Link to="/products?category=perfumes" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Perfumes
            </Link>
            <Link to="/products?category=makeup" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Makeup
            </Link>
            <Link to="/products?category=skincare" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Skincare
            </Link>
            <Link to="/products?category=haircare" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Haircare
            </Link>
          </nav>

          <Link to="/" className="logo-link">
            <img src="/logo.png" alt="KOSTIN" className="logo-image" />
          </Link>

          <div className="header-utilities">
            <button 
              className="icon-button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            
            <Link to="/cart" className="icon-button cart-button">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            
            {currentUser ? (
              <div className="user-menu">
                <button className="icon-button" aria-label="User menu">
                  <User size={20} />
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
                <User size={20} />
              </Link>
            )}
            
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
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
  );
};

export default Header;