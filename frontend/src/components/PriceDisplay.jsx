import React from 'react';
import { getPriceDisplay } from '../utils/currency';
import './PriceDisplay.css';

/**
 * Component to display price in EUR with BGN equivalent
 * @param {number} amount - Price in EUR
 * @param {string} size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} showBgn - Whether to show BGN (default: true)
 * @param {string} className - Additional CSS classes
 */
const PriceDisplay = ({ amount, size = 'md', showBgn = true, className = '' }) => {
  const { eur, bgn } = getPriceDisplay(amount);
  
  return (
    <span className={`price-display price-display--${size} ${className}`}>
      <span className="price-eur">{eur}</span>
      {showBgn && <span className="price-bgn">{bgn}</span>}
    </span>
  );
};

export default PriceDisplay;
