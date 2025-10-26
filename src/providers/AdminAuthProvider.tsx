"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ModalContent, ModalRoot } from "@/components/uikit/dialog/Modal";
import { setAdminAuthCallback } from "@/services/admin-http";
import styles from "./AdminAuthProvider.module.scss";

interface AdminAuthContextType {
  showLoginModal: () => Promise<boolean>;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showLoginModal = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      setIsModalOpen(true);
      setPassword("");
      setError(null);
      setResolvePromise(() => resolve);
    });
  }, []);

  // Реєструємо callback для обробки 401 помилок
  useEffect(() => {
    setAdminAuthCallback(showLoginModal);
  }, [showLoginModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Не вдалося увійти");
        setLoading(false);
        return;
      }

      // Успішна авторизація
      setIsAuthenticated(true);
      setIsModalOpen(false);
      setPassword("");
      setError(null);

      if (resolvePromise) {
        resolvePromise(true);
        setResolvePromise(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка мережі");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setPassword("");
    setError(null);

    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{ showLoginModal, isAuthenticated, setIsAuthenticated }}
    >
      {children}

      <ModalRoot open={isModalOpen} onOpenChange={handleCancel}>
        <ModalContent title="Вхід для адміністратора">
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="admin-password" className={styles.label}>
                Пароль
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль адміністратора"
                className={styles.input}
                disabled={loading}
              />
              {error && <div className={styles.error}>{error}</div>}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelButton}
                disabled={loading}
              >
                Скасувати
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !password}
              >
                {loading ? "Вхід..." : "Увійти"}
              </button>
            </div>
          </form>
        </ModalContent>
      </ModalRoot>
    </AdminAuthContext.Provider>
  );
}
