import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getProductImages, FALLBACK_IMAGE } from '../utils/imageUtils';
import parseProductName from '../utils/parseProductName';
import { addToRecentlyViewed } from '../utils/recentlyViewed';
import { trackViewItem } from '../utils/analytics';
import { pixelViewContent, pixelAddToWishlist, pixelAddToCart } from '../utils/metaPixel';
import { toast } from '../components/ui/sonner';
import './ProductDetail.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState({});
  const { t, lang } = useLanguage();
  const { addToCart } = useAuth();
  const viewedRef = useRef(null); // guards GA4 view_item against StrictMode double-invoke

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          
          // Add to recently viewed
          addToRecentlyViewed(data);

          // GA4: Track view_item once per product (avoids double-count on re-render)
          if (viewedRef.current !== data.id) {
            viewedRef.current = data.id;
            trackViewItem(data);
            pixelViewContent(data);
          }
          
          // Fetch variants (other sizes of same product)
          const varRes = await fetch(`${API_URL}/api/products/${id}/variants`);
          if (varRes.ok) {
            const varData = await varRes.json();
            setVariants(varData.variants || []);
          }
          
          // Fetch related products by scent profile
          const relRes = await fetch(`${API_URL}/api/products/${id}/related?limit=5`);
          if (relRes.ok) {
            const relData = await relRes.json();
            setRelatedProducts(relData.products || []);
          }
        } else {
          setProduct(null);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    setQuantity(1);
    setSelectedImageIndex(0);
    setImageError({});
  }, [id]);

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    pixelAddToCart(product, quantity);
    toast.success(t('addedToCart', { qty: quantity, name: product.name }));
  };

  const getDescription = () => {
    if (!product) return '';
    if (lang === 'bg' && product.description_bg) {
      // Keep markdown but remove HTML
      return product.description_bg.replace(/<[^>]*>/g, '');
    }
    return product.description ? product.description.replace(/<[^>]*>/g, '') : '';
  };

  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  if (loading) {
    return (
      <div className="container section-padding">
        <p className="body-large text-center">{t('loading')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container section-padding">
        <p className="body-large text-center">{t('productNotFound')}</p>
      </div>
    );
  }

  // Get all product images - prefer images array, fallback to legacy image field
  const productImages = (product.images && product.images.length > 0) 
    ? product.images 
    : getProductImages(product.image);
  const currentImage = imageError[selectedImageIndex] ? FALLBACK_IMAGE : productImages[selectedImageIndex];

  return (
    <div className="product-detail-page">
      <div className="container section-padding-small">
        <button className="back-button" onClick={() => navigate(-1)} data-testid="back-button">
          <ArrowLeft size={20} />
          <span>{t('back')}</span>
        </button>

        <div className="product-detail-grid">
          <div className="product-detail-images">
            <div className="product-detail-main-image">
              <img 
                src={currentImage}
                alt={product.name}
                data-testid="product-image"
                onError={() => handleImageError(selectedImageIndex)}
              />
            </div>
            
            {/* Gallery thumbnails if multiple images */}
            {productImages.length > 1 && (
              <div className="product-gallery" data-testid="product-gallery">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    className={`gallery-thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                    data-testid={`gallery-thumb-${index}`}
                  >
                    <img 
                      src={imageError[index] ? FALLBACK_IMAGE : img}
                      alt={`${product.name} ${index + 1}`}
                      onError={() => handleImageError(index)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <p className="product-detail-brand" data-testid="product-brand">{product.brand}</p>
            {(() => {
              const { name: cleanName, details } = parseProductName(product.name);
              return (
                <>
                  <h1 className="heading-1 mt-2" data-testid="product-name">{cleanName}</h1>
                  {details && <p className="product-detail-variant">{details}</p>}
                </>
              );
            })()}
            {(() => {
              const isOnSale = product.original_price && product.original_price > product.price;
              const discountPercent = isOnSale 
                ? Math.round((1 - product.price / product.original_price) * 100)
                : 0;
              
              return (
                <div className={`product-detail-price ${isOnSale ? 'on-sale' : ''}`} data-testid="product-price">
                  {isOnSale && (
                    <>
                      <div className="price-original-row">
                        <span className="price-original-eur">&euro;{product.original_price.toFixed(2)}</span>
                        <span className="price-original-bgn">{(product.original_price * 1.95583).toFixed(2)} лв.</span>
                      </div>
                      <span className="discount-badge">-{discountPercent}%</span>
                    </>
                  )}
                  <span className={`price-eur ${isOnSale ? 'sale-price' : ''}`}>&euro;{product.price.toFixed(2)}</span>
                  <span className="price-bgn">{(product.price * 1.95583).toFixed(2)} лв.</span>
                </div>
              );
            })()}
            
            <div className="product-detail-stock">
              {product.stock > 20 ? (
                <span className="stock-available" data-testid="stock-status">{t('inStock')}</span>
              ) : product.stock > 0 ? (
                <span className="stock-low" data-testid="stock-status">{t('onlyLeft', { count: product.stock })}</span>
              ) : (
                <span className="stock-out" data-testid="stock-status">{t('outOfStock')}</span>
              )}
            </div>

            <div className="free-return-info" data-testid="free-return-info">
              <RotateCcw size={18} />
              <span>{t('freeReturnInfo') || '14 дни безплатно връщане'}</span>
            </div>

            <div className="product-actions mt-4">
              <div className="quantity-selector" data-testid="quantity-selector">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="quantity-button"
                  disabled={quantity <= 1}
                  data-testid="qty-minus"
                >
                  -
                </button>
                <span className="quantity-value" data-testid="qty-value">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="quantity-button"
                  disabled={quantity >= product.stock}
                  data-testid="qty-plus"
                >
                  +
                </button>
              </div>

              <button 
                className="btn-primary"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                style={{ flex: 1 }}
                data-testid="add-to-cart-button"
              >
                <ShoppingCart size={18} style={{ marginRight: '8px' }} />
                {t('addToCart')}
              </button>

              <button className="wishlist-button" aria-label="Add to wishlist" data-testid="wishlist-button" onClick={() => pixelAddToWishlist(product)}>
                <Heart size={20} />
              </button>
            </div>

            {/* Product Variants (Different Sizes) */}
            {variants.length > 1 && (
              <div className="product-variants" data-testid="product-variants">
                <span className="variants-label">{t('availableSizes') || 'Налични разфасовки:'}</span>
                <div className="variants-buttons">
                  {variants.map(variant => {
                    const { details } = parseProductName(variant.name);
                    const isActive = variant.id === product.id;
                    return (
                      <Link
                        key={variant.id}
                        to={`/product/${variant.id}`}
                        className={`variant-button ${isActive ? 'active' : ''}`}
                        data-testid={`variant-${variant.id}`}
                      >
                        <span className="variant-size">{details || variant.name}</span>
                        <span className="variant-price">€{variant.price.toFixed(2)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="product-description mt-5" data-testid="product-description">
              <ReactMarkdown>{getDescription()}</ReactMarkdown>
            </div>

            <div className="product-meta mt-5">
              <div className="meta-item">
                <span className="meta-label">{t('categoryLabel')}</span>
                <span className="meta-value">{product.category}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">{t('brandLabel')}</span>
                <span className="meta-value">{product.brand}</span>
              </div>
              {product.scent_profiles && product.scent_profiles.length > 0 && (
                <div className="meta-item">
                  <span className="meta-label">{t('scentProfile')}</span>
                  <span className="meta-value scent-profile-tags">
                    {product.scent_profiles.map(profile => (
                      <span key={profile} className="scent-tag">
                        {t(`scent${profile.charAt(0).toUpperCase() + profile.slice(1)}`) || profile}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="related-products section-padding">
            <h2 className="heading-2 mb-5">{t('youMayAlsoLike')}</h2>
            <div className="grid-product-showcase" data-testid="related-products-grid">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
