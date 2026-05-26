import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

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
    } catch {}
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
    } catch {}
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

  const login = async (email, password) => {
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
      const localCart = JSON.parse(localStorage.getItem('kostin_cart') || '[]');
      if (localCart.length > 0) {
        for (const item of localCart) {
          await fetch(`${API_URL}/api/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ product_id: String(item.id), quantity: item.quantity }),
          }).catch(() => {});
        }
        localStorage.removeItem('kostin_cart');
      }
    } catch {}

    await fetchCart();
    return data;
  };

  const register = async (email, password, name) => {
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
      } catch {}
      if (!detail) {
        if (res.status === 400) detail = 'Email already registered';
        else detail = 'Registration failed';
      }
      throw new Error(detail);
    }
    const data = await res.clone().json();
    setUser(data);
    await fetchCart();
    return data;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    setUser(null);
    setCartData(null);
  };

  const addToCart = async (product, quantity = 1) => {
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
      } catch {}
    }
    // Fallback to localStorage for non-authenticated users
    const { addToCart: localAdd } = await import('../mock');
    localAdd(product, quantity);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateCartItem = async (productId, quantity) => {
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
      } catch {}
    }
    const { updateCartItem: localUpdate } = await import('../mock');
    localUpdate(productId, quantity);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeCartItem = async (productId) => {
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
      } catch {}
    }
    const { removeFromCart: localRemove } = await import('../mock');
    localRemove(productId);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCartAll = async () => {
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
      } catch {}
    }
    const { clearCart: localClear } = await import('../mock');
    localClear();
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getCartItems = () => {
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
    try {
      return JSON.parse(localStorage.getItem('kostin_cart') || '[]');
    } catch {
      return [];
    }
  };

  const getCartTotal = () => {
    if (user && cartData) return cartData.total;
    const items = getCartItems();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    if (user && cartData) return cartData.item_count;
    const items = getCartItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      addToCart, updateCartItem, removeCartItem, clearCartAll,
      getCartItems, getCartTotal, getCartCount,
      cartData, fetchCart,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
