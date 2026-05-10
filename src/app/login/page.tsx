"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKey, User } from "@phosphor-icons/react/dist/ssr";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Usuário ou senha inválidos.");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] p-8 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[var(--color-detroit-red)] rounded-full blur-[100px] opacity-20 pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold tracking-tighter text-white uppercase italic">
            Detroit <span className="text-[var(--color-detroit-red)]">Admin</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-2">Acesso restrito à moderação</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 relative z-10">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="relative">
            <User
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
            />
          </div>

          <div className="relative">
            <LockKey
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 bg-[var(--color-detroit-red)] text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
