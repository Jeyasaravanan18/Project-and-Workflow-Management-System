import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    // Validate user data - must have role property
    if (storedUser) {
      if (!storedUser.role || !storedUser._id || !storedUser.email) {
        console.warn(
          "AuthContext - Invalid user data in localStorage, clearing...",
        );
        localStorage.removeItem("user");
        setLoading(false);
        return;
      }
      setUser(storedUser);
      if (storedUser.accessToken) {
        const decoded = decodeToken(storedUser.accessToken);
        if (decoded && decoded.exp) {
          setTokenExpiry(decoded.exp * 1000); // Convert to ms
        }
      }
    }
    setLoading(false);
  }, []);

  // Monitor token expiry
  useEffect(() => {
    if (!tokenExpiry) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = tokenExpiry - now;

      // If token is significantly expired (e.g. more than 30s ago), log out
      if (timeLeft < -30000) {
        logout();
      }
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [tokenExpiry]);

  const refreshTokens = async () => {
    if (!user || !user.refreshToken) return null;
    try {
      const response = await api.post("/auth/refresh", {
        refreshToken: user.refreshToken,
      });
      if (response.data && response.data.data) {
        const { accessToken, refreshToken } = response.data.data;
        const updatedUser = { ...user, accessToken, refreshToken };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        const decoded = decodeToken(accessToken);
        if (decoded && decoded.exp) {
          setTokenExpiry(decoded.exp * 1000);
        }
        return true;
      }
    } catch (error) {
      console.error("Failed to refresh token", error);
      logout();
      return false;
    }
  };

  const login = async (email, password) => {
    // Ensure email is trimmed
    const trimmedEmail = email.trim();
    const response = await api.post("/auth/login", {
      email: trimmedEmail,
      password,
    });
    if (response.data && response.data.data) {
      // Extract the data object which contains user, accessToken, and refreshToken
      const userData = response.data.data;
      // Store with user data at the top level for easy access
      const userToStore = {
        ...userData.user,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
      };
      localStorage.setItem("user", JSON.stringify(userToStore));
      setUser(userToStore);
      
      const decoded = decodeToken(userData.accessToken);
      if (decoded && decoded.exp) {
        setTokenExpiry(decoded.exp * 1000);
      }
      return userToStore;
    }
    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    if (response.data && response.data.data) {
      // Extract the data object which contains user, accessToken, and refreshToken
      const responseData = response.data.data;
      // Store with user data at the top level for easy access
      const userToStore = {
        ...responseData.user,
        accessToken: responseData.accessToken,
        refreshToken: responseData.refreshToken,
      };
      localStorage.setItem("user", JSON.stringify(userToStore));
      setUser(userToStore);
      return userToStore;
    }
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const setToken = (token) => {
    // Update the user object with the new token
    if (user) {
      const updatedUser = { ...user, accessToken: token };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      const decoded = decodeToken(token);
      if (decoded && decoded.exp) {
        setTokenExpiry(decoded.exp * 1000);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, setToken, loading, login, register, logout, tokenExpiry, refreshTokens }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
