import React, { useState, useEffect } from 'react';
import { Link2, Unlink, Search, Plus, X, GripVertical, Check } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import './VariantsManager.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VariantsManager = () => {
  const { lang } = useLanguage();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState(null);
  const [existingGroups, setExistingGroups] = useState([]);
  const [autoGroups, setAutoGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'auto'

  const txt = lang === 'bg' ? {
    title: 'Свързване на Варианти',
    subtitle: 'Свържете продукти с различни разфасовки като варианти',
    searchPlaceholder: 'Търсете продукт по име...',
    search: 'Търси',
    selectedProducts: 'Избрани продукти',
    noProductsSelected: 'Изберете поне 2 продукта за свързване',
    linkProducts: 'Свържи като варианти',
    unlinkProduct: 'Премахни от група',
    clearSelection: 'Изчисти',
    productLinked: 'Продуктите са свързани успешно!',
    productUnlinked: 'Продуктът е премахнат от групата',
    variantGroup: 'Група варианти',
    noResults: 'Няма намерени продукти',
    currentVariants: 'Текущи варианти',
    addToSelection: 'Добави',
    alreadySelected: 'Избран',
    dragToReorder: 'Плъзнете за пренареждане',
    existingGroups: 'Съществуващи групи варианти',
    autoGroups: 'Автоматично свързани',
    manualGroups: 'Ръчно свързани',
    unlinkAll: 'Премахни всички',
    noGroups: 'Няма създадени групи',
    noAutoGroups: 'Няма автоматично свързани групи',
    loadGroups: 'Зареди групи',
    confirmUnlink: 'Сигурни ли сте?',
    convertToManual: 'Преобразувай в ръчна група',
    autoGroupDesc: 'Тези групи се разпознават автоматично по име на продукта',
  } : {
    title: 'Variant Linking',
    subtitle: 'Link products with different sizes as variants',
    searchPlaceholder: 'Search product by name...',
    search: 'Search',
    selectedProducts: 'Selected Products',
    noProductsSelected: 'Select at least 2 products to link',
    linkProducts: 'Link as Variants',
    unlinkProduct: 'Remove from group',
    clearSelection: 'Clear',
    productLinked: 'Products linked successfully!',
    productUnlinked: 'Product removed from group',
    variantGroup: 'Variant Group',
    noResults: 'No products found',
    currentVariants: 'Current Variants',
    addToSelection: 'Add',
    alreadySelected: 'Selected',
    dragToReorder: 'Drag to reorder',
    existingGroups: 'Existing Variant Groups',
    autoGroups: 'Auto-linked',
    manualGroups: 'Manual Groups',
    unlinkAll: 'Unlink All',
    noGroups: 'No groups created',
    noAutoGroups: 'No auto-linked groups found',
    loadGroups: 'Load Groups',
    confirmUnlink: 'Are you sure?',
    convertToManual: 'Convert to manual group',
    autoGroupDesc: 'These groups are automatically detected by product name',
  };

  // Search products
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(searchQuery)}&limit=20`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add product to selection
  const addToSelection = (product) => {
    if (selectedProducts.find(p => p.id === product.id)) return;
    setSelectedProducts(prev => [...prev, product]);
  };

  // Remove product from selection
  const removeFromSelection = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedProducts([]);
    setMessage(null);
  };

  // Link products as variants
  const linkProducts = async () => {
    if (selectedProducts.length < 2) return;
    
    setLinking(true);
    setMessage(null);
    
    try {
      const res = await fetch(`${API_URL}/api/products/variants/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_ids: selectedProducts.map(p => p.id)
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: `${txt.productLinked} (${data.variant_group_id})` });
        setSelectedProducts([]);
        // Refresh search results to show updated variant_group_id
        if (searchQuery) handleSearch();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.detail || 'Error linking products' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error linking products' });
    } finally {
      setLinking(false);
    }
  };

  // Unlink product from variant group
  const unlinkProduct = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/products/variants/unlink/${productId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: txt.productUnlinked });
        // Refresh search results and groups
        if (searchQuery) handleSearch();
        loadExistingGroups();
      }
    } catch (err) {
      console.error('Unlink failed:', err);
    }
  };

  // Load existing variant groups (both manual and auto)
  const loadExistingGroups = async () => {
    setLoadingGroups(true);
    try {
      // Use new endpoint that returns both manual and auto groups
      const res = await fetch(`${API_URL}/api/products/variants/all-groups`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        
        // Manual groups - format for display
        const manualGroupArray = (data.manual_groups || []).map(g => ({
          id: g.id,
          type: 'manual',
          products: g.products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            variant_order: p.order
          }))
        }));
        
        // Auto groups - format for display
        const autoGroupArray = (data.auto_groups || []).map(g => ({
          id: g.id,
          type: 'auto',
          baseName: g.base_name,
          brand: g.brand,
          products: g.products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image
          }))
        }));
        
        setExistingGroups(manualGroupArray);
        setAutoGroups(autoGroupArray);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Unlink all products in a group
  const unlinkAllInGroup = async (groupId) => {
    const group = existingGroups.find(g => g.id === groupId);
    if (!group) return;
    
    try {
      for (const product of group.products) {
        await fetch(`${API_URL}/api/products/variants/unlink/${product.id}`, {
          method: 'POST',
          credentials: 'include'
        });
      }
      setMessage({ type: 'success', text: `Групата "${groupId}" е премахната` });
      loadExistingGroups();
      if (searchQuery) handleSearch();
    } catch (err) {
      console.error('Failed to unlink group:', err);
    }
  };

  // Convert auto group to manual group
  const convertToManualGroup = async (autoGroup) => {
    setLinking(true);
    try {
      const productIds = autoGroup.products.map(p => p.id);
      const res = await fetch(`${API_URL}/api/products/variants/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_ids: productIds,
          group_name: autoGroup.baseName ? autoGroup.baseName.substring(0, 20) : null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: `Групата е преобразувана в ръчна (${data.variant_group_id})` });
        loadExistingGroups();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.detail || 'Грешка при преобразуване' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Грешка при преобразуване' });
    } finally {
      setLinking(false);
    }
  };

  // Load groups on mount
  useEffect(() => {
    loadExistingGroups();
  }, []);

  // Drag and drop reordering
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newProducts = [...selectedProducts];
    const draggedItem = newProducts[draggedIndex];
    newProducts.splice(draggedIndex, 1);
    newProducts.splice(index, 0, draggedItem);
    setSelectedProducts(newProducts);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isSelected = (productId) => selectedProducts.some(p => p.id === productId);

  return (
    <div className="variants-manager">
      <div className="variants-header">
        <h2>{txt.title}</h2>
        <p className="variants-subtitle">{txt.subtitle}</p>
      </div>

      {/* Existing Groups Section */}
      <div className="existing-groups-section">
        <div className="section-header">
          <h3>{txt.existingGroups}</h3>
          <button onClick={loadExistingGroups} disabled={loadingGroups} className="refresh-btn">
            {loadingGroups ? '...' : '↻'}
          </button>
        </div>
        
        {/* Tabs for Manual vs Auto groups */}
        <div className="groups-tabs">
          <button 
            className={`groups-tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            {txt.manualGroups} ({existingGroups.length})
          </button>
          <button 
            className={`groups-tab ${activeTab === 'auto' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto')}
          >
            {txt.autoGroups} ({autoGroups.length})
          </button>
        </div>
        
        {/* Manual Groups */}
        {activeTab === 'manual' && (
          existingGroups.length === 0 ? (
            <p className="no-groups">{txt.noGroups}</p>
          ) : (
            <div className="groups-list">
              {existingGroups.map(group => (
                <div key={group.id} className="group-card manual-group">
                  <div className="group-header">
                    <span className="group-id">
                      <Link2 size={14} /> {group.id}
                    </span>
                    <button 
                      onClick={() => {
                        if (window.confirm(txt.confirmUnlink)) {
                          unlinkAllInGroup(group.id);
                        }
                      }} 
                      className="unlink-all-btn"
                    >
                      <Unlink size={12} /> {txt.unlinkAll}
                    </button>
                  </div>
                  <div className="group-products">
                    {group.products.map((p, idx) => (
                      <div key={p.id} className="group-product">
                        <span className="product-order">{idx + 1}</span>
                        <img src={p.image || '/placeholder.png'} alt="" className="product-thumb-xs" />
                        <span className="product-name-sm">{p.name}</span>
                        <span className="product-price-sm">€{p.price}</span>
                        <button onClick={() => unlinkProduct(p.id)} className="unlink-single-btn" title={txt.unlinkProduct}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        
        {/* Auto Groups */}
        {activeTab === 'auto' && (
          <>
            <p className="auto-groups-desc">{txt.autoGroupDesc}</p>
            {autoGroups.length === 0 ? (
              <p className="no-groups">{txt.noAutoGroups}</p>
            ) : (
              <div className="groups-list">
                {autoGroups.map(group => (
                  <div key={group.id} className="group-card auto-group">
                    <div className="group-header">
                      <span className="group-id auto-badge">
                        <Link2 size={14} /> {group.baseName}
                        <span className="brand-tag">{group.brand}</span>
                      </span>
                      <button 
                        onClick={() => convertToManualGroup(group)}
                        disabled={linking}
                        className="convert-btn"
                        title={txt.convertToManual}
                      >
                        <Plus size={12} /> {txt.convertToManual}
                      </button>
                    </div>
                    <div className="group-products">
                      {group.products.map((p, idx) => (
                        <div key={p.id} className="group-product">
                          <span className="product-order">{idx + 1}</span>
                          <img src={p.image || '/placeholder.png'} alt="" className="product-thumb-xs" />
                          <span className="product-name-sm">{p.name}</span>
                          <span className="product-price-sm">€{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Search Section */}
      <div className="variants-search-section">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={txt.searchPlaceholder}
            className="search-input"
          />
          <button onClick={handleSearch} disabled={loading} className="search-btn">
            {txt.search}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`variants-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="variants-content">
        {/* Search Results */}
        <div className="variants-panel search-results-panel">
          <h3>{txt.noResults.replace('Няма намерени продукти', 'Резултати от търсене')}</h3>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : searchResults.length > 0 ? (
            <div className="product-list">
              {searchResults.map(product => (
                <div key={product.id} className={`product-item ${isSelected(product.id) ? 'selected' : ''}`}>
                  <img src={product.image || '/placeholder.png'} alt={product.name} className="product-thumb" />
                  <div className="product-info">
                    <span className="product-name">{product.name}</span>
                    <span className="product-meta">
                      €{product.price}
                      {product.variant_group_id && (
                        <span className="variant-badge" title={`${txt.variantGroup}: ${product.variant_group_id}`}>
                          <Link2 size={12} /> {product.variant_group_id}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="product-actions">
                    {isSelected(product.id) ? (
                      <span className="already-selected"><Check size={16} /> {txt.alreadySelected}</span>
                    ) : (
                      <button onClick={() => addToSelection(product)} className="add-btn">
                        <Plus size={16} /> {txt.addToSelection}
                      </button>
                    )}
                    {product.variant_group_id && (
                      <button onClick={() => unlinkProduct(product.id)} className="unlink-btn" title={txt.unlinkProduct}>
                        <Unlink size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="no-results">{txt.noResults}</div>
          ) : null}
        </div>

        {/* Selected Products */}
        <div className="variants-panel selected-panel">
          <div className="panel-header">
            <h3>{txt.selectedProducts} ({selectedProducts.length})</h3>
            {selectedProducts.length > 0 && (
              <button onClick={clearSelection} className="clear-btn">
                <X size={14} /> {txt.clearSelection}
              </button>
            )}
          </div>
          
          {selectedProducts.length === 0 ? (
            <div className="empty-selection">{txt.noProductsSelected}</div>
          ) : (
            <>
              <p className="drag-hint">{txt.dragToReorder}</p>
              <div className="selected-list">
                {selectedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`selected-item ${draggedIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <GripVertical size={16} className="drag-handle" />
                    <span className="order-number">{index + 1}</span>
                    <img src={product.image || '/placeholder.png'} alt={product.name} className="product-thumb-sm" />
                    <div className="product-info">
                      <span className="product-name">{product.name}</span>
                      <span className="product-price">€{product.price}</span>
                    </div>
                    <button onClick={() => removeFromSelection(product.id)} className="remove-btn">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={linkProducts} 
                disabled={selectedProducts.length < 2 || linking}
                className="link-btn"
              >
                <Link2 size={18} />
                {linking ? 'Linking...' : txt.linkProducts}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariantsManager;
