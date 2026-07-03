import React, { useState } from 'react';
import { Package, ChevronDown, XCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { formatDualPrice } from '../../../utils/currency';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_OPTIONS_BASE = [
  { id: 'pending', color: '#f59e0b' },
  { id: 'confirmed', color: '#3b82f6' },
  { id: 'processing', color: '#8b5cf6' },
  { id: 'shipped', color: '#06b6d4' },
  { id: 'delivered', color: '#10b981' },
  { id: 'cancellation_requested', color: '#d97706' },
  { id: 'cancelled', color: '#ef4444' },
];

const STATUS_LABELS = {
  bg: {
    'pending': 'Изчаква',
    'confirmed': 'Потвърдена',
    'processing': 'Обработва се',
    'shipped': 'Изпратена',
    'delivered': 'Доставена',
    'cancellation_requested': 'Заявка за отказ',
    'cancelled': 'Отказана'
  },
  en: {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancellation_requested': 'Cancel Requested',
    'cancelled': 'Cancelled'
  }
};

const OrdersManager = ({ orders, onRefresh }) => {
  const { t, language } = useLanguage();
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(null);
  const [syncingStatuses, setSyncingStatuses] = useState(false);

  // Get translated status options
  const STATUS_OPTIONS = STATUS_OPTIONS_BASE.map(opt => ({
    ...opt,
    label: STATUS_LABELS[language]?.[opt.id] || STATUS_LABELS['en'][opt.id]
  }));

  const getStatusLabel = (statusId) => {
    return STATUS_LABELS[language]?.[statusId] || STATUS_LABELS['en']?.[statusId] || statusId;
  };

  const handleSyncStatuses = async () => {
    setSyncingStatuses(true);
    try {
      const res = await fetch(`${API_URL}/api/speedy/sync-statuses`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const msg = language === 'bg' 
          ? `✅ Проверени: ${data.checked}, Обновени: ${data.updated}`
          : `✅ Checked: ${data.checked}, Updated: ${data.updated}`;
        alert(msg);
        if (data.updated > 0) {
          onRefresh?.();
        }
      } else {
        alert(`❌ ${data.detail || 'Error syncing statuses'}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSyncingStatuses(false);
    }
  };

  const handleCreateShipment = async (orderId) => {
    setCreatingShipment(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/admin/${orderId}/create-shipment`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Товарителница създадена: ${data.tracking_number}`);
        onRefresh?.();
      } else {
        alert(`❌ Грешка: ${data.detail || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`❌ Грешка: ${err.message}`);
    } finally {
      setCreatingShipment(null);
    }
  };

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
      {/* Sync statuses button */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSyncStatuses}
          disabled={syncingStatuses}
          style={{
            padding: '8px 16px',
            background: syncingStatuses ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: syncingStatuses ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          data-testid="sync-statuses-btn"
        >
          {syncingStatuses ? '⏳' : '🔄'} {language === 'bg' ? 'Синхронизирай статуси от Speedy' : 'Sync Speedy statuses'}
        </button>
      </div>
      
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
              
              {/* Tracking Info / Create Shipment */}
              <div className="order-tracking-section">
                {order.tracking_number ? (
                  <div className="tracking-info">
                    <span className="tracking-label">🚚 Товарителница:</span>
                    <a 
                      href={order.tracking_url || `https://www.speedy.bg/bg/track-shipment?shipmentNumber=${order.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tracking-link"
                    >
                      {order.tracking_number}
                    </a>
                  </div>
                ) : (
                  order.payment_method === 'cod' && order.speedy_data && (
                    <button
                      className="btn-create-shipment"
                      onClick={() => handleCreateShipment(order.id)}
                      disabled={creatingShipment === order.id}
                    >
                      {creatingShipment === order.id ? '⏳ Създаване...' : '📦 Създай товарителница'}
                    </button>
                  )
                )}
              </div>
              
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
