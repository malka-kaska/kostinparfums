import React from 'react';
import { useBrandBackground } from '../context/BrandBackgroundContext';
import './DynamicHeaderBackground.css';

const DynamicHeaderBackground = () => {
  const { getActiveBackgrounds, hasActiveBackground } = useBrandBackground();
  
  if (!hasActiveBackground()) {
    return null; // No custom background, use default
  }
  
  const activeBackgrounds = getActiveBackgrounds();
  const count = activeBackgrounds.length;
  
  // Calculate clip paths for diagonal splits
  const getClipPath = (index, total) => {
    if (total === 1) {
      return 'none';
    }
    
    if (total === 2) {
      // Diagonal split: left-top to right-bottom
      if (index === 0) {
        return 'polygon(0 0, 100% 0, 0 100%)'; // Top-left triangle
      } else {
        return 'polygon(100% 0, 100% 100%, 0 100%)'; // Bottom-right triangle
      }
    }
    
    if (total === 3) {
      // Three diagonal sections
      if (index === 0) {
        return 'polygon(0 0, 66% 0, 0 100%)';
      } else if (index === 1) {
        return 'polygon(66% 0, 100% 0, 33% 100%, 0 100%)';
      } else {
        return 'polygon(100% 0, 100% 100%, 33% 100%)';
      }
    }
    
    if (total === 4) {
      // Four diagonal sections
      const width = 100 / total;
      const startX = index * width;
      const endX = (index + 1) * width;
      return `polygon(${startX}% 0, ${endX}% 0, ${endX - width/2}% 100%, ${startX - width/2}% 100%)`;
    }
    
    // For 5+ brands, use vertical slices with slight diagonal
    const sliceWidth = 100 / total;
    const offset = 10; // Slight diagonal offset
    const startX = index * sliceWidth;
    const endX = (index + 1) * sliceWidth;
    
    if (index === 0) {
      return `polygon(0 0, ${endX}% 0, ${endX - offset}% 100%, 0 100%)`;
    } else if (index === total - 1) {
      return `polygon(${startX}% 0, 100% 0, 100% 100%, ${startX - offset}% 100%)`;
    } else {
      return `polygon(${startX}% 0, ${endX}% 0, ${endX - offset}% 100%, ${startX - offset}% 100%)`;
    }
  };
  
  return (
    <div className="dynamic-header-bg" data-testid="dynamic-header-bg">
      {activeBackgrounds.map((bg, index) => (
        <div
          key={bg.brand}
          className="dynamic-header-bg-layer"
          style={{
            backgroundImage: `url(${bg.image_url})`,
            backgroundPosition: `${bg.image_position_x}% ${bg.image_position_y}%`,
            clipPath: getClipPath(index, count),
            WebkitClipPath: getClipPath(index, count),
            zIndex: count - index
          }}
        >
          {/* Overlay */}
          <div 
            className="dynamic-header-bg-overlay"
            style={{ 
              backgroundColor: `rgba(0, 0, 0, ${bg.overlay_opacity})`,
              clipPath: getClipPath(index, count),
              WebkitClipPath: getClipPath(index, count)
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default DynamicHeaderBackground;
