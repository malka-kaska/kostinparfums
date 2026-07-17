import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Copy, Check, Tag, Percent, RefreshCw, Calendar, Users, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DiscountCodesManager = ({ products, collections }) => {
  const { language, t } = useLanguage();
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'all',
    target_id: '',
    exclude_sale_items: false,
    usage_type: 'multi_use',
    usage_limit: '',
    per_user_limit: 1,
    min_order_amount: '',
    max_discount_amount: '',
    valid_from: '',
    valid_until: '',
    description: '',
    is_active: true,
  });

  const translations = {
    bg: {
      title: 'Кодове за отстъпка',
      description: 'Създавайте и управлявайте промоционални кодове за вашите клиенти.',
      addCode: 'Създай код',
      createNew: 'Създай нов код за отстъпка',
      editCode: 'Редактирай код',
      code: 'Код',
      codeHint: 'Оставете празно за автоматично генериране',
      generateCode: 'Генерирай',
      discountType: 'Тип отстъпка',
      percentage: 'Процент (%)',
      fixedAmount: 'Фиксирана сума (€)',
      discountValue: 'Стойност',
      appliesTo: 'Прилага се за',
      allProducts: 'Всички продукти',
      specificProduct: 'Конкретен продукт',
      specificCategory: 'Категория',
      specificCollection: 'Колекция/Кампания',
      specificBrand: 'Марка',
      selectProduct: 'Избери продукт',
      selectCategory: 'Избери категория',
      selectCollection: 'Избери колекция',
      enterBrand: 'Въведи марка',
      usageType: 'Тип използване',
      singleUse: 'Еднократен',
      multiUse: 'Многократен',
      usageLimit: 'Лимит използвания',
      usageLimitHint: 'Оставете празно за неограничено',
      perUserLimit: 'На потребител',
      minOrder: 'Мин. стойност на поръчка (€)',
      maxDiscount: 'Макс. отстъпка (€)',
      maxDiscountHint: 'Таван за процентни отстъпки',
      validFrom: 'Валиден от',
      validUntil: 'Валиден до',
      internalNote: 'Вътрешна бележка',
      active: 'Активен',
      save: 'Запази',
      cancel: 'Отказ',
      noCodesYet: 'Няма създадени кодове за отстъпка',
      used: 'използван',
      times: 'пъти',
      unlimited: 'Неограничено',
      expired: 'Изтекъл',
      notStarted: 'Не е започнал',
      copyCode: 'Копирай код',
      copied: 'Копиран!',
      confirmDelete: 'Сигурни ли сте, че искате да изтриете този код?',
      excludeSaleItems: 'Изключи продукти с намаление',
      excludeSaleItemsHint: 'Кодът няма да важи за продукти, които вече са на промоция',
      categories: {
        perfumes: 'Парфюми',
        makeup: 'Грим',
        skincare: 'Грижа за кожата',
        haircare: 'Грижа за косата',
        bodycare: 'Грижа за тялото',
        menscare: 'Мъжка грижа',
      }
    },
    en: {
      title: 'Discount Codes',
      description: 'Create and manage promotional codes for your customers.',
      addCode: 'Create Code',
      createNew: 'Create New Discount Code',
      editCode: 'Edit Code',
      code: 'Code',
      codeHint: 'Leave empty to auto-generate',
      generateCode: 'Generate',
      discountType: 'Discount Type',
      percentage: 'Percentage (%)',
      fixedAmount: 'Fixed Amount (€)',
      discountValue: 'Value',
      appliesTo: 'Applies To',
      allProducts: 'All Products',
      specificProduct: 'Specific Product',
      specificCategory: 'Category',
      specificCollection: 'Collection/Campaign',
      specificBrand: 'Brand',
      selectProduct: 'Select product',
      selectCategory: 'Select category',
      selectCollection: 'Select collection',
      enterBrand: 'Enter brand name',
      usageType: 'Usage Type',
      singleUse: 'Single Use',
      multiUse: 'Multi Use',
      usageLimit: 'Usage Limit',
      usageLimitHint: 'Leave empty for unlimited',
      perUserLimit: 'Per User',
      minOrder: 'Min. Order Value (€)',
      maxDiscount: 'Max. Discount (€)',
      maxDiscountHint: 'Cap for percentage discounts',
      validFrom: 'Valid From',
      validUntil: 'Valid Until',
      internalNote: 'Internal Note',
      active: 'Active',
      save: 'Save',
      cancel: 'Cancel',
      noCodesYet: 'No discount codes created yet',
      used: 'used',
      times: 'times',
      unlimited: 'Unlimited',
      expired: 'Expired',
      notStarted: 'Not Started',
      copyCode: 'Copy code',
      copied: 'Copied!',
      confirmDelete: 'Are you sure you want to delete this code?',
      excludeSaleItems: 'Exclude sale items',
      excludeSaleItemsHint: 'Code will not apply to products already on sale',
      categories: {
        perfumes: 'Perfumes',
        makeup: 'Makeup',
        skincare: 'Skincare',
        haircare: 'Haircare',
        bodycare: 'Body Care',
        menscare: 'Men\'s Care',
      }
    }
  };

  const txt = translations[language] || translations.bg;

  const CATEGORIES = [
    { id: 'perfumes', name: txt.categories.perfumes },
    { id: 'makeup', name: txt.categories.makeup },
    { id: 'skincare', name: txt.categories.skincare },
    { id: 'haircare', name: txt.categories.haircare },
    { id: 'bodycare', name: txt.categories.bodycare },
    { id: 'menscare', name: txt.categories.menscare },
  ];

  const fetchDiscountCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/discounts/admin/all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDiscountCodes(data.discount_codes || []);
      }
    } catch (err) {
      console.error('Failed to fetch discount codes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDiscountCodes(); }, [fetchDiscountCodes]);

  const resetForm = () => {
    setFormData({
      code: '', discount_type: 'percentage', discount_value: '', applies_to: 'all',
      target_id: '', exclude_sale_items: false, usage_type: 'multi_use', usage_limit: '', per_user_limit: 1,
      min_order_amount: '', max_discount_amount: '', valid_from: '', valid_until: '',
      description: '', is_active: true,
    });
  };

  const handleCreate = () => {
    setEditingCode(null);
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      applies_to: code.applies_to,
      target_id: code.target_id || '',
      exclude_sale_items: code.exclude_sale_items || false,
      usage_type: code.usage_type,
      usage_limit: code.usage_limit?.toString() || '',
      per_user_limit: code.per_user_limit || 1,
      min_order_amount: code.min_order_amount?.toString() || '',
      max_discount_amount: code.max_discount_amount?.toString() || '',
      valid_from: code.valid_from ? code.valid_from.slice(0, 16) : '',
      valid_until: code.valid_until ? code.valid_until.slice(0, 16) : '',
      description: code.description || '',
      is_active: code.is_active,
    });
    setShowForm(true);
  };

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSave = async () => {
    if (!formData.discount_value) {
      alert(language === 'bg' ? 'Моля, въведете стойност на отстъпката' : 'Please enter discount value');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        applies_to: formData.applies_to,
        target_id: formData.applies_to !== 'all' ? formData.target_id : null,
        exclude_sale_items: formData.exclude_sale_items,
        usage_type: formData.usage_type,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: parseInt(formData.per_user_limit) || 1,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        description: formData.description || null,
        is_active: formData.is_active,
      };

      const url = editingCode 
        ? `${API_URL}/api/discounts/admin/${editingCode.id}`
        : `${API_URL}/api/discounts/admin/create`;
      
      const method = editingCode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        setEditingCode(null);
        fetchDiscountCodes();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (codeId) => {
    try {
      const res = await fetch(`${API_URL}/api/discounts/admin/${codeId}/toggle`, {
        method: 'POST', credentials: 'include',
      });
      if (res.ok) fetchDiscountCodes();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (codeId) => {
    if (!window.confirm(txt.confirmDelete)) return;
    try {
      const res = await fetch(`${API_URL}/api/discounts/admin/${codeId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) fetchDiscountCodes();
      else { const err = await res.json(); alert(err.detail || 'Failed'); }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (code) => {
    const now = new Date();
    if (!code.is_active) return <span className="badge badge-inactive">{language === 'bg' ? 'Неактивен' : 'Inactive'}</span>;
    if (code.valid_until && new Date(code.valid_until) < now) return <span className="badge badge-expired">{txt.expired}</span>;
    if (code.valid_from && new Date(code.valid_from) > now) return <span className="badge badge-pending">{txt.notStarted}</span>;
    if (code.usage_type === 'single_use' && code.times_used > 0) return <span className="badge badge-used">{language === 'bg' ? 'Използван' : 'Used'}</span>;
    if (code.usage_limit && code.times_used >= code.usage_limit) return <span className="badge badge-used">{language === 'bg' ? 'Изчерпан' : 'Exhausted'}</span>;
    return <span className="badge badge-active">{language === 'bg' ? 'Активен' : 'Active'}</span>;
  };

  const getAppliesToLabel = (code) => {
    switch (code.applies_to) {
      case 'all': return txt.allProducts;
      case 'product': return `${txt.specificProduct}: ${code.target_name || code.target_id}`;
      case 'category': return `${txt.specificCategory}: ${txt.categories[code.target_id] || code.target_id}`;
      case 'collection': return `${txt.specificCollection}: ${code.target_name || code.target_id}`;
      case 'brand': return `${txt.specificBrand}: ${code.target_id}`;
      default: return code.applies_to;
    }
  };

  return (
    <div className="discount-codes-management" data-testid="discount-codes-management">
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h3>{txt.title}</h3>
            <p className="body-regular" style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{txt.description}</p>
          </div>
          <button className="btn-primary" onClick={handleCreate} data-testid="add-discount-code-btn">
            <Plus size={18} />
            <span>{txt.addCode}</span>
          </button>
        </div>

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="discount-form-modal">
            <div className="discount-form">
              <div className="form-header">
                <h2 className="heading-3">{editingCode ? txt.editCode : txt.createNew}</h2>
                <button className="icon-button" onClick={() => { setShowForm(false); resetForm(); setEditingCode(null); }}><X size={20} /></button>
              </div>

              <div className="form-grid discount-form-grid">
                {/* Code */}
                <div className="form-group">
                  <label className="form-label">{txt.code}</label>
                  <div className="code-input-group">
                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="form-input" placeholder="SAVE20" disabled={!!editingCode} data-testid="discount-code-input" />
                    {!editingCode && (
                      <button type="button" className="btn-generate" onClick={handleGenerateCode}><RefreshCw size={16} /> {txt.generateCode}</button>
                    )}
                  </div>
                  <span className="form-hint">{txt.codeHint}</span>
                </div>

                {/* Discount Type & Value */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{txt.discountType}</label>
                    <select value={formData.discount_type} onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      className="form-input" data-testid="discount-type-select">
                      <option value="percentage">{txt.percentage}</option>
                      <option value="fixed">{txt.fixedAmount}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{txt.discountValue}</label>
                    <div className="input-with-suffix">
                      <input type="number" min="0" step="0.01" value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        className="form-input" placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                        data-testid="discount-value-input" />
                      <span className="input-suffix">{formData.discount_type === 'percentage' ? '%' : '€'}</span>
                    </div>
                  </div>
                </div>

                {/* Applies To */}
                <div className="form-group full-width">
                  <label className="form-label">{txt.appliesTo}</label>
                  <div className="applies-to-options">
                    {[
                      { value: 'all', label: txt.allProducts, icon: <ShoppingBag size={16} /> },
                      { value: 'product', label: txt.specificProduct, icon: <Tag size={16} /> },
                      { value: 'category', label: txt.specificCategory, icon: <Tag size={16} /> },
                      { value: 'collection', label: txt.specificCollection, icon: <Tag size={16} /> },
                      { value: 'brand', label: txt.specificBrand, icon: <Tag size={16} /> },
                    ].map(opt => (
                      <label key={opt.value} className={`applies-to-option ${formData.applies_to === opt.value ? 'selected' : ''}`}>
                        <input type="radio" name="applies_to" value={opt.value} checked={formData.applies_to === opt.value}
                          onChange={(e) => setFormData({ ...formData, applies_to: e.target.value, target_id: '' })} />
                        {opt.icon}
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Target Selection */}
                {formData.applies_to === 'product' && products?.length > 0 && (
                  <div className="form-group full-width">
                    <label className="form-label">{txt.selectProduct}</label>
                    <select value={formData.target_id} onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                      className="form-input" data-testid="target-product-select">
                      <option value="">-- {txt.selectProduct} --</option>
                      {products.slice(0, 200).map(p => (<option key={p.id} value={p.id}>{p.name} - {p.brand}</option>))}
                    </select>
                  </div>
                )}
                {formData.applies_to === 'category' && (
                  <div className="form-group full-width">
                    <label className="form-label">{txt.selectCategory}</label>
                    <select value={formData.target_id} onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                      className="form-input" data-testid="target-category-select">
                      <option value="">-- {txt.selectCategory} --</option>
                      {CATEGORIES.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                )}
                {formData.applies_to === 'collection' && collections?.length > 0 && (
                  <div className="form-group full-width">
                    <label className="form-label">{txt.selectCollection}</label>
                    <select value={formData.target_id} onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                      className="form-input" data-testid="target-collection-select">
                      <option value="">-- {txt.selectCollection} --</option>
                      {collections.map(c => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
                    </select>
                  </div>
                )}
                {formData.applies_to === 'brand' && (
                  <div className="form-group full-width">
                    <label className="form-label">{txt.enterBrand}</label>
                    <input type="text" value={formData.target_id} onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                      className="form-input" placeholder="Dior, Chanel..." data-testid="target-brand-input" />
                  </div>
                )}

                {/* Exclude Sale Items */}
                <div className="form-group full-width">
                  <label className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.exclude_sale_items}
                      onChange={(e) => setFormData({ ...formData, exclude_sale_items: e.target.checked })}
                      data-testid="exclude-sale-items-checkbox"
                    />
                    <div>
                      <span style={{ fontWeight: 500 }}>{txt.excludeSaleItems}</span>
                      <span className="form-hint" style={{ display: 'block', marginTop: '2px' }}>{txt.excludeSaleItemsHint}</span>
                    </div>
                  </label>
                </div>

                {/* Usage Type */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{txt.usageType}</label>
                    <select value={formData.usage_type} onChange={(e) => setFormData({ ...formData, usage_type: e.target.value })}
                      className="form-input" data-testid="usage-type-select">
                      <option value="single_use">{txt.singleUse}</option>
                      <option value="multi_use">{txt.multiUse}</option>
                    </select>
                  </div>
                  {formData.usage_type === 'multi_use' && (
                    <div className="form-group">
                      <label className="form-label">{txt.usageLimit}</label>
                      <input type="number" min="1" value={formData.usage_limit}
                        onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                        className="form-input" placeholder="100" />
                      <span className="form-hint">{txt.usageLimitHint}</span>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">{txt.perUserLimit}</label>
                    <input type="number" min="1" value={formData.per_user_limit}
                      onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                      className="form-input" placeholder="1" />
                  </div>
                </div>

                {/* Order Requirements */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{txt.minOrder}</label>
                    <input type="number" min="0" step="0.01" value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      className="form-input" placeholder="50.00" />
                  </div>
                  {formData.discount_type === 'percentage' && (
                    <div className="form-group">
                      <label className="form-label">{txt.maxDiscount}</label>
                      <input type="number" min="0" step="0.01" value={formData.max_discount_amount}
                        onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                        className="form-input" placeholder="20.00" />
                      <span className="form-hint">{txt.maxDiscountHint}</span>
                    </div>
                  )}
                </div>

                {/* Validity Period */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><Calendar size={14} /> {txt.validFrom}</label>
                    <input type="datetime-local" value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Calendar size={14} /> {txt.validUntil}</label>
                    <input type="datetime-local" value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="form-input" />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group full-width">
                  <label className="form-label">{txt.internalNote}</label>
                  <input type="text" value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-input" placeholder={language === 'bg' ? 'Коледна промоция 2025' : 'Christmas promo 2025'} />
                </div>

                {/* Active Toggle */}
                <div className="form-group full-width">
                  <label className="toggle-label">
                    <input type="checkbox" checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    <span>{txt.active}</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); setEditingCode(null); }}>{txt.cancel}</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} data-testid="save-discount-code-btn">
                  <Save size={18} />
                  <span>{saving ? '...' : txt.save}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discount Codes List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : discountCodes.length === 0 ? (
          <div className="empty-state">
            <Percent size={48} strokeWidth={1} />
            <p>{txt.noCodesYet}</p>
          </div>
        ) : (
          <div className="discount-codes-table">
            <table>
              <thead>
                <tr>
                  <th>{txt.code}</th>
                  <th>{txt.discountType}</th>
                  <th>{txt.appliesTo}</th>
                  <th>{language === 'bg' ? 'Използване' : 'Usage'}</th>
                  <th>{language === 'bg' ? 'Валидност' : 'Validity'}</th>
                  <th>{language === 'bg' ? 'Статус' : 'Status'}</th>
                  <th>{language === 'bg' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {discountCodes.map(code => (
                  <tr key={code.id} className={!code.is_active ? 'inactive-row' : ''}>
                    <td>
                      <div className="code-cell">
                        <code className="discount-code-display">{code.code}</code>
                        <button className="btn-copy" onClick={() => handleCopyCode(code.code)} title={txt.copyCode}>
                          {copiedCode === code.code ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      {code.description && <span className="code-description">{code.description}</span>}
                    </td>
                    <td>
                      <span className="discount-value-badge">
                        {code.discount_type === 'percentage' ? (
                          <><Percent size={14} /> {code.discount_value}%</>
                        ) : (
                          <>€{code.discount_value.toFixed(2)}</>
                        )}
                      </span>
                    </td>
                    <td><span className="applies-to-cell">{getAppliesToLabel(code)}</span></td>
                    <td>
                      <div className="usage-cell">
                        <Users size={14} />
                        <span>{code.times_used} / {code.usage_limit || '∞'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="validity-cell">
                        {code.valid_from && <span>{new Date(code.valid_from).toLocaleDateString()}</span>}
                        {code.valid_from && code.valid_until && <span> → </span>}
                        {code.valid_until && <span>{new Date(code.valid_until).toLocaleDateString()}</span>}
                        {!code.valid_from && !code.valid_until && <span style={{ color: 'var(--text-light)' }}>—</span>}
                      </div>
                    </td>
                    <td>{getStatusBadge(code)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="action-button" onClick={() => handleToggle(code.id)} title={code.is_active ? 'Deactivate' : 'Activate'}>
                          {code.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button className="action-button edit" onClick={() => handleEdit(code)}><Edit size={16} /></button>
                        <button className="action-button delete" onClick={() => handleDelete(code.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountCodesManager;
