"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ListDashes, Clock, User, ShieldCheck, TextAa } from "@phosphor-icons/react/dist/ssr";

interface LogEntry {
  id: number;
  admin_email: string;
  action: string;
  details: string;
  created_at: string;
}

export default function LogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") return router.push("/login");
    
    // Check if user has "logs" permission or is superadmin
    if (status === "authenticated") {
      const perms = session?.user?.permissions || [];
      const hasAccess = session?.user?.role === "superadmin" || perms.includes("all") || perms.includes("logs");
      
      if (!hasAccess) {
        router.push("/admin");
      } else {
        fetchLogs();
      }
    }
  }, [status, session, router]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 p-8 pt-24 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-detroit-red)]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ListDashes size={32} className="text-[var(--color-detroit-red)]" />
          <h1 className="text-3xl font-bold text-white">Logs de Auditoria</h1>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase bg-black/50 text-zinc-300">
                <tr>
                  <th className="px-6 py-4 rounded-tl-3xl"><div className="flex items-center gap-2"><Clock size={16} /> Data/Hora</div></th>
                  <th className="px-6 py-4"><div className="flex items-center gap-2"><User size={16} /> Staff</div></th>
                  <th className="px-6 py-4"><div className="flex items-center gap-2"><ShieldCheck size={16} /> Ação</div></th>
                  <th className="px-6 py-4 rounded-tr-3xl"><div className="flex items-center gap-2"><TextAa size={16} /> Detalhes</div></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-white font-mono text-xs">{formatDate(log.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-300">{log.admin_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-[var(--color-detroit-red)]/10 text-[var(--color-detroit-red)] text-xs font-bold tracking-wider">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 max-w-md truncate" title={log.details}>
                        {log.details || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
