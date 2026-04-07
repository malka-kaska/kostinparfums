import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_OPTIONS = [
  { id: 'perfumes', name: 'Perfumes' },
  { id: 'makeup', name: 'Makeup' },
  { id: 'skincare', name: 'Skincare' },
  { id: 'haircare', name: 'Haircare' },
  { id: 'bodycare', name: 'Body Care' },
  { id: 'menscare', name: "Men's Care" },
];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', brand: '', category: '', price: '', description: '', image: '', stock: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/products?limit=200`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') fetchProducts();
  }, [user, fetchProducts]);

  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setIsCreating(false);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price.toString(),
      description: product.description,
      image: product.image,
      stock: product.stock.toString()
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingProduct(null);
    setFormData({
      name: '', brand: '', category: CATEGORY_OPTIONS[0].id,
      price: '', description: '',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      stock: ''
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        image: formData.image,
        stock: parseInt(formData.stock) || 0,
      };

      if (isCreating) {
        const res = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.detail || 'Failed to create product');
          return;
        }
        setIsCreating(false);
      } else {
        const res = await fetch(`${API_URL}/api/products/${editingProduct}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.detail || 'Failed to update product');
          return;
        }
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
    setFormData({ name: '', brand: '', category: '', price: '', description: '', image: '', stock: '' });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to delete product');
      }
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
            <h1 className="heading-1" data-testid="admin-heading">Admin Panel</h1>
            <p className="body-regular mt-2" style={{ color: 'var(--text-secondary)' }}>
              Manage products and inventory ({products.length} products)
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreate} data-testid="add-product-button">
            <Plus size={18} style={{ marginRight: '8px' }} />
            Add Product
          </button>
        </div>

        {(isCreating || editingProduct) && (
          <div className="product-form-modal">
            <div className="product-form">
              <div className="form-header">
                <h2 className="heading-3">
                  {isCreating ? 'Create New Product' : 'Edit Product'}
                </h2>
                <button className="icon-button" onClick={handleCancel}>
                  <X size={20} />
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    data-testid="product-name-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="form-input"
                    data-testid="product-brand-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                    data-testid="product-category-select"
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="form-input"
                    data-testid="product-price-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="form-input"
                    data-testid="product-stock-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="form-input"
                    data-testid="product-image-input"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-input"
                    rows="4"
                    data-testid="product-description-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} data-testid="save-product-button">
                  <Save size={18} style={{ marginRight: '8px' }} />
                  {saving ? 'Saving...' : (isCreating ? 'Create Product' : 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="products-table" data-testid="products-table">
          {products.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p className="body-large">No products yet. Click "Add Product" to create your first product.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} data-testid={`product-row-${product.id}`}>
                    <td>
                      <img src={product.image} alt={product.name} className="table-image" />
                    </td>
                    <td>
                      <div className="table-product-name">{product.name}</div>
                    </td>
                    <td>{product.brand}</td>
                    <td style={{ textTransform: 'capitalize' }}>{product.category}</td>
                    <td>€{product.price.toFixed(2)}</td>
                    <td>
                      <span className={`stock-badge ${product.stock < 20 ? 'low' : ''}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-button edit"
                          onClick={() => handleEdit(product)}
                          aria-label="Edit"
                          data-testid={`edit-product-${product.id}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-button delete"
                          onClick={() => handleDelete(product.id)}
                          aria-label="Delete"
                          data-testid={`delete-product-${product.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
