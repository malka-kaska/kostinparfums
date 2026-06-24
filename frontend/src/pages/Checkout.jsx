import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ArrowLeft, Loader, CheckCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SpeedyShipping from '../components/SpeedyShipping';
import '../components/SpeedyShipping.css';
import './Checkout.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Guest Account Creation Component
const GuestAccountCreation = ({ email, name, orderId, language, t }) => {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(language === 'bg' ? 'Паролата трябва да е поне 8 символа' : 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'bg' ? 'Паролите не съвпадат' : 'Passwords do not match');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          order_id: orderId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.detail || (language === 'bg' ? 'Грешка при създаване на акаунт' : 'Failed to create account'));
      }
    } catch (err) {
      setError(language === 'bg' ? 'Грешка при свързване със сървъра' : 'Connection error');
    } finally {
      setIsCreating(false);
    }
  };

  if (success) {
    return (
      <div className="guest-account-section success">
        <CheckCircle size={24} />
        <div>
          <strong>{language === 'bg' ? 'Акаунтът е създаден!' : 'Account created!'}</strong>
          <p>{language === 'bg' ? 'Вече можете да влезете и да проследявате поръчките си.' : 'You can now log in and track your orders.'}</p>
          <Link to="/auth" className="btn-login-link">
            {language === 'bg' ? 'Вход в акаунта' : 'Log in'} →
          </Link>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="guest-account-section">
        <User size={24} />
        <div>
          <strong>{language === 'bg' ? 'Създайте акаунт' : 'Create an account'}</strong>
          <p>{language === 'bg' ? 'Запазете поръчката си и следете доставките лесно.' : 'Save your order and track deliveries easily.'}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-create-account">
          {language === 'bg' ? 'Създай акаунт' : 'Create Account'}
        </button>
      </div>
    );
  }

  return (
    <div className="guest-account-section form-active">
      <form onSubmit={handleCreateAccount} className="guest-account-form">
        <h3>{language === 'bg' ? 'Създайте акаунт' : 'Create your account'}</h3>
        <p className="form-subtitle">
          {language === 'bg' ? `Email: ${email}` : `Email: ${email}`}
        </p>

        <div className="password-field">
          <label>{language === 'bg' ? 'Парола' : 'Password'}</label>
          <div className="password-input-wrapper">
            <Lock size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === 'bg' ? 'Минимум 8 символа' : 'Minimum 8 characters'}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="toggle-password">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="password-field">
          <label>{language === 'bg' ? 'Потвърди парола' : 'Confirm Password'}</label>
          <div className="password-input-wrapper">
            <Lock size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={language === 'bg' ? 'Повтори паролата' : 'Repeat password'}
              required
            />
          </div>
        </div>

        {error && <p className="form-error-message">{error}</p>}

        <div className="form-actions">
          <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
            {language === 'bg' ? 'Отказ' : 'Cancel'}
          </button>
          <button type="submit" disabled={isCreating} className="btn-submit">
            {isCreating ? <Loader size={18} className="spinning" /> : null}
            {language === 'bg' ? 'Създай' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, getCartItems, getCartTotal, clearCartAll } = useAuth();
  
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'cod'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  // Speedy integration state
  const [deliveryType, setDeliveryType] = useState('OFFICE'); // 'OFFICE' or 'ADDRESS'
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [shippingPrice, setShippingPrice] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Contact form - required for ALL orders
  const [contactForm, setContactForm] = useState({
    full_name: user?.name || '',
    phone: '',
    email: user?.email || '',
    notes: '',
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
      setContactForm(prev => ({
        ...prev,
        full_name: user.name || prev.full_name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const validateForm = () => {
    const errors = {};
    if (!contactForm.full_name.trim()) errors.full_name = t('requiredField') || 'Задължително поле';
    if (!contactForm.phone.trim()) errors.phone = t('requiredField') || 'Задължително поле';
    if (!user && !contactForm.email.trim()) errors.email = t('requiredField') || 'Задължително поле';
    
    // Validate Speedy selection
    if (!selectedCity) {
      errors.city = language === 'bg' ? 'Моля, изберете град' : 'Please select a city';
    }
    if (deliveryType === 'OFFICE' && !selectedOffice) {
      errors.office = language === 'bg' ? 'Моля, изберете офис' : 'Please select an office';
    }
    if (deliveryType === 'ADDRESS' && !deliveryAddress.trim()) {
      errors.address = language === 'bg' ? 'Моля, въведете адрес' : 'Please enter an address';
    }
    if (!shippingPrice) {
      errors.shipping = language === 'bg' ? 'Цената за доставка не е изчислена' : 'Shipping price not calculated';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCardCheckout = async () => {
    // Validate form first
    if (!validateForm()) return;
    
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

      // Build shipping address based on delivery type
      const shippingAddress = {
        full_name: contactForm.full_name,
        phone: contactForm.phone,
        city: selectedCity?.name || '',
        notes: contactForm.notes,
      };
      
      if (deliveryType === 'OFFICE' && selectedOffice) {
        shippingAddress.address = `Офис Спиди: ${selectedOffice.name}`;
        shippingAddress.office_id = selectedOffice.id;
        shippingAddress.office_name = selectedOffice.name;
      } else {
        shippingAddress.address = deliveryAddress;
      }

      // Save shipping info for after payment
      sessionStorage.setItem('pending_shipping_address', JSON.stringify({
        ...shippingAddress,
        email: contactForm.email,
        delivery_type: deliveryType,
        shipping_cost: shippingPrice?.eur || 0,
      }));

      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          origin_url: originUrl, 
          items,
          shipping_address: shippingAddress,
          customer_email: contactForm.email,
          shipping_cost: shippingPrice?.eur || 0,
          shipping_method: deliveryType === 'OFFICE' ? 'speedy_office' : 'address',
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

      // Build shipping address based on delivery type
      const shippingAddress = {
        full_name: contactForm.full_name,
        phone: contactForm.phone,
        city: selectedCity?.name || '',
        notes: contactForm.notes,
      };
      
      if (deliveryType === 'OFFICE' && selectedOffice) {
        shippingAddress.address = `Офис Спиди: ${selectedOffice.name}`;
        shippingAddress.office_id = selectedOffice.id;
        shippingAddress.office_name = selectedOffice.name;
      } else {
        shippingAddress.address = deliveryAddress;
      }

      const response = await fetch(`${API_URL}/api/orders/cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items,
          shipping_address: shippingAddress,
          shipping_method: deliveryType === 'OFFICE' ? 'speedy_office' : 'address',
          shipping_cost: shippingPrice?.eur || 0,
          email: contactForm.email,
          speedy_data: {
            city_id: selectedCity?.id,
            city_name: selectedCity?.name,
            office_id: selectedOffice?.id,
            office_name: selectedOffice?.name,
            delivery_type: deliveryType,
          }
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
    setContactForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const finalTotal = total + (shippingPrice?.eur || 0);

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
            
            {/* Tracking info if available */}
            {orderSuccess.tracking_number && (
              <div className="success-tracking">
                <p>{language === 'bg' ? 'Номер за проследяване:' : 'Tracking number:'} <strong>{orderSuccess.tracking_number}</strong></p>
                <a href={orderSuccess.tracking_url} target="_blank" rel="noopener noreferrer" className="tracking-link">
                  {language === 'bg' ? 'Проследи в Speedy' : 'Track on Speedy'} →
                </a>
              </div>
            )}
            
            <div className="success-total">
              <span>{t('totalToPay') || 'Сума за плащане при доставка'}:</span>
              <strong>€{orderSuccess.total.toFixed(2)}</strong>
            </div>
            
            {/* Create Account Section for Guests */}
            {!user && contactForm.email && (
              <GuestAccountCreation 
                email={contactForm.email} 
                name={contactForm.full_name}
                orderId={orderSuccess.order_id}
                language={language}
                t={t}
              />
            )}
            
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
          {/* Left column - Shipping Address & Payment Method */}
          <div className="checkout-main">
            {/* Speedy Shipping Integration */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">{t('shippingMethod') || 'Доставка'}</h2>
              
              <SpeedyShipping
                deliveryType={deliveryType}
                setDeliveryType={setDeliveryType}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                selectedOffice={selectedOffice}
                setSelectedOffice={setSelectedOffice}
                shippingPrice={shippingPrice}
                setShippingPrice={setShippingPrice}
                address={deliveryAddress}
                setAddress={setDeliveryAddress}
              />
              
              {formErrors.city && <span className="form-error">{formErrors.city}</span>}
              {formErrors.office && <span className="form-error">{formErrors.office}</span>}
              {formErrors.address && <span className="form-error">{formErrors.address}</span>}
              {formErrors.shipping && <span className="form-error">{formErrors.shipping}</span>}
            </div>

            {/* Contact Information */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">{t('contactInfo') || 'Данни за контакт'}</h2>
              
              <div className="shipping-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('fullName') || 'Име и фамилия'} *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={contactForm.full_name}
                      onChange={handleInputChange}
                      className={formErrors.full_name ? 'error' : ''}
                      placeholder="Иван Иванов"
                      data-testid="contact-name"
                    />
                    {formErrors.full_name && <span className="form-error">{formErrors.full_name}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>{t('phone') || 'Телефон'} *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={contactForm.phone}
                      onChange={handleInputChange}
                      className={formErrors.phone ? 'error' : ''}
                      placeholder="+359 888 123 456"
                      data-testid="contact-phone"
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
                      value={contactForm.email}
                      onChange={handleInputChange}
                      className={formErrors.email ? 'error' : ''}
                      placeholder="email@example.com"
                      data-testid="contact-email"
                    />
                    {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                  </div>
                )}
                
                <div className="form-group">
                  <label>{t('deliveryNotes') || 'Бележки за доставка'}</label>
                  <textarea
                    name="notes"
                    value={contactForm.notes}
                    onChange={handleInputChange}
                    placeholder={t('deliveryNotesPlaceholder') || 'Допълнителни инструкции за куриера...'}
                    rows={3}
                    data-testid="contact-notes"
                  />
                </div>
              </div>
            </div>

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
                  <span>{t('shipping') || 'Доставка'} ({deliveryType === 'OFFICE' ? (language === 'bg' ? 'офис' : 'office') : (language === 'bg' ? 'адрес' : 'address')})</span>
                  <span>{shippingPrice ? `€${shippingPrice.eur.toFixed(2)}` : '---'}</span>
                </div>
                <div className="order-total-row total">
                  <span>{t('total') || 'Общо'}</span>
                  <span>€{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Free Return Info */}
              <div className="free-return-info">
                <span className="return-icon">↩️</span>
                <div className="return-text">
                  <strong>{t('freeReturn') || 'Безплатно връщане до 14 дни'}</strong>
                  <span>{t('freeReturnDesc') || 'При неразопакован продукт'}</span>
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
