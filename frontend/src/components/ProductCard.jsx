import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { addToCart } from '../mock';
import { useLanguage } from '../context/LanguageContext';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart }) => {
  const { t } = useLanguage();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    window.dispatchEvent(new Event('cartUpdated'));
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const rating = 4.5;
  const reviewCount = Math.floor(Math.random() * 100) + 10;

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image-wrapper">
        <img 
          src={product.image} 
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        <button 
          className="quick-add-button"
          onClick={handleAddToCart}
          aria-label={t('addToCart')}
        >
          <ShoppingCart size={16} />
          <span>{t('quickAdd')}</span>
        </button>
      </div>
      <div className="product-details">
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              fill={i < Math.floor(rating) ? "#d4a574" : "none"}
              stroke={"#d4a574"}
            />
          ))}
          <span className="review-count">({reviewCount})</span>
        </div>
        <p className="product-price">
          &euro;{product.price.toFixed(2)}
        </p>
        {product.stock < 20 && product.stock > 0 && (
          <p className="product-stock-low">{t('onlyLeft', { count: product.stock })}</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
