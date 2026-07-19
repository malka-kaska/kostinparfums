import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Save, Eye, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BrandBackgroundsManager = () => {
  const { language } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state for editing
  const [formData, setFormData] = useState({
    image_url: '',
    text_color: 'white',
    image_position_x: 50,
    image_position_y: 50,
    overlay_opacity: 0.3
  });

  // Load brands and backgrounds
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [brandsRes, backgroundsRes] = await Promise.all([
        fetch(`${API_URL}/api/brand-backgrounds/brands`),
        fetch(`${API_URL}/api/brand-backgrounds`)
      ]);
      
      const brandsData = await brandsRes.json();
      const backgroundsData = await backgroundsRes.json();
      
      setBrands(brandsData.brands || []);
      setBackgrounds(backgroundsData.backgrounds || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    
    // Find existing background for this brand
    const existing = backgrounds.find(bg => bg.brand === brand);
    if (existing) {
      setFormData({
        image_url: existing.image_url || '',
        text_color: existing.text_color || 'white',
        image_position_x: existing.image_position_x ?? 50,
        image_position_y: existing.image_position_y ?? 50,
        overlay_opacity: existing.overlay_opacity ?? 0.3
      });
    } else {
      setFormData({
        image_url: '',
        text_color: 'white',
        image_position_x: 50,
        image_position_y: 50,
        overlay_opacity: 0.3
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    try {
      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include'
      });
      
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Грешка при качване на снимката');
    }
  };

  const handleSave = async () => {
    if (!selectedBrand || !formData.image_url) {
      alert('Моля, изберете марка и качете снимка');
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/brand-backgrounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          brand: selectedBrand,
          ...formData
        })
      });
      
      if (res.ok) {
        alert('Запазено успешно!');
        loadData();
      } else {
        const error = await res.json();
        alert(`Грешка: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Грешка при запазване');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBrand) return;
    
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете фона за ${selectedBrand}?`)) {
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/brand-backgrounds/${encodeURIComponent(selectedBrand)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Изтрито успешно!');
        setSelectedBrand(null);
        setFormData({
          image_url: '',
          text_color: 'white',
          image_position_x: 50,
          image_position_y: 50,
          overlay_opacity: 0.3
        });
        loadData();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getBrandStatus = (brand) => {
    return backgrounds.some(bg => bg.brand === brand);
  };

  if (isLoading) {
    return <div className="loading">Зареждане...</div>;
  }

  return (
    <div className="brand-backgrounds-manager" data-testid="brand-backgrounds-manager">
      <h2 style={{ marginBottom: '20px' }}>
        {language === 'bg' ? '🎨 Фонове на марки (Header)' : '🎨 Brand Backgrounds (Header)'}
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Brand List */}
        <div style={{ 
          background: '#1a1a1a', 
          borderRadius: '12px', 
          padding: '16px',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#9ca3af' }}>
            {language === 'bg' ? 'Марки' : 'Brands'} ({brands.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {brands.map(brand => (
              <div
                key={brand}
                onClick={() => handleBrandSelect(brand)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedBrand === brand ? '#c9a86c' : 'transparent',
                  color: selectedBrand === brand ? '#000' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <span>{brand}</span>
                {getBrandStatus(brand) && (
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#22c55e' 
                  }} title="Има фон" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Editor */}
        <div style={{ 
          background: '#1a1a1a', 
          borderRadius: '12px', 
          padding: '24px'
        }}>
          {selectedBrand ? (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3>{selectedBrand}</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    style={{
                      padding: '8px 16px',
                      background: previewMode ? '#3b82f6' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Eye size={16} /> {language === 'bg' ? 'Преглед' : 'Preview'}
                  </button>
                </div>
              </div>
              
              {/* Preview Area */}
              {previewMode && formData.image_url && (
                <div style={{
                  position: 'relative',
                  height: '120px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${formData.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: `${formData.image_position_x}% ${formData.image_position_y}%`
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `rgba(0,0,0,${formData.overlay_opacity})`
                  }} />
                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '20px',
                    color: formData.text_color,
                    fontWeight: 'bold',
                    fontSize: '24px'
                  }}>
                    KOSTIN
                  </div>
                </div>
              )}
              
              {/* Image Upload */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>
                  {language === 'bg' ? 'Снимка за фон' : 'Background Image'}
                </label>
                
                {formData.image_url ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={formData.image_url} 
                      alt="Background preview"
                      style={{ 
                        width: '200px', 
                        height: '120px', 
                        objectFit: 'cover',
                        objectPosition: `${formData.image_position_x}% ${formData.image_position_y}%`,
                        borderRadius: '8px'
                      }}
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '200px',
                    height: '120px',
                    border: '2px dashed #374151',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#9ca3af'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <Upload size={24} />
                  </label>
                )}
              </div>
              
              {/* Image Position */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>
                  {language === 'bg' ? 'Позиция на снимката' : 'Image Position'}
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280' }}>
                      {language === 'bg' ? 'Хоризонтално' : 'Horizontal'}: {formData.image_position_x}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.image_position_x}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        image_position_x: parseInt(e.target.value) 
                      }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280' }}>
                      {language === 'bg' ? 'Вертикално' : 'Vertical'}: {formData.image_position_y}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.image_position_y}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        image_position_y: parseInt(e.target.value) 
                      }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Text Color */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>
                  {language === 'bg' ? 'Цвят на текста' : 'Text Color'}
                </label>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, text_color: 'white' }))}
                    style={{
                      padding: '10px 20px',
                      background: formData.text_color === 'white' ? '#fff' : '#374151',
                      color: formData.text_color === 'white' ? '#000' : '#fff',
                      border: formData.text_color === 'white' ? '2px solid #c9a86c' : '2px solid transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Sun size={16} /> {language === 'bg' ? 'Бял' : 'White'}
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, text_color: 'black' }))}
                    style={{
                      padding: '10px 20px',
                      background: formData.text_color === 'black' ? '#000' : '#374151',
                      color: formData.text_color === 'black' ? '#fff' : '#fff',
                      border: formData.text_color === 'black' ? '2px solid #c9a86c' : '2px solid transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Moon size={16} /> {language === 'bg' ? 'Черен' : 'Black'}
                  </button>
                </div>
              </div>
              
              {/* Overlay Opacity */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af' }}>
                  {language === 'bg' ? 'Затъмняване' : 'Overlay'}: {Math.round(formData.overlay_opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="70"
                  value={formData.overlay_opacity * 100}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    overlay_opacity: parseInt(e.target.value) / 100 
                  }))}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.image_url}
                  style={{
                    padding: '12px 24px',
                    background: '#c9a86c',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSaving || !formData.image_url ? 'not-allowed' : 'pointer',
                    opacity: isSaving || !formData.image_url ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600'
                  }}
                >
                  <Save size={16} /> {isSaving ? 'Запазване...' : (language === 'bg' ? 'Запази' : 'Save')}
                </button>
                
                {getBrandStatus(selectedBrand) && (
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: '12px 24px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Trash2 size={16} /> {language === 'bg' ? 'Изтрий' : 'Delete'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '300px',
              color: '#6b7280'
            }}>
              {language === 'bg' ? 'Изберете марка от списъка' : 'Select a brand from the list'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandBackgroundsManager;
