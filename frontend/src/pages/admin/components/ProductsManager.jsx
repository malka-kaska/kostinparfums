import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Upload, Loader, GripVertical, Search, Filter, Wand2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { formatDualPrice } from '../../../utils/currency';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_OPTIONS_BASE = [
  { id: 'perfumes', name: 'Perfumes' },
];

const ProductsManager = ({ collections }) => {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', brand: '', category: '', price: '', original_price: '', description: '', description_bg: '', images: [], stock: '', gender: [], collections: ['all_products'], scent_profiles: [], related_product_ids: []
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [relatedSearch, setRelatedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PRODUCTS_PER_PAGE = 50;

  // Filters
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [filterSort, setFilterSort] = useState('name');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterScentProfile, setFilterScentProfile] = useState('all'); // 'all', 'with', 'without'

  // Scent profile options
  const SCENT_PROFILE_OPTIONS = [
    { key: 'sweet', label: t('scentSweet') || 'Сладки' },
    { key: 'fresh', label: t('scentFresh') || 'Свежи' },
    { key: 'citrus', label: t('scentCitrus') || 'Цитрусови' },
    { key: 'fruity', label: t('scentFruity') || 'Плодови' },
    { key: 'floral', label: t('scentFloral') || 'Флорални' },
    { key: 'woody', label: t('scentWoody') || 'Дървесни' },
    { key: 'spicy', label: t('scentSpicy') || 'Пикантни' },
    { key: 'aquatic', label: t('scentAquatic') || 'Водни' },
    { key: 'musky', label: t('scentMusky') || 'Мускусни' },
    { key: 'leather', label: t('scentLeather') || 'Кожени' },
    { key: 'tobacco', label: t('scentTobacco') || 'Тютюневи' },
    { key: 'oriental', label: t('scentOriental') || 'Ориенталски' },
    { key: 'vanilla', label: t('scentVanilla') || 'Ванилови' },
  ];

  const CATEGORY_OPTIONS = [
    { id: 'perfumes', name: t('perfumes') },
    { id: 'makeup', name: t('makeup') },
    { id: 'skincare', name: t('skincare') },
    { id: 'haircare', name: t('haircare') },
    { id: 'bodycare', name: t('bodyCare') },
    { id: 'menscare', name: t('mensCare') },
  ];

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', PRODUCTS_PER_PAGE);
      params.set('page', page);
      if (filterVisibility !== 'all') params.set('visibility', filterVisibility);
      if (filterSort) params.set('sort', filterSort);
      if (filterSearch.trim()) params.set('search', filterSearch.trim());
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (filterScentProfile !== 'all') params.set('scent_profile_filter', filterScentProfile);
      
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
  }, [page, filterVisibility, filterSort, filterSearch, filterCategory, filterScentProfile]);

  useEffect(() => { setPage(1); }, [filterVisibility, filterSort, filterSearch, filterCategory, filterScentProfile]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Load all products (lightweight) once for the related-products picker
  const [allProducts, setAllProducts] = useState([]);
  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/admin/all?limit=10000`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAllProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to load all products for related picker:', err);
      }
    };
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Image upload handlers
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    setUploading(true);
    const newImages = [...formData.images];
    
    try {
      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          alert(`${file.name}: ${t('invalidImageType') || 'Invalid file type.'}`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name}: ${t('imageTooLarge') || 'Image too large. Maximum size is 10MB.'}`);
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const res = await fetch(`${API_URL}/api/upload/image`, {
          method: 'POST', credentials: 'include', body: formDataUpload,
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
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // Drag handlers
  const handleDragStart = (index) => setDraggedIndex(index);
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
  const handleDragEnd = () => setDraggedIndex(null);

  // CRUD handlers
  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setIsCreating(false);
    const images = product.images?.length > 0 ? product.images : (product.image ? [product.image] : []);
    setFormData({
      name: product.name, brand: product.brand, category: product.category,
      price: product.price.toString(), 
      original_price: product.original_price ? product.original_price.toString() : '',
      description: product.description || '',
      description_bg: product.description_bg || '', images, stock: product.stock.toString(),
      gender: product.gender || [], collections: product.collections || ['all_products'],
      scent_profiles: product.scent_profiles || [],
      related_product_ids: product.related_product_ids || []
    });
    setRelatedSearch('');
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingProduct(null);
    setFormData({
      name: '', brand: '', category: 'perfumes', price: '', original_price: '', description: '', description_bg: '',
      images: [], stock: '', gender: [], collections: ['all_products'], scent_profiles: [], related_product_ids: []
    });
    setRelatedSearch('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name, brand: formData.brand, category: formData.category,
        price: parseFloat(formData.price), description: formData.description,
        description_bg: formData.description_bg || undefined,
        image: formData.images[0] || '', images: formData.images,
        stock: parseInt(formData.stock) || 0, gender: formData.gender || [],
        collections: formData.collections || ['all_products'],
        scent_profiles: formData.scent_profiles || [],
        related_product_ids: formData.related_product_ids || [],
      };
      
      // Handle original_price for discounts
      if (formData.original_price && parseFloat(formData.original_price) > 0) {
        payload.original_price = parseFloat(formData.original_price);
      } else {
        payload.original_price = null; // Remove discount
      }

      const url = isCreating ? `${API_URL}/api/products` : `${API_URL}/api/products/${editingProduct}`;
      const method = isCreating ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload),
      });
      
      if (!res.ok) { const err = await res.json(); alert(err.detail || 'Failed'); return; }
      setIsCreating(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { setEditingProduct(null); setIsCreating(false); };

  const [aiGenerating, setAiGenerating] = useState({ bg: false, en: false });

  const handleAiGenerate = async (language) => {
    if (!editingProduct) {
      alert(lang === 'bg' ? 'Първо запази продукта' : 'Save the product first');
      return;
    }
    setAiGenerating(prev => ({ ...prev, [language]: true }));
    try {
      const res = await fetch(`${API_URL}/api/ai-descriptions/product/${editingProduct}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: [language], force: true }),
      });
      if (res.ok) {
        const data = await res.json();
        const result = data?.results?.[language];
        if (result?.text) {
          if (language === 'bg') {
            setFormData(prev => ({ ...prev, description_bg: result.text }));
          } else {
            setFormData(prev => ({ ...prev, description: result.text }));
          }
        } else if (result?.error) {
          alert('AI error: ' + result.error);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'AI generation failed');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setAiGenerating(prev => ({ ...prev, [language]: false }));
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchProducts();
      else { const err = await res.json(); alert(err.detail || 'Failed'); }
    } catch (err) { alert('Network error: ' + err.message); }
  };

  const handleToggleVisibility = async (productId, currentVisibility) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}/visibility`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ is_visible: !currentVisibility }),
      });
      if (res.ok) fetchProducts();
      else { const err = await res.clone().json(); alert(err.detail || 'Failed'); }
    } catch (err) { alert('Network error: ' + err.message); }
  };

  return (
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

      {/* Filters */}
      <div className="admin-filters" data-testid="admin-filters">
        <div className="filter-search">
          <Search size={18} />
          <input type="text" placeholder={t('searchProducts') || 'Search products...'} value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)} data-testid="filter-search" />
        </div>
        <div className="filter-group">
          <Filter size={16} />
          <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} data-testid="filter-visibility">
            <option value="all">{t('allProducts') || 'All Products'}</option>
            <option value="visible">{t('visibleOnly') || 'Visible Only'}</option>
            <option value="hidden">{t('hiddenOnly') || 'Hidden Only'}</option>
          </select>
        </div>
        <div className="filter-group">
          <select value={filterScentProfile} onChange={(e) => setFilterScentProfile(e.target.value)} data-testid="filter-scent-profile">
            <option value="all">{t('allScentProfiles') || 'Всички профили'}</option>
            <option value="with">{t('withScentProfile') || 'С профил'}</option>
            <option value="without">{t('withoutScentProfile') || 'Без профил'}</option>
          </select>
        </div>
        <div className="filter-group">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} data-testid="filter-category">
            <option value="all">{t('allCategories') || 'All Categories'}</option>
            {CATEGORY_OPTIONS.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
          </select>
        </div>
        <div className="filter-group">
          <select value={filterSort} onChange={(e) => setFilterSort(e.target.value)} data-testid="filter-sort">
            <option value="name">{t('sortAZ') || 'Name A-Z'}</option>
            <option value="name-desc">{t('sortZA') || 'Name Z-A'}</option>
            <option value="price-low">{t('sortPriceLow') || 'Price: Low to High'}</option>
            <option value="price-high">{t('sortPriceHigh') || 'Price: High to Low'}</option>
            <option value="best-sellers">{t('sortBestSellers') || 'Best Sellers'}</option>
            <option value="newest">{t('sortNewest') || 'Newest First'}</option>
          </select>
        </div>
        {(filterVisibility !== 'all' || filterCategory !== 'all' || filterSearch || filterScentProfile !== 'all') && (
          <button className="filter-clear" onClick={() => { setFilterVisibility('all'); setFilterCategory('all'); setFilterSearch(''); setFilterSort('name'); setFilterScentProfile('all'); }}>
            {t('clearFilters') || 'Clear Filters'}
          </button>
        )}
      </div>

      {/* Product Form Modal */}
      {(isCreating || editingProduct) && (
        <div className="product-form-modal">
          <div className="product-form">
            <div className="form-header">
              <h2 className="heading-3">{isCreating ? t('createNewProduct') : t('editProduct')}</h2>
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
                  {CATEGORY_OPTIONS.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('priceEur')}</label>
                <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="form-input" data-testid="product-price-input" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('originalPrice') || 'Оригинална цена (преди отстъпка)'}</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.original_price} 
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} 
                  className="form-input" 
                  placeholder={t('leaveEmptyForNoDiscount') || 'Остави празно ако няма отстъпка'}
                  data-testid="product-original-price-input" 
                />
                {formData.original_price && parseFloat(formData.original_price) > parseFloat(formData.price) && (
                  <span className="discount-preview">
                    -{Math.round((1 - parseFloat(formData.price) / parseFloat(formData.original_price)) * 100)}% отстъпка
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{t('stock')}</label>
                <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="form-input" data-testid="product-stock-input" />
              </div>
              
              {/* Images */}
              <div className="form-group image-upload-group">
                <label className="form-label">{t('productImages') || 'Product Images'}</label>
                <p className="form-hint">{t('dragToReorder') || 'Drag to reorder. First image is the main product image.'}</p>
                <div className="images-gallery" data-testid="images-gallery">
                  {formData.images.map((img, index) => (
                    <div key={index} className={`gallery-item ${draggedIndex === index ? 'dragging' : ''} ${index === 0 ? 'main-image' : ''}`}
                      draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd}>
                      <div className="gallery-item-drag"><GripVertical size={16} /></div>
                      <img src={img} alt={`Product ${index + 1}`} />
                      {index === 0 && <span className="main-badge">{t('mainImage') || 'Main'}</span>}
                      <button type="button" className="gallery-item-remove" onClick={() => handleRemoveImage(index)}><X size={14} /></button>
                    </div>
                  ))}
                  <label className="gallery-add-button" data-testid="upload-image-button">
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} disabled={uploading} multiple style={{ display: 'none' }} />
                    {uploading ? <Loader size={24} className="spin" /> : (<><Upload size={24} /><span>{t('addImages') || 'Add Images'}</span></>)}
                  </label>
                </div>
                <div className="image-url-input">
                  <input type="text" className="form-input" placeholder={t('imageUrlPlaceholder') || 'Paste image URL and press Enter...'}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) { e.preventDefault(); setFormData(prev => ({ ...prev, images: [...prev.images, e.target.value.trim()] })); e.target.value = ''; } }} />
                  <span className="url-hint">{t('pressEnterToAdd') || 'Press Enter to add'}</span>
                </div>
              </div>

              {/* Gender */}
              <div className="form-group gender-group">
                <label className="form-label">{t('targetAudience') || 'Target Audience'}</label>
                <div className="gender-checkboxes">
                  <label className="gender-checkbox">
                    <input type="checkbox" checked={formData.gender?.includes('women')}
                      onChange={(e) => { const newGender = e.target.checked ? [...(formData.gender || []), 'women'] : (formData.gender || []).filter(g => g !== 'women'); setFormData({ ...formData, gender: newGender }); }} />
                    <span>{t('forWomen') || 'For Women'}</span>
                  </label>
                  <label className="gender-checkbox">
                    <input type="checkbox" checked={formData.gender?.includes('men')}
                      onChange={(e) => { const newGender = e.target.checked ? [...(formData.gender || []), 'men'] : (formData.gender || []).filter(g => g !== 'men'); setFormData({ ...formData, gender: newGender }); }} />
                    <span>{t('forMen') || 'For Men'}</span>
                  </label>
                </div>
                <p className="form-hint">{t('genderHint') || 'Select both for unisex products'}</p>
              </div>

              {/* Collections */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">{t('collections') || 'Колекции/Страници'}</label>
                <div className="collections-checkboxes">
                  {collections.map(col => (
                    <label key={col.slug} className="collection-checkbox">
                      <input type="checkbox" checked={formData.collections?.includes(col.slug)}
                        onChange={(e) => {
                          let newCollections = [...(formData.collections || [])];
                          if (e.target.checked) { if (!newCollections.includes(col.slug)) newCollections.push(col.slug); }
                          else { newCollections = newCollections.filter(c => c !== col.slug); if (newCollections.length === 0) newCollections = ['all_products']; }
                          setFormData({ ...formData, collections: newCollections });
                        }} />
                      <span>{col.name}</span>
                      <span className="collection-count">({col.product_count})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scent Profiles */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">{t('scentProfiles') || 'Ароматни профили'}</label>
                <div className="scent-profiles-checkboxes">
                  {SCENT_PROFILE_OPTIONS.map(profile => (
                    <label key={profile.key} className="scent-profile-checkbox">
                      <input 
                        type="checkbox" 
                        checked={formData.scent_profiles?.includes(profile.key)}
                        onChange={(e) => {
                          let newProfiles = [...(formData.scent_profiles || [])];
                          if (e.target.checked) {
                            if (!newProfiles.includes(profile.key)) newProfiles.push(profile.key);
                          } else {
                            newProfiles = newProfiles.filter(p => p !== profile.key);
                          }
                          setFormData({ ...formData, scent_profiles: newProfiles });
                        }}
                      />
                      <span>{profile.label}</span>
                    </label>
                  ))}
                </div>
                <p className="form-hint">{t('scentProfilesHint') || 'Избери до 4 ароматни профила за този продукт'}</p>
              </div>

              {/* Related Products (You may also like) */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  {t('relatedProductsLabel') || 'Свързани продукти („Може да ви хареса също")'}
                </label>
                <p className="form-hint">
                  {t('relatedProductsHint') || 'Избери до 6 продукта, които да се показват в секцията „Може да ви хареса също". Ако не избереш нищо, системата автоматично препоръчва подобни продукти.'}
                </p>

                {/* Selected list */}
                {formData.related_product_ids && formData.related_product_ids.length > 0 && (
                  <div className="related-selected-list" data-testid="related-selected-list">
                    {formData.related_product_ids.map((rid, idx) => {
                      const p = allProducts.find((x) => x.id === rid) || products.find((x) => x.id === rid);
                      const label = p ? `${p.brand} — ${p.name}` : `#${rid}`;
                      return (
                        <div key={rid} className="related-selected-item">
                          <span className="related-order">{idx + 1}</span>
                          {p && p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="related-thumb"
                            />
                          )}
                          <span className="related-name">{label}</span>
                          <div className="related-actions">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx === 0) return;
                                const arr = [...formData.related_product_ids];
                                [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                setFormData({ ...formData, related_product_ids: arr });
                              }}
                              disabled={idx === 0}
                              data-testid={`related-move-up-${idx}`}
                            >↑</button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx === formData.related_product_ids.length - 1) return;
                                const arr = [...formData.related_product_ids];
                                [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                                setFormData({ ...formData, related_product_ids: arr });
                              }}
                              disabled={idx === formData.related_product_ids.length - 1}
                              data-testid={`related-move-down-${idx}`}
                            >↓</button>
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  related_product_ids: formData.related_product_ids.filter((x) => x !== rid),
                                });
                              }}
                              data-testid={`related-remove-${idx}`}
                            >✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Search + add */}
                {(formData.related_product_ids?.length || 0) < 6 && (
                  <>
                    <div className="related-search-box">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder={t('searchProducts') || 'Търси продукти...'}
                        value={relatedSearch}
                        onChange={(e) => setRelatedSearch(e.target.value)}
                        data-testid="related-search-input"
                      />
                    </div>
                    <div className="related-suggestions">
                      {allProducts
                        .filter((p) => {
                          if (p.id === editingProduct) return false;
                          if ((formData.related_product_ids || []).includes(p.id)) return false;
                          if (!relatedSearch) return false;
                          const q = relatedSearch.toLowerCase();
                          return (
                            (p.name || '').toLowerCase().includes(q) ||
                            (p.brand || '').toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 12)
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="related-suggestion"
                            onClick={() => {
                              const current = formData.related_product_ids || [];
                              if (current.length >= 6) return;
                              setFormData({
                                ...formData,
                                related_product_ids: [...current, p.id],
                              });
                              setRelatedSearch('');
                            }}
                            data-testid={`related-add-${p.id}`}
                          >
                            {p.image && <img src={p.image} alt={p.name} />}
                            <span>{p.brand} — {p.name}</span>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Descriptions */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">{t('description')} (EN)</label>
                  {editingProduct && (
                    <button
                      type="button"
                      className="btn-ai-generate"
                      onClick={() => handleAiGenerate('en')}
                      disabled={aiGenerating.en}
                      data-testid="ai-generate-en-btn"
                      title={lang === 'bg' ? 'Генерирай с AI' : 'Generate with AI'}
                    >
                      {aiGenerating.en ? <Loader size={14} className="spinning" /> : <Wand2 size={14} />}
                      <span>{aiGenerating.en ? '...' : (lang === 'bg' ? 'AI генерирай' : 'AI Generate')}</span>
                    </button>
                  )}
                </div>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-input" rows="4" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">{t('description')} (BG)</label>
                  {editingProduct && (
                    <button
                      type="button"
                      className="btn-ai-generate"
                      onClick={() => handleAiGenerate('bg')}
                      disabled={aiGenerating.bg}
                      data-testid="ai-generate-bg-btn"
                      title={lang === 'bg' ? 'Генерирай с AI' : 'Generate with AI'}
                    >
                      {aiGenerating.bg ? <Loader size={14} className="spinning" /> : <Wand2 size={14} />}
                      <span>{aiGenerating.bg ? '...' : (lang === 'bg' ? 'AI генерирай' : 'AI Generate')}</span>
                    </button>
                  )}
                </div>
                <textarea value={formData.description_bg} onChange={(e) => setFormData({ ...formData, description_bg: e.target.value })} className="form-input" rows="4" />
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

      {/* Products Table */}
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
              {products.map(product => {
                const isOnSale = product.original_price && product.original_price > product.price;
                return (
                <tr key={product.id} className={!product.is_visible ? 'hidden-product' : ''}>
                  <td><img src={product.image} alt={product.name} className="table-image" /></td>
                  <td><div className="table-product-name">{product.name}</div></td>
                  <td>{product.brand}</td>
                  <td style={{ textTransform: 'capitalize' }}>{product.category}</td>
                  <td>
                    {isOnSale ? (
                      <div className="table-price-sale">
                        <span className="table-price-original">{formatDualPrice(product.original_price)}</span>
                        <span className="table-price-current">{formatDualPrice(product.price)}</span>
                      </div>
                    ) : (
                      formatDualPrice(product.price)
                    )}
                  </td>
                  <td><span className={`stock-badge ${product.stock < 20 ? 'low' : ''}`}>{product.stock}</span></td>
                  <td>
                    <button className={`visibility-toggle ${product.is_visible ? 'visible' : 'hidden'}`}
                      onClick={() => handleToggleVisibility(product.id, product.is_visible)}>
                      {product.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-button edit" onClick={() => handleEdit(product)}><Edit size={16} /></button>
                      <button className="action-button delete" onClick={() => handleDelete(product.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" data-testid="pagination">
          <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            &laquo; {t('prevPage') || 'Prev'}
          </button>
          <span className="pagination-info">{t('pageOf') || 'Page'} {page} / {totalPages}</span>
          <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            {t('nextPage') || 'Next'} &raquo;
          </button>
        </div>
      )}
    </>
  );
};

export default ProductsManager;
