import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Grid2X2, LayoutList } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import './Products.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Dubai/Arabic perfume brands - shown only on Dubai Perfumes page
const DUBAI_BRANDS = [
  'Lattafa',
  'Afnan',
  'Armaf',
  'Rasasi',
  'Swiss Arabian',
  'Al Haramain',
  'Ard Al Zaafaran',
  'Ajmal',
  'Maison Alhambra',
  'Fragrance World',
  'Paris Corner'
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrands, setSelectedBrands] = useState(() => {
    const brandsParam = searchParams.get('brands');
    return brandsParam ? brandsParam.split(',').filter(Boolean) : [];
  });
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || 'all');
  const [selectedScentProfiles, setSelectedScentProfiles] = useState(() => {
    const profilesParam = searchParams.get('scent_profiles');
    return profilesParam ? profilesParam.split(',').filter(Boolean) : [];
  });
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileGridCols, setMobileGridCols] = useState(1); // 1 or 2 columns on mobile
  const { t } = useLanguage();

  // Scent profile options
  const SCENT_PROFILE_OPTIONS = [
    { key: 'sweet', label: t('scentSweet') || 'Sweet' },
    { key: 'fresh', label: t('scentFresh') || 'Fresh' },
    { key: 'citrus', label: t('scentCitrus') || 'Citrus' },
    { key: 'fruity', label: t('scentFruity') || 'Fruity' },
    { key: 'floral', label: t('scentFloral') || 'Floral' },
    { key: 'woody', label: t('scentWoody') || 'Woody' },
    { key: 'spicy', label: t('scentSpicy') || 'Spicy' },
    { key: 'aquatic', label: t('scentAquatic') || 'Aquatic' },
    { key: 'musky', label: t('scentMusky') || 'Musky' },
    { key: 'leather', label: t('scentLeather') || 'Leather' },
    { key: 'tobacco', label: t('scentTobacco') || 'Tobacco' },
    { key: 'oriental', label: t('scentOriental') || 'Oriental' },
    { key: 'vanilla', label: t('scentVanilla') || 'Vanilla' },
  ];

  // Fetch brands with gender filter
  const fetchBrands = async (gender) => {
    try {
      const params = new URLSearchParams();
      if (gender && gender !== 'all') params.set('gender', gender);
      const brandRes = await fetch(`${API_URL}/api/products/brands?${params.toString()}`);
      if (brandRes.ok) {
        const brandData = await brandRes.json();
        // Filter out Dubai brands from the brand filter list
        const filteredBrands = brandData
          .map(b => b.name)
          .filter(name => !DUBAI_BRANDS.includes(name));
        setBrands(filteredBrands);
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const catRes = await fetch(`${API_URL}/api/products/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.map(c => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchMeta();
  }, []);

  // Refetch brands when gender changes
  useEffect(() => {
    fetchBrands(selectedGender);
    // Only reset selected brands if NOT coming from URL
    // (URL brands are handled in the other useEffect)
  }, [selectedGender]);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
    const searchFromUrl = searchParams.get('search') || '';
    const genderFromUrl = searchParams.get('gender') || 'all';
    const brandsFromUrl = searchParams.get('brands');
    const profilesFromUrl = searchParams.get('scent_profiles');
    
    setSelectedCategory(categoryFromUrl);
    setSearchQuery(searchFromUrl);
    setSelectedGender(genderFromUrl);
    
    // Set brands from URL if present
    if (brandsFromUrl) {
      setSelectedBrands(brandsFromUrl.split(',').filter(Boolean));
    }
    
    // Set scent profiles from URL if present
    if (profilesFromUrl) {
      setSelectedScentProfiles(profilesFromUrl.split(',').filter(Boolean));
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        
        // Read brands from URL directly to avoid race condition
        const brandsFromUrl = searchParams.get('brands');
        const brandsToUse = brandsFromUrl 
          ? brandsFromUrl.split(',').filter(Boolean) 
          : selectedBrands;
        
        // Read scent profiles from URL directly to avoid race condition
        const profilesFromUrl = searchParams.get('scent_profiles');
        const profilesToUse = profilesFromUrl 
          ? profilesFromUrl.split(',').filter(Boolean) 
          : selectedScentProfiles;
        
        if (brandsToUse.length > 0) params.set('brands', brandsToUse.join(','));
        if (selectedGender !== 'all') params.set('gender', selectedGender);
        if (profilesToUse.length > 0) params.set('scent_profiles', profilesToUse.join(','));
        if (searchQuery) params.set('search', searchQuery);
        if (sortBy) params.set('sort', sortBy);
        
        // Filter by "all_products" collection (excludes Dubai products by default)
        params.set('collection', 'all_products');
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
  }, [selectedCategory, selectedBrands, selectedGender, selectedScentProfiles, sortBy, searchQuery, searchParams]);

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

  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    const newParams = {};
    if (gender !== 'all') newParams.gender = gender;
    if (selectedCategory !== 'all') newParams.category = selectedCategory;
    setSearchParams(newParams);
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  const handleScentProfileToggle = (profile) => {
    setSelectedScentProfiles(prev => {
      if (prev.includes(profile)) {
        return prev.filter(p => p !== profile);
      } else {
        return [...prev, profile];
      }
    });
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setSelectedGender('all');
    setSelectedScentProfiles([]);
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

            {/* Category filter hidden - only perfumes for now */}

            {/* Gender filter */}
            <div className="filter-group">
              <h4 className="filter-title">{t('gender') || 'Gender'}</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === 'all'}
                    onChange={() => handleGenderChange('all')}
                  />
                  <span>{t('all') || 'All'}</span>
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === 'women'}
                    onChange={() => handleGenderChange('women')}
                  />
                  <span>{t('forWomen') || 'For Women'}</span>
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === 'men'}
                    onChange={() => handleGenderChange('men')}
                  />
                  <span>{t('forMen') || 'For Men'}</span>
                </label>
              </div>
            </div>

            <div className="filter-group">
              <h4 className="filter-title">{t('brand')}</h4>
              <div className="filter-options scrollable">
                {brands.map(brand => (
                  <label key={brand} className="filter-option checkbox">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
              {selectedBrands.length > 0 && (
                <button 
                  className="clear-brands-btn"
                  onClick={() => setSelectedBrands([])}
                >
                  {t('clearBrands') || 'Clear brands'} ({selectedBrands.length})
                </button>
              )}
            </div>

            {/* Scent Profile Filter */}
            <div className="filter-group">
              <h4 className="filter-title">{t('scentProfile') || 'Scent Profile'}</h4>
              <div className="filter-options scrollable">
                {SCENT_PROFILE_OPTIONS.map(({ key, label }) => (
                  <label key={key} className="filter-option checkbox">
                    <input
                      type="checkbox"
                      checked={selectedScentProfiles.includes(key)}
                      onChange={() => handleScentProfileToggle(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {selectedScentProfiles.length > 0 && (
                <button 
                  className="clear-brands-btn"
                  onClick={() => setSelectedScentProfiles([])}
                >
                  {t('clearScentProfiles') || 'Clear profiles'} ({selectedScentProfiles.length})
                </button>
              )}
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

              {/* Mobile Grid Toggle - only visible on mobile */}
              <div className="mobile-grid-toggle" data-testid="mobile-grid-toggle">
                <button
                  className={`grid-btn ${mobileGridCols === 1 ? 'active' : ''}`}
                  onClick={() => setMobileGridCols(1)}
                  aria-label="1 column"
                >
                  <LayoutList size={18} />
                </button>
                <button
                  className={`grid-btn ${mobileGridCols === 2 ? 'active' : ''}`}
                  onClick={() => setMobileGridCols(2)}
                  aria-label="2 columns"
                >
                  <Grid2X2 size={18} />
                </button>
              </div>

              <div className="sort-controls">
                <label htmlFor="sort">{t('sortBy')}</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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

            {products.length > 0 ? (
              <div className={`grid-product-showcase ${mobileGridCols === 2 ? 'mobile-two-cols' : ''}`} data-testid="products-grid">
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
