"use client";

import { useState } from "react";
import { LockKeyOpen, CircleNotch } from "@phosphor-icons/react/dist/ssr";

interface ReopenTicketButtonProps {
  ticketId: number;
}

export default function ReopenTicketButton({ ticketId }: ReopenTicketButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReopen = async () => {
    if (confirm("Deseja realmente reabrir este ticket? Um novo canal será criado no Discord.")) {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/tickets/reopen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId })
        });
        
        const data = await res.json();
        if (data.success) {
          setSuccess(true);
        } else {
          setError(data.error || "Erro desconhecido ao reabrir.");
        }
      } catch (err: any) {
        setError(err.message || "Erro na requisição.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (success) {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-medium">
        Reaberto!
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleReopen}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {loading ? (
          <CircleNotch size={16} className="animate-spin" />
        ) : (
          <LockKeyOpen size={16} />
        )}
        Reabrir
      </button>
      {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
  );
}
