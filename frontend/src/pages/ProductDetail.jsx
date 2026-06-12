import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './ProductDetail.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLanguage();
  const { addToCart } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          const relRes = await fetch(`${API_URL}/api/products?category=${data.category}&limit=5`);
          if (relRes.ok) {
            const relData = await relRes.json();
            setRelatedProducts(relData.products.filter(p => p.id !== data.id).slice(0, 4));
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
  }, [id]);

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    alert(t('addedToCart', { qty: quantity, name: product.name }));
  };

  const getDescription = () => {
    if (!product) return '';
    if (lang === 'bg' && product.description_bg) {
      return product.description_bg.replace(/<[^>]*>/g, '');
    }
    return product.description ? product.description.replace(/<[^>]*>/g, '') : '';
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

  return (
    <div className="product-detail-page">
      <div className="container section-padding-small">
        <button className="back-button" onClick={() => navigate(-1)} data-testid="back-button">
          <ArrowLeft size={20} />
          <span>{t('back')}</span>
        </button>

        <div className="product-detail-grid">
          <div className="product-detail-image">
            <img src={product.image} alt={product.name} data-testid="product-image" />
          </div>

          <div className="product-detail-info">
            <p className="product-detail-brand" data-testid="product-brand">{product.brand}</p>
            <h1 className="heading-1 mt-2" data-testid="product-name">{product.name}</h1>
            <p className="product-detail-price" data-testid="product-price">&euro;{product.price.toFixed(2)}</p>
            
            <div className="product-detail-stock">
              {product.stock > 20 ? (
                <span className="stock-available" data-testid="stock-status">{t('inStock')}</span>
              ) : product.stock > 0 ? (
                <span className="stock-low" data-testid="stock-status">{t('onlyLeft', { count: product.stock })}</span>
              ) : (
                <span className="stock-out" data-testid="stock-status">{t('outOfStock')}</span>
              )}
            </div>

            <p className="body-regular mt-4" data-testid="product-description">
              {getDescription()}
            </p>

            <div className="product-actions mt-5">
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

              <button className="wishlist-button" aria-label="Add to wishlist" data-testid="wishlist-button">
                <Heart size={20} />
              </button>
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
              <div className="meta-item">
                <span className="meta-label">{t('skuLabel')}</span>
                <span className="meta-value">LUX-{String(product.id).padStart(6, '0')}</span>
              </div>
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
