import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { products as mockProducts, addToCart } from '../mock';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          // Fetch related products from same category
          const relRes = await fetch(`${API_URL}/api/products?category=${data.category}&limit=5`);
          if (relRes.ok) {
            const relData = await relRes.json();
            setRelatedProducts(relData.products.filter(p => p.id !== data.id).slice(0, 4));
          }
        } else {
          // Fallback to mock
          loadFromMock();
        }
      } catch {
        loadFromMock();
      } finally {
        setLoading(false);
      }
    };

    const loadFromMock = () => {
      const foundProduct = mockProducts.find(p => p.id === parseInt(id));
      setProduct(foundProduct || null);
      if (foundProduct) {
        const related = mockProducts
          .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    };

    fetchProduct();
    setQuantity(1);
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    window.dispatchEvent(new Event('cartUpdated'));
    alert(`Added ${quantity} ${product.name} to cart!`);
  };

  if (loading) {
    return (
      <div className="container section-padding">
        <p className="body-large text-center">Loading...</p>
      </div>
    );
  }

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
        <button className="back-button" onClick={() => navigate(-1)} data-testid="back-button">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="product-detail-grid">
          <div className="product-detail-image">
            <img src={product.image} alt={product.name} data-testid="product-image" />
          </div>

          <div className="product-detail-info">
            <p className="product-detail-brand" data-testid="product-brand">{product.brand}</p>
            <h1 className="heading-1 mt-2" data-testid="product-name">{product.name}</h1>
            <p className="product-detail-price" data-testid="product-price">€{product.price.toFixed(2)}</p>
            
            <div className="product-detail-stock">
              {product.stock > 20 ? (
                <span className="stock-available" data-testid="stock-status">In Stock</span>
              ) : product.stock > 0 ? (
                <span className="stock-low" data-testid="stock-status">Only {product.stock} left</span>
              ) : (
                <span className="stock-out" data-testid="stock-status">Out of Stock</span>
              )}
            </div>

            <p className="body-regular mt-4" data-testid="product-description">{product.description}</p>

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
                Add to Cart
              </button>

              <button className="wishlist-button" aria-label="Add to wishlist" data-testid="wishlist-button">
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
                <span className="meta-value">LUX-{String(product.id).padStart(6, '0')}</span>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="related-products section-padding">
            <h2 className="heading-2 mb-5">You May Also Like</h2>
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
