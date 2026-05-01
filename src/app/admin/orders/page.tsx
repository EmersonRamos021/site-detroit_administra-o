"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Order {
  id: number;
  code: string;
  status: string;
  price: number;
  product_title: string;
  product_image: string | null;
  user_tag: string;
  user_discord_id: string;
  mp_payment_id: number | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: "Pendente", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  pago: { label: "Pago", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  entregue: { label: "Entregue", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  cancelado: { label: "Cancelado", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
};

const statusFlow = ["pendente", "pago", "entregue", "cancelado"];
const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async (currentPage: number, currentFilter: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        status: currentFilter,
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      console.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page, filter);
  }, [page, filter, fetchOrders]);

  function handleFilterChange(newFilter: string) {
    setFilter(newFilter);
    setPage(1); // Volta para página 1 ao mudar filtro
  }

  async function updateStatus(orderId: number, newStatus: string) {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      fetchOrders(page, filter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">← Admin</Link>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter text-white">Pedidos</h1>
            {!loading && (
              <p className="text-sm text-zinc-500 mt-1">
                {total} {total === 1 ? "pedido" : "pedidos"} no total
              </p>
            )}
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex bg-zinc-900 border border-white/5 rounded-full p-1 mb-10 overflow-x-auto no-scrollbar w-fit">
          {["todos", ...statusFlow].map(s => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                filter === s ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s === "todos" ? "Todos" : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>

        {/* ORDERS LIST */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-zinc-500 py-12 text-center">Nenhum pedido encontrado.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const sc = statusConfig[order.status] || statusConfig.pendente;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/40 border border-white/5"
                >
                  {order.product_image && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <Image src={order.product_image} alt={order.product_title} fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-zinc-500">{order.code}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{order.product_title}</p>
                    <p className="text-xs text-zinc-500">
                      por {order.user_tag} • {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      {order.mp_payment_id && ` • PIX ID: ${order.mp_payment_id}`}
                    </p>
                  </div>
                  <span className="text-base font-mono font-bold text-white flex-shrink-0 mr-4">
                    R$ {Number(order.price).toFixed(2)}
                  </span>
                  {/* Status actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {statusFlow.filter(s => s !== order.status).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(order.id, s)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${statusConfig[s].bg} ${statusConfig[s].color} hover:opacity-80`}
                      >
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Anterior
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="text-zinc-600 px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                        page === p
                          ? "bg-[var(--color-detroit-red)] text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                          : "bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Próximo →
            </button>
          </div>
        )}

        {/* PAGE INFO */}
        {!loading && total > 0 && (
          <p className="text-center text-xs text-zinc-600 mt-4">
            Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de {total} pedidos
          </p>
        )}
      </div>
    </div>
  );
}
