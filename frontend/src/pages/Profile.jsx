import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Phone, Package, LogOut, Plus, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    postalCode: '',
    country: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }

    // Load addresses from localStorage
    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    } else {
      const defaultAddresses = [
        {
          id: 1,
          label: 'Home',
          street: '123 Beauty Lane',
          city: 'Brussels',
          postalCode: '1000',
          country: 'Belgium',
          isDefault: true
        }
      ];
      setAddresses(defaultAddresses);
      localStorage.setItem('userAddresses', JSON.stringify(defaultAddresses));
    }
  }, [navigate, user, loading]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city || !newAddress.country) return;

    const address = {
      id: Date.now(),
      ...newAddress,
      isDefault: addresses.length === 0
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
    const updatedAddresses = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
  };

  // Mock order history
  const orders = [
    {
      id: 'KST-2024-001',
      date: '2024-12-15',
      total: 245.50,
      status: 'Delivered',
      items: [
        { name: 'Luxury Perfume', quantity: 1, price: 125.00 },
        { name: 'Skincare Set', quantity: 1, price: 98.00 },
        { name: 'Lip Gloss', quantity: 1, price: 22.50 }
      ]
    },
    {
      id: 'KST-2024-002',
      date: '2024-12-18',
      total: 189.00,
      status: 'Shipped',
      items: [
        { name: 'Foundation', quantity: 1, price: 54.00 },
        { name: 'Night Cream', quantity: 1, price: 135.00 }
      ]
    },
    {
      id: 'KST-2024-003',
      date: '2024-12-20',
      total: 325.75,
      status: 'Processing',
      items: [
        { name: 'Signature Fragrance', quantity: 1, price: 145.00 },
        { name: 'Hair Oil', quantity: 2, price: 62.00 },
        { name: 'Body Lotion', quantity: 1, price: 56.75 }
      ]
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page" data-testid="profile-page">
      <div className="container section-padding-small">
        <div className="page-header">
          <h1 className="section-title">MY ACCOUNT</h1>
          <p className="page-subtitle">
            Manage your account information, view order history, and manage shipping addresses
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs" data-testid="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            data-testid="tab-profile"
          >
            <User size={18} />
            <span>Profile</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            data-testid="tab-orders"
          >
            <Package size={18} />
            <span>Orders</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
            data-testid="tab-addresses"
          >
            <MapPin size={18} />
            <span>Addresses</span>
          </button>
        </div>

        <div className="profile-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content" data-testid="profile-section">
              <section className="profile-section">
                <div className="section-header-with-icon">
                  <User size={24} />
                  <h2 className="heading-2">Account Information</h2>
                </div>

                <div className="info-card">
                  <div className="info-row">
                    <div className="info-label">
                      <User size={16} />
                      <span>Full Name</span>
                    </div>
                    <div className="info-value" data-testid="profile-name">{user.name}</div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">
                      <Mail size={16} />
                      <span>Email</span>
                    </div>
                    <div className="info-value" data-testid="profile-email">{user.email}</div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">
                      <Phone size={16} />
                      <span>Phone</span>
                    </div>
                    <div className="info-value">+32 (0) 123 456 789</div>
                  </div>

                  {user.role === 'admin' && (
                    <div className="info-row">
                      <div className="info-label">
                        <Package size={16} />
                        <span>Role</span>
                      </div>
                      <div className="info-value admin-badge">Administrator</div>
                    </div>
                  )}
                </div>

                <div className="profile-actions">
                  <button className="action-button-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="tab-content" data-testid="orders-section">
              <section className="profile-section">
                <div className="section-header-with-icon">
                  <Package size={24} />
                  <h2 className="heading-2">Order History</h2>
                </div>

                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card" data-testid={`order-${order.id}`}>
                      <div className="order-header">
                        <div>
                          <p className="order-id">{order.id}</p>
                          <p className="order-date">
                            {new Date(order.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`order-status status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="order-items-list">
                        {order.items.map((item, index) => (
                          <div key={index} className="order-item-row">
                            <span className="item-name">{item.name} × {item.quantity}</span>
                            <span className="item-price">€{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer">
                        <span className="order-total-label">Total</span>
                        <span className="order-total">€{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="tab-content" data-testid="addresses-section">
              <section className="profile-section">
                <div className="section-header-with-icon">
                  <MapPin size={24} />
                  <h2 className="heading-2">Saved Addresses</h2>
                  <button
                    className="btn-add-address"
                    onClick={() => setShowAddAddress(true)}
                    data-testid="add-address-btn"
                  >
                    <Plus size={16} />
                    Add Address
                  </button>
                </div>

                {/* Add Address Form */}
                {showAddAddress && (
                  <div className="add-address-form" data-testid="add-address-form">
                    <h3 className="form-title">Add New Address</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Label</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Home, Work, etc."
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">Street Address *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="123 Beauty Lane"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Brussels"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Postal Code</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="1000"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Country *</label>
                        <select
                          className="form-input"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        >
                          <option value="">Select Country</option>
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
                        <Check size={16} />
                        Save Address
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setShowAddAddress(false);
                          setNewAddress({ label: '', street: '', city: '', postalCode: '', country: '' });
                        }}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Address Cards */}
                <div className="addresses-grid">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`address-card ${address.isDefault ? 'default' : ''}`}
                      data-testid={`address-${address.id}`}
                    >
                      {address.isDefault && (
                        <span className="default-badge">Default</span>
                      )}
                      <h4 className="address-label">{address.label || 'Address'}</h4>
                      <p className="address-details">
                        {address.street}<br />
                        {address.city}, {address.postalCode}<br />
                        {address.country}
                      </p>
                      <div className="address-actions">
                        {!address.isDefault && (
                          <button
                            className="btn-text"
                            onClick={() => handleSetDefaultAddress(address.id)}
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          className="btn-icon-danger"
                          onClick={() => handleDeleteAddress(address.id)}
                          data-testid={`delete-address-${address.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {addresses.length === 0 && (
                  <div className="empty-state">
                    <MapPin size={48} strokeWidth={1} />
                    <p>No addresses saved yet</p>
                    <button
                      className="btn-primary"
                      onClick={() => setShowAddAddress(true)}
                    >
                      Add Your First Address
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
