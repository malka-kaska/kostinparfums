import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Loader } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart, clearCart, getCartTotal } from '../mock';
import { useLanguage } from '../context/LanguageContext';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cartItems = getCart();
    setCart(cartItems);
    setTotal(getCartTotal());
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartItem(productId, newQuantity);
    loadCart();
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    loadCart();
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleClearCart = () => {
    if (window.confirm(t('clearCartConfirm'))) {
      clearCart();
      loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const originUrl = window.location.origin;

      const items = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin_url: originUrl,
          items: items
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to initiate checkout. Please try again.');
      setIsLoading(false);
    }
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
            <Link to="/products" className="btn-primary mt-5">
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
          <h1 className="heading-1">{t('shoppingCart')}</h1>
          <button className="clear-cart-button" onClick={handleClearCart}>
            {t('clearCartBtn')}
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <Link to={`/product/${item.id}`} className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </Link>
                
                <div className="cart-item-details">
                  <Link to={`/product/${item.id}`} className="cart-item-name">
                    <p className="cart-item-brand">{item.brand}</p>
                    <h3>{item.name}</h3>
                  </Link>
                  <p className="cart-item-price">&euro;{item.price.toFixed(2)}</p>
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
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <p className="cart-item-subtotal">
                    &euro;{(item.price * item.quantity).toFixed(2)}
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
              <span>&euro;{total.toFixed(2)}</span>
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
              <span>&euro;{(total >= 100 ? total : total + 9.95).toFixed(2)}</span>
            </div>

            {error && (
              <div className="checkout-error">
                {error}
              </div>
            )}

            <button 
              className="btn-primary checkout-button" 
              onClick={handleCheckout} 
              disabled={isLoading}
              style={{ width: '100%', marginTop: '24px' }}
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="spinning" />
                  {t('processingPayment')}
                </>
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
