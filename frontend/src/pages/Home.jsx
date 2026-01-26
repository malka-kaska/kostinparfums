import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { products, categories } from '../mock';
import { Sparkles, Heart, Scissors } from 'lucide-react';
import './Home.css';

const Home = () => {
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="home-page">
      <Hero />

      {/* Categories Section */}
      <section className="section-padding-small">
        <div className="container">
          <h2 className="heading-1 text-center mb-5">Shop by Category</h2>
          <div className="categories-grid">
            {categories.map(category => {
              const IconComponent = category.icon === 'Sparkles' ? Sparkles : 
                                   category.icon === 'Heart' ? Heart : Scissors;
              return (
                <Link 
                  key={category.id} 
                  to={`/products?category=${category.id}`}
                  className="category-card hover-lift"
                >
                  <div className="category-icon">
                    <IconComponent size={32} />
                  </div>
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-count">
                    {products.filter(p => p.category === category.id).length} Products
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-1">Featured Products</h2>
            <Link to="/products" className="btn-secondary">
              View All Products
            </Link>
          </div>
          <div className="grid-product-showcase">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="brands-section">
        <div className="container">
          <h2 className="heading-1 text-center mb-5">Luxury Brands We Carry</h2>
          <div className="brands-grid">
            {['Givenchy', 'Guerlain', 'Lancome', 'Yves Saint Laurent', 'Giorgio Armani', 'Estee Lauder', 'Clinique', 'Shiseido', 'Kerastase', 'MAC', 'Jo Malone', 'Maison Francis Kurkdjian'].map(brand => (
              <div key={brand} className="brand-item">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;