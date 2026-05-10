"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { LockKey } from "@phosphor-icons/react/dist/ssr";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("As senhas não coincidem.");
    }

    if (password.length < 6) {
      return setError("A senha deve ter pelo menos 6 caracteres.");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao definir senha");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError("Erro interno ao conectar ao servidor.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] p-8 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
          <p className="text-zinc-400">O token de convite está ausente ou inválido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] p-8 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[var(--color-detroit-red)] rounded-full blur-[100px] opacity-20 pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold tracking-tighter text-white uppercase italic">
            Detroit <span className="text-[var(--color-detroit-red)]">Staff</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-2">Defina sua senha de acesso ao painel</p>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-center">
            Senha definida com sucesso! Redirecionando para o login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="relative">
              <LockKey size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                placeholder="Nova Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
              />
            </div>

            <div className="relative">
              <LockKey size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                placeholder="Confirme a Senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-4 bg-[var(--color-detroit-red)] text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Definir Senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <InviteContent />
    </Suspense>
  );
}
