import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, Filter, Home, Percent, Sparkles, Cloud, Image, Link2, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import ProductsManager from './components/ProductsManager';
import OrdersManager from './components/OrdersManager';
import CollectionsManager from './components/CollectionsManager';
import HomepageManager from './components/HomepageManager';
import DiscountCodesManager from './components/DiscountCodesManager';
import ScentMigrationManager from './components/ScentMigrationManager';
import MetaCatalogManager from './components/MetaCatalogManager';
import BrandBackgroundsManager from './components/BrandBackgroundsManager';
import VariantsManager from './components/VariantsManager';
import AiDescriptionsManager from './components/AiDescriptionsManager';
import '../Admin.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [orders, setOrders] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [products, setProducts] = useState([]);
  const [discountCodesCount, setDiscountCodesCount] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/collections/all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  const fetchProductCount = useCallback(async () => {
    try {
      // Fetch all visible products for discount codes dropdown
      const res = await fetch(`${API_URL}/api/products/admin/all?limit=10000&visibility=visible`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTotalProducts(data.total);
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch product count:', err);
    }
  }, []);

  const fetchDiscountCodesCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/discounts/admin/all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDiscountCodesCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch discount codes count:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders();
      fetchCollections();
      fetchProductCount();
      fetchDiscountCodesCount();
    }
  }, [user, fetchOrders, fetchCollections, fetchProductCount, fetchDiscountCodesCount]);

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
            className={`admin-tab ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveTab('collections')}
            data-testid="admin-tab-collections"
          >
            <Filter size={18} />
            <span>{t('collectionsTab') || 'Колекции'} ({collections.length})</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'homepage' ? 'active' : ''}`}
            onClick={() => setActiveTab('homepage')}
            data-testid="admin-tab-homepage"
          >
            <Home size={18} />
            <span>{t('homepageTab') || 'Homepage'}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'discounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('discounts')}
            data-testid="admin-tab-discounts"
          >
            <Percent size={18} />
            <span>{t('discountsTab') || 'Отстъпки'} ({discountCodesCount})</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'scent' ? 'active' : ''}`}
            onClick={() => setActiveTab('scent')}
            data-testid="admin-tab-scent"
          >
            <Sparkles size={18} />
            <span>{t('scentAnalysis') || 'Аромати'}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'meta' ? 'active' : ''}`}
            onClick={() => setActiveTab('meta')}
            data-testid="admin-tab-meta"
          >
            <Cloud size={18} />
            <span>Meta Catalog</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'backgrounds' ? 'active' : ''}`}
            onClick={() => setActiveTab('backgrounds')}
            data-testid="admin-tab-backgrounds"
          >
            <Image size={18} />
            <span>{t('brandBackgrounds') || 'Фонове'}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'variants' ? 'active' : ''}`}
            onClick={() => setActiveTab('variants')}
            data-testid="admin-tab-variants"
          >
            <Link2 size={18} />
            <span>{t('variantsTab') || 'Варианти'}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'ai-descriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-descriptions')}
            data-testid="admin-tab-ai-descriptions"
          >
            <Wand2 size={18} />
            <span>{t('aiDescriptions') || 'AI Описания'}</span>
          </button>
        </div>

        {activeTab === 'products' && (
          <ProductsManager collections={collections} />
        )}

        {activeTab === 'orders' && (
          <OrdersManager orders={orders} onRefresh={fetchOrders} />
        )}

        {activeTab === 'collections' && (
          <CollectionsManager 
            collections={collections} 
            loading={collectionsLoading} 
            onRefresh={fetchCollections} 
          />
        )}

        {activeTab === 'homepage' && (
          <HomepageManager />
        )}

        {activeTab === 'discounts' && (
          <DiscountCodesManager products={products} collections={collections} />
        )}

        {activeTab === 'scent' && (
          <ScentMigrationManager token={user?.token} />
        )}

        {activeTab === 'meta' && (
          <MetaCatalogManager />
        )}

        {activeTab === 'backgrounds' && (
          <BrandBackgroundsManager />
        )}

        {activeTab === 'variants' && (
          <VariantsManager />
        )}

        {activeTab === 'ai-descriptions' && (
          <AiDescriptionsManager />
        )}
      </div>
    </div>
  );
};

export default Admin;
