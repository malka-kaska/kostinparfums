import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { trackRemoveFromCart } from '../utils/analytics';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, getCartItems, getCartTotal, updateCartItem, removeCartItem, clearCartAll } = useAuth();

  const loadCart = useCallback(() => {
    setCart(getCartItems());
    setTotal(getCartTotal());
  }, [getCartItems, getCartTotal]);

  useEffect(() => {
    loadCart();
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [loadCart]);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(productId, newQuantity);
    loadCart();
  };

  const handleRemoveItem = async (productId) => {
    // GA4: Track remove_from_cart with the line being removed (before state changes)
    const removed = cart.find(item => item.id === productId);
    if (removed) trackRemoveFromCart(removed, removed.quantity || 1);
    await removeCartItem(productId);
    loadCart();
  };

  const handleClearCart = async () => {
    if (window.confirm(t('clearCartConfirm'))) {
      await clearCartAll();
      loadCart();
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container section-padding">
          <div className="empty-cart">
            <ShoppingBag size={64} strokeWidth={1} />
            <h2 className="heading-2 mt-4">{t('cartEmpty')}</h2>
            <p className="body-regular mt-3" style={{ color: 'var(--text-secondary)' }}>
              {t('cartEmptyDesc')}
            </p>
            <Link to="/products" className="btn-primary mt-5" data-testid="start-shopping-btn">
              {t('startShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container section-padding-small">
        <div className="cart-header">
          <h1 className="heading-1" data-testid="cart-heading">{t('shoppingCart')}</h1>
          <button className="clear-cart-button" onClick={handleClearCart} data-testid="clear-cart-btn">
            {t('clearCartBtn')}
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item" data-testid={`cart-item-${item.id}`}>
                <Link to={`/product/${item.id}`} className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </Link>
                
                <div className="cart-item-details">
                  <Link to={`/product/${item.id}`} className="cart-item-name">
                    <p className="cart-item-brand">{item.brand}</p>
                    <h3>{item.name}</h3>
                  </Link>
                  <p className="cart-item-price">
                    <span className="price-eur">&euro;{item.price.toFixed(2)}</span>
                    <span className="price-bgn">{(item.price * 1.95583).toFixed(2)} лв.</span>
                  </p>
                </div>

                <div className="cart-item-actions">
                  <div className="cart-quantity-selector">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="cart-quantity-button"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="cart-quantity-value">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="cart-quantity-button"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <p className="cart-item-subtotal">
                    <span className="subtotal-eur">&euro;{(item.price * item.quantity).toFixed(2)}</span>
                    <span className="subtotal-bgn">{(item.price * item.quantity * 1.95583).toFixed(2)} лв.</span>
                  </p>

                  <button 
                    className="cart-remove-button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label={t('remove')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3 className="heading-3 mb-4">{t('orderSummary')}</h3>
            
            <div className="summary-row">
              <span>{t('subtotal')} ({cart.reduce((sum, item) => sum + item.quantity, 0)} {t('items')})</span>
              <div className="summary-price">
                <span className="price-eur">&euro;{total.toFixed(2)}</span>
                <span className="price-bgn">{(total * 1.95583).toFixed(2)} лв.</span>
              </div>
            </div>
            
            <div className="summary-row">
              <span>{t('shipping')}</span>
              <span>{total >= 100 ? t('freeShipping') : '\u20ac9.95'}</span>
            </div>
            
            {total < 100 && (
              <p className="free-shipping-hint">
                {t('addMoreForFree', { amount: (100 - total).toFixed(2) })}
              </p>
            )}
            
            <div className="summary-divider"></div>
            
            <div className="summary-row summary-total">
              <span>{t('total')}</span>
              <div className="summary-price total-price">
                <span className="price-eur">&euro;{(total >= 100 ? total : total + 9.95).toFixed(2)}</span>
                <span className="price-bgn">{((total >= 100 ? total : total + 9.95) * 1.95583).toFixed(2)} лв.</span>
              </div>
            </div>

            {error && <div className="checkout-error">{error}</div>}

            <button 
              className="btn-primary checkout-button" 
              onClick={handleCheckout} 
              disabled={isLoading}
              style={{ width: '100%', marginTop: '24px' }}
              data-testid="checkout-button"
            >
              {isLoading ? (
                <><Loader size={18} className="spinning" />{t('processingPayment')}</>
              ) : (
                t('proceedToCheckout')
              )}
            </button>

            <div className="payment-methods">
              <p>{t('secureCheckout')}</p>
            </div>

            <Link to="/products" className="continue-shopping">
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
