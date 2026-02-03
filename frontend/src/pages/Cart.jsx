import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Loader } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart, clearCart, getCartTotal } from '../mock';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    if (window.confirm('Are you sure you want to clear your cart?')) {
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

      // Prepare cart items for checkout
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

      // Redirect to Stripe checkout
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
            <h2 className="heading-2 mt-4">Your cart is empty</h2>
            <p className="body-regular mt-3" style={{ color: 'var(--text-secondary)' }}>
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link to="/products" className="btn-primary mt-5">
              Start Shopping
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
          <h1 className="heading-1">Shopping Cart</h1>
          <button className="clear-cart-button" onClick={handleClearCart}>
            Clear Cart
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
                  <p className="cart-item-price">€{item.price.toFixed(2)}</p>
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
                    €{(item.price * item.quantity).toFixed(2)}
                  </p>

                  <button 
                    className="cart-remove-button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3 className="heading-3 mb-4">Order Summary</h3>
            
            <div className="summary-row">
              <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Shipping</span>
              <span>{total >= 100 ? 'Free' : '€9.95'}</span>
            </div>
            
            {total < 100 && (
              <p className="free-shipping-hint">
                Add €{(100 - total).toFixed(2)} more for free shipping!
              </p>
            )}
            
            <div className="summary-divider"></div>
            
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>€{(total >= 100 ? total : total + 9.95).toFixed(2)}</span>
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
                  Processing...
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </button>

            <div className="payment-methods">
              <p>Secure checkout powered by Stripe</p>
            </div>

            <Link to="/products" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;