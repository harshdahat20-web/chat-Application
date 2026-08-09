import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const cachedUser = localStorage.getItem("user");

      if (!cachedUser) {
        setUser(null);
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await api.get("/user/profile");
        const userData = response.data.data;
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Unexpected error checking auth:", error);
        }
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isCheckingAuth, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
