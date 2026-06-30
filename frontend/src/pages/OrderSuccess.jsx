import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Heart, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './OrderSuccess.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const orderNumber = searchParams.get('order');
  const trackingNumber = searchParams.get('tracking');
  const total = searchParams.get('total');
  const isGuest = searchParams.get('guest') === 'true';

  useEffect(() => {
    // Fetch recommended products
    const fetchRecommended = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products?limit=4&sort=popularity`);
        const data = await response.json();
        setRelatedProducts(data.products || []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };
    
    fetchRecommended();
    
    // Clear cart
    try {
      localStorage.removeItem('kostin_cart');
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="order-success-page">
      <div className="container section-padding">
        <div className="success-container">
          {/* Success Header */}
          <div className="success-header">
            <div className="success-icon-wrapper">
              <CheckCircle className="success-icon" size={80} />
            </div>
            <h1 className="heading-1">
              {language === 'bg' ? 'Благодарим Ви!' : 'Thank You!'}
            </h1>
            <p className="success-subtitle">
              {language === 'bg' 
                ? 'Вашата поръчка е приета успешно' 
                : 'Your order has been placed successfully'}
            </p>
          </div>

          {/* Order Details Card */}
          <div className="order-details-card">
            <div className="order-info-row">
              <span className="order-label">
                {language === 'bg' ? 'Номер на поръчка' : 'Order Number'}
              </span>
              <span className="order-value order-number">{orderNumber}</span>
            </div>
            
            {total && (
              <div className="order-info-row">
                <span className="order-label">
                  {language === 'bg' ? 'Обща сума' : 'Total Amount'}
                </span>
                <span className="order-value">€{parseFloat(total).toFixed(2)}</span>
              </div>
            )}
            
            {trackingNumber && (
              <div className="order-info-row tracking-row">
                <span className="order-label">
                  <Truck size={18} />
                  {language === 'bg' ? 'Проследяване' : 'Tracking'}
                </span>
                <a 
                  href={`https://www.speedy.bg/bg/track-shipment?shipmentNumber=${trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tracking-link"
                >
                  {trackingNumber}
                </a>
              </div>
            )}
          </div>

          {/* What's Next Section */}
          <div className="whats-next-section">
            <h3>
              {language === 'bg' ? 'Какво следва?' : "What's Next?"}
            </h3>
            <ul className="next-steps">
              <li>
                {language === 'bg' 
                  ? 'Ще получите имейл с потвърждение на поръчката'
                  : "You'll receive an order confirmation email"}
              </li>
              <li>
                {language === 'bg'
                  ? 'Вашата пратка ще бъде изпратена в рамките на 1-2 работни дни'
                  : 'Your package will be shipped within 1-2 business days'}
              </li>
              <li>
                {language === 'bg'
                  ? 'Можете да проследите статуса в профила си'
                  : 'You can track the status in your profile'}
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            {user ? (
              <Link to="/profile" className="btn-primary">
                <Package size={18} />
                {language === 'bg' ? 'Към моите поръчки' : 'View My Orders'}
              </Link>
            ) : (
              <Link to="/auth" className="btn-primary">
                {language === 'bg' ? 'Създай акаунт' : 'Create Account'}
              </Link>
            )}
            <Link to="/products" className="btn-secondary">
              {language === 'bg' ? 'Продължи пазаруването' : 'Continue Shopping'}
            </Link>
          </div>

          {/* Recommended Products */}
          {relatedProducts.length > 0 && (
            <div className="recommended-section">
              <h3>
                <Heart size={20} />
                {language === 'bg' ? 'Може да Ви хареса' : 'You May Also Like'}
              </h3>
              <div className="recommended-grid">
                {relatedProducts.map(product => (
                  <Link 
                    to={`/product/${product.id}`} 
                    key={product.id}
                    className="recommended-product"
                  >
                    <div className="recommended-image">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="recommended-info">
                      <span className="recommended-brand">{product.brand}</span>
                      <span className="recommended-name">{product.name}</span>
                      <span className="recommended-price">€{product.price?.toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Guest Account Prompt */}
          {isGuest && !user && (
            <div className="guest-prompt">
              <h4>
                {language === 'bg' 
                  ? 'Създайте акаунт за по-лесно проследяване'
                  : 'Create an account for easier tracking'}
              </h4>
              <p>
                {language === 'bg'
                  ? 'С акаунт можете да проследявате поръчките си, да запазвате любими продукти и да получавате ексклузивни оферти.'
                  : 'With an account, you can track your orders, save favorite products, and receive exclusive offers.'}
              </p>
              <Link to="/auth" className="btn-primary">
                {language === 'bg' ? 'Създай акаунт' : 'Create Account'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
