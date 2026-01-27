import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart, clearCart, getCartTotal } from '../mock';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
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

  const handleCheckout = () => {
    alert('Checkout functionality will be implemented with backend. Your order has been placed!');
    clearCart();
    loadCart();
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/');
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
              <span>Free</span>
            </div>
            
            <div className="summary-row">
              <span>Tax</span>
              <span>€{(total * 0.1).toFixed(2)}</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>€{(total * 1.1).toFixed(2)}</span>
            </div>

            <button className="btn-primary" onClick={handleCheckout} style={{ width: '100%', marginTop: '24px' }}>
              Proceed to Checkout
            </button>

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