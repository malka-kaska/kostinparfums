import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Phone, Package, LogOut, Plus, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Profile.css';

const Profile = () => {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '', street: '', city: '', postalCode: '', country: ''
  });
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    } else {
      const defaultAddresses = [{
        id: 1, label: 'Home', street: '123 Beauty Lane',
        city: 'Brussels', postalCode: '1000', country: 'Belgium', isDefault: true
      }];
      setAddresses(defaultAddresses);
      localStorage.setItem('userAddresses', JSON.stringify(defaultAddresses));
    }
    // Fetch user orders
    const fetchOrders = async () => {
      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const res = await fetch(`${API_URL}/api/orders`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        }
      } catch {}
    };
    if (user) fetchOrders();
  }, [navigate, user, loading]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city || !newAddress.country) return;
    const address = {
      id: Date.now(), ...newAddress, isDefault: addresses.length === 0
    };
    const updatedAddresses = [...addresses, address];
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    setNewAddress({ label: '', street: '', city: '', postalCode: '', country: '' });
    setShowAddAddress(false);
  };

  const handleDeleteAddress = (id) => {
    const updatedAddresses = addresses.filter(a => a.id !== id);
    if (updatedAddresses.length > 0 && !updatedAddresses.some(a => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
  };

  const handleSetDefaultAddress = (id) => {
    const updatedAddresses = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
  };

  if (!user) return null;

  return (
    <div className="profile-page" data-testid="profile-page">
      <div className="container section-padding-small">
        <div className="page-header">
          <h1 className="section-title">{t('profileTitle')}</h1>
          <p className="page-subtitle">{t('profileSubtitle')}</p>
        </div>

        <div className="profile-tabs" data-testid="profile-tabs">
          <button className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} data-testid="tab-profile">
            <User size={18} /><span>{t('profileTab')}</span>
          </button>
          <button className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')} data-testid="tab-orders">
            <Package size={18} /><span>{t('ordersTab')}</span>
          </button>
          <button className={`profile-tab ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')} data-testid="tab-addresses">
            <MapPin size={18} /><span>{t('addressesTab')}</span>
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="tab-content" data-testid="profile-section">
              <section className="profile-section">
                <div className="section-header-with-icon">
                  <User size={24} />
                  <h2 className="heading-2">{t('accountInfo')}</h2>
                </div>
                <div className="info-card">
                  <div className="info-row">
                    <div className="info-label"><User size={16} /><span>{t('fullNameLabel')}</span></div>
                    <div className="info-value" data-testid="profile-name">{user.name}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label"><Mail size={16} /><span>{t('email')}</span></div>
                    <div className="info-value" data-testid="profile-email">{user.email}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label"><Phone size={16} /><span>{t('phone')}</span></div>
                    <div className="info-value">+32 (0) 123 456 789</div>
                  </div>
                  {user.role === 'admin' && (
                    <div className="info-row">
                      <div className="info-label"><Package size={16} /><span>{t('role')}</span></div>
                      <div className="info-value admin-badge">{t('administrator')}</div>
                    </div>
                  )}
                </div>
                <div className="profile-actions">
                  <button className="action-button-logout" onClick={handleLogout}>
                    <LogOut size={16} /><span>{t('logout')}</span>
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="tab-content" data-testid="orders-section">
              <section className="profile-section">
                <div className="section-header-with-icon">
                  <Package size={24} />
                  <h2 className="heading-2">{t('orderHistory')}</h2>
                </div>
                {orders.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Package size={48} strokeWidth={1} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
                    <p className="body-regular" style={{ color: 'var(--text-secondary)' }}>{t('noOrders')}</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div key={order.id} className="order-card" data-testid={`order-${order.id}`}>
                        <div className="order-header">
                          <div>
                            <p className="order-id">#{order.id.slice(-8).toUpperCase()}</p>
                            <p className="order-date">
                              {order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                            </p>
                          </div>
                          <span className={`order-status status-${(order.status || 'pending').toLowerCase()}`}>{order.status}</span>
                        </div>
                        <div className="order-items-list">
                          {(order.items || []).map((item, index) => (
                            <div key={index} className="order-item-row">
                              <span className="item-name">{item.name} x {item.quantity}</span>
                              <span className="item-price">&euro;{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Tracking Information */}
                        {order.tracking_number && (
                          <div className="order-tracking">
                            <div className="tracking-info">
                              <Package size={16} />
                              <span className="tracking-label">{t('trackingNumber') || 'Проследяване'}:</span>
                              <span className="tracking-number">{order.tracking_number}</span>
                            </div>
                            <a 
                              href={order.tracking_url || `https://www.speedy.bg/bg/track-shipment?shipmentNumber=${order.tracking_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-track"
                            >
                              {t('trackShipment') || 'Проследи пратката'}
                            </a>
                          </div>
                        )}
                        
                        <div className="order-footer">
                          <span className="order-total-label">{t('total')}</span>
                          <span className="order-total">&euro;{(order.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="tab-content" data-testid="addresses-section">
              <section className="profile-section">
                <div className="section-header-with-icon">
                  <MapPin size={24} />
                  <h2 className="heading-2">{t('savedAddresses')}</h2>
                  <button className="btn-add-address" onClick={() => setShowAddAddress(true)} data-testid="add-address-btn">
                    <Plus size={16} />{t('addAddress')}
                  </button>
                </div>

                {showAddAddress && (
                  <div className="add-address-form" data-testid="add-address-form">
                    <h3 className="form-title">{t('addNewAddress')}</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">{t('addressLabel')}</label>
                        <input type="text" className="form-input" placeholder={t('labelPlaceholder')} value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">{t('street')} *</label>
                        <input type="text" className="form-input" placeholder={t('streetPlaceholder')} value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('city')} *</label>
                        <input type="text" className="form-input" placeholder={t('cityPlaceholder')} value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('postalCode')}</label>
                        <input type="text" className="form-input" placeholder={t('postalCodePlaceholder')} value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('country')} *</label>
                        <select className="form-input" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}>
                          <option value="">{t('selectCountry')}</option>
                          <option value="Belgium">Belgium</option>
                          <option value="France">France</option>
                          <option value="Germany">Germany</option>
                          <option value="Netherlands">Netherlands</option>
                          <option value="Italy">Italy</option>
                          <option value="Spain">Spain</option>
                          <option value="Portugal">Portugal</option>
                          <option value="Austria">Austria</option>
                          <option value="Bulgaria">Bulgaria</option>
                          <option value="Other EU">Other EU Country</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button className="btn-primary" onClick={handleAddAddress} data-testid="save-address-btn">
                        <Check size={16} />{t('saveAddress')}
                      </button>
                      <button className="btn-secondary" onClick={() => { setShowAddAddress(false); setNewAddress({ label: '', street: '', city: '', postalCode: '', country: '' }); }}>
                        <X size={16} />{t('cancel')}
                      </button>
                    </div>
                  </div>
                )}

                <div className="addresses-grid">
                  {addresses.map((address) => (
                    <div key={address.id} className={`address-card ${address.isDefault ? 'default' : ''}`} data-testid={`address-${address.id}`}>
                      {address.isDefault && <span className="default-badge">{t('defaultAddress')}</span>}
                      <h4 className="address-label">{address.label || t('addressLabel')}</h4>
                      <p className="address-details">
                        {address.street}<br />
                        {address.city}, {address.postalCode}<br />
                        {address.country}
                      </p>
                      <div className="address-actions">
                        {!address.isDefault && (
                          <button className="btn-text" onClick={() => handleSetDefaultAddress(address.id)}>
                            {t('setAsDefault')}
                          </button>
                        )}
                        <button className="btn-icon-danger" onClick={() => handleDeleteAddress(address.id)} data-testid={`delete-address-${address.id}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {addresses.length === 0 && (
                  <div className="empty-state">
                    <MapPin size={48} strokeWidth={1} />
                    <p>{t('noAddressesSaved')}</p>
                    <button className="btn-primary" onClick={() => setShowAddAddress(true)}>
                      {t('addFirstAddress')}
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
