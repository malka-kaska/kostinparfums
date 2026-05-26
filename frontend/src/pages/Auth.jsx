import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        if (!name || !email || !password) {
          setError(t('fillAllFields'));
          setIsLoading(false);
          return;
        }
        if (!agreeTerms) {
          setError(t('agreeTermsError'));
          setIsLoading(false);
          return;
        }
        await register(email, password, name);
        if (subscribeNewsletter) {
          localStorage.setItem('newsletterSubscribed', 'true');
        }
        navigate('/');
      }
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container section-padding">
        <div className="auth-container">
          <div className="auth-form-wrapper">
            <h1 className="heading-2 mb-3" data-testid="auth-heading">
              {isLogin ? t('welcomeBack') : t('createAccount')}
            </h1>
            <p className="body-regular mb-5" style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? t('signInAccess') : t('joinUs')}
            </p>

            {error && (
              <div className="auth-error" data-testid="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" data-testid="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name" className="form-label">{t('fullName')}</label>
                  <input 
                    type="text"
                    id="name"
                    data-testid="auth-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">{t('email')}</label>
                <input 
                  type="email"
                  id="email"
                  data-testid="auth-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">{t('password')}</label>
                <input 
                  type="password"
                  id="password"
                  data-testid="auth-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div className="auth-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="checkbox-input"
                      data-testid="auth-terms-checkbox"
                    />
                    <span className="checkbox-text">
                      {t('agreeTerms')} <Link to="/privacy" target="_blank">{t('privacyPolicy')}</Link> {t('and')} <Link to="/terms" target="_blank">{t('termsOfService')}</Link> *
                    </span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={subscribeNewsletter}
                      onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                      className="checkbox-input"
                      data-testid="auth-newsletter-checkbox"
                    />
                    <span className="checkbox-text">
                      {t('newsletterOptIn')}
                    </span>
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '24px' }}
                disabled={isLoading}
                data-testid="auth-submit-button"
              >
                {isLoading ? t('pleaseWait') : (isLogin ? t('signIn') : t('createAccount'))}
              </button>
            </form>

            <div className="auth-toggle">
              <p>
                {isLogin ? t('noAccount') : t('haveAccount')}
                {' '}
                <button 
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setAgreeTerms(false);
                    setSubscribeNewsletter(false);
                  }}
                  className="auth-toggle-button"
                  data-testid="auth-toggle-button"
                >
                  {isLogin ? t('signUp') : t('signIn')}
                </button>
              </p>
            </div>

            {isLogin && (
              <div className="demo-credentials">
                <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                  {t('demoCredentials')}
                </p>
                <p className="body-small" style={{ marginTop: '8px' }}>
                  <strong>{t('admin')}</strong> konstantin.kirchev.bs@gmail.com
                </p>
              </div>
            )}
          </div>

          <div className="auth-image">
            <div className="auth-image-overlay">
              <h2 className="hero-medium" style={{ color: 'white' }}>
                KOSTIN
              </h2>
              <p className="body-large" style={{ color: 'rgba(255,255,255,0.9)', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '14px' }}>
                {t('curatedBeautyEssentials')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
