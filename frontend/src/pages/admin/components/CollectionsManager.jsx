import React, { useState } from 'react';
import { Plus, Eye, EyeOff, Trash2, Loader, Pencil, Upload, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CollectionsManager = ({ collections, loading, onRefresh }) => {
  const { t } = useLanguage();
  const [newCollection, setNewCollection] = useState({ name: '', name_en: '', slug: '', description: '', description_en: '', show_in_nav: false });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ description: '', description_en: '', banner_image: '' });
  const [bannerUploading, setBannerUploading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (col) => {
    setEditingId(col.id);
    setEditData({
      description: col.description || '',
      description_en: col.description_en || '',
      banner_image: col.banner_image || '',
    });
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/upload/image`, { method: 'POST', credentials: 'include', body: formData });
      if (res.ok) {
        const data = await res.json();
        setEditData(prev => ({ ...prev, banner_image: data.url }));
      } else { alert('Upload failed'); }
    } catch (err) { alert('Upload error: ' + err.message); }
    finally { setBannerUploading(false); e.target.value = ''; }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_URL}/api/collections/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        setEditingId(null);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update collection');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

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
        setNewCollection({ name: '', name_en: '', slug: '', description: '', description_en: '', show_in_nav: false });
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

  const handleToggleNav = async (colId, currentValue) => {
    try {
      const res = await fetch(`${API_URL}/api/collections/${colId}/toggle-nav`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Failed to toggle nav:', err);
    }
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
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={newCollection.show_in_nav}
                onChange={(e) => setNewCollection({ ...newCollection, show_in_nav: e.target.checked })}
              />
              <span>{t('showInNav') || 'Покажи в навигацията (хедър/футър)'}</span>
            </label>
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
                  <th>{t('inNav') || 'В навигация'}</th>
                  <th>{t('status') || 'Статус'}</th>
                  <th>{t('actions') || 'Действия'}</th>
                </tr>
              </thead>
              <tbody>
                {collections.map(col => (
                  <React.Fragment key={col.id}>
                  <tr data-testid={`collection-row-${col.slug}`}>
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
                      <button 
                        className={`nav-toggle-btn ${col.show_in_nav ? 'active' : ''}`}
                        onClick={() => handleToggleNav(col.id, col.show_in_nav)}
                        title={col.show_in_nav ? 'Премахни от навигация' : 'Добави в навигация'}
                      >
                        {col.show_in_nav ? '✓' : '—'}
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${col.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {col.is_active ? (t('active') || 'Активна') : (t('inactive') || 'Неактивна')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="action-button" onClick={() => editingId === col.id ? setEditingId(null) : startEdit(col)}
                          title="Банер и описание" data-testid={`edit-collection-${col.slug}`}>
                          <Pencil size={16} />
                        </button>
                        {!col.is_system && (
                          <>
                            <button className="action-button" onClick={() => handleToggle(col.id)}
                              title={col.is_active ? 'Деактивирай' : 'Активирай'}>
                              {col.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button className="action-button delete" onClick={() => handleDelete(col.id)} title="Изтрий">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingId === col.id && (
                    <tr className="collection-edit-row">
                      <td colSpan={7} style={{ background: 'var(--bg-secondary)', padding: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <div className="form-group">
                            <label className="form-label">{t('collectionDescription') || 'Описание (BG)'}</label>
                            <textarea value={editData.description} rows={2}
                              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              className="form-input" placeholder="Описание на колекцията"
                              data-testid="edit-collection-description" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{t('collectionDescriptionEn') || 'Описание (EN)'}</label>
                            <textarea value={editData.description_en} rows={2}
                              onChange={(e) => setEditData({ ...editData, description_en: e.target.value })}
                              className="form-input" placeholder="Collection description"
                              data-testid="edit-collection-description-en" />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label className="form-label">{t('collectionBanner') || 'Банер снимка (страница на колекцията)'}</label>
                          {editData.banner_image ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={editData.banner_image} alt="Banner"
                                style={{ width: '320px', height: '110px', objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
                              <button
                                onClick={() => setEditData({ ...editData, banner_image: '' })}
                                title="Премахни банера"
                                data-testid="remove-collection-banner"
                                style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <Upload size={16} />
                              <span>{bannerUploading ? (t('uploading') || 'Качване...') : (t('uploadBanner') || 'Качи банер')}</span>
                              <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} disabled={bannerUploading} data-testid="upload-collection-banner" />
                            </label>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button className="btn-primary" onClick={handleSaveEdit} disabled={savingEdit} data-testid="save-collection-edit">
                            {savingEdit ? (t('saving') || 'Запазване...') : (t('save') || 'Запази')}
                          </button>
                          <button className="btn-secondary" onClick={() => setEditingId(null)}>
                            {t('cancel') || 'Отказ'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
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
