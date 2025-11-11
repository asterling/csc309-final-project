import React, { createContext, useState, useEffect } from 'react';
import { fetchUserProfile } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('token');
      const expiresAt = localStorage.getItem('tokenExpiresAt');

      if (storedToken && new Date() < new Date(expiresAt)) {
        try {
          const userProfile = await fetchUserProfile(storedToken);
          setUser(userProfile);
          setToken(storedToken);
        } catch (error) {
          console.error("Session expired or token invalid.", error);
          logout();
        }
      } else {
        logout();
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = (newToken, expiresAt) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('tokenExpiresAt', expiresAt);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
