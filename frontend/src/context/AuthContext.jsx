import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const CART_STORAGE_KEY = 'kostin_cart';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Local storage cart helpers
const getLocalCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveLocalCart = (items) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartData, setCartData] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      }
    } catch { /* silent fail - user remains null */ }
    setUser(null);
    return null;
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/cart`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCartData(data);
        return data;
      }
    } catch { /* silent fail - cart remains null */ }
    return null;
  }, []);

  useEffect(() => {
    const init = async () => {
      const u = await fetchUser();
      if (u) await fetchCart();
      setLoading(false);
    };
    init();
  }, [fetchUser, fetchCart]);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let detail;
      try {
        const err = await res.clone().json();
        detail = err.detail;
      } catch {
        // body may have been consumed by platform monitoring script
      }
      if (!detail) {
        if (res.status === 429) detail = 'Too many failed attempts. Try again in 15 minutes.';
        else if (res.status === 401) detail = 'Invalid email or password';
        else detail = 'Login failed';
      }
      throw new Error(detail);
    }
    const data = await res.clone().json();
    setUser(data);

    // Sync localStorage cart to backend
    try {
      const localCart = getLocalCart();
      if (localCart.length > 0) {
        for (const item of localCart) {
          await fetch(`${API_URL}/api/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ product_id: String(item.id), quantity: item.quantity }),
          }).catch(() => {});
        }
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch { /* silent fail - cart sync is optimistic */ }

    await fetchCart();
    return data;
  }, [fetchCart]);

  const register = useCallback(async (email, password, name) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      let detail;
      try {
        const err = await res.clone().json();
        detail = err.detail;
      } catch { /* JSON parse may fail if body consumed */ }
      if (!detail) {
        if (res.status === 400) detail = 'Email already registered';
        else detail = 'Registration failed';
      }
      throw new Error(detail);
    }
    const data = await res.clone().json();
    // Don't log in user after registration - they need to verify email first
    // setUser(data) - REMOVED
    // Return data with pending verification status
    return {
      ...data,
      pendingVerification: true,
      message: data.message || 'Please check your email to verify your account'
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* silent fail - logout is best-effort */ }
    setUser(null);
    setCartData(null);
  }, []);

  const addToCart = useCallback(async (product, quantity = 1) => {
    // Meta Pixel: Track AddToCart event
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.price * quantity,
        currency: 'EUR'
      });
    }

    if (user) {
      try {
        const res = await fetch(`${API_URL}/api/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ product_id: String(product.id), quantity }),
        });
        if (res.ok) {
          const data = await res.json();
          setCartData(data);
          window.dispatchEvent(new Event('cartUpdated'));
          return data;
        }
      } catch { /* JSON parse may fail if body consumed */ }
    }
    // Fallback to localStorage for non-authenticated users
    const cart = getLocalCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.price,
        stock: product.stock,
        quantity,
      });
    }
    saveLocalCart(cart);
    window.dispatchEvent(new Event('cartUpdated'));
  }, [user]);

  const updateCartItem = useCallback(async (productId, quantity) => {
    if (user) {
      try {
        const res = await fetch(`${API_URL}/api/cart/update/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ quantity }),
        });
        if (res.ok) {
          const data = await res.json();
          setCartData(data);
          window.dispatchEvent(new Event('cartUpdated'));
          return data;
        }
      } catch { /* JSON parse may fail if body consumed */ }
    }
    // localStorage fallback
    const cart = getLocalCart();
    const index = cart.findIndex(item => item.id === productId);
    if (index >= 0) {
      cart[index].quantity = quantity;
      saveLocalCart(cart);
    }
    window.dispatchEvent(new Event('cartUpdated'));
  }, [user]);

  const removeCartItem = useCallback(async (productId) => {
    if (user) {
      try {
        const res = await fetch(`${API_URL}/api/cart/remove/${productId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setCartData(data);
          window.dispatchEvent(new Event('cartUpdated'));
          return data;
        }
      } catch { /* JSON parse may fail if body consumed */ }
    }
    // localStorage fallback
    const cart = getLocalCart();
    const filtered = cart.filter(item => item.id !== productId);
    saveLocalCart(filtered);
    window.dispatchEvent(new Event('cartUpdated'));
  }, [user]);

  const clearCartAll = useCallback(async () => {
    if (user) {
      try {
        const res = await fetch(`${API_URL}/api/cart/clear`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setCartData(data);
          window.dispatchEvent(new Event('cartUpdated'));
          return data;
        }
      } catch { /* JSON parse may fail if body consumed */ }
    }
    // localStorage fallback
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event('cartUpdated'));
  }, [user]);

  const getCartItems = useCallback(() => {
    if (user && cartData) {
      return cartData.items.map(item => ({
        id: item.product_id,
        name: item.name,
        brand: item.brand,
        image: item.image,
        price: item.price,
        stock: item.stock,
        quantity: item.quantity,
      }));
    }
    return getLocalCart();
  }, [user, cartData]);

  const getCartTotal = useCallback(() => {
    if (user && cartData) return cartData.total;
    const items = getCartItems();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [user, cartData, getCartItems]);

  const getCartCount = useCallback(() => {
    if (user && cartData) return cartData.item_count;
    const items = getCartItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [user, cartData, getCartItems]);

  const contextValue = useMemo(() => ({
    user, loading, login, register, logout,
    addToCart, updateCartItem, removeCartItem, clearCartAll,
    getCartItems, getCartTotal, getCartCount,
    cartData, fetchCart,
  }), [user, loading, login, register, logout, addToCart, updateCartItem, removeCartItem, clearCartAll, getCartItems, getCartTotal, getCartCount, cartData, fetchCart]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
