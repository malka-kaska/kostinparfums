import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import './Products.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DubaiPerfumes = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    gender: true,
    brand: true,
  });
  const [availableBrands, setAvailableBrands] = useState([]);

  // Get filter values from URL
  const selectedGender = searchParams.get('gender') || '';
  const selectedBrandsParam = searchParams.get('brands') || '';
  const selectedBrands = selectedBrandsParam ? selectedBrandsParam.split(',').filter(Boolean) : [];
  const sortBy = searchParams.get('sort') || 'popular';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch from "dubai" collection
        const params = new URLSearchParams();
        params.set('collection', 'dubai');
        params.set('sort', sortBy);
        params.set('limit', '200');
        
        if (selectedBrands.length > 0) {
          params.set('brands', selectedBrands.join(','));
        }
        if (selectedGender) {
          params.set('gender', selectedGender);
        }
        
        const url = `${API_URL}/api/products?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        
        setProducts(data.products || []);
        
        // Extract available brands from results
        const brandsInResults = [...new Set(data.products.map(p => p.brand))];
        setAvailableBrands(brandsInResults.sort());
        
      } catch (err) {
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedGender, selectedBrandsParam, sortBy, selectedBrands]);

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const toggleBrand = (brand) => {
    let newBrands;
    if (selectedBrands.includes(brand)) {
      newBrands = selectedBrands.filter(b => b !== brand);
    } else {
      newBrands = [...selectedBrands, brand];
    }
    updateFilters('brands', newBrands.join(','));
  };

  const clearAllFilters = () => {
    setSearchParams({ sort: sortBy });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const hasActiveFilters = selectedGender || selectedBrands.length > 0;

  return (
    <div className="products-page">
      <div className="container section-padding">
        {/* Page Header */}
        <div className="products-header">
          <div className="products-title-section">
            <h1 className="section-title">{t('dubaiFragrances')}</h1>
            <p className="products-subtitle">{t('dubaiFragrancesSubtitle')}</p>
          </div>
          
          <div className="products-controls">
            <button 
              className="mobile-filter-toggle"
              onClick={() => setMobileFiltersOpen(true)}
              data-testid="mobile-filter-toggle"
            >
              <Filter size={18} />
              {t('filters')}
            </button>
            
            <div className="sort-controls">
              <label htmlFor="sort">{t('sortBy')}</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => updateFilters('sort', e.target.value)}
                className="sort-select"
                data-testid="sort-select"
              >
                <option value="popular">{t('sortPopular')}</option>
                <option value="newest">{t('sortNewest')}</option>
                <option value="name">{t('sortName')}</option>
                <option value="price-low">{t('sortPriceLow')}</option>
                <option value="price-high">{t('sortPriceHigh')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className={`filters-sidebar ${mobileFiltersOpen ? 'open' : ''}`}>
            <div className="filters-header">
              <h3>{t('filters')}</h3>
              <button 
                className="close-filters"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters" onClick={clearAllFilters}>
                {t('clearAll')}
              </button>
            )}

            {/* Gender Filter */}
            <div className="filter-section">
              <button 
                className="filter-section-header"
                onClick={() => toggleSection('gender')}
              >
                <span>{t('gender')}</span>
                {expandedSections.gender ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {expandedSections.gender && (
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="gender"
                      checked={!selectedGender}
                      onChange={() => updateFilters('gender', '')}
                    />
                    <span>{t('allGenders')}</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="gender"
                      checked={selectedGender === 'women'}
                      onChange={() => updateFilters('gender', 'women')}
                    />
                    <span>{t('women')}</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="gender"
                      checked={selectedGender === 'men'}
                      onChange={() => updateFilters('gender', 'men')}
                    />
                    <span>{t('men')}</span>
                  </label>
                </div>
              )}
            </div>

            {/* Brand Filter */}
            {availableBrands.length > 0 && (
              <div className="filter-section">
                <button 
                  className="filter-section-header"
                  onClick={() => toggleSection('brand')}
                >
                  <span>{t('brand')}</span>
                  {expandedSections.brand ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.brand && (
                  <div className="filter-options brand-filter-options">
                    {availableBrands.map(brand => (
                      <label key={brand} className="filter-option checkbox-option">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button 
              className="apply-filters-mobile"
              onClick={() => setMobileFiltersOpen(false)}
            >
              {t('applyFilters')} ({products.length})
            </button>
          </aside>

          {/* Products Grid */}
          <div className="products-content">
            <p className="products-count">
              {t('showingProducts', { count: products.length })}
            </p>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>{t('loadingProducts')}</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <p>{t('noProductsFound')}</p>
                <button onClick={clearAllFilters} className="btn-primary">
                  {t('clearFilters')}
                </button>
              </div>
            ) : (
              <div className="grid-product-showcase" data-testid="products-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {mobileFiltersOpen && (
        <div 
          className="filter-overlay"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}
    </div>
  );
};

export default DubaiPerfumes;
