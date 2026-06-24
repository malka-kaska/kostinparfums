import React from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Pending', color: '#f59e0b' },
  { id: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
  { id: 'processing', label: 'Processing', color: '#8b5cf6' },
  { id: 'shipped', label: 'Shipped', color: '#06b6d4' },
  { id: 'delivered', label: 'Delivered', color: '#10b981' },
  { id: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];

const OrdersManager = ({ orders, onRefresh }) => {
  const { t } = useLanguage();

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
                  <span className="order-total-admin">&euro;{order.total?.toFixed(2)}</span>
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
                    <span>&euro;{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {order.shipping_cost > 0 && (
                <div className="order-shipping-admin">
                  <span>{t('shipping')}</span>
                  <span>&euro;{order.shipping_cost.toFixed(2)}</span>
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
