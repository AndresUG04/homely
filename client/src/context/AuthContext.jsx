import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../config/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setProfile(parsedUser);
    }
    setLoading(false);
  }, []);

  const signUp = async (email, password, fullName, role) => {
    const data = await api.post("/api/auth/register", {
      email,
      password,
      full_name: fullName,
      role,
    });

    if (data.error) return { error: data.error };

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setProfile(data.user);

    return { data };
  };

  const signIn = async (email, password) => {
    const data = await api.post("/api/auth/login", { email, password });

    if (data.error) return { error: data.error };

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setProfile(data.user);

    return { data };
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, setProfile, token, loading, signUp, signIn, signOut }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
