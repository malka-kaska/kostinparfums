import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getMainImage, FALLBACK_IMAGE } from '../utils/imageUtils';
import { formatDualPrice } from '../utils/currency';
import parseProductName from '../utils/parseProductName';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { t } = useLanguage();
  const { addToCart } = useAuth();
  const [imgError, setImgError] = useState(false);

  // Parse product name to extract clean name and details
  const { name: cleanName, details } = parseProductName(product.name);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    await addToCart(product, 1);
  };

  const handleImageError = () => {
    setImgError(true);
  };

  const rating = 4.5;
  const reviewCount = Math.floor(Math.random() * 100) + 10;
  
  // Get main image with fallback handling
  const mainImage = imgError ? FALLBACK_IMAGE : getMainImage(product.image);

  return (
    <Link to={`/product/${product.id}`} className="product-card" data-testid={`product-card-${product.id}`}>
      <div className="product-image-wrapper">
        <img 
          src={mainImage}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={handleImageError}
        />
        <button 
          className="quick-add-button"
          onClick={handleAddToCart}
          aria-label={t('addToCart')}
          data-testid={`quick-add-${product.id}`}
        >
          <ShoppingCart size={16} />
          <span>{t('quickAdd')}</span>
        </button>
      </div>
      <div className="product-details">
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-name">{cleanName}</h3>
        {details && <p className="product-variant">{details}</p>}
        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              fill={i < Math.floor(rating) ? "#d4a574" : "none"}
              stroke="#d4a574"
            />
          ))}
          <span className="review-count">({reviewCount})</span>
        </div>
        <div className="product-price">
          <span className="price-eur">&euro;{product.price.toFixed(2)}</span>
          <span className="price-bgn">{(product.price * 1.95583).toFixed(2)} лв.</span>
        </div>
        {product.stock < 20 && product.stock > 0 && (
          <p className="product-stock-low">{t('onlyLeft', { count: product.stock })}</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
