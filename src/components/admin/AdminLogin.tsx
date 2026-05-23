import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/api";

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
export function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!token.trim()) return;
    setLoading(true); setError("");
    try {
      await adminApi.stats(token.trim());
      onLogin(token.trim());
    } catch {
      setError("Неверный токен");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0a1a" }}>
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
            <Icon name="ShieldCheck" size={32} className="text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl">Админ-панель</h1>
          <p className="text-white/40 text-sm mt-1">LoveBloom</p>
        </div>
        <div className="flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 24 }}>
          <input value={token} onChange={(e) => setToken(e.target.value)} type="password"
            placeholder="Секретный токен" onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none border border-white/10 focus:border-pink-500/50 font-mono" />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B59B6)" }}>
            {loading ? "Проверяем..." : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
