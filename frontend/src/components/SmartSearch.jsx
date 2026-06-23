import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getMainImage, FALLBACK_IMAGE } from '../utils/imageUtils';
import parseProductName from '../utils/parseProductName';
import './SmartSearch.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SmartSearch = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const searchTimeout = useRef(null);
  
  const performSearch = useCallback(async (searchQuery, brandFilter) => {
    if (!searchQuery && !brandFilter) {
      setBrands([]);
      setProducts([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    try {
      if (brandFilter) {
        // Search products within selected brand
        const res = await fetch(
          `${API_URL}/api/search/products?q=${encodeURIComponent(searchQuery)}&brand=${encodeURIComponent(brandFilter)}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setBrands([]);
        }
      } else {
        // Search both brands and products
        const res = await fetch(
          `${API_URL}/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setBrands(data.brands || []);
          setProducts(data.products || []);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setBrands([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length > 0 || selectedBrand) {
      searchTimeout.current = setTimeout(() => {
        performSearch(trimmedQuery, selectedBrand);
      }, 200);
    } else {
      setBrands([]);
      setProducts([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, selectedBrand, performSearch]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // If user clears input completely, reset brand selection
    if (!value.trim()) {
      setSelectedBrand(null);
    }
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand.name);
    setQuery('');
    setBrands([]);
    inputRef.current?.focus();
  };

  const handleProductSelect = (product) => {
    setShowDropdown(false);
    setQuery('');
    setSelectedBrand(null);
    onClose();
    navigate(`/product/${product.id}`);
  };

  const handleBrandClear = () => {
    setSelectedBrand(null);
    setQuery('');
    setBrands([]);
    setProducts([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      onClose();
    } else if (e.key === 'Enter' && query.trim()) {
      // Navigate to products page with search
      setShowDropdown(false);
      onClose();
      if (selectedBrand) {
        navigate(`/products?brands=${encodeURIComponent(selectedBrand)}&search=${encodeURIComponent(query)}`);
      } else {
        navigate(`/products?search=${encodeURIComponent(query)}`);
      }
    }
  };

  const handleViewAllBrand = (brandName) => {
    setShowDropdown(false);
    setQuery('');
    setSelectedBrand(null);
    onClose();
    navigate(`/products?brands=${encodeURIComponent(brandName)}`);
  };

  if (!isOpen) return null;

  const hasResults = brands.length > 0 || products.length > 0;
  const showNoResults = showDropdown && !loading && query.trim().length > 0 && !hasResults;

  return (
    <div className="smart-search-container" ref={dropdownRef}>
      <div className="smart-search-bar">
        <Search size={18} className="smart-search-icon" />
        
        {selectedBrand && (
          <div className="smart-search-brand-tag">
            <span>{selectedBrand}</span>
            <button 
              onClick={handleBrandClear}
              className="smart-search-brand-clear"
              aria-label="Clear brand"
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => (query.trim() || selectedBrand) && setShowDropdown(true)}
          placeholder={selectedBrand ? t('searchInBrand') || 'Търсене в марката...' : t('searchPlaceholder')}
          className="smart-search-input"
          data-testid="smart-search-input"
        />
        
        {(query || selectedBrand) && (
          <button 
            onClick={() => {
              setQuery('');
              setSelectedBrand(null);
              setBrands([]);
              setProducts([]);
              setShowDropdown(false);
            }}
            className="smart-search-clear"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="smart-search-dropdown" data-testid="smart-search-dropdown">
          {loading && (
            <div className="smart-search-loading">
              <div className="smart-search-spinner"></div>
            </div>
          )}

          {!loading && brands.length > 0 && (
            <div className="smart-search-section">
              <h4 className="smart-search-section-title">
                {t('suggestedBrands') || 'Предложени марки'}
              </h4>
              <ul className="smart-search-brand-list">
                {brands.map((brand) => (
                  <li key={brand.name} className="smart-search-brand-item">
                    <button
                      onClick={() => handleBrandSelect(brand)}
                      className="smart-search-brand-button"
                      data-testid={`brand-suggestion-${brand.name}`}
                    >
                      <div className="smart-search-brand-info">
                        <span className="smart-search-brand-name">{brand.name}</span>
                        <span className="smart-search-brand-count">
                          {brand.product_count} {brand.product_count === 1 
                            ? (t('productSingular') || 'продукт') 
                            : (t('productsCount') || 'продукта')}
                        </span>
                      </div>
                      <ChevronRight size={16} className="smart-search-brand-arrow" />
                    </button>
                    <button
                      onClick={() => handleViewAllBrand(brand.name)}
                      className="smart-search-brand-view-all"
                    >
                      {t('viewAllFromBrand') || 'Виж всички'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="smart-search-section">
              <h4 className="smart-search-section-title">
                {selectedBrand 
                  ? `${t('productsFrom') || 'Продукти от'} ${selectedBrand}`
                  : (t('suggestedProducts') || 'Предложени продукти')}
              </h4>
              <ul className="smart-search-product-list">
                {products.map((product) => {
                  const { name: cleanName, details } = parseProductName(product.name);
                  const image = getMainImage(product.image) || FALLBACK_IMAGE;
                  
                  return (
                    <li key={product.id} className="smart-search-product-item">
                      <button
                        onClick={() => handleProductSelect(product)}
                        className="smart-search-product-button"
                        data-testid={`product-suggestion-${product.id}`}
                      >
                        <div className="smart-search-product-image">
                          <img src={image} alt={product.name} loading="lazy" />
                        </div>
                        <div className="smart-search-product-info">
                          <span className="smart-search-product-brand">{product.brand}</span>
                          <span className="smart-search-product-name">{cleanName}</span>
                          {details && (
                            <span className="smart-search-product-details">{details}</span>
                          )}
                          <span className="smart-search-product-price">€{product.price.toFixed(2)}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {showNoResults && (
            <div className="smart-search-no-results">
              <p>{t('noSearchResults') || 'Няма намерени резултати'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
