import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, X, Package, ShoppingBag, ChevronDown, Eye, EyeOff, Upload, Loader, GripVertical, Search, Filter, Home, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Admin.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_OPTIONS = [
  { id: 'perfumes', name: 'Perfumes' },
];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', brand: '', category: '', price: '', description: '', description_bg: '', images: [], stock: '', gender: []
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Homepage management state
  const [heroSlides, setHeroSlides] = useState([]);
  const [featuredProductIds, setFeaturedProductIds] = useState([]);
  const [allProductsForSelection, setAllProductsForSelection] = useState([]);
  const [heroUploading, setHeroUploading] = useState(false);
  const [homepageSaving, setHomepageSaving] = useState(false);

  // Multiple image upload handler
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    setUploading(true);
    const newImages = [...formData.images];
    
    try {
      for (const file of files) {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          alert(`${file.name}: ${t('invalidImageType') || 'Invalid file type.'}`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name}: ${t('imageTooLarge') || 'Image too large. Maximum size is 10MB.'}`);
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const res = await fetch(`${API_URL}/api/upload/image`, {
          method: 'POST',
          credentials: 'include',
          body: formDataUpload,
        });

        if (res.ok) {
          const data = await res.json();
          newImages.push(data.url);
        } else {
          const err = await res.clone().json();
          alert(`${file.name}: ${err.detail || 'Upload failed'}`);
        }
      }
      
      setFormData(prev => ({ ...prev, images: newImages }));
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  // Remove image from list
  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...formData.images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    setFormData(prev => ({ ...prev, images: newImages }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // ========== HOMEPAGE MANAGEMENT FUNCTIONS ==========
  
  // Fetch homepage settings
  const fetchHomepageSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/homepage/settings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHeroSlides(data.hero_slides || []);
        setFeaturedProductIds(data.featured_product_ids || []);
      }
    } catch (err) {
      console.error('Failed to fetch homepage settings:', err);
    }
  }, []);

  // Upload hero image
  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHeroUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setHeroSlides(prev => [...prev, { image: data.url, alt: '' }]);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setHeroUploading(false);
      e.target.value = '';
    }
  };

  // Remove hero slide
  const handleRemoveHeroSlide = (index) => {
    setHeroSlides(prev => prev.filter((_, i) => i !== index));
  };

  // Reorder hero slides
  const moveHeroSlide = (fromIndex, toIndex) => {
    const newSlides = [...heroSlides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    setHeroSlides(newSlides);
  };

  // Save hero slides
  const saveHeroSlides = async () => {
    setHomepageSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage/hero-slides`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slides: heroSlides }),
      });
      if (res.ok) {
        alert(t('savedSuccessfully') || 'Saved successfully!');
      } else {
        alert('Save failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setHomepageSaving(false);
    }
  };

  // Toggle product in featured list
  const toggleFeaturedProduct = (productId) => {
    setFeaturedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Move featured product up/down
  const moveFeaturedProduct = (index, direction) => {
    const newIds = [...featuredProductIds];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newIds.length) return;
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setFeaturedProductIds(newIds);
  };

  // Save featured products
  const saveFeaturedProducts = async () => {
    setHomepageSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage/featured-products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_ids: featuredProductIds }),
      });
      if (res.ok) {
        alert(t('savedSuccessfully') || 'Saved successfully!');
      } else {
        alert('Save failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setHomepageSaving(false);
    }
  };

  // ========== END HOMEPAGE MANAGEMENT ==========

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

  // Filter states
  const [filterVisibility, setFilterVisibility] = useState('all'); // all, visible, hidden
  const [filterSort, setFilterSort] = useState('name'); // name, name-desc, price-low, price-high, best-sellers
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', PRODUCTS_PER_PAGE);
      params.set('page', page);
      
      if (filterVisibility !== 'all') {
        params.set('visibility', filterVisibility);
      }
      if (filterSort) {
        params.set('sort', filterSort);
      }
      if (filterSearch.trim()) {
        params.set('search', filterSearch.trim());
      }
      if (filterCategory !== 'all') {
        params.set('category', filterCategory);
      }
      
      const res = await fetch(`${API_URL}/api/products/admin/all?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotalProducts(data.total);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [page, filterVisibility, filterSort, filterSearch, filterCategory]);

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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterVisibility, filterSort, filterSearch, filterCategory]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
      fetchOrders();
      fetchHomepageSettings();
      // Also fetch all products for featured selection
      fetch(`${API_URL}/api/products/admin/all?limit=500`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setAllProductsForSelection(data.products || []))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, filterVisibility, filterSort, filterSearch, filterCategory]);

  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setIsCreating(false);
    // Use images array if available, otherwise convert legacy image field
    const images = product.images && product.images.length > 0 
      ? product.images 
      : (product.image ? [product.image] : []);
    setFormData({
      name: product.name, brand: product.brand, category: product.category,
      price: product.price.toString(), description: product.description || '',
      description_bg: product.description_bg || '',
      images: images, stock: product.stock.toString(),
      gender: product.gender || []
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingProduct(null);
    setFormData({
      name: '', brand: '', category: 'perfumes',
      price: '', description: '', description_bg: '',
      images: [],
      stock: '',
      gender: []
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name, brand: formData.brand, category: formData.category,
        price: parseFloat(formData.price), description: formData.description,
        description_bg: formData.description_bg || undefined,
        image: formData.images[0] || '',  // Legacy field - first image
        images: formData.images,  // New field - all images in order
        stock: parseInt(formData.stock) || 0,
        gender: formData.gender || [],
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
          <button
            className={`admin-tab ${activeTab === 'homepage' ? 'active' : ''}`}
            onClick={() => setActiveTab('homepage')}
            data-testid="admin-tab-homepage"
          >
            <Home size={18} />
            <span>{t('homepageTab') || 'Homepage'}</span>
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

            {/* Filters Section */}
            <div className="admin-filters" data-testid="admin-filters">
              <div className="filter-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder={t('searchProducts') || 'Search products...'}
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  data-testid="filter-search"
                />
              </div>
              
              <div className="filter-group">
                <Filter size={16} />
                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value)}
                  data-testid="filter-visibility"
                >
                  <option value="all">{t('allProducts') || 'All Products'}</option>
                  <option value="visible">{t('visibleOnly') || 'Visible Only'}</option>
                  <option value="hidden">{t('hiddenOnly') || 'Hidden Only'}</option>
                </select>
              </div>

              <div className="filter-group">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  data-testid="filter-category"
                >
                  <option value="all">{t('allCategories') || 'All Categories'}</option>
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <select
                  value={filterSort}
                  onChange={(e) => setFilterSort(e.target.value)}
                  data-testid="filter-sort"
                >
                  <option value="name">{t('sortAZ') || 'Name A-Z'}</option>
                  <option value="name-desc">{t('sortZA') || 'Name Z-A'}</option>
                  <option value="price-low">{t('sortPriceLow') || 'Price: Low to High'}</option>
                  <option value="price-high">{t('sortPriceHigh') || 'Price: High to Low'}</option>
                  <option value="best-sellers">{t('sortBestSellers') || 'Best Sellers'}</option>
                  <option value="newest">{t('sortNewest') || 'Newest First'}</option>
                </select>
              </div>

              {(filterVisibility !== 'all' || filterCategory !== 'all' || filterSearch) && (
                <button 
                  className="filter-clear"
                  onClick={() => {
                    setFilterVisibility('all');
                    setFilterCategory('all');
                    setFilterSearch('');
                    setFilterSort('name');
                  }}
                >
                  {t('clearFilters') || 'Clear Filters'}
                </button>
              )}
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
                    <div className="form-group image-upload-group">
                      <label className="form-label">{t('productImages') || 'Product Images'}</label>
                      <p className="form-hint">{t('dragToReorder') || 'Drag to reorder. First image is the main product image.'}</p>
                      
                      {/* Image gallery with drag and drop */}
                      <div className="images-gallery" data-testid="images-gallery">
                        {formData.images.map((img, index) => (
                          <div
                            key={index}
                            className={`gallery-item ${draggedIndex === index ? 'dragging' : ''} ${index === 0 ? 'main-image' : ''}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            data-testid={`gallery-item-${index}`}
                          >
                            <div className="gallery-item-drag">
                              <GripVertical size={16} />
                            </div>
                            <img src={img} alt={`Product ${index + 1}`} />
                            {index === 0 && <span className="main-badge">{t('mainImage') || 'Main'}</span>}
                            <button
                              type="button"
                              className="gallery-item-remove"
                              onClick={() => handleRemoveImage(index)}
                              aria-label="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add more images button */}
                        <label className="gallery-add-button" data-testid="upload-image-button">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            multiple
                            style={{ display: 'none' }}
                          />
                          {uploading ? (
                            <Loader size={24} className="spin" />
                          ) : (
                            <>
                              <Upload size={24} />
                              <span>{t('addImages') || 'Add Images'}</span>
                            </>
                          )}
                        </label>
                      </div>
                      
                      {/* URL input for adding image by URL */}
                      <div className="image-url-input">
                        <input
                          type="text"
                          className="form-input"
                          placeholder={t('imageUrlPlaceholder') || 'Paste image URL and press Enter...'}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              e.preventDefault();
                              setFormData(prev => ({
                                ...prev,
                                images: [...prev.images, e.target.value.trim()]
                              }));
                              e.target.value = '';
                            }
                          }}
                          data-testid="product-image-url-input"
                        />
                        <span className="url-hint">{t('pressEnterToAdd') || 'Press Enter to add'}</span>
                      </div>
                    </div>
                    <div className="form-group gender-group">
                      <label className="form-label">{t('targetAudience') || 'Target Audience'}</label>
                      <div className="gender-checkboxes">
                        <label className="gender-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.gender?.includes('women')}
                            onChange={(e) => {
                              const newGender = e.target.checked
                                ? [...(formData.gender || []), 'women']
                                : (formData.gender || []).filter(g => g !== 'women');
                              setFormData({ ...formData, gender: newGender });
                            }}
                            data-testid="gender-women-checkbox"
                          />
                          <span>{t('forWomen') || 'For Women'}</span>
                        </label>
                        <label className="gender-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.gender?.includes('men')}
                            onChange={(e) => {
                              const newGender = e.target.checked
                                ? [...(formData.gender || []), 'men']
                                : (formData.gender || []).filter(g => g !== 'men');
                              setFormData({ ...formData, gender: newGender });
                            }}
                            data-testid="gender-men-checkbox"
                          />
                          <span>{t('forMen') || 'For Men'}</span>
                        </label>
                      </div>
                      <p className="form-hint">{t('genderHint') || 'Select both for unisex products'}</p>
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

        {/* Homepage Management Tab */}
        {activeTab === 'homepage' && (
          <div className="homepage-management">
            {/* Hero Slides Section */}
            <div className="admin-section">
              <div className="admin-section-header">
                <h3>{t('heroSlides') || 'Hero Carousel Images'}</h3>
                <div className="section-actions">
                  <label className="btn-secondary upload-btn">
                    <Upload size={16} />
                    <span>{heroUploading ? (t('uploading') || 'Uploading...') : (t('addImage') || 'Add Image')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      disabled={heroUploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button 
                    className="btn-primary" 
                    onClick={saveHeroSlides}
                    disabled={homepageSaving}
                  >
                    <Save size={16} />
                    <span>{homepageSaving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}</span>
                  </button>
                </div>
              </div>
              
              <div className="hero-slides-grid">
                {heroSlides.map((slide, index) => (
                  <div key={index} className="hero-slide-card">
                    <div className="hero-slide-image">
                      <img src={slide.image} alt={slide.alt || `Slide ${index + 1}`} />
                    </div>
                    <div className="hero-slide-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => moveHeroSlide(index, -1)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => moveHeroSlide(index, 1)}
                        disabled={index === heroSlides.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => handleRemoveHeroSlide(index)}
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Image description (alt text)"
                      value={slide.alt}
                      onChange={(e) => {
                        const newSlides = [...heroSlides];
                        newSlides[index] = { ...slide, alt: e.target.value };
                        setHeroSlides(newSlides);
                      }}
                      className="hero-slide-alt-input"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Products Section */}
            <div className="admin-section">
              <div className="admin-section-header">
                <h3>{t('featuredProducts') || 'Featured Products (Homepage)'}</h3>
                <button 
                  className="btn-primary" 
                  onClick={saveFeaturedProducts}
                  disabled={homepageSaving}
                >
                  <Save size={16} />
                  <span>{homepageSaving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}</span>
                </button>
              </div>

              <p className="section-description">
                {t('featuredProductsDesc') || 'Select products to display in "New Arrivals" section on the homepage. Drag to reorder.'}
              </p>

              {/* Selected Featured Products */}
              {featuredProductIds.length > 0 && (
                <div className="featured-products-list">
                  <h4>{t('selectedProducts') || 'Selected Products'} ({featuredProductIds.length})</h4>
                  <div className="featured-items">
                    {featuredProductIds.map((productId, index) => {
                      const product = allProductsForSelection.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="featured-item">
                          <span className="featured-order">{index + 1}</span>
                          <img src={product.images?.[0] || product.image} alt={product.name} className="featured-thumb" />
                          <span className="featured-name">{product.name}</span>
                          <div className="featured-actions">
                            <button onClick={() => moveFeaturedProduct(index, -1)} disabled={index === 0}>↑</button>
                            <button onClick={() => moveFeaturedProduct(index, 1)} disabled={index === featuredProductIds.length - 1}>↓</button>
                            <button onClick={() => toggleFeaturedProduct(productId)} className="btn-remove">✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Selection */}
              <div className="product-selection">
                <h4>{t('availableProducts') || 'Available Products'}</h4>
                <div className="product-selection-grid">
                  {allProductsForSelection
                    .filter(p => p.is_visible && !featuredProductIds.includes(p.id))
                    .slice(0, 50)
                    .map(product => (
                      <div 
                        key={product.id} 
                        className="product-select-card"
                        onClick={() => toggleFeaturedProduct(product.id)}
                      >
                        <img src={product.images?.[0] || product.image} alt={product.name} />
                        <span>{product.name}</span>
                        <span className="product-brand">{product.brand}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
