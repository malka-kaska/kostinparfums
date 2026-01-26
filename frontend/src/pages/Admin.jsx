import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { products as initialProducts, categories, brands, getCurrentUser } from '../mock';
import './Admin.css';

const Admin = () => {
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    description: '',
    image: '',
    stock: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/auth');
    }
  }, [navigate]);

  const handleEdit = (product) => {
    setEditingProduct(product.id);
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
    setFormData({
      name: '',
      brand: brands[0],
      category: categories[0].id,
      price: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      stock: ''
    });
  };

  const handleSave = () => {
    if (isCreating) {
      const newProduct = {
        id: Math.max(...products.map(p => p.id)) + 1,
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        image: formData.image,
        stock: parseInt(formData.stock)
      };
      setProducts([...products, newProduct]);
      setIsCreating(false);
      alert('Product created successfully! (Note: Changes are not persisted in mock mode)');
    } else {
      setProducts(products.map(p => 
        p.id === editingProduct 
          ? {
              ...p,
              name: formData.name,
              brand: formData.brand,
              category: formData.category,
              price: parseFloat(formData.price),
              description: formData.description,
              image: formData.image,
              stock: parseInt(formData.stock)
            }
          : p
      ));
      setEditingProduct(null);
      alert('Product updated successfully! (Note: Changes are not persisted in mock mode)');
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setIsCreating(false);
    setFormData({
      name: '',
      brand: '',
      category: '',
      price: '',
      description: '',
      image: '',
      stock: ''
    });
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted! (Note: Changes are not persisted in mock mode)');
    }
  };

  return (
    <div className="admin-page">
      <div className="container section-padding-small">
        <div className="admin-header">
          <div>
            <h1 className="heading-1">Admin Panel</h1>
            <p className="body-regular mt-2" style={{ color: 'var(--text-secondary)' }}>
              Manage products and inventory
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreate}>
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
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="form-input"
                  >
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input 
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input 
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-input"
                    rows="4"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave}>
                  <Save size={18} style={{ marginRight: '8px' }} />
                  {isCreating ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="products-table">
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
                <tr key={product.id}>
                  <td>
                    <img src={product.image} alt={product.name} className="table-image" />
                  </td>
                  <td>
                    <div className="table-product-name">{product.name}</div>
                  </td>
                  <td>{product.brand}</td>
                  <td style={{ textTransform: 'capitalize' }}>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
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
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={() => handleDelete(product.id)}
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
