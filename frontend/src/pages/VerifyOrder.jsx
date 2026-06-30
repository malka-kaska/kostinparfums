import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VerifyOrder = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const verifyOrder = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage(t('invalidVerificationLink'));
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/orders/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || t('orderVerified'));
          setOrderId(data.order_id || '');
          setTrackingNumber(data.tracking_number || '');
        } else {
          setStatus('error');
          setMessage(data.detail || t('orderVerificationFailed'));
        }
      } catch (error) {
        setStatus('error');
        setMessage(t('verificationError'));
      }
    };

    verifyOrder();
  }, [searchParams, t]);

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ textAlign: 'center', maxWidth: '500px' }}>
        <Link to="/" className="auth-logo">
          <span className="logo-text">KOSTIN</span>
          <span className="logo-tagline">{t('logoTagline')}</span>
        </Link>

        <div className="verification-content" style={{ marginTop: '40px' }}>
          {status === 'loading' && (
            <>
              <Loader2 size={64} className="spin" style={{ color: 'var(--accent-gold)', marginBottom: '20px' }} />
              <h2 style={{ fontWeight: '400', marginBottom: '10px' }}>{t('verifyingOrder')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('pleaseWait')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={64} style={{ color: '#22c55e', marginBottom: '20px' }} />
              <h2 style={{ fontWeight: '400', marginBottom: '10px' }}>{t('orderConfirmedTitle')}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>{message}</p>
              
              {orderId && (
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '15px 25px', 
                  borderRadius: '8px', 
                  marginBottom: '25px',
                  display: 'inline-block'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('orderNumber')}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '500', letterSpacing: '2px' }}>
                    #{orderId.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              )}

              {trackingNumber && (
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '15px 25px', 
                  borderRadius: '8px', 
                  marginBottom: '25px',
                  display: 'block',
                  maxWidth: '320px',
                  margin: '0 auto 25px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('trackingNumber')}</p>
                  <p style={{ margin: '5px 0 10px 0', fontSize: '18px', fontWeight: '500', letterSpacing: '1px' }}>
                    {trackingNumber}
                  </p>
                  <a
                    href={`https://www.speedy.bg/bg/track-shipment?shipmentNumber=${trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-gold)', fontSize: '14px', textDecoration: 'none' }}
                  >
                    <Package size={16} />
                    {t('trackShipment')}
                  </a>
                </div>
              )}
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
                {t('orderConfirmationSent')}
              </p>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link 
                  to="/account" 
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 30px' }}
                >
                  <Package size={18} />
                  {t('viewOrders')}
                </Link>
                <Link 
                  to="/products" 
                  className="btn-secondary"
                  style={{ display: 'inline-block', padding: '14px 30px' }}
                >
                  {t('continueShopping')}
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={64} style={{ color: '#ef4444', marginBottom: '20px' }} />
              <h2 style={{ fontWeight: '400', marginBottom: '10px' }}>{t('orderVerificationFailedTitle')}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{message}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                {t('contactSupport')}: <a href="mailto:contact@kostinparfums.com" style={{ color: 'var(--accent-gold)' }}>contact@kostinparfums.com</a>
              </p>
              <Link 
                to="/" 
                className="btn-primary"
                style={{ display: 'inline-block', padding: '14px 40px' }}
              >
                {t('backToHome')}
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyOrder;
