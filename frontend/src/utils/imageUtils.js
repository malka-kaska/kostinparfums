// Image utility functions for handling product images

// Default fallback image - luxury cosmetics placeholder
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80';

// Category images - luxury cosmetics style
export const CATEGORY_IMAGES = {
  perfumes: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
  skincare: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=800&q=80',
  haircare: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80',
  menscare: 'https://images.unsplash.com/photo-1581750028485-58042f8062cc?w=800&q=80',
  makeup: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
  bodycare: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
  other: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&q=80',
};

// Hero image - luxury perfume/beauty
export const HERO_IMAGE = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1920&q=80';

/**
 * Parse product image field which may contain multiple URLs separated by |
 * @param {string|array} image - Image field from product
 * @returns {string[]} Array of valid image URLs
 */
export function getProductImages(image) {
  if (!image) return [FALLBACK_IMAGE];
  
  // If already an array
  if (Array.isArray(image)) {
    const filtered = image.filter(url => url && typeof url === 'string' && url.trim());
    return filtered.length > 0 ? filtered : [FALLBACK_IMAGE];
  }
  
  // If string, split by | and clean up
  if (typeof image === 'string') {
    const urls = image
      .split('|')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'));
    
    return urls.length > 0 ? urls : [FALLBACK_IMAGE];
  }
  
  return [FALLBACK_IMAGE];
}

/**
 * Get the main (first) product image
 * @param {string|array} image - Image field from product
 * @returns {string} First valid image URL or fallback
 */
export function getMainImage(image) {
  const images = getProductImages(image);
  return images[0];
}

/**
 * Get gallery images (all except first, if multiple exist)
 * @param {string|array} image - Image field from product
 * @returns {string[]} Array of gallery image URLs (may be empty)
 */
export function getGalleryImages(image) {
  const images = getProductImages(image);
  return images.length > 1 ? images.slice(1) : [];
}

/**
 * Check if image URL is likely to work
 * Known problematic domains can be filtered here
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export function isReliableImageUrl(url) {
  if (!url) return false;
  
  // Known unreliable domains
  const unreliableDomains = [
    'image.cosmeticwholesale.eu',
    'placeholder.com',
  ];
  
  try {
    const urlObj = new URL(url);
    return !unreliableDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Get a reliable image URL with fallback
 * @param {string} url - Original image URL
 * @returns {string} Reliable URL or fallback
 */
export function getReliableImage(url) {
  if (!url || !isReliableImageUrl(url)) {
    return FALLBACK_IMAGE;
  }
  return url;
}

/**
 * Handle image load error by replacing with fallback
 * @param {Event} event - Image error event
 */
export function handleImageError(event) {
  const img = event.target;
  if (img.src !== FALLBACK_IMAGE) {
    img.src = FALLBACK_IMAGE;
  }
}
