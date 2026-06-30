import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './GuestCancelOrder.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GuestCancelOrder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const orderId = searchParams.get('order');
  const token = searchParams.get('token');
  
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId || !token) {
      setError(language === 'bg' 
        ? 'Невалиден линк за отказ. Моля, използвайте линка от имейла.' 
        : 'Invalid cancellation link. Please use the link from your email.');
    }
  }, [orderId, token, language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cancelReason.trim()) {
      setError(language === 'bg' ? 'Моля, въведете причина за отказ.' : 'Please enter a cancellation reason.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/orders/guest/${orderId}/cancel?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      
      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        if (response.status === 404) {
          setError(language === 'bg' 
            ? 'Поръчката не е намерена или линкът е невалиден.' 
            : 'Order not found or invalid link.');
        } else if (response.status === 400) {
          setError(data.detail || (language === 'bg' 
            ? 'Тази поръчка не може да бъде отказана.' 
            : 'This order cannot be cancelled.'));
        } else {
          setError(data.detail || (language === 'bg' ? 'Възникна грешка.' : 'An error occurred.'));
        }
      }
    } catch (err) {
      setError(language === 'bg' ? 'Грешка при свързване със сървъра.' : 'Connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="guest-cancel-page" data-testid="guest-cancel-success">
        <div className="guest-cancel-container">
          <div className="cancel-success-box">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h1>{language === 'bg' ? 'Заявката е изпратена!' : 'Request Submitted!'}</h1>
            <p>
              {language === 'bg' 
                ? 'Получихме Вашата заявка за отказ. Ще се свържем с Вас в най-кратък срок за потвърждение.' 
                : 'We received your cancellation request. We will contact you shortly to confirm.'}
            </p>
            <button onClick={() => navigate('/')} className="btn-back-home">
              <ArrowLeft size={18} />
              {language === 'bg' ? 'Към началната страница' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid link)
  if (error && (!orderId || !token)) {
    return (
      <div className="guest-cancel-page" data-testid="guest-cancel-error">
        <div className="guest-cancel-container">
          <div className="cancel-error-box">
            <div className="error-icon">
              <AlertTriangle size={48} />
            </div>
            <h1>{language === 'bg' ? 'Невалиден линк' : 'Invalid Link'}</h1>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="btn-back-home">
              <ArrowLeft size={18} />
              {language === 'bg' ? 'Към началната страница' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-cancel-page" data-testid="guest-cancel-page">
      <div className="guest-cancel-container">
        <div className="cancel-header">
          <XCircle size={48} className="cancel-icon" />
          <h1>{language === 'bg' ? 'Отказ от поръчка' : 'Cancel Order'}</h1>
          <p className="order-ref">
            {language === 'bg' ? 'Поръчка' : 'Order'}: <strong>#{orderId?.slice(-8).toUpperCase()}</strong>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="cancel-form">
          <div className="form-group">
            <label htmlFor="cancelReason">
              {language === 'bg' ? 'Защо искате да откажете поръчката?' : 'Why do you want to cancel?'}
            </label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={language === 'bg' 
                ? 'Опишете накратко причината за отказ...' 
                : 'Briefly describe the reason...'}
              rows={4}
              data-testid="cancel-reason-input"
            />
          </div>
          
          {error && (
            <div className="form-error" data-testid="cancel-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-submit-cancel"
              disabled={isSubmitting || !cancelReason.trim()}
              data-testid="submit-cancel-btn"
            >
              {isSubmitting 
                ? (language === 'bg' ? 'Изпращане...' : 'Submitting...') 
                : (language === 'bg' ? 'Изпрати заявка за отказ' : 'Submit Cancellation Request')}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="btn-back"
            >
              {language === 'bg' ? 'Назад' : 'Back'}
            </button>
          </div>
          
          <p className="cancel-note">
            {language === 'bg' 
              ? 'След изпращането ще получите потвърждение от нашия екип.' 
              : 'After submission, you will receive confirmation from our team.'}
          </p>
        </form>
      </div>
    </div>
  );
};

export default GuestCancelOrder;
