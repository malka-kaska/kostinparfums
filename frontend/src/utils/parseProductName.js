/**
 * Utility function to parse product names and extract details
 * Example: "Armani Code EDP 50 ml" -> { name: "Armani Code", details: "EDP · 50 ml" }
 */

// Fragrance types to look for
const FRAGRANCE_TYPES = [
  'Eau de Parfum',
  'Eau de Toilette', 
  'Eau Forte',
  'Eau Fraiche',
  'Parfum Intense',
  'Parfum',
  'EDP',
  'EDT',
  'EDC',
  'Extrait',
  'Elixir',
  'Cologne',
  'Very Cool Spray',
  'L Exclusif',
];

// Regex to match size patterns like "50 ml", "100ml", "50 W", "100 M", etc.
const SIZE_REGEX = /(\d+)\s*(ml|ML|W|M)$/i;

// Regex to match trailing gender indicators
const GENDER_SUFFIX_REGEX = /\s+[WM]$/i;

export function parseProductName(fullName) {
  if (!fullName) {
    return { name: fullName, details: '' };
  }

  let workingName = fullName.trim();
  let fragranceType = '';
  let size = '';

  // Extract size (e.g., "50 ml", "100 W")
  const sizeMatch = workingName.match(SIZE_REGEX);
  if (sizeMatch) {
    const sizeValue = sizeMatch[1];
    const sizeUnit = sizeMatch[2].toLowerCase();
    
    // Normalize: W/M are sometimes used instead of ml
    if (sizeUnit === 'w' || sizeUnit === 'm') {
      size = `${sizeValue} ml`;
    } else {
      size = `${sizeValue} ml`;
    }
    
    // Remove size from name
    workingName = workingName.replace(SIZE_REGEX, '').trim();
  }

  // Extract fragrance type
  for (const type of FRAGRANCE_TYPES) {
    const typeRegex = new RegExp(`\\s+${type}\\s*$`, 'i');
    if (typeRegex.test(workingName)) {
      fragranceType = type;
      workingName = workingName.replace(typeRegex, '').trim();
      break;
    }
    
    // Also check without trailing space
    const typeRegex2 = new RegExp(`\\s+${type}$`, 'i');
    if (typeRegex2.test(workingName)) {
      fragranceType = type;
      workingName = workingName.replace(typeRegex2, '').trim();
      break;
    }
  }

  // Normalize fragrance type display
  const normalizedType = normalizeFragranceType(fragranceType);

  // Build details string
  let details = '';
  if (normalizedType && size) {
    details = `${normalizedType} · ${size}`;
  } else if (normalizedType) {
    details = normalizedType;
  } else if (size) {
    details = size;
  }

  return {
    name: workingName,
    details: details,
    fragranceType: normalizedType,
    size: size
  };
}

function normalizeFragranceType(type) {
  if (!type) return '';
  
  const upperType = type.toUpperCase();
  
  // Map abbreviations to full names or keep short form
  const typeMap = {
    'EDP': 'Eau de Parfum',
    'EDT': 'Eau de Toilette',
    'EDC': 'Eau de Cologne',
    'PARFUM': 'Parfum',
    'PARFUM INTENSE': 'Parfum Intense',
    'EAU DE PARFUM': 'Eau de Parfum',
    'EAU DE TOILETTE': 'Eau de Toilette',
    'EAU FORTE': 'Eau Forte',
    'EAU FRAICHE': 'Eau Fraîche',
    'EXTRAIT': 'Extrait',
    'ELIXIR': 'Elixir',
    'COLOGNE': 'Cologne',
    'VERY COOL SPRAY': 'Very Cool Spray',
    'L EXCLUSIF': "L'Exclusif",
  };

  return typeMap[upperType] || type;
}

export default parseProductName;
