import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Package } from 'lucide-react';
import { clearCart } from '../mock';
import './CheckoutSuccess.css';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const pollPaymentStatus = async (attempts = 0) => {
      const maxAttempts = 10;
      const pollInterval = 2000;

      if (attempts >= maxAttempts) {
        setStatus('timeout');
        return;
      }

      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${API_URL}/api/payments/status/${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check payment status');
        }

        const data = await response.json();
        setPaymentDetails(data);

        if (data.payment_status === 'paid') {
          setStatus('success');
          // Clear the cart after successful payment
          clearCart();
          window.dispatchEvent(new Event('cartUpdated'));
          return;
        } else if (data.status === 'expired') {
          setStatus('expired');
          return;
        }

        // Continue polling
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (attempts < maxAttempts - 1) {
          setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
        } else {
          setStatus('error');
        }
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
              <h1 className="heading-2">Processing Payment</h1>
              <p className="status-message">Please wait while we confirm your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="status-content success">
              <CheckCircle className="status-icon success-icon" size={64} />
              <h1 className="heading-2">Payment Successful!</h1>
              <p className="status-message">
                Thank you for your order. You will receive a confirmation email shortly.
              </p>
              {paymentDetails && (
                <div className="payment-details">
                  <p className="amount">
                    Total Paid: <strong>€{paymentDetails.amount_total.toFixed(2)}</strong>
                  </p>
                </div>
              )}
              <div className="action-buttons">
                <Link to="/products" className="btn-primary">
                  Continue Shopping
                </Link>
                <Link to="/profile" className="btn-secondary">
                  <Package size={18} />
                  View Orders
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="status-content error">
              <XCircle className="status-icon error-icon" size={64} />
              <h1 className="heading-2">Session Expired</h1>
              <p className="status-message">
                Your payment session has expired. Please try again.
              </p>
              <Link to="/cart" className="btn-primary">
                Return to Cart
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="status-content error">
              <XCircle className="status-icon error-icon" size={64} />
              <h1 className="heading-2">Something Went Wrong</h1>
              <p className="status-message">
                We couldn't verify your payment. If you were charged, please contact support.
              </p>
              <Link to="/cart" className="btn-primary">
                Return to Cart
              </Link>
            </div>
          )}

          {status === 'timeout' && (
            <div className="status-content">
              <Loader className="status-icon" size={64} />
              <h1 className="heading-2">Payment Processing</h1>
              <p className="status-message">
                Your payment is still being processed. Please check your email for confirmation or contact support.
              </p>
              <Link to="/" className="btn-primary">
                Return to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
