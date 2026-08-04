import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneCall } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-canvas">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-copper-500/15 text-copper-500">
            <PhoneCall size={22} strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-xl font-semibold">Espace admin</h1>
          <p className="text-sm text-canvas/50">Connecte-toi pour gérer les discussions</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-ink-900 p-6 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-canvas/50">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-canvas outline-none focus:border-copper-500"
              placeholder="admin@monentreprise.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-canvas/50">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-canvas outline-none focus:border-copper-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-copper-500 py-2.5 text-sm font-semibold text-white transition hover:bg-copper-600 disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
