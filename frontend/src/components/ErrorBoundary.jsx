import React from 'react';
import './ErrorBoundary.css';

/**
 * App-wide error boundary.
 *
 * Why this exists: an unhandled render error in any descendant previously
 * unmounted the whole React tree, leaving users on a blank white page (the exact
 * symptom reported for the Speedy office selector). This boundary catches such
 * errors and renders a recoverable, bilingual fallback instead of a white screen.
 *
 * It is intentionally self-contained (no context/hook dependencies) so it keeps
 * working even if a provider is the thing that threw. Language is read directly
 * from localStorage to match LanguageContext ('kostin_lang').
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Surface to console for debugging and to analytics if available.
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo);
    try {
      if (typeof window !== 'undefined') {
        if (window.gtag) {
          window.gtag('event', 'exception', {
            description: String(error?.message || error),
            fatal: true,
          });
        }
        if (window.posthog && typeof window.posthog.captureException === 'function') {
          window.posthog.captureException(error);
        }
      }
    } catch { /* analytics must never throw from the boundary */ }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    let isBg = false;
    try {
      isBg = (typeof window !== 'undefined' && localStorage.getItem('kostin_lang') === 'bg');
    } catch { /* ignore storage access errors */ }

    const copy = isBg
      ? {
          title: 'Възникна неочаквана грешка',
          message: 'Извиняваме се за неудобството. Можете да опитате отново или да се върнете към началната страница. Кошницата ви е запазена.',
          reload: 'Опитай отново',
          home: 'Към начало',
        }
      : {
          title: 'Something went wrong',
          message: 'Sorry for the inconvenience. You can try again or return to the homepage. Your cart has been saved.',
          reload: 'Try again',
          home: 'Go to homepage',
        };

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__card">
          <div className="error-boundary__icon" aria-hidden="true">!</div>
          <h1 className="error-boundary__title">{copy.title}</h1>
          <p className="error-boundary__message">{copy.message}</p>
          <div className="error-boundary__actions">
            <button type="button" className="error-boundary__btn primary" onClick={this.handleReload}>
              {copy.reload}
            </button>
            <a className="error-boundary__btn secondary" href="/">
              {copy.home}
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
