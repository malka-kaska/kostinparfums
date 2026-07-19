import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BrandBackgroundContext = createContext();

export const useBrandBackground = () => {
  const context = useContext(BrandBackgroundContext);
  if (!context) {
    throw new Error('useBrandBackground must be used within a BrandBackgroundProvider');
  }
  return context;
};

export const BrandBackgroundProvider = ({ children }) => {
  const [backgrounds, setBackgrounds] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all brand backgrounds on mount
  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        const res = await fetch(`${API_URL}/api/brand-backgrounds`);
        if (res.ok) {
          const data = await res.json();
          setBackgrounds(data.backgrounds || []);
        }
      } catch (error) {
        console.error('Error loading brand backgrounds:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBackgrounds();
  }, []);

  // Get backgrounds for selected brands
  const getActiveBackgrounds = () => {
    if (selectedBrands.length === 0) return [];
    
    return selectedBrands
      .map(brand => backgrounds.find(bg => bg.brand === brand))
      .filter(Boolean);
  };

  // Get text color for current selection
  const getTextColor = () => {
    const activeBackgrounds = getActiveBackgrounds();
    if (activeBackgrounds.length === 0) return null; // Use default
    
    // If all have the same color, use that; otherwise default to white
    const colors = activeBackgrounds.map(bg => bg.text_color);
    const uniqueColors = [...new Set(colors)];
    
    return uniqueColors.length === 1 ? uniqueColors[0] : 'white';
  };

  // Check if we have active brand backgrounds
  const hasActiveBackground = () => {
    return getActiveBackgrounds().length > 0;
  };

  const value = {
    backgrounds,
    selectedBrands,
    setSelectedBrands,
    getActiveBackgrounds,
    getTextColor,
    hasActiveBackground,
    isLoading
  };

  return (
    <BrandBackgroundContext.Provider value={value}>
      {children}
    </BrandBackgroundContext.Provider>
  );
};

export default BrandBackgroundContext;
