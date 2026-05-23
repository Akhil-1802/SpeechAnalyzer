import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AuthUser { name: string; email: string; token: string; }
interface AuthCtx { user: AuthUser | null; login: (u: AuthUser) => void; logout: () => void; }

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem("auth_user") ?? "null"); } catch { return null; }
  });

  const login = (u: AuthUser) => { setUser(u); localStorage.setItem("auth_user", JSON.stringify(u)); };
  const logout = () => { setUser(null); localStorage.removeItem("auth_user"); };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
