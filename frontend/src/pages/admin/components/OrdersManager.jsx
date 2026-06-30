import React, { useState } from 'react';
import { Package, ChevronDown, XCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { formatDualPrice } from '../../../utils/currency';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Pending', color: '#f59e0b' },
  { id: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
  { id: 'processing', label: 'Processing', color: '#8b5cf6' },
  { id: 'shipped', label: 'Shipped', color: '#06b6d4' },
  { id: 'delivered', label: 'Delivered', color: '#10b981' },
  { id: 'cancellation_requested', label: 'Cancel Requested', color: '#d97706' },
  { id: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];

const OrdersManager = ({ orders, onRefresh }) => {
  const { t, language } = useLanguage();
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onRefresh();
      else { const err = await res.json(); alert(err.detail || 'Failed'); }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  const handleAdminCancelOrder = async () => {
    if (!cancelOrderId || !cancelReason.trim()) {
      alert(language === 'bg' ? 'Моля, въведете причина' : 'Please enter a reason');
      return;
    }
    
    setIsCancelling(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/admin/${cancelOrderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (res.ok) {
        setCancelOrderId(null);
        setCancelReason('');
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to cancel order');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="orders-management" data-testid="orders-management">
      {orders.length === 0 ? (
        <div className="empty-orders">
          <Package size={48} strokeWidth={1} />
          <p className="body-large mt-3" style={{ color: 'var(--text-secondary)' }}>
            No orders yet
          </p>
        </div>
      ) : (
        <div className="orders-list-admin">
          {orders.map(order => (
            <div key={order.id} className="order-card-admin" data-testid={`order-${order.id}`}>
              <div className="order-card-header">
                <div className="order-info-left">
                  <span className="order-id-admin">#{order.id.slice(-8).toUpperCase()}</span>
                  <span className="order-date-admin">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                <div className="order-info-right">
                  <span className="order-total-admin">{formatDualPrice(order.total)}</span>
                  <div className="status-selector">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      className="status-select"
                      data-testid={`order-status-${order.id}`}
                      style={{ borderColor: STATUS_OPTIONS.find(s => s.id === order.status)?.color || '#999' }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="status-chevron" />
                  </div>
                </div>
              </div>
              <div className="order-customer">
                {order.user_email && <span>{order.user_name || order.user_email}</span>}
                {order.user_email && order.user_name && <span className="order-email-small">{order.user_email}</span>}
              </div>
              <div className="order-items-admin">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="order-item-admin">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatDualPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {order.shipping_cost > 0 && (
                <div className="order-shipping-admin">
                  <span>{t('shipping')}</span>
                  <span>{formatDualPrice(order.shipping_cost)}</span>
                </div>
              )}
              
              {/* Cancellation Request Alert */}
              {order.status === 'cancellation_requested' && (
                <div className="cancellation-alert">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>Заявка за отказ</strong>
                    {order.cancellation_reason && <p>Причина: &ldquo;{order.cancellation_reason}&rdquo;</p>}
                  </div>
                </div>
              )}
              
              {/* Admin Cancel Button */}
              {!['cancelled', 'delivered'].includes(order.status) && (
                <div className="admin-cancel-section">
                  {cancelOrderId === order.id ? (
                    <div className="admin-cancel-form">
                      <p className="admin-cancel-title">Защо отказвате тази поръчка?</p>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Опишете накратко причината за отказ..."
                        className="cancel-reason-input-admin"
                        rows={3}
                      />
                      <div className="admin-cancel-actions">
                        <button 
                          onClick={handleAdminCancelOrder}
                          disabled={isCancelling || !cancelReason.trim()}
                          className="btn-admin-cancel-confirm"
                        >
                          {isCancelling ? '...' : 'Потвърди отказ'}
                        </button>
                        <button 
                          onClick={() => { setCancelOrderId(null); setCancelReason(''); }}
                          className="btn-admin-cancel-back"
                        >
                          Назад
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="btn-admin-cancel"
                      onClick={() => setCancelOrderId(order.id)}
                    >
                      <XCircle size={14} />
                      Откажи поръчката
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
