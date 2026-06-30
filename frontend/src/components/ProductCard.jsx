import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getMainImage, FALLBACK_IMAGE } from '../utils/imageUtils';
import parseProductName from '../utils/parseProductName';
import { toast } from './ui/sonner';
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
    toast.success(t('addedToCart', { qty: 1, name: product.name }));
  };

  const handleImageError = () => {
    setImgError(true);
  };
  
  // Get main image with fallback handling
  const mainImage = imgError ? FALLBACK_IMAGE : getMainImage(product.image);
  
  // Check if product is on sale
  const isOnSale = product.original_price && product.original_price > product.price;

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
        <div className={`product-price ${isOnSale ? 'on-sale' : ''}`}>
          {isOnSale && (
            <span className="price-original">
              <span className="price-original-eur">&euro;{product.original_price.toFixed(2)}</span>
              <span className="price-original-bgn">{(product.original_price * 1.95583).toFixed(2)} лв.</span>
            </span>
          )}
          <span className={`price-eur ${isOnSale ? 'sale-price' : ''}`}>&euro;{product.price.toFixed(2)}</span>
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
