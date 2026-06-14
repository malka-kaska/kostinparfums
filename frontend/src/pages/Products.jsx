import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import './Products.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch(`${API_URL}/api/products/categories`),
          fetch(`${API_URL}/api/products/brands`),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.map(c => ({ id: c.id, name: c.name })));
        }
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          setBrands(brandData.map(b => b.name));
        }
      } catch (err) {
        console.error('Failed to fetch categories/brands:', err);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
    const searchFromUrl = searchParams.get('search') || '';
    setSelectedCategory(categoryFromUrl);
    setSearchQuery(searchFromUrl);
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        if (selectedBrand !== 'all') params.set('brand', selectedBrand);
        if (searchQuery) params.set('search', searchQuery);
        if (sortBy) params.set('sort', sortBy);
        params.set('limit', '200');

        const res = await fetch(`${API_URL}/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products);
          setTotalProducts(data.total);
        } else {
          setProducts([]);
          setTotalProducts(0);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedBrand, sortBy, searchQuery]);

  const categoryNames = {
    perfumes: t('perfumes'),
    makeup: t('makeup'),
    skincare: t('skincare'),
    haircare: t('haircare'),
    bodycare: t('bodyCare'),
    menscare: t('mensCare'),
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div className="products-page">
      <div className="container">
        <div className="page-header section-padding-small">
          <h1 className="hero-medium" data-testid="products-heading">{t('allProducts')}</h1>
          <p className="body-large mt-3" style={{ color: 'var(--text-secondary)' }}>
            {totalProducts === 1 
              ? t('discoverCollectionSingular', { count: totalProducts })
              : t('discoverCollection', { count: totalProducts })}
          </p>
        </div>

        <div className="products-layout">
          <aside className={`filters-sidebar ${filtersOpen ? 'open' : ''}`} data-testid="filters-sidebar">
            <div className="filters-header">
              <h3 className="heading-3">{t('filters')}</h3>
              <button className="close-filters" onClick={() => setFiltersOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="filter-group">
              <h4 className="filter-title">{t('category')}</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === 'all'}
                    onChange={() => handleCategoryChange('all')}
                  />
                  <span>{t('allProductsFilter')}</span>
                </label>
                {categories.map(category => (
                  <label key={category.id} className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category.id}
                      onChange={() => handleCategoryChange(category.id)}
                    />
                    <span>{categoryNames[category.id] || category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4 className="filter-title">{t('brand')}</h4>
              <div className="filter-options scrollable">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === 'all'}
                    onChange={() => setSelectedBrand('all')}
                  />
                  <span>{t('allBrands')}</span>
                </label>
                {brands.map(brand => (
                  <label key={brand} className="filter-option">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === brand}
                      onChange={() => setSelectedBrand(brand)}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={clearFilters} data-testid="clear-filters-btn">
              {t('clearAllFilters')}
            </button>
          </aside>

          <div className="products-main">
            <div className="products-controls">
              <button
                className="filters-toggle"
                onClick={() => setFiltersOpen(!filtersOpen)}
                data-testid="filters-toggle"
              >
                <SlidersHorizontal size={20} />
                <span>{t('filters')}</span>
              </button>

              <div className="sort-controls">
                <label htmlFor="sort">{t('sortBy')}</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                  data-testid="sort-select"
                >
                  <option value="name">{t('sortName')}</option>
                  <option value="price-low">{t('sortPriceLow')}</option>
                  <option value="price-high">{t('sortPriceHigh')}</option>
                </select>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid-product-showcase" data-testid="products-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="no-products" data-testid="no-products">
                <p className="body-large">
                  {loading ? t('loadingProducts') : t('noProductsFound')}
                </p>
                {!loading && (
                  <button className="btn-primary mt-4" onClick={clearFilters}>
                    {t('clearFilters')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
