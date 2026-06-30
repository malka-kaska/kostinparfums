import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { trackPurchase } from '../utils/analytics';
import './CheckoutSuccess.css';

// Cart is persisted under 'kostin_cart' (see AuthContext CART_STORAGE_KEY).
const clearCart = () => {
  try {
    localStorage.removeItem('kostin_cart');
    localStorage.removeItem('cart'); // legacy key cleanup
  } catch { /* ignore */ }
};

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const sessionId = searchParams.get('session_id');
  const { t } = useLanguage();

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const pollPaymentStatus = async (attempts = 0) => {
      const maxAttempts = 10;
      const pollInterval = 2000;

      if (attempts >= maxAttempts) {
        setStatus('success');
        clearCart();
        window.dispatchEvent(new Event('cartUpdated'));
        return;
      }

      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${API_URL}/api/payments/status/${sessionId}`);
        
        if (!response.ok) {
          if (attempts >= 2) {
            setStatus('success');
            clearCart();
            window.dispatchEvent(new Event('cartUpdated'));
            return;
          }
          throw new Error('Failed to check payment status');
        }

        const data = await response.json();
        setPaymentDetails(data);

        if (data.payment_status === 'paid') {
          setStatus('success');
          clearCart();
          window.dispatchEvent(new Event('cartUpdated'));
          
          // Backend returns amount_total already in EUR (see /payments/status).
          const orderValue = Number(data.amount_total) || 0;
          let shippingCost = 0;
          try {
            const pending = JSON.parse(sessionStorage.getItem('pending_shipping_address') || '{}');
            shippingCost = Number(pending.shipping_cost) || 0;
          } catch { /* ignore malformed pending data */ }

          // Meta Pixel: Track Purchase event
          if (typeof window !== 'undefined' && window.fbq && orderValue > 0) {
            window.fbq('track', 'Purchase', {
              value: orderValue,
              currency: 'EUR',
              content_type: 'product'
            });
          }

          // GA4: Track purchase event for card (Stripe) payment.
          // transaction_id = Stripe session id guards against duplicate counting on reload.
          trackPurchase({ transactionId: sessionId, value: orderValue, shipping: shippingCost });
          return;
        } else if (data.status === 'expired') {
          setStatus('expired');
          return;
        }

        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (attempts >= 2) {
          setStatus('success');
          clearCart();
          window.dispatchEvent(new Event('cartUpdated'));
          return;
        }
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      }
    };

    pollPaymentStatus();
  }, [sessionId]);

  return (
    <div className="checkout-success-page">
      <div className="container section-padding">
        <div className="success-container">
          {status === 'loading' && (
            <div className="status-content">
              <Loader className="status-icon spinning" size={64} />
              <h1 className="heading-2">{t('processingPaymentTitle')}</h1>
              <p className="status-message">{t('processingPaymentMsg')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="status-content success">
              <CheckCircle className="status-icon success-icon" size={64} />
              <h1 className="heading-2">{t('paymentSuccessful')}</h1>
              <p className="status-message">{t('thankYou')}</p>
              {paymentDetails && paymentDetails.amount_total != null && (
                <div className="payment-details">
                  <p className="amount">
                    {t('totalPaid')} <strong>&euro;{Number(paymentDetails.amount_total).toFixed(2)}</strong>
                  </p>
                </div>
              )}
              <div className="action-buttons">
                <Link to="/products" className="btn-primary">
                  {t('continueShopping')}
                </Link>
                <Link to="/profile" className="btn-secondary">
                  <Package size={18} />
                  {t('viewOrders')}
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="status-content error">
              <XCircle className="status-icon error-icon" size={64} />
              <h1 className="heading-2">{t('sessionExpired')}</h1>
              <p className="status-message">{t('sessionExpiredMsg')}</p>
              <Link to="/cart" className="btn-primary">
                {t('returnToCart')}
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="status-content error">
              <XCircle className="status-icon error-icon" size={64} />
              <h1 className="heading-2">{t('somethingWentWrong')}</h1>
              <p className="status-message">{t('paymentVerifyFailed')}</p>
              <Link to="/cart" className="btn-primary">
                {t('returnToCart')}
              </Link>
            </div>
          )}

          {status === 'timeout' && (
            <div className="status-content">
              <Loader className="status-icon" size={64} />
              <h1 className="heading-2">{t('paymentProcessingTitle')}</h1>
              <p className="status-message">{t('paymentProcessingMsg')}</p>
              <Link to="/" className="btn-primary">
                {t('returnToHome')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
