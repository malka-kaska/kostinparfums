// Mock data for luxury cosmetics e-commerce

export const categories = [
  { id: 'perfumes', name: 'product name', icon: 'Sparkles' },
  { id: 'makeup', name: 'product name', icon: 'Palette' },
  { id: 'skincare', name: 'product name', icon: 'Heart' },
  { id: 'haircare', name: 'product name', icon: 'Scissors' }
];

export const brands = [
  'Givenchy', 'Guerlain', 'Lancome', 'Calvin Klein', 'Bvlgari', 'Cartier', 'Paco Rabanne',
  'Hermes', 'Carolina Herrera', 'Issey Miyake', 'Jean Paul Gaultier', 'Giorgio Armani',
  'Narciso Rodriguez', 'Valentino', 'Yves Saint Laurent', 'Elie Saab', 'Estee Lauder',
  'Clinique', 'Bioderma', 'Clarins', 'MAC', 'Max Factor', 'Collistar', 'Elizabeth Arden',
  'Nuxe', 'Shiseido', 'Maison Francis Kurkdjian', 'Jo Malone', 'Amouage', 'By Kilian',
  'L\'oreal Professionnel', 'Kerastase', 'Schwarzkopf', 'Aveda', 'Redken', 'Olaplex'
];

export const products = [
  // Perfumes
  { id: 1, name: 'product name', brand: 'Lancome', category: 'perfumes', price: 125.00, description: 'product description', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', stock: 45 },
  { id: 2, name: 'product name', brand: 'Calvin Klein', category: 'perfumes', price: 65.00, description: 'product description', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400', stock: 62 },
  { id: 3, name: 'product name', brand: 'Bvlgari', category: 'perfumes', price: 98.00, description: 'product description', image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400', stock: 38 },
  { id: 4, name: 'product name', brand: 'Cartier', category: 'perfumes', price: 145.00, description: 'product description', image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59260?w=400', stock: 28 },
  { id: 5, name: 'product name', brand: 'Paco Rabanne', category: 'perfumes', price: 89.00, description: 'product description', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400', stock: 55 },
  { id: 6, name: 'product name', brand: 'Hermes', category: 'perfumes', price: 135.00, description: "product description", image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400', stock: 42 },
  { id: 7, name: 'product name', brand: 'Carolina Herrera', category: 'perfumes', price: 118.00, description: 'product description', image: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400', stock: 51 },
  { id: 8, name: 'product name', brand: 'Issey Miyake', category: 'perfumes', price: 92.00, description: "product description", image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400', stock: 67 },
  { id: 9, name: 'product name', brand: 'Jean Paul Gaultier', category: 'perfumes', price: 85.00, description: 'product description', image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400', stock: 73 },
  { id: 10, name: 'product name', brand: 'Giorgio Armani', category: 'perfumes', price: 105.00, description: 'product description', image: 'https://images.unsplash.com/photo-1595425970154-c18b9e4d4a7b?w=400', stock: 81 },
  { id: 11, name: 'product name', brand: 'Narciso Rodriguez', category: 'perfumes', price: 112.00, description: 'product description', image: 'https://images.unsplash.com/photo-1592542420271-e9ef3ab77cee?w=400', stock: 39 },
  { id: 12, name: 'product name', brand: 'Valentino', category: 'perfumes', price: 125.00, description: 'product description', image: 'https://images.unsplash.com/photo-1547887538-047f814bfb64?w=400', stock: 44 },
  { id: 13, name: 'product name', brand: 'Yves Saint Laurent', category: 'perfumes', price: 128.00, description: 'product description', image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=400', stock: 88 },
  { id: 14, name: 'product name', brand: 'Elie Saab', category: 'perfumes', price: 115.00, description: 'product description', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', stock: 52 },
  { id: 15, name: 'product name', brand: 'Estee Lauder', category: 'perfumes', price: 95.00, description: 'product description', image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400', stock: 61 },
  { id: 16, name: 'product name', brand: 'Maison Francis Kurkdjian', category: 'perfumes', price: 325.00, description: 'product description', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400', stock: 22 },
  { id: 17, name: 'product name', brand: 'Jo Malone', category: 'perfumes', price: 145.00, description: 'product description', image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59260?w=400', stock: 35 },
  { id: 18, name: 'product name', brand: 'Amouage', category: 'perfumes', price: 285.00, description: 'product description', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400', stock: 18 },
  { id: 19, name: 'product name', brand: 'By Kilian', category: 'perfumes', price: 265.00, description: "product description", image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400', stock: 27 },
  { id: 20, name: 'product name', brand: 'Guerlain', category: 'perfumes', price: 135.00, description: 'product description', image: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400', stock: 46 },

  // Makeup
  { id: 21, name: 'product name', brand: 'Estee Lauder', category: 'makeup', price: 52.00, description: 'product description', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400', stock: 95 },
  { id: 22, name: 'product name', brand: 'Lancome', category: 'makeup', price: 54.00, description: 'product description', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400', stock: 87 },
  { id: 23, name: 'product name', brand: 'MAC', category: 'makeup', price: 33.00, description: 'product description', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', stock: 112 },
  { id: 24, name: 'product name', brand: 'Max Factor', category: 'makeup', price: 16.00, description: 'product description', image: 'https://images.unsplash.com/photo-1631214524020-7e18db7f7db1?w=400', stock: 158 },
  { id: 25, name: 'product name', brand: 'Guerlain', category: 'makeup', price: 58.00, description: 'product description', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', stock: 72 },
  { id: 26, name: 'product name', brand: 'Givenchy', category: 'makeup', price: 68.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620032427372-e8e36243a629?w=400', stock: 54 },
  { id: 27, name: 'product name', brand: 'Givenchy', category: 'makeup', price: 55.00, description: 'product description', image: 'https://images.unsplash.com/photo-1583241800698-9c2c2e5d5a8b?w=400', stock: 68 },
  { id: 28, name: 'product name', brand: 'Lancome', category: 'makeup', price: 32.00, description: 'product description', image: 'https://images.unsplash.com/photo-1631214524020-7e18db7f7db1?w=400', stock: 142 },
  { id: 29, name: 'product name', brand: 'Clinique', category: 'makeup', price: 39.00, description: 'product description', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400', stock: 91 },
  { id: 30, name: 'product name', brand: 'Clinique', category: 'makeup', price: 33.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620032427372-e8e36243a629?w=400', stock: 76 },
  { id: 31, name: 'product name', brand: 'MAC', category: 'makeup', price: 29.00, description: 'product description', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', stock: 134 },
  { id: 32, name: 'product name', brand: 'Clarins', category: 'makeup', price: 62.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620032427372-e8e36243a629?w=400', stock: 48 },
  { id: 33, name: 'product name', brand: 'Collistar', category: 'makeup', price: 38.00, description: 'product description', image: 'https://images.unsplash.com/photo-1583241800698-9c2c2e5d5a8b?w=400', stock: 63 },
  { id: 34, name: 'product name', brand: 'Elizabeth Arden', category: 'makeup', price: 22.00, description: 'product description', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', stock: 118 },
  { id: 35, name: 'product name', brand: 'Nuxe', category: 'makeup', price: 34.00, description: 'product description', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400', stock: 82 },
  { id: 36, name: 'product name', brand: 'Shiseido', category: 'makeup', price: 32.00, description: 'product description', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', stock: 97 },
  { id: 37, name: 'product name', brand: 'Shiseido', category: 'makeup', price: 50.00, description: 'product description', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400', stock: 74 },
  { id: 38, name: 'product name', brand: 'Clarins', category: 'makeup', price: 35.00, description: 'product description', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', stock: 105 },
  { id: 39, name: 'product name', brand: 'Estee Lauder', category: 'makeup', price: 36.00, description: 'product description', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', stock: 89 },
  { id: 40, name: 'product name', brand: 'MAC', category: 'makeup', price: 26.00, description: 'product description', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', stock: 126 },

  // Skincare
  { id: 41, name: 'product name', brand: 'Estee Lauder', category: 'skincare', price: 98.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 67 },
  { id: 42, name: 'product name', brand: 'Lancome', category: 'skincare', price: 105.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', stock: 84 },
  { id: 43, name: 'product name', brand: 'Guerlain', category: 'skincare', price: 485.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 18 },
  { id: 44, name: 'product name', brand: 'Bioderma', category: 'skincare', price: 18.00, description: 'product description', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400', stock: 215 },
  { id: 45, name: 'product name', brand: 'Clarins', category: 'skincare', price: 95.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', stock: 73 },
  { id: 46, name: 'product name', brand: 'Clinique', category: 'skincare', price: 32.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 142 },
  { id: 47, name: 'product name', brand: 'Clinique', category: 'skincare', price: 45.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 98 },
  { id: 48, name: 'product name', brand: 'Shiseido', category: 'skincare', price: 88.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', stock: 62 },
  { id: 49, name: 'product name', brand: 'Avene', category: 'skincare', price: 28.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 108 },
  { id: 50, name: 'product name', brand: 'Guerlain', category: 'skincare', price: 145.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', stock: 51 },
  { id: 51, name: 'product name', brand: 'Lancome', category: 'skincare', price: 125.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 64 },
  { id: 52, name: 'product name', brand: 'Guerlain', category: 'skincare', price: 165.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', stock: 43 },
  { id: 53, name: 'product name', brand: 'Clarins', category: 'skincare', price: 38.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 87 },
  { id: 54, name: 'product name', brand: 'Avene', category: 'skincare', price: 15.00, description: 'product description', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400', stock: 176 },
  { id: 55, name: 'product name', brand: 'Filorga', category: 'skincare', price: 78.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 56 },
  { id: 56, name: 'product name', brand: 'Nuxe', category: 'skincare', price: 32.00, description: 'product description', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400', stock: 92 },
  { id: 57, name: 'product name', brand: 'Nuxe', category: 'skincare', price: 36.00, description: 'product description', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400', stock: 124 },
  { id: 58, name: 'product name', brand: 'Shiseido', category: 'skincare', price: 115.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 47 },
  { id: 59, name: 'product name', brand: 'Clarins', category: 'skincare', price: 65.00, description: 'product description', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', stock: 69 },
  { id: 60, name: 'product name', brand: 'Clinique', category: 'skincare', price: 42.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 103 },

  // Haircare
  { id: 61, name: 'product name', brand: 'Kerastase', category: 'haircare', price: 62.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 88 },
  { id: 62, name: 'product name', brand: 'L\'oreal Professionnel', category: 'haircare', price: 28.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228852-80c3f73e84c1?w=400', stock: 156 },
  { id: 63, name: 'product name', brand: 'Redken', category: 'haircare', price: 35.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 94 },
  { id: 64, name: 'product name', brand: 'Olaplex', category: 'haircare', price: 32.00, description: 'product description', image: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=400', stock: 218 },
  { id: 65, name: 'product name', brand: 'Schwarzkopf', category: 'haircare', price: 24.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 132 },
  { id: 66, name: 'product name', brand: 'Aveda', category: 'haircare', price: 38.00, description: 'product description', image: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=400', stock: 76 },
  { id: 67, name: 'product name', brand: 'Kerastase', category: 'haircare', price: 55.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 84 },
  { id: 68, name: 'product name', brand: 'GHD', category: 'haircare', price: 18.00, description: 'product description', image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400', stock: 147 },
  { id: 69, name: 'product name', brand: 'Davines', category: 'haircare', price: 42.00, description: 'product description', image: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=400', stock: 102 },
  { id: 70, name: 'product name', brand: 'Philip Kingsley', category: 'haircare', price: 48.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 67 },
  { id: 71, name: 'product name', brand: 'Joico', category: 'haircare', price: 36.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228852-80c3f73e84c1?w=400', stock: 114 },
  { id: 72, name: 'product name', brand: 'American Crew', category: 'haircare', price: 19.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 185 },
  { id: 73, name: 'product name', brand: 'Wella', category: 'haircare', price: 34.00, description: 'product description', image: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=400', stock: 92 },
  { id: 74, name: 'product name', brand: 'Redken', category: 'haircare', price: 29.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 126 },
  { id: 75, name: 'product name', brand: 'Olaplex', category: 'haircare', price: 30.00, description: 'product description', image: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=400', stock: 164 },
  { id: 76, name: 'product name', brand: 'Kerastase', category: 'haircare', price: 48.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 73 },
  { id: 77, name: 'L\'Oreal Professionnel Serie Expert', brand: 'L\'oreal Professionnel', category: 'haircare', price: 32.00, description: 'product description', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', stock: 118 },
  { id: 78, name: 'product name', brand: 'Aveda', category: 'haircare', price: 44.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228852-80c3f73e84c1?w=400', stock: 87 },
  { id: 79, name: 'product name', brand: 'Schwarzkopf', category: 'haircare', price: 26.00, description: 'product description', image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400', stock: 105 },
  { id: 80, name: 'product name', brand: 'Redken', category: 'haircare', price: 31.00, description: 'product description', image: 'https://images.unsplash.com/photo-1556228852-80c3f73e84c1?w=400', stock: 143 }
];

// Cart stored in localStorage
export const getCart = () => {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
};

export const addToCart = (product, quantity = 1) => {
  const cart = getCart();
  const existingItem = cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  return cart;
};

export const updateCartItem = (productId, quantity) => {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);
  
  if (item) {
    item.quantity = quantity;
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  
  return cart;
};

export const removeFromCart = (productId) => {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  return cart;
};

export const clearCart = () => {
  localStorage.removeItem('cart');
  return [];
};

export const getCartTotal = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// User authentication (mock)
export const mockUsers = [
  { id: 1, email: 'admin@cosmetics.com', password: 'admin123', role: 'admin', name: 'Admin User' },
  { id: 2, email: 'user@example.com', password: 'user123', role: 'customer', name: 'John Doe' }
];

export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

export const login = (email, password) => {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (user) {
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const register = (email, password, name) => {
  const newUser = {
    id: mockUsers.length + 1,
    email,
    password,
    role: 'customer',
    name
  };
  mockUsers.push(newUser);
  const userWithoutPassword = { ...newUser };
  delete userWithoutPassword.password;
  localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
  return userWithoutPassword;
};