import React, { useState } from 'react';
import { Plus, Eye, EyeOff, Trash2, Loader } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CollectionsManager = ({ collections, loading, onRefresh }) => {
  const { t } = useLanguage();
  const [newCollection, setNewCollection] = useState({ name: '', name_en: '', slug: '', description: '', description_en: '' });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newCollection),
      });
      if (res.ok) {
        setNewCollection({ name: '', name_en: '', slug: '', description: '', description_en: '' });
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create collection');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (colId) => {
    const res = await fetch(`${API_URL}/api/collections/${colId}/toggle`, { method: 'POST', credentials: 'include' });
    if (res.ok) onRefresh();
  };

  const handleDelete = async (colId) => {
    if (!window.confirm(t('confirmDeleteCollection') || 'Сигурни ли сте, че искате да изтриете тази колекция?')) return;
    const res = await fetch(`${API_URL}/api/collections/${colId}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) onRefresh();
    else { const err = await res.json(); alert(err.detail || 'Failed to delete'); }
  };

  return (
    <div className="collections-management" data-testid="collections-management">
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>{t('manageCollections') || 'Управление на колекции'}</h3>
          <p className="body-regular" style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            {t('collectionsDescription') || 'Създавайте колекции за да организирате продуктите по страници и кампании.'}
          </p>
        </div>

        {/* Create new collection form */}
        <div className="new-collection-form" style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '16px' }}>{t('createNewCollection') || 'Създай нова колекция'}</h4>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">{t('collectionName') || 'Име (BG)'} *</label>
              <input type="text" value={newCollection.name}
                onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                className="form-input" placeholder="напр. Лятна Колекция" data-testid="new-collection-name" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('collectionNameEn') || 'Име (EN)'}</label>
              <input type="text" value={newCollection.name_en}
                onChange={(e) => setNewCollection({ ...newCollection, name_en: e.target.value })}
                className="form-input" placeholder="e.g. Summer Collection" data-testid="new-collection-name-en" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('collectionSlug') || 'Slug (URL)'} *</label>
              <input type="text" value={newCollection.slug}
                onChange={(e) => setNewCollection({ ...newCollection, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                className="form-input" placeholder="summer_collection" data-testid="new-collection-slug" />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">{t('collectionDescription') || 'Описание (BG)'}</label>
            <input type="text" value={newCollection.description}
              onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
              className="form-input" placeholder="Кратко описание на колекцията" />
          </div>
          <button className="btn-primary" style={{ marginTop: '16px' }}
            disabled={!newCollection.name || !newCollection.slug || creating}
            onClick={handleCreate} data-testid="create-collection-button">
            <Plus size={18} style={{ marginRight: '8px' }} />
            {creating ? (t('creating') || 'Създаване...') : (t('createCollection') || 'Създай колекция')}
          </button>
        </div>

        {/* Collections list */}
        <div className="collections-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader size={24} className="spin" /></div>
          ) : collections.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{t('noCollections') || 'Няма създадени колекции'}</p>
          ) : (
            <table className="collections-table">
              <thead>
                <tr>
                  <th>{t('collectionName') || 'Име'}</th>
                  <th>Slug</th>
                  <th>{t('productsCount') || 'Продукти'}</th>
                  <th>{t('type') || 'Тип'}</th>
                  <th>{t('status') || 'Статус'}</th>
                  <th>{t('actions') || 'Действия'}</th>
                </tr>
              </thead>
              <tbody>
                {collections.map(col => (
                  <tr key={col.id} data-testid={`collection-row-${col.slug}`}>
                    <td>
                      <strong>{col.name}</strong>
                      {col.name_en && <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>{col.name_en}</span>}
                    </td>
                    <td><code>{col.slug}</code></td>
                    <td>{col.product_count}</td>
                    <td>
                      {col.is_system ? (
                        <span className="badge badge-system">{t('system') || 'Системна'}</span>
                      ) : (
                        <span className="badge badge-custom">{t('custom') || 'Потребителска'}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${col.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {col.is_active ? (t('active') || 'Активна') : (t('inactive') || 'Неактивна')}
                      </span>
                    </td>
                    <td>
                      {!col.is_system ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="action-button" onClick={() => handleToggle(col.id)}
                            title={col.is_active ? 'Деактивирай' : 'Активирай'}>
                            {col.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button className="action-button delete" onClick={() => handleDelete(col.id)} title="Изтрий">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionsManager;
