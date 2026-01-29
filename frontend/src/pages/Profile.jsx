import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Phone, Package, LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../mock';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/auth');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Mock order history
  const orders = [
    {
      id: 'ORD-2024-001',
      date: '2024-01-15',
      total: 245.50,
      status: 'Delivered',
      items: 3
    },
    {
      id: 'ORD-2024-002',
      date: '2024-01-20',
      total: 189.00,
      status: 'Shipped',
      items: 2
    },
    {
      id: 'ORD-2024-003',
      date: '2024-01-25',
      total: 325.75,
      status: 'Processing',
      items: 5
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="container section-padding-small">
        <div className="page-header">
          <h1 className="section-title">MY PROFILE</h1>
          <p className="page-subtitle">
            Manage your account information and view your order history
          </p>
        </div>

        <div className="profile-layout">
          {/* Account Information */}
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
                <div className="info-value">{user.name}</div>
              </div>
              
              <div className="info-row">
                <div className="info-label">
                  <Mail size={16} />
                  <span>Email</span>
                </div>
                <div className="info-value">{user.email}</div>
              </div>
              
              <div className="info-row">
                <div className="info-label">
                  <Phone size={16} />
                  <span>Phone</span>
                </div>
                <div className="info-value">+32 (0) 123 456 789</div>
              </div>
              
              <div className="info-row">
                <div className="info-label">
                  <MapPin size={16} />
                  <span>Address</span>
                </div>
                <div className="info-value">Brussels, Belgium</div>
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

            <button className="btn-secondary mt-4">
              Edit Profile
            </button>
          </section>

          {/* Order History */}
          <section className="profile-section">
            <div className="section-header-with-icon">
              <Package size={24} />
              <h2 className="heading-2">Order History</h2>
            </div>
            
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <p className="order-id">{order.id}</p>
                      <p className="order-date">{new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <span className={`order-status status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <div className="order-info">
                      <span>{order.items} items</span>
                      <span className="order-total">€{order.total.toFixed(2)}</span>
                    </div>
                    <button className="btn-secondary btn-small">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Account Actions */}
          <section className="profile-section">
            <div className="account-actions">
              <button className="action-button" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;