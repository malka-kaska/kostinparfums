import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage(t('invalidVerificationLink'));
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || t('emailVerified'));
        } else {
          setStatus('error');
          setMessage(data.detail || t('verificationFailed'));
        }
      } catch (error) {
        setStatus('error');
        setMessage(t('verificationError'));
      }
    };

    verifyEmail();
  }, [searchParams, t]);

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ textAlign: 'center', maxWidth: '450px' }}>
        <Link to="/" className="auth-logo">
          <span className="logo-text">KOSTIN</span>
          <span className="logo-tagline">{t('logoTagline')}</span>
        </Link>

        <div className="verification-content" style={{ marginTop: '40px' }}>
          {status === 'loading' && (
            <>
              <Loader2 size={64} className="spin" style={{ color: 'var(--accent-gold)', marginBottom: '20px' }} />
              <h2 style={{ fontWeight: '400', marginBottom: '10px' }}>{t('verifyingEmail')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('pleaseWait')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={64} style={{ color: '#22c55e', marginBottom: '20px' }} />
              <h2 style={{ fontWeight: '400', marginBottom: '10px' }}>{t('emailVerifiedTitle')}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{message}</p>
              <Link 
                to="/auth" 
                className="btn-primary"
                style={{ display: 'inline-block', padding: '14px 40px' }}
              >
                {t('loginNow')}
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={64} style={{ color: '#ef4444', marginBottom: '20px' }} />
              <h2 style={{ fontWeight: '400', marginBottom: '10px' }}>{t('verificationFailedTitle')}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{message}</p>
              <Link 
                to="/auth" 
                className="btn-primary"
                style={{ display: 'inline-block', padding: '14px 40px' }}
              >
                {t('tryAgain')}
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

export default VerifyEmail;
