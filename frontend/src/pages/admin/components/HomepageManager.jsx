import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Save, X, Search, Link, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomepageManager = () => {
  const { lang, t } = useLanguage();
  const [heroSlides, setHeroSlides] = useState([]);
  const [featuredProductIds, setFeaturedProductIds] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [heroUploading, setHeroUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSlide, setExpandedSlide] = useState(null);
  const [campaignBanner, setCampaignBanner] = useState({
    enabled: false,
    image: '',
    title: '',
    title_en: '',
    description: '',
    description_en: '',
    button_text: '',
    button_text_en: '',
    button_link: '',
  });
  const [campaignUploading, setCampaignUploading] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [genderImages, setGenderImages] = useState({ men: '', women: '' });
  const [genderMenUploading, setGenderMenUploading] = useState(false);
  const [genderWomenUploading, setGenderWomenUploading] = useState(false);
  const [savingGenderImages, setSavingGenderImages] = useState(false);

  const txt = lang === 'bg' ? {
    heroSlides: 'Снимки на началната страница',
    addImage: 'Добави снимка',
    uploading: 'Качване...',
    saveChanges: 'Запази',
    saving: 'Запазване...',
    savedSuccessfully: 'Запазено успешно!',
    buttonSettings: 'Настройки на бутона',
    buttonText: 'Текст на бутона (BG)',
    buttonTextEn: 'Текст на бутона (EN)',
    buttonLink: 'Линк на бутона',
    showButton: 'Покажи бутон',
    linkType: 'Тип линк',
    selectProduct: 'Избери продукт',
    selectCollection: 'Избери колекция',
    customUrl: 'Друг URL',
    product: 'Продукт',
    collection: 'Колекция',
    custom: 'Друг',
    imageDescription: 'Описание на снимката',
    campaignBanner: 'Кампанийна секция',
    campaignBannerDesc: 'Голяма кампанийна секция, показва се под "Пазарувайте по категории".',
    enableCampaign: 'Активирай секцията',
    campaignImage: 'Изображение (фон)',
    uploadImage: 'Качи снимка',
    replaceImage: 'Смени снимката',
    campaignTitle: 'Заглавие (BG)',
    campaignTitleEn: 'Заглавие (EN)',
    campaignDescription: 'Описание (BG)',
    campaignDescriptionEn: 'Описание (EN)',
    campaignButtonText: 'Текст на бутона (BG)',
    campaignButtonTextEn: 'Текст на бутона (EN)',
    campaignButtonLink: 'Линк на бутона (напр. /products?collection=summer)',
    preview: 'Преглед',
    genderImages: 'Снимки на секциите „Мъже" и „Жени"',
    genderImagesDesc: 'Тези снимки се показват на началната страница в секцията „Пазарувайте по категории".',
    menImage: 'Снимка „За мъже"',
    womenImage: 'Снимка „За жени"',
  } : {
    heroSlides: 'Hero Carousel Images',
    addImage: 'Add Image',
    uploading: 'Uploading...',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    savedSuccessfully: 'Saved successfully!',
    buttonSettings: 'Button Settings',
    buttonText: 'Button Text (BG)',
    buttonTextEn: 'Button Text (EN)',
    buttonLink: 'Button Link',
    showButton: 'Show Button',
    linkType: 'Link Type',
    selectProduct: 'Select Product',
    selectCollection: 'Select Collection',
    customUrl: 'Custom URL',
    product: 'Product',
    collection: 'Collection',
    custom: 'Custom',
    imageDescription: 'Image description',
    campaignBanner: 'Campaign Banner',
    campaignBannerDesc: 'Large campaign banner, shown under "Shop by Category".',
    enableCampaign: 'Enable section',
    campaignImage: 'Background Image',
    uploadImage: 'Upload Image',
    replaceImage: 'Replace Image',
    campaignTitle: 'Title (BG)',
    campaignTitleEn: 'Title (EN)',
    campaignDescription: 'Description (BG)',
    campaignDescriptionEn: 'Description (EN)',
    campaignButtonText: 'Button Text (BG)',
    campaignButtonTextEn: 'Button Text (EN)',
    campaignButtonLink: 'Button Link (e.g. /products?collection=summer)',
    preview: 'Preview',
    genderImages: 'Men/Women Section Images',
    genderImagesDesc: 'These images are displayed on the homepage in the "Shop by Category" section.',
    menImage: 'Men Image',
    womenImage: 'Women Image',
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/homepage/settings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHeroSlides(data.hero_slides || []);
        setFeaturedProductIds(data.featured_product_ids || []);
        if (data.campaign_banner) {
          setCampaignBanner({
            enabled: !!data.campaign_banner.enabled,
            image: data.campaign_banner.image || '',
            title: data.campaign_banner.title || '',
            title_en: data.campaign_banner.title_en || '',
            description: data.campaign_banner.description || '',
            description_en: data.campaign_banner.description_en || '',
            button_text: data.campaign_banner.button_text || '',
            button_text_en: data.campaign_banner.button_text_en || '',
            button_link: data.campaign_banner.button_link || '',
          });
        }
        if (data.gender_images) {
          setGenderImages({
            men: data.gender_images.men || '',
            women: data.gender_images.women || '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch homepage settings:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/admin/all?limit=10000`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllProducts((data.products || []).filter(p => p.is_visible));
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/collections`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCollections(Array.isArray(data) ? data : data.collections || []);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  }, []);

  useEffect(() => { fetchSettings(); fetchProducts(); fetchCollections(); }, [fetchSettings, fetchProducts, fetchCollections]);

  // Hero Image handlers
  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/upload/image`, { method: 'POST', credentials: 'include', body: formData });
      if (res.ok) {
        const data = await res.json();
        // Initialize button settings if not present
        setHeroSlides(prev => [...prev, { 
          image: data.url, 
          alt: '',
          show_button: true,
          button_text: lang === 'bg' ? 'Разгледай' : 'Explore',
          button_link_type: 'collection', // 'product', 'collection', 'custom'
          button_link: '/products',
          button_product_id: null,
          button_collection_slug: null
        }]);
      } else { alert('Upload failed'); }
    } catch (err) { alert('Upload error: ' + err.message); }
    finally { setHeroUploading(false); e.target.value = ''; }
  };

  const removeHeroSlide = (index) => setHeroSlides(prev => prev.filter((_, i) => i !== index));
  
  const moveHeroSlide = (from, to) => {
    const newSlides = [...heroSlides];
    const [removed] = newSlides.splice(from, 1);
    newSlides.splice(to, 0, removed);
    setHeroSlides(newSlides);
  };

  const saveHeroSlides = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage/hero-slides`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ slides: heroSlides }),
      });
      if (res.ok) alert(t('savedSuccessfully') || 'Saved successfully!');
      else alert('Save failed');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  // Featured Products handlers
  const toggleFeatured = (productId) => {
    setFeaturedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const moveFeatured = (index, direction) => {
    const newIds = [...featuredProductIds];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newIds.length) return;
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setFeaturedProductIds(newIds);
  };

  const saveFeaturedProducts = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage/featured-products`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ product_ids: featuredProductIds }),
      });
      if (res.ok) alert(t('savedSuccessfully') || 'Saved successfully!');
      else alert('Save failed');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  // Campaign Banner handlers
  const handleCampaignImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCampaignUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/upload/image`, { method: 'POST', credentials: 'include', body: formData });
      if (res.ok) {
        const data = await res.json();
        setCampaignBanner(prev => ({ ...prev, image: data.url }));
      } else {
        alert('Upload failed');
      }
    } catch (err) { alert('Upload error: ' + err.message); }
    finally { setCampaignUploading(false); e.target.value = ''; }
  };

  const saveCampaignBanner = async () => {
    setSavingCampaign(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage/campaign-banner`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ banner: campaignBanner }),
      });
      if (res.ok) alert(txt.savedSuccessfully);
      else alert('Save failed');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSavingCampaign(false); }
  };

  // Gender Images handlers
  const handleGenderImageUpload = async (e, gender) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (gender === 'men') setGenderMenUploading(true);
    else setGenderWomenUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/upload/image`, { method: 'POST', credentials: 'include', body: formData });
      if (res.ok) {
        const data = await res.json();
        setGenderImages(prev => ({ ...prev, [gender]: data.url }));
      } else {
        alert('Upload failed');
      }
    } catch (err) { alert('Upload error: ' + err.message); }
    finally {
      if (gender === 'men') setGenderMenUploading(false);
      else setGenderWomenUploading(false);
      e.target.value = '';
    }
  };

  const saveGenderImages = async () => {
    setSavingGenderImages(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage/gender-images`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ images: genderImages }),
      });
      if (res.ok) alert(txt.savedSuccessfully);
      else alert('Save failed');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSavingGenderImages(false); }
  };

  return (
    <div className="homepage-management">
      {/* Hero Slides Section */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>{t('heroSlides') || 'Hero Carousel Images'}</h3>
          <div className="section-actions">
            <label className="btn-secondary upload-btn">
              <Upload size={16} />
              <span>{heroUploading ? (t('uploading') || 'Uploading...') : (t('addImage') || 'Add Image')}</span>
              <input type="file" accept="image/*" onChange={handleHeroUpload} disabled={heroUploading} style={{ display: 'none' }} />
            </label>
            <button className="btn-primary" onClick={saveHeroSlides} disabled={saving}>
              <Save size={16} />
              <span>{saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}</span>
            </button>
          </div>
        </div>
        
        <div className="hero-slides-grid">
          {heroSlides.map((slide, index) => (
            <div key={index} className="hero-slide-card">
              <div className="hero-slide-image">
                <img src={slide.image} alt={slide.alt || `Slide ${index + 1}`} />
              </div>
              <div className="hero-slide-actions">
                <button className="btn-icon" onClick={() => moveHeroSlide(index, -1)} disabled={index === 0}>↑</button>
                <button className="btn-icon" onClick={() => moveHeroSlide(index, 1)} disabled={index === heroSlides.length - 1}>↓</button>
                <button className="btn-icon btn-danger" onClick={() => removeHeroSlide(index)}><X size={16} /></button>
              </div>
              <input type="text" placeholder={txt.imageDescription} value={slide.alt || ''}
                onChange={(e) => {
                  const newSlides = [...heroSlides];
                  newSlides[index] = { ...slide, alt: e.target.value };
                  setHeroSlides(newSlides);
                }}
                className="hero-slide-alt-input" />
              
              {/* Button Settings */}
              <div className="hero-button-settings">
                <button 
                  className="btn-expand-settings"
                  onClick={() => setExpandedSlide(expandedSlide === index ? null : index)}
                >
                  <Link size={14} />
                  <span>{txt.buttonSettings}</span>
                  <ChevronDown size={14} className={expandedSlide === index ? 'rotated' : ''} />
                </button>
                
                {expandedSlide === index && (
                  <div className="button-settings-panel">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={slide.show_button !== false}
                        onChange={(e) => {
                          const newSlides = [...heroSlides];
                          newSlides[index] = { ...slide, show_button: e.target.checked };
                          setHeroSlides(newSlides);
                        }}
                      />
                      <span>{txt.showButton}</span>
                    </label>
                    
                    {slide.show_button !== false && (
                      <>
                        <div className="setting-row">
                          <label>{txt.buttonText}</label>
                          <input 
                            type="text" 
                            value={slide.button_text || ''}
                            placeholder={lang === 'bg' ? 'Разгледай колекцията' : 'Разгледай колекцията (BG)'}
                            data-testid={`slide-button-text-${index}`}
                            onChange={(e) => {
                              const newSlides = [...heroSlides];
                              newSlides[index] = { ...slide, button_text: e.target.value };
                              setHeroSlides(newSlides);
                            }}
                          />
                        </div>
                        
                        <div className="setting-row">
                          <label>{txt.buttonTextEn}</label>
                          <input 
                            type="text" 
                            value={slide.button_text_en || ''}
                            placeholder="Explore Collection"
                            data-testid={`slide-button-text-en-${index}`}
                            onChange={(e) => {
                              const newSlides = [...heroSlides];
                              newSlides[index] = { ...slide, button_text_en: e.target.value };
                              setHeroSlides(newSlides);
                            }}
                          />
                        </div>
                        
                        <div className="setting-row">
                          <label>{txt.linkType}</label>
                          <select 
                            value={slide.button_link_type || 'custom'}
                            onChange={(e) => {
                              const newSlides = [...heroSlides];
                              newSlides[index] = { 
                                ...slide, 
                                button_link_type: e.target.value,
                                button_link: e.target.value === 'custom' ? '/products' : ''
                              };
                              setHeroSlides(newSlides);
                            }}
                          >
                            <option value="collection">{txt.collection}</option>
                            <option value="product">{txt.product}</option>
                            <option value="custom">{txt.custom}</option>
                          </select>
                        </div>
                        
                        {slide.button_link_type === 'collection' && (
                          <div className="setting-row">
                            <label>{txt.selectCollection}</label>
                            <select 
                              value={slide.button_collection_slug || ''}
                              onChange={(e) => {
                                const newSlides = [...heroSlides];
                                newSlides[index] = { 
                                  ...slide, 
                                  button_collection_slug: e.target.value,
                                  button_link: `/products?collection=${e.target.value}`
                                };
                                setHeroSlides(newSlides);
                              }}
                            >
                              <option value="">-- {txt.selectCollection} --</option>
                              {collections.map(col => (
                                <option key={col.slug} value={col.slug}>
                                  {col.name_bg || col.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {slide.button_link_type === 'product' && (
                          <div className="setting-row">
                            <label>{txt.selectProduct}</label>
                            <select 
                              value={slide.button_product_id || ''}
                              onChange={(e) => {
                                const newSlides = [...heroSlides];
                                newSlides[index] = { 
                                  ...slide, 
                                  button_product_id: e.target.value,
                                  button_link: `/product/${e.target.value}`
                                };
                                setHeroSlides(newSlides);
                              }}
                            >
                              <option value="">-- {txt.selectProduct} --</option>
                              {allProducts.slice(0, 100).map(prod => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} - €{prod.price}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {slide.button_link_type === 'custom' && (
                          <div className="setting-row">
                            <label>{txt.customUrl}</label>
                            <input 
                              type="text" 
                              value={slide.button_link || ''}
                              placeholder="/products или https://..."
                              onChange={(e) => {
                                const newSlides = [...heroSlides];
                                newSlides[index] = { ...slide, button_link: e.target.value };
                                setHeroSlides(newSlides);
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="current-link">
                          Линк: <code>{slide.button_link || '/products'}</code>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gender Section Images */}
      <div className="admin-section" data-testid="gender-images-manager">
        <div className="admin-section-header">
          <h3>{txt.genderImages}</h3>
          <button
            className="btn-primary"
            onClick={saveGenderImages}
            disabled={savingGenderImages}
            data-testid="save-gender-images-btn"
          >
            <Save size={16} />
            <span>{savingGenderImages ? txt.saving : txt.saveChanges}</span>
          </button>
        </div>
        <p className="section-description">{txt.genderImagesDesc}</p>

        <div className="gender-images-grid">
          <div className="gender-image-card">
            <label className="form-label">{txt.menImage}</label>
            {genderImages.men ? (
              <div className="gender-image-preview">
                <img src={genderImages.men} alt="Men category" />
                <label className="btn-secondary upload-btn">
                  <Upload size={16} />
                  <span>{genderMenUploading ? txt.uploading : txt.replaceImage}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleGenderImageUpload(e, 'men')}
                    disabled={genderMenUploading}
                    style={{ display: 'none' }}
                    data-testid="gender-men-image-replace-input"
                  />
                </label>
              </div>
            ) : (
              <label className="btn-secondary upload-btn">
                <Upload size={16} />
                <span>{genderMenUploading ? txt.uploading : txt.uploadImage}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleGenderImageUpload(e, 'men')}
                  disabled={genderMenUploading}
                  style={{ display: 'none' }}
                  data-testid="gender-men-image-input"
                />
              </label>
            )}
          </div>

          <div className="gender-image-card">
            <label className="form-label">{txt.womenImage}</label>
            {genderImages.women ? (
              <div className="gender-image-preview">
                <img src={genderImages.women} alt="Women category" />
                <label className="btn-secondary upload-btn">
                  <Upload size={16} />
                  <span>{genderWomenUploading ? txt.uploading : txt.replaceImage}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleGenderImageUpload(e, 'women')}
                    disabled={genderWomenUploading}
                    style={{ display: 'none' }}
                    data-testid="gender-women-image-replace-input"
                  />
                </label>
              </div>
            ) : (
              <label className="btn-secondary upload-btn">
                <Upload size={16} />
                <span>{genderWomenUploading ? txt.uploading : txt.uploadImage}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleGenderImageUpload(e, 'women')}
                  disabled={genderWomenUploading}
                  style={{ display: 'none' }}
                  data-testid="gender-women-image-input"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Banner Section */}
      <div className="admin-section" data-testid="campaign-banner-manager">
        <div className="admin-section-header">
          <h3>{txt.campaignBanner}</h3>
          <button
            className="btn-primary"
            onClick={saveCampaignBanner}
            disabled={savingCampaign}
            data-testid="save-campaign-banner-btn"
          >
            <Save size={16} />
            <span>{savingCampaign ? txt.saving : txt.saveChanges}</span>
          </button>
        </div>
        <p className="section-description">{txt.campaignBannerDesc}</p>

        <div className="campaign-banner-form">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={!!campaignBanner.enabled}
              onChange={(e) => setCampaignBanner(prev => ({ ...prev, enabled: e.target.checked }))}
              data-testid="campaign-enabled-toggle"
            />
            <span>{txt.enableCampaign}</span>
          </label>

          <div className="setting-row">
            <label>{txt.campaignImage}</label>
            {campaignBanner.image ? (
              <div className="campaign-image-preview">
                <img src={campaignBanner.image} alt="Campaign banner preview" />
                <label className="btn-secondary upload-btn">
                  <Upload size={16} />
                  <span>{campaignUploading ? txt.uploading : txt.replaceImage}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCampaignImageUpload}
                    disabled={campaignUploading}
                    style={{ display: 'none' }}
                    data-testid="campaign-image-replace-input"
                  />
                </label>
              </div>
            ) : (
              <label className="btn-secondary upload-btn">
                <Upload size={16} />
                <span>{campaignUploading ? txt.uploading : txt.uploadImage}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCampaignImageUpload}
                  disabled={campaignUploading}
                  style={{ display: 'none' }}
                  data-testid="campaign-image-input"
                />
              </label>
            )}
          </div>

          <div className="setting-row">
            <label>{txt.campaignTitle}</label>
            <input
              type="text"
              value={campaignBanner.title}
              onChange={(e) => setCampaignBanner(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Лятна колекция 2026"
              data-testid="campaign-title-bg"
            />
          </div>

          <div className="setting-row">
            <label>{txt.campaignTitleEn}</label>
            <input
              type="text"
              value={campaignBanner.title_en}
              onChange={(e) => setCampaignBanner(prev => ({ ...prev, title_en: e.target.value }))}
              placeholder="Summer Collection 2026"
              data-testid="campaign-title-en"
            />
          </div>

          <div className="setting-row">
            <label>{txt.campaignDescription}</label>
            <textarea
              value={campaignBanner.description}
              onChange={(e) => setCampaignBanner(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Открий най-свежите аромати за лятото..."
              rows={3}
              data-testid="campaign-description-bg"
            />
          </div>

          <div className="setting-row">
            <label>{txt.campaignDescriptionEn}</label>
            <textarea
              value={campaignBanner.description_en}
              onChange={(e) => setCampaignBanner(prev => ({ ...prev, description_en: e.target.value }))}
              placeholder="Discover the freshest scents of summer..."
              rows={3}
              data-testid="campaign-description-en"
            />
          </div>

          <div className="setting-row">
            <label>{txt.campaignButtonText}</label>
            <input
              type="text"
              value={campaignBanner.button_text}
              onChange={(e) => setCampaignBanner(prev => ({ ...prev, button_text: e.target.value }))}
              placeholder="Разгледай"
              data-testid="campaign-button-text-bg"
            />
          </div>

          <div className="setting-row">
            <label>{txt.campaignButtonTextEn}</label>
            <input
              type="text"
              value={campaignBanner.button_text_en}
              onChange={(e) => setCampaignBanner(prev => ({ ...prev, button_text_en: e.target.value }))}
              placeholder="Shop Now"
              data-testid="campaign-button-text-en"
            />
          </div>

          <div className="setting-row">
            <label>{txt.campaignButtonLink}</label>
            <input
              type="text"
              value={campaignBanner.button_link}
              onChange={(e) => setCampaignBanner(prev => ({ ...prev, button_link: e.target.value }))}
              placeholder="/products?collection=summer"
              data-testid="campaign-button-link"
            />
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>{t('featuredProducts') || 'Featured Products (Homepage)'}</h3>
          <button className="btn-primary" onClick={saveFeaturedProducts} disabled={saving}>
            <Save size={16} />
            <span>{saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}</span>
          </button>
        </div>

        <p className="section-description">
          {t('featuredProductsDesc') || 'Select products to display in "New Arrivals" section on the homepage. Drag to reorder.'}
        </p>

        {/* Selected Featured Products */}
        {featuredProductIds.length > 0 && (
          <div className="featured-products-list">
            <h4>{t('selectedProducts') || 'Selected Products'} ({featuredProductIds.length})</h4>
            <div className="featured-items">
              {featuredProductIds.map((productId, index) => {
                const product = allProducts.find(p => p.id === productId);
                if (!product) return null;
                return (
                  <div key={productId} className="featured-item">
                    <span className="featured-order">{index + 1}</span>
                    <img src={product.images?.[0] || product.image} alt={product.name} className="featured-thumb" />
                    <span className="featured-name">{product.name}</span>
                    <div className="featured-actions">
                      <button onClick={() => moveFeatured(index, -1)} disabled={index === 0}>↑</button>
                      <button onClick={() => moveFeatured(index, 1)} disabled={index === featuredProductIds.length - 1}>↓</button>
                      <button onClick={() => toggleFeatured(productId)} className="btn-remove">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div className="product-selection">
          <h4>{t('availableProducts') || 'Available Products'}</h4>
          <div className="product-search-box">
            <Search size={16} />
            <input type="text" placeholder={t('searchProducts') || 'Search products...'} value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="product-search-input" />
          </div>
          <div className="product-selection-grid">
            {allProducts
              .filter(p => {
                if (!p.is_visible) return false;
                if (featuredProductIds.includes(p.id)) return false;
                if (searchQuery) {
                  const q = searchQuery.toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
                }
                return true;
              })
              .slice(0, 100)
              .map(product => (
                <div key={product.id} className="product-select-card" onClick={() => toggleFeatured(product.id)}>
                  <img src={product.images?.[0] || product.image} alt={product.name} />
                  <span>{product.name}</span>
                  <span className="product-brand">{product.brand}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageManager;
