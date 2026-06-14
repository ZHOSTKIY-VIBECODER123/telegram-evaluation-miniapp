import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { ADMIN_ROLE } from "@/data/roles";

export interface CurrentUser {
  id: string;
  name: string;
  role: string;
}

interface CurrentUserContextType {
  currentUser: CurrentUser | null;
  /** true пока читаем localStorage на старте */
  loading: boolean;
  /** Авторизация: создаёт/находит сотрудника в БД и запоминает личность */
  login: (name: string, role: string) => Promise<void>;
  /** Сброс личности — вернёт на экран входа */
  logout: () => void;
  isAdmin: boolean;
}

const STORAGE_KEY = "evalbot.currentUser";

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Восстанавливаем личность из localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CurrentUser;
        if (parsed?.id && parsed?.name && parsed?.role) setCurrentUser(parsed);
      }
    } catch {
      // повреждённое значение — игнорируем, покажем экран входа
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (name: string, role: string) => {
    const trimmed = name.trim();
    const sb = getSupabase();

    // Ищем активного сотрудника по имени (без учёта регистра)
    const { data: existing, error: findErr } = await sb
      .from("employees")
      .select("*")
      .ilike("full_name", trimmed)
      .eq("active", true)
      .limit(1);
    if (findErr) throw findErr;

    let id: string;
    if (existing && existing.length > 0) {
      // Нашли — синхронизируем роль с выбранной и гарантируем право оценивать
      const emp = existing[0];
      id = String(emp.id);
      const { error: updErr } = await sb
        .from("employees")
        .update({ role, can_evaluate: true })
        .eq("id", emp.id);
      if (updErr) throw updErr;
    } else {
      // Нет — создаём нового
      const { data: inserted, error: insErr } = await sb
        .from("employees")
        .insert({ full_name: trimmed, role, can_evaluate: true, active: true })
        .select()
        .single();
      if (insErr) throw insErr;
      id = String(inserted.id);
    }

    const user: CurrentUser = { id, name: trimmed, role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const isAdmin = currentUser?.role === ADMIN_ROLE;

  return (
    <CurrentUserContext.Provider value={{ currentUser, loading, login, logout, isAdmin }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (ctx === undefined) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return ctx;
}
