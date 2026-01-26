import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { addToCart } from '../mock';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart }) => {
  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    // Dispatch custom event to update cart count
    window.dispatchEvent(new Event('cartUpdated'));
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card hover-lift">
      <div className="product-image-wrapper">
        <img 
          src={product.image} 
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        <button 
          className="add-to-cart-button"
          onClick={handleAddToCart}
          aria-label="Add to cart"
        >
          <ShoppingCart size={18} />
        </button>
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">${product.price.toFixed(2)}</p>
        {product.stock < 20 && (
          <p className="product-stock-warning">Only {product.stock} left</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;