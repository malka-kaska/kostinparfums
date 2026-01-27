import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <img src="/logo.png" alt="KOSTIN" className="footer-logo" />
            <p className="footer-tagline">Curated beauty essentials</p>
            <p className="footer-description">
              Your destination for authentic luxury cosmetics and fragrances from the world's most prestigious brands.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <Mail size={16} />
                <span>contact@kostin.com</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>123 Luxury Ave, New York, NY 10001</span>
              </div>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Shop</h4>
            <ul className="footer-links">
              <li><Link to="/products?category=perfumes">Perfumes</Link></li>
              <li><Link to="/products?category=makeup">Makeup</Link></li>
              <li><Link to="/products?category=skincare">Skincare</Link></li>
              <li><Link to="/products?category=haircare">Haircare</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Information</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/shipping">Shipping & Returns</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Account</h4>
            <ul className="footer-links">
              <li><Link to="/auth">Sign In</Link></li>
              <li><Link to="/cart">Shopping Cart</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              <li><Link to="/orders">Order History</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} KOSTIN. All rights reserved.
          </p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="separator">|</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;