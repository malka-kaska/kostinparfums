// Currency utilities for EUR/BGN dual display
// Fixed exchange rate: 1 EUR = 1.95583 BGN

export const EUR_TO_BGN_RATE = 1.95583;

/**
 * Convert EUR to BGN
 * @param {number} eurAmount - Amount in EUR
 * @returns {number} Amount in BGN
 */
export const eurToBgn = (eurAmount) => {
  if (typeof eurAmount !== 'number' || isNaN(eurAmount)) return 0;
  return eurAmount * EUR_TO_BGN_RATE;
};

/**
 * Format price in EUR only
 * @param {number} amount - Amount in EUR
 * @returns {string} Formatted price
 */
export const formatEur = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '€0.00';
  return `€${amount.toFixed(2)}`;
};

/**
 * Format price in BGN only
 * @param {number} eurAmount - Amount in EUR
 * @returns {string} Formatted price in BGN
 */
export const formatBgn = (eurAmount) => {
  if (typeof eurAmount !== 'number' || isNaN(eurAmount)) return '0.00 лв.';
  const bgnAmount = eurAmount * EUR_TO_BGN_RATE;
  return `${bgnAmount.toFixed(2)} лв.`;
};

/**
 * Format price in both EUR and BGN
 * @param {number} eurAmount - Amount in EUR
 * @param {string} separator - Separator between currencies (default: ' / ')
 * @returns {string} Formatted dual price
 */
export const formatDualPrice = (eurAmount, separator = ' / ') => {
  if (typeof eurAmount !== 'number' || isNaN(eurAmount)) return '€0.00 / 0.00 лв.';
  const bgnAmount = eurAmount * EUR_TO_BGN_RATE;
  return `€${eurAmount.toFixed(2)}${separator}${bgnAmount.toFixed(2)} лв.`;
};

/**
 * Format price with EUR primary and BGN secondary (smaller)
 * For use in product cards, etc.
 * @param {number} eurAmount - Amount in EUR
 * @returns {object} Object with eur and bgn formatted strings
 */
export const getPriceDisplay = (eurAmount) => {
  if (typeof eurAmount !== 'number' || isNaN(eurAmount)) {
    return { eur: '€0.00', bgn: '0.00 лв.' };
  }
  const bgnAmount = eurAmount * EUR_TO_BGN_RATE;
  return {
    eur: `€${eurAmount.toFixed(2)}`,
    bgn: `${bgnAmount.toFixed(2)} лв.`
  };
};

export default {
  EUR_TO_BGN_RATE,
  eurToBgn,
  formatEur,
  formatBgn,
  formatDualPrice,
  getPriceDisplay
};
