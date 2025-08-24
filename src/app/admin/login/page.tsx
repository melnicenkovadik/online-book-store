"use client";
import React from 'react';

export default function AdminLoginPage() {
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
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
        return;
      }
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err?.message || "Помилка мережі");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <form onSubmit={onSubmit} style={{ background: "white", padding: 24, borderRadius: 12, width: 360, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
        <h1 style={{ margin: 0, marginBottom: 16, fontSize: 20 }}>Вхід для адміністратора</h1>
        <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введіть пароль адміністратора"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", outline: "none" }}
        />
        {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 16, padding: "10px 12px", borderRadius: 8, border: "none", background: "#111827", color: "white", cursor: "pointer" }}>
          {loading ? "Вхід..." : "Увійти"}
        </button>
      </form>
    </div>
  );
}
