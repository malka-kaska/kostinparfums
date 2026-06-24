import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Save, X, Search } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomepageManager = () => {
  const { t } = useLanguage();
  const [heroSlides, setHeroSlides] = useState([]);
  const [featuredProductIds, setFeaturedProductIds] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [heroUploading, setHeroUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSettings = useCallback(async () => {
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

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/admin/all?limit=10000`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllProducts((data.products || []).filter(p => p.is_visible));
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  useEffect(() => { fetchSettings(); fetchProducts(); }, [fetchSettings, fetchProducts]);

  // Hero Image handlers
  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/upload/image`, { method: 'POST', credentials: 'include', body: formData });
      if (res.ok) {
        const data = await res.json();
        setHeroSlides(prev => [...prev, { image: data.url, alt: '' }]);
      } else { alert('Upload failed'); }
    } catch (err) { alert('Upload error: ' + err.message); }
    finally { setHeroUploading(false); e.target.value = ''; }
  };

  const removeHeroSlide = (index) => setHeroSlides(prev => prev.filter((_, i) => i !== index));
  
  const moveHeroSlide = (from, to) => {
    const newSlides = [...heroSlides];
    const [removed] = newSlides.splice(from, 1);
    newSlides.splice(to, 0, removed);
    setHeroSlides(newSlides);
  };

  const saveHeroSlides = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage/hero-slides`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ slides: heroSlides }),
      });
      if (res.ok) alert(t('savedSuccessfully') || 'Saved successfully!');
      else alert('Save failed');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  // Featured Products handlers
  const toggleFeatured = (productId) => {
    setFeaturedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const moveFeatured = (index, direction) => {
    const newIds = [...featuredProductIds];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newIds.length) return;
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setFeaturedProductIds(newIds);
  };

  const saveFeaturedProducts = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage/featured-products`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ product_ids: featuredProductIds }),
      });
      if (res.ok) alert(t('savedSuccessfully') || 'Saved successfully!');
      else alert('Save failed');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="homepage-management">
      {/* Hero Slides Section */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>{t('heroSlides') || 'Hero Carousel Images'}</h3>
          <div className="section-actions">
            <label className="btn-secondary upload-btn">
              <Upload size={16} />
              <span>{heroUploading ? (t('uploading') || 'Uploading...') : (t('addImage') || 'Add Image')}</span>
              <input type="file" accept="image/*" onChange={handleHeroUpload} disabled={heroUploading} style={{ display: 'none' }} />
            </label>
            <button className="btn-primary" onClick={saveHeroSlides} disabled={saving}>
              <Save size={16} />
              <span>{saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}</span>
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
                <button className="btn-icon" onClick={() => moveHeroSlide(index, -1)} disabled={index === 0}>↑</button>
                <button className="btn-icon" onClick={() => moveHeroSlide(index, 1)} disabled={index === heroSlides.length - 1}>↓</button>
                <button className="btn-icon btn-danger" onClick={() => removeHeroSlide(index)}><X size={16} /></button>
              </div>
              <input type="text" placeholder="Image description (alt text)" value={slide.alt}
                onChange={(e) => {
                  const newSlides = [...heroSlides];
                  newSlides[index] = { ...slide, alt: e.target.value };
                  setHeroSlides(newSlides);
                }}
                className="hero-slide-alt-input" />
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>{t('featuredProducts') || 'Featured Products (Homepage)'}</h3>
          <button className="btn-primary" onClick={saveFeaturedProducts} disabled={saving}>
            <Save size={16} />
            <span>{saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}</span>
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
                const product = allProducts.find(p => p.id === productId);
                if (!product) return null;
                return (
                  <div key={productId} className="featured-item">
                    <span className="featured-order">{index + 1}</span>
                    <img src={product.images?.[0] || product.image} alt={product.name} className="featured-thumb" />
                    <span className="featured-name">{product.name}</span>
                    <div className="featured-actions">
                      <button onClick={() => moveFeatured(index, -1)} disabled={index === 0}>↑</button>
                      <button onClick={() => moveFeatured(index, 1)} disabled={index === featuredProductIds.length - 1}>↓</button>
                      <button onClick={() => toggleFeatured(productId)} className="btn-remove">✕</button>
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
          <div className="product-search-box">
            <Search size={16} />
            <input type="text" placeholder={t('searchProducts') || 'Search products...'} value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="product-search-input" />
          </div>
          <div className="product-selection-grid">
            {allProducts
              .filter(p => {
                if (!p.is_visible) return false;
                if (featuredProductIds.includes(p.id)) return false;
                if (searchQuery) {
                  const q = searchQuery.toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
                }
                return true;
              })
              .slice(0, 100)
              .map(product => (
                <div key={product.id} className="product-select-card" onClick={() => toggleFeatured(product.id)}>
                  <img src={product.images?.[0] || product.image} alt={product.name} />
                  <span>{product.name}</span>
                  <span className="product-brand">{product.brand}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageManager;
