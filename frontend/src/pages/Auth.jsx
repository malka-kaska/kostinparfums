import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, register } from '../mock';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = login(email, password);
      if (user) {
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/');
      } else {
        setError('Invalid email or password');
      }
    } else {
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        return;
      }
      if (!agreeTerms) {
        setError('Please agree to the Privacy Policy and Terms of Service');
        return;
      }
      const user = register(email, password, name);
      if (user) {
        // Store newsletter preference
        if (subscribeNewsletter) {
          localStorage.setItem('newsletterSubscribed', 'true');
        }
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/');
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="container section-padding">
        <div className="auth-container">
          <div className="auth-form-wrapper">
            <h1 className="heading-2 mb-3">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="body-regular mb-5" style={{ color: 'var(--text-secondary)' }}>
              {isLogin 
                ? 'Sign in to access your account' 
                : 'Join us to start shopping luxury cosmetics'
              }
            </p>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input 
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input 
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input 
                  type="password"
                  id="password"
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
                    />
                    <span className="checkbox-text">
                      I agree to the <Link to="/privacy" target="_blank">Privacy Policy</Link> and <Link to="/terms" target="_blank">Terms of Service</Link> *
                    </span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={subscribeNewsletter}
                      onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">
                      I want to receive news, offers and promotions via email
                    </span>
                  </label>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-toggle">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
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
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {isLogin && (
              <div className="demo-credentials">
                <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                  Demo credentials:
                </p>
                <p className="body-small" style={{ marginTop: '8px' }}>
                  <strong>Customer:</strong> user@example.com / user123
                </p>
                <p className="body-small" style={{ marginTop: '4px' }}>
                  <strong>Admin:</strong> admin@cosmetics.com / admin123
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
                Curated beauty essentials
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;