import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { products, categories } from '../mock';
import './Home.css';

const Home = () => {
  const newArrivals = products.slice(0, 8);
  const bestSellers = products.slice(8, 16);

  return (
    <div className="home-page">
      <Hero />

      {/* New Arrivals Section */}
      <section className="section-padding-small">
        <div className="container">
          <h2 className="section-title">NEW ARRIVALS</h2>
          <div className="grid-product-showcase">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="section-cta">
            <Link to="/products" className="btn-secondary">
              VIEW ALL PRODUCTS
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="section-padding-small best-sellers-section">
        <div className="container">
          <h2 className="section-title">BEST SELLERS</h2>
          <div className="grid-product-showcase">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-padding categories-section">
        <div className="container">
          <h2 className="section-title">SHOP BY CATEGORY</h2>
          <div className="categories-grid">
            {categories.map(category => (
              <Link 
                key={category.id} 
                to={`/products?category=${category.id}`}
                className="category-card"
              >
                <h3 className="category-name">{category.name}</h3>
                <p className="category-count">
                  {products.filter(p => p.category === category.id).length} Products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <h3>100% AUTHENTIC</h3>
              <p>All products sourced from trusted suppliers</p>
            </div>
            <div className="trust-item">
              <h3>FAST SHIPPING</h3>
              <p>Orders shipped within 1-2 business days</p>
            </div>
            <div className="trust-item">
              <h3>SECURE PAYMENTS</h3>
              <p>Industry-standard encryption</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;