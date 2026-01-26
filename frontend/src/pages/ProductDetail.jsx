import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { products, addToCart, getCart } from '../mock';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const foundProduct = products.find(p => p.id === parseInt(id));
    setProduct(foundProduct);
    
    if (foundProduct) {
      // Get related products from same category
      const related = products
        .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
        .slice(0, 4);
      setRelatedProducts(related);
    }
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    window.dispatchEvent(new Event('cartUpdated'));
    // Show toast or notification
    alert(`Added ${quantity} ${product.name} to cart!`);
  };

  if (!product) {
    return (
      <div className="container section-padding">
        <p className="body-large text-center">Product not found</p>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container section-padding-small">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="product-detail-grid">
          <div className="product-detail-image">
            <img src={product.image} alt={product.name} />
          </div>

          <div className="product-detail-info">
            <p className="product-detail-brand">{product.brand}</p>
            <h1 className="heading-1 mt-2">{product.name}</h1>
            <p className="product-detail-price">${product.price.toFixed(2)}</p>
            
            <div className="product-detail-stock">
              {product.stock > 20 ? (
                <span className="stock-available">In Stock</span>
              ) : product.stock > 0 ? (
                <span className="stock-low">Only {product.stock} left</span>
              ) : (
                <span className="stock-out">Out of Stock</span>
              )}
            </div>

            <p className="body-regular mt-4">{product.description}</p>

            <div className="product-actions mt-5">
              <div className="quantity-selector">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="quantity-button"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="quantity-button"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>

              <button 
                className="btn-primary"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                style={{ flex: 1 }}
              >
                <ShoppingCart size={18} style={{ marginRight: '8px' }} />
                Add to Cart
              </button>

              <button className="wishlist-button" aria-label="Add to wishlist">
                <Heart size={20} />
              </button>
            </div>

            <div className="product-meta mt-5">
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{product.category}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Brand:</span>
                <span className="meta-value">{product.brand}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">SKU:</span>
                <span className="meta-value">LUX-{product.id.toString().padStart(6, '0')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-products section-padding">
            <h2 className="heading-2 mb-5">You May Also Like</h2>
            <div className="grid-product-showcase">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;