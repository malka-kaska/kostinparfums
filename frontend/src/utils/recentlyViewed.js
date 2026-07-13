// Recently Viewed Products - localStorage utility with 7-day expiry

const STORAGE_KEY = 'kostin_recently_viewed';
const MAX_PRODUCTS = 8;
const EXPIRY_DAYS = 7;

/**
 * Get recently viewed products from localStorage
 * Filters out expired entries and returns valid products
 */
export const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    const now = Date.now();
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    // Filter out expired entries
    const valid = data.filter(item => (now - item.viewedAt) < expiryMs);
    
    // If some items were expired, update storage
    if (valid.length !== data.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    
    return valid.map(item => item.product);
  } catch {
    return [];
  }
};

/**
 * Add a product to recently viewed
 * Moves to front if already exists, limits to MAX_PRODUCTS
 */
export const addToRecentlyViewed = (product) => {
  if (!product || !product.id) return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let data = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    // Filter out expired entries and the current product (to re-add at front)
    data = data.filter(item => 
      (now - item.viewedAt) < expiryMs && item.product.id !== product.id
    );
    
    // Add current product at the beginning
    data.unshift({
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image || (product.images && product.images[0]),
        images: product.images,
        category: product.category,
        stock: product.stock
      },
      viewedAt: now
    });
    
    // Limit to MAX_PRODUCTS
    if (data.length > MAX_PRODUCTS) {
      data = data.slice(0, MAX_PRODUCTS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err.message);
  }
};

/**
 * Clear all recently viewed products
 */
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear localStorage:', err.message);
  }
};
