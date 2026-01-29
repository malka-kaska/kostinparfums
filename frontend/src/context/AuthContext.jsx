import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as mockLogin, logout as mockLogout, register as mockRegister } from '../mock';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const loggedInUser = mockLogin(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      window.dispatchEvent(new Event('cartUpdated'));
      return loggedInUser;
    }
    return null;
  };

  const register = (email, password, name) => {
    const newUser = mockRegister(email, password, name);
    if (newUser) {
      setUser(newUser);
      window.dispatchEvent(new Event('cartUpdated'));
      return newUser;
    }
    return null;
  };

  const logout = () => {
    mockLogout();
    setUser(null);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateUser = (updatedData) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
