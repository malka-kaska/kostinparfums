import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, AlertTriangle, ExternalLink, Cloud, Database, ArrowRightLeft } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MetaCatalogManager = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState('');
  const [metaProducts, setMetaProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/meta-catalog/status`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setError('');
      } else {
        setError('Грешка при зареждане на статуса');
      }
    } catch (err) {
      setError('Грешка при свързване със сървъра');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetaProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/meta-catalog/products?limit=25`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMetaProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching Meta products:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSyncAll = async () => {
    setSyncing(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/meta-catalog/sync/all`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastSync(new Date().toLocaleString('bg-BG'));
        // Refresh status after a delay to see updated counts
        setTimeout(fetchStatus, 5000);
      } else {
        setError('Грешка при синхронизация');
      }
    } catch (err) {
      setError('Грешка при свързване');
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/meta-catalog/test`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setStatus(prev => ({ ...prev, connection_status: 'connected', meta_catalog: data.catalog }));
        setError('');
      } else {
        setError(data.error?.error?.message || 'Връзката неуспешна');
      }
    } catch (err) {
      setError('Грешка при тест на връзката');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="meta-catalog-manager" data-testid="meta-catalog-manager">
        <div className="loading-state">
          <RefreshCw className="spin" size={24} />
          <span>Зареждане...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="meta-catalog-manager" data-testid="meta-catalog-manager">
      <div className="manager-header">
        <h2>
          <Cloud size={24} />
          Meta Catalog Integration
        </h2>
        <p className="manager-subtitle">
          Синхронизирайте продуктите с Meta Ads Manager за Dynamic Ads
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Connection Status */}
      <div className="status-cards">
        <div className={`status-card ${status?.connection_status === 'connected' ? 'connected' : 'disconnected'}`}>
          <div className="status-icon">
            {status?.connection_status === 'connected' ? (
              <Check size={24} />
            ) : (
              <AlertTriangle size={24} />
            )}
          </div>
          <div className="status-info">
            <span className="status-label">Връзка</span>
            <span className="status-value">
              {status?.connection_status === 'connected' ? 'Свързан' : 'Прекъсната'}
            </span>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon local">
            <Database size={24} />
          </div>
          <div className="status-info">
            <span className="status-label">Локални продукти</span>
            <span className="status-value">{status?.local_product_count?.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon meta">
            <Cloud size={24} />
          </div>
          <div className="status-info">
            <span className="status-label">В Meta Каталог</span>
            <span className="status-value">{status?.meta_catalog?.product_count?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Catalog Info */}
      {status?.meta_catalog && (
        <div className="catalog-info">
          <h3>Каталог информация</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Име:</span>
              <span className="info-value">{status.meta_catalog.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ID:</span>
              <span className="info-value">{status.meta_catalog.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Тип:</span>
              <span className="info-value">{status.meta_catalog.vertical}</span>
            </div>
          </div>
          <a 
            href={`https://business.facebook.com/commerce/catalogs/${status.meta_catalog.id}/products`}
            target="_blank"
            rel="noopener noreferrer"
            className="meta-link"
          >
            <ExternalLink size={16} />
            Отвори в Meta Business Manager
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="actions-section">
        <h3>Действия</h3>
        <div className="action-buttons">
          <button 
            onClick={handleTestConnection}
            disabled={loading}
            className="btn-test"
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            Тест на връзката
          </button>
          
          <button 
            onClick={handleSyncAll}
            disabled={syncing || status?.connection_status !== 'connected'}
            className="btn-sync"
          >
            <ArrowRightLeft size={18} className={syncing ? 'spin' : ''} />
            {syncing ? 'Синхронизиране...' : 'Синхронизирай всички продукти'}
          </button>

          <button 
            onClick={() => {
              setShowProducts(!showProducts);
              if (!showProducts) fetchMetaProducts();
            }}
            className="btn-view"
          >
            {showProducts ? 'Скрий продуктите' : 'Виж продукти в Meta'}
          </button>
        </div>
        
        {lastSync && (
          <p className="last-sync">Последна синхронизация: {lastSync}</p>
        )}
      </div>

      {/* Products in Meta */}
      {showProducts && (
        <div className="meta-products-section">
          <h3>Продукти в Meta каталога ({metaProducts.length})</h3>
          {metaProducts.length === 0 ? (
            <p className="no-products">Няма продукти в каталога или все още се обработват.</p>
          ) : (
            <div className="meta-products-grid">
              {metaProducts.map(product => (
                <div key={product.id} className="meta-product-card">
                  <img src={product.image_url} alt={product.name} />
                  <div className="meta-product-info">
                    <span className="meta-product-name">{product.name}</span>
                    <span className="meta-product-price">{product.price}</span>
                    <span className={`meta-product-availability ${product.availability?.replace(' ', '-')}`}>
                      {product.availability === 'in stock' ? 'В наличност' : 'Изчерпан'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="help-section">
        <h3>Как работи?</h3>
        <ul>
          <li><strong>Автоматичен sync:</strong> При създаване, редактиране или изтриване на продукт, промените автоматично се изпращат към Meta.</li>
          <li><strong>Пълна синхронизация:</strong> Използвайте бутона за да синхронизирате всички продукти наведнъж.</li>
          <li><strong>Dynamic Ads:</strong> Продуктите в каталога могат да се използват за автоматични Facebook/Instagram реклами.</li>
        </ul>
      </div>

      <style>{`
        .meta-catalog-manager {
          padding: 20px 0;
        }
        
        .manager-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 500;
          margin: 0 0 5px 0;
        }
        
        .manager-subtitle {
          color: var(--text-secondary);
          font-size: 14px;
          margin: 0 0 24px 0;
        }
        
        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .loading-state {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 40px;
          justify-content: center;
          color: var(--text-secondary);
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .status-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .status-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
        }
        
        .status-card.connected .status-icon {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .status-card.disconnected .status-icon {
          background: #fef2f2;
          color: #dc2626;
        }
        
        .status-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
        }
        
        .status-icon.local {
          background: #ede9fe;
          color: #7c3aed;
        }
        
        .status-icon.meta {
          background: #e0e7ff;
          color: #4f46e5;
        }
        
        .status-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .status-label {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .status-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .catalog-info {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .catalog-info h3 {
          font-size: 14px;
          font-weight: 500;
          margin: 0 0 12px 0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .info-label {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .info-value {
          font-size: 13px;
          color: var(--text-primary);
        }
        
        .meta-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #4f46e5;
          text-decoration: none;
        }
        
        .meta-link:hover {
          text-decoration: underline;
        }
        
        .actions-section {
          margin-bottom: 24px;
        }
        
        .actions-section h3 {
          font-size: 14px;
          font-weight: 500;
          margin: 0 0 12px 0;
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .action-buttons button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-test {
          background: #f1f5f9;
          color: #475569;
        }
        
        .btn-test:hover:not(:disabled) {
          background: #e2e8f0;
        }
        
        .btn-sync {
          background: #4f46e5;
          color: white;
        }
        
        .btn-sync:hover:not(:disabled) {
          background: #4338ca;
        }
        
        .btn-sync:disabled, .btn-test:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-view {
          background: transparent;
          border: 1px solid var(--border-light) !important;
          color: var(--text-primary);
        }
        
        .btn-view:hover {
          background: var(--bg-primary);
        }
        
        .last-sync {
          margin-top: 12px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .meta-products-section {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .meta-products-section h3 {
          font-size: 14px;
          font-weight: 500;
          margin: 0 0 16px 0;
        }
        
        .no-products {
          color: var(--text-secondary);
          font-size: 14px;
          text-align: center;
          padding: 20px;
        }
        
        .meta-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        
        .meta-product-card {
          border: 1px solid var(--border-light);
          border-radius: 6px;
          overflow: hidden;
        }
        
        .meta-product-card img {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }
        
        .meta-product-info {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .meta-product-name {
          font-size: 12px;
          font-weight: 500;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .meta-product-price {
          font-size: 13px;
          font-weight: 600;
          color: var(--accent-gold);
        }
        
        .meta-product-availability {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
        }
        
        .meta-product-availability.in-stock {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .meta-product-availability.out-of-stock {
          background: #fef2f2;
          color: #dc2626;
        }
        
        .help-section {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
        }
        
        .help-section h3 {
          font-size: 14px;
          font-weight: 500;
          margin: 0 0 12px 0;
        }
        
        .help-section ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .help-section li {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          line-height: 1.5;
        }
        
        .help-section li strong {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default MetaCatalogManager;
