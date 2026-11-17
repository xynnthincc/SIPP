"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { ROLE_HOME, User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => {
      const stored = localStorage.getItem("sipp_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/login", { email, password });
    localStorage.setItem("sipp_token", data.token);
    localStorage.setItem("sipp_user", JSON.stringify(data.user));
    setUser(data.user);
    router.push(ROLE_HOME[data.user.role as User["role"]] ?? "/");
  }

  async function logout() {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("sipp_token");
      localStorage.removeItem("sipp_user");
      setUser(null);
      router.push("/login");
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
