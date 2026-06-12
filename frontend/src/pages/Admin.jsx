import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, X, Package, ShoppingBag, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Admin.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', brand: '', category: '', price: '', description: '', description_bg: '', image: '', stock: ''
  });
  const navigate = useNavigate();
  const { t } = useLanguage();

  const CATEGORY_OPTIONS = [
    { id: 'perfumes', name: t('perfumes') },
    { id: 'makeup', name: t('makeup') },
    { id: 'skincare', name: t('skincare') },
    { id: 'haircare', name: t('haircare') },
    { id: 'bodycare', name: t('bodyCare') },
    { id: 'menscare', name: t('mensCare') },
  ];

  const STATUS_OPTIONS = [
    { id: 'pending', label: 'Pending', color: '#f59e0b' },
    { id: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
    { id: 'processing', label: 'Processing', color: '#8b5cf6' },
    { id: 'shipped', label: 'Shipped', color: '#06b6d4' },
    { id: 'delivered', label: 'Delivered', color: '#10b981' },
    { id: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  ];

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PRODUCTS_PER_PAGE = 50;

  const fetchProducts = useCallback(async () => {
    try {
      // Use admin endpoint to get ALL products including hidden ones
      const res = await fetch(`${API_URL}/api/products/admin/all?limit=${PRODUCTS_PER_PAGE}&page=${page}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotalProducts(data.total);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [page]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders?limit=100`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setIsCreating(false);
    setFormData({
      name: product.name, brand: product.brand, category: product.category,
      price: product.price.toString(), description: product.description || '',
      description_bg: product.description_bg || '',
      image: product.image, stock: product.stock.toString()
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingProduct(null);
    setFormData({
      name: '', brand: '', category: 'perfumes',
      price: '', description: '', description_bg: '',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      stock: ''
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name, brand: formData.brand, category: formData.category,
        price: parseFloat(formData.price), description: formData.description,
        description_bg: formData.description_bg || undefined,
        image: formData.image, stock: parseInt(formData.stock) || 0,
      };

      if (isCreating) {
        const res = await fetch(`${API_URL}/api/products`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          credentials: 'include', body: JSON.stringify(payload),
        });
        if (!res.ok) { const err = await res.json(); alert(err.detail || 'Failed'); return; }
        setIsCreating(false);
      } else {
        const res = await fetch(`${API_URL}/api/products/${editingProduct}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          credentials: 'include', body: JSON.stringify(payload),
        });
        if (!res.ok) { const err = await res.json(); alert(err.detail || 'Failed'); return; }
        setEditingProduct(null);
      }
      fetchProducts();
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setIsCreating(false);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchProducts();
      else { const err = await res.json(); alert(err.detail || 'Failed'); }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  const handleToggleVisibility = async (productId, currentVisibility) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_visible: !currentVisibility }),
      });
      if (res.ok) {
        fetchProducts();
      } else {
        const err = await res.clone().json();
        alert(err.detail || 'Failed to toggle visibility');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
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
      if (res.ok) fetchOrders();
      else { const err = await res.json(); alert(err.detail || 'Failed'); }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  if (authLoading) return null;

  return (
    <div className="admin-page">
      <div className="container section-padding-small">
        <div className="admin-header">
          <div>
            <h1 className="heading-1" data-testid="admin-heading">{t('adminTitle')}</h1>
          </div>
        </div>

        <div className="admin-tabs" data-testid="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
            data-testid="admin-tab-products"
          >
            <ShoppingBag size={18} />
            <span>{t('product')} ({totalProducts})</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            data-testid="admin-tab-orders"
          >
            <Package size={18} />
            <span>{t('ordersTab')} ({orders.length})</span>
          </button>
        </div>

        {activeTab === 'products' && (
          <>
            <div className="admin-section-header">
              <p className="body-regular" style={{ color: 'var(--text-secondary)' }}>
                {t('manageProducts', { count: totalProducts })}
              </p>
              <button className="btn-primary" onClick={handleCreate} data-testid="add-product-button">
                <Plus size={18} style={{ marginRight: '8px' }} />
                {t('addProduct')}
              </button>
            </div>

            {(isCreating || editingProduct) && (
              <div className="product-form-modal">
                <div className="product-form">
                  <div className="form-header">
                    <h2 className="heading-3">
                      {isCreating ? t('createNewProduct') : t('editProduct')}
                    </h2>
                    <button className="icon-button" onClick={handleCancel}><X size={20} /></button>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">{t('productName')}</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" data-testid="product-name-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('brand')}</label>
                      <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="form-input" data-testid="product-brand-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('category')}</label>
                      <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input" data-testid="product-category-select">
                        {CATEGORY_OPTIONS.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('priceEur')}</label>
                      <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="form-input" data-testid="product-price-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('stock')}</label>
                      <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="form-input" data-testid="product-stock-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('imageUrl')}</label>
                      <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="form-input" data-testid="product-image-input" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">{t('description')} (EN)</label>
                      <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-input" rows="3" data-testid="product-description-input" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">{t('description')} (BG)</label>
                      <textarea value={formData.description_bg} onChange={(e) => setFormData({ ...formData, description_bg: e.target.value })} className="form-input" rows="3" data-testid="product-description-bg-input" />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-secondary" onClick={handleCancel}>{t('cancel')}</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving} data-testid="save-product-button">
                      <Save size={18} style={{ marginRight: '8px' }} />
                      {saving ? t('saving') : (isCreating ? t('createProductBtn') : t('saveChanges'))}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="products-table" data-testid="products-table">
              {products.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p className="body-large">{t('noProductsYet')}</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>{t('image')}</th>
                      <th>{t('product')}</th>
                      <th>{t('brand')}</th>
                      <th>{t('category')}</th>
                      <th>{t('price')}</th>
                      <th>{t('stock')}</th>
                      <th>{t('visibility')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} data-testid={`product-row-${product.id}`} className={!product.is_visible ? 'hidden-product' : ''}>
                        <td><img src={product.image} alt={product.name} className="table-image" /></td>
                        <td><div className="table-product-name">{product.name}</div></td>
                        <td>{product.brand}</td>
                        <td style={{ textTransform: 'capitalize' }}>{product.category}</td>
                        <td>&euro;{product.price.toFixed(2)}</td>
                        <td><span className={`stock-badge ${product.stock < 20 ? 'low' : ''}`}>{product.stock}</span></td>
                        <td>
                          <button
                            className={`visibility-toggle ${product.is_visible ? 'visible' : 'hidden'}`}
                            onClick={() => handleToggleVisibility(product.id, product.is_visible)}
                            title={product.is_visible ? t('hideProduct') : t('showProduct')}
                            data-testid={`visibility-toggle-${product.id}`}
                          >
                            {product.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="action-button edit" onClick={() => handleEdit(product)} aria-label="Edit" data-testid={`edit-product-${product.id}`}><Edit size={16} /></button>
                            <button className="action-button delete" onClick={() => handleDelete(product.id)} aria-label="Delete" data-testid={`delete-product-${product.id}`}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" data-testid="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  &laquo; {t('prevPage') || 'Prev'}
                </button>
                <span className="pagination-info">
                  {t('pageOf') || 'Page'} {page} / {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('nextPage') || 'Next'} &raquo;
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
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
        )}
      </div>
    </div>
  );
};

export default Admin;
