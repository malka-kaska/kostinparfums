import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Checkout.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Checkout = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, getCartItems, getCartTotal, clearCartAll } = useAuth();
  
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'cod'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  // Shipping form for COD
  const [shippingForm, setShippingForm] = useState({
    full_name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
    email: user?.email || '',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadCart = useCallback(() => {
    const items = getCartItems();
    setCart(items);
    setTotal(getCartTotal());
    
    // Redirect if cart is empty
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [getCartItems, getCartTotal, navigate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    // Pre-fill user data if logged in
    if (user) {
      setShippingForm(prev => ({
        ...prev,
        full_name: user.name || prev.full_name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const validateForm = () => {
    const errors = {};
    if (!shippingForm.full_name.trim()) errors.full_name = t('requiredField') || 'Задължително поле';
    if (!shippingForm.phone.trim()) errors.phone = t('requiredField') || 'Задължително поле';
    if (!shippingForm.address.trim()) errors.address = t('requiredField') || 'Задължително поле';
    if (!shippingForm.city.trim()) errors.city = t('requiredField') || 'Задължително поле';
    if (!shippingForm.postal_code.trim()) errors.postal_code = t('requiredField') || 'Задължително поле';
    if (!user && !shippingForm.email.trim()) errors.email = t('requiredField') || 'Задължително поле';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCardCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      const originUrl = window.location.origin;
      const items = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ origin_url: originUrl, items })
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
      setError(err.message || t('checkoutError') || 'Грешка при плащането. Моля, опитайте отново.');
      setIsLoading(false);
    }
  };

  const handleCODCheckout = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');

    try {
      const items = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const response = await fetch(`${API_URL}/api/orders/cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items,
          shipping_address: {
            full_name: shippingForm.full_name,
            phone: shippingForm.phone,
            address: shippingForm.address,
            city: shippingForm.city,
            postal_code: shippingForm.postal_code,
            notes: shippingForm.notes,
          },
          email: shippingForm.email,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create order');
      }

      const data = await response.json();
      
      // Clear cart and show success
      await clearCartAll();
      setOrderSuccess(data);
      
    } catch (err) {
      console.error('COD order error:', err);
      setError(err.message || t('orderError') || 'Грешка при поръчката. Моля, опитайте отново.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = () => {
    if (paymentMethod === 'card') {
      handleCardCheckout();
    } else {
      handleCODCheckout();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const shippingCost = total >= 100 ? 0 : 9.95;
  const finalTotal = total + shippingCost;

  // Order success view
  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="container section-padding">
          <div className="checkout-success-card">
            <CheckCircle size={64} className="success-icon" />
            <h1 className="heading-2">{t('orderConfirmed') || 'Поръчката е потвърдена!'}</h1>
            <p className="order-number">
              {t('orderNumber') || 'Номер на поръчка'}: <strong>{orderSuccess.order_number}</strong>
            </p>
            <p className="success-message">
              {t('codSuccessMessage') || 'Благодарим за поръчката! Ще получите потвърждение по имейл. Плащането ще бъде извършено при доставка.'}
            </p>
            <div className="success-total">
              <span>{t('totalToPay') || 'Сума за плащане при доставка'}:</span>
              <strong>€{orderSuccess.total.toFixed(2)}</strong>
            </div>
            <div className="success-actions">
              <Link to="/products" className="btn-primary">
                {t('continueShopping') || 'Продължи пазаруването'}
              </Link>
              {user && (
                <Link to="/profile" className="btn-secondary">
                  {t('viewOrders') || 'Виж поръчките'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container section-padding-small">
        <Link to="/cart" className="back-to-cart">
          <ArrowLeft size={18} />
          {t('backToCart') || 'Обратно към кошницата'}
        </Link>
        
        <h1 className="heading-1 checkout-title">{t('checkout') || 'Плащане'}</h1>

        <div className="checkout-layout">
          {/* Left column - Payment method & Form */}
          <div className="checkout-main">
            {/* Payment Method Selection */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">{t('paymentMethod') || 'Метод на плащане'}</h2>
              
              <div className="payment-options">
                <label 
                  className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                  data-testid="payment-card"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <CreditCard size={24} />
                    <div>
                      <span className="payment-option-title">{t('payWithCard') || 'Плащане с карта'}</span>
                      <span className="payment-option-desc">{t('cardSecure') || 'Сигурно плащане чрез Stripe'}</span>
                    </div>
                  </div>
                </label>
                
                <label 
                  className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  data-testid="payment-cod"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <Truck size={24} />
                    <div>
                      <span className="payment-option-title">{t('cashOnDelivery') || 'Наложен платеж'}</span>
                      <span className="payment-option-desc">{t('codDesc') || 'Плащане при доставка на куриера'}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Shipping Address Form - shown for COD */}
            {paymentMethod === 'cod' && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">{t('deliveryAddress') || 'Адрес за доставка'}</h2>
                
                <div className="shipping-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('fullName') || 'Име и фамилия'} *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={shippingForm.full_name}
                        onChange={handleInputChange}
                        className={formErrors.full_name ? 'error' : ''}
                        placeholder="Иван Иванов"
                        data-testid="shipping-name"
                      />
                      {formErrors.full_name && <span className="form-error">{formErrors.full_name}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label>{t('phone') || 'Телефон'} *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingForm.phone}
                        onChange={handleInputChange}
                        className={formErrors.phone ? 'error' : ''}
                        placeholder="+359 888 123 456"
                        data-testid="shipping-phone"
                      />
                      {formErrors.phone && <span className="form-error">{formErrors.phone}</span>}
                    </div>
                  </div>
                  
                  {!user && (
                    <div className="form-group">
                      <label>{t('email') || 'Имейл'} *</label>
                      <input
                        type="email"
                        name="email"
                        value={shippingForm.email}
                        onChange={handleInputChange}
                        className={formErrors.email ? 'error' : ''}
                        placeholder="email@example.com"
                        data-testid="shipping-email"
                      />
                      {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>{t('address') || 'Адрес'} *</label>
                    <input
                      type="text"
                      name="address"
                      value={shippingForm.address}
                      onChange={handleInputChange}
                      className={formErrors.address ? 'error' : ''}
                      placeholder="ул. Примерна 123, ап. 45"
                      data-testid="shipping-address"
                    />
                    {formErrors.address && <span className="form-error">{formErrors.address}</span>}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('city') || 'Град'} *</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingForm.city}
                        onChange={handleInputChange}
                        className={formErrors.city ? 'error' : ''}
                        placeholder="София"
                        data-testid="shipping-city"
                      />
                      {formErrors.city && <span className="form-error">{formErrors.city}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label>{t('postalCode') || 'Пощенски код'} *</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={shippingForm.postal_code}
                        onChange={handleInputChange}
                        className={formErrors.postal_code ? 'error' : ''}
                        placeholder="1000"
                        data-testid="shipping-postal"
                      />
                      {formErrors.postal_code && <span className="form-error">{formErrors.postal_code}</span>}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>{t('deliveryNotes') || 'Бележки за доставка'}</label>
                    <textarea
                      name="notes"
                      value={shippingForm.notes}
                      onChange={handleInputChange}
                      placeholder={t('deliveryNotesPlaceholder') || 'Допълнителни инструкции за куриера...'}
                      rows={3}
                      data-testid="shipping-notes"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && <div className="checkout-error">{error}</div>}
          </div>

          {/* Right column - Order Summary */}
          <div className="checkout-sidebar">
            <div className="order-summary">
              <h2 className="checkout-section-title">{t('orderSummary') || 'Обобщение'}</h2>
              
              <div className="order-items">
                {cart.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="order-item-image">
                      <img src={item.image} alt={item.name} />
                      <span className="order-item-qty">{item.quantity}</span>
                    </div>
                    <div className="order-item-details">
                      <span className="order-item-name">{item.name}</span>
                      <span className="order-item-price">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-totals">
                <div className="order-total-row">
                  <span>{t('subtotal') || 'Междинна сума'}</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <div className="order-total-row">
                  <span>{t('shipping') || 'Доставка'}</span>
                  <span>{shippingCost === 0 ? (t('free') || 'Безплатна') : `€${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="order-total-row total">
                  <span>{t('total') || 'Общо'}</span>
                  <span>€{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <button
                className="btn-primary checkout-submit-btn"
                onClick={handleCheckout}
                disabled={isLoading}
                data-testid="submit-order-btn"
              >
                {isLoading ? (
                  <><Loader size={18} className="spinning" /> {t('processing') || 'Обработка...'}</>
                ) : paymentMethod === 'card' ? (
                  t('payNow') || 'Плати сега'
                ) : (
                  t('placeOrder') || 'Поръчай'
                )}
              </button>
              
              {paymentMethod === 'card' && (
                <p className="secure-note">{t('secureStripe') || 'Сигурно плащане чрез Stripe'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
