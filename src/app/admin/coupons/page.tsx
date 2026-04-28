"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Coupon {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_price: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percent",
    discount_value: "",
    min_price: "",
    max_uses: "",
    active: true,
    expires_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {
      console.error("Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setForm({ code: "", discount_type: "percent", discount_value: "", min_price: "", max_uses: "", active: true, expires_at: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(coupon: Coupon) {
    let expiresAtLocal = "";
    if (coupon.expires_at) {
      // Formata data ISO para o formato do input datetime-local Omitindo frações de segundos e "Z"
      const date = new Date(coupon.expires_at);
      const shift = date.getTime() - date.getTimezoneOffset() * 60000;
      expiresAtLocal = new Date(shift).toISOString().slice(0, 16);
    }

    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_price: String(coupon.min_price),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : "",
      active: coupon.active,
      expires_at: expiresAtLocal,
    });
    setEditingId(coupon.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const method = editingId ? "PUT" : "POST";
      const body = { 
        ...form, 
        discount_value: parseFloat(form.discount_value), 
        min_price: form.min_price ? parseFloat(form.min_price) : 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        id: editingId 
      };

      const res = await fetch("/api/admin/coupons", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: editingId ? "Cupom atualizado!" : "Cupom criado!" });
      resetForm();
      fetchData();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deletar este cupom permanentemente?")) return;

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Erro ao deletar");
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">← Admin</Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter text-white">Cupons de Desconto</h1>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-5 py-3 rounded-xl bg-[var(--color-detroit-red)] text-white font-bold text-sm hover:bg-[var(--color-detroit-red-hover)] transition-all"
          >
            + Novo Cupom
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
            {message.text}
          </div>
        )}

        {/* FORM MODAL */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 rounded-2xl bg-zinc-900 border border-white/10"
          >
            <h3 className="text-lg font-bold text-white mb-6">{editingId ? "Editar Cupom" : "Novo Cupom"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Código Promocional</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EX: VERAO20"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white font-mono uppercase focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Tipo</label>
                  <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors">
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Desconto</label>
                  <input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Valor Mínimo (R$)</label>
                <input type="number" step="0.01" value={form.min_price} onChange={e => setForm({ ...form, min_price: e.target.value })} placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Limite de Usos Totais</label>
                <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Vazio = ilimitado"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Data de Expiração</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors" />
              </div>
              
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded accent-[var(--color-detroit-red)]" />
                  <span className="text-sm text-zinc-300">Cupom Ativo</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-3 rounded-xl bg-[var(--color-detroit-red)] text-white font-bold text-sm hover:bg-[var(--color-detroit-red-hover)] transition-all disabled:opacity-50">
                {saving ? "Salvando..." : editingId ? "Atualizar Cupom" : "Criar Cupom"}
              </button>
              <button onClick={resetForm}
                className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-all">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* COUPONS TABLE */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">Nenhum cupom cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon, idx) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  coupon.active ? "bg-zinc-900/40 border-white/5" : "bg-zinc-900/20 border-white/3 opacity-60"
                }`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="px-3 py-1 bg-zinc-800 border border-white/10 rounded-lg">
                    <p className="font-mono font-bold text-white tracking-widest">{coupon.code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-300">
                      {coupon.discount_type === "percent" ? `${Number(coupon.discount_value)}% de Desconto` : `R$ ${Number(coupon.discount_value).toFixed(2)} de Desconto`}
                    </p>
                    <p className="text-xs text-zinc-500 flex gap-2">
                       {coupon.max_uses ? <span>Usos: {coupon.used_count} / {coupon.max_uses}</span> : <span>Usos: {coupon.used_count}</span>}
                       {coupon.min_price > 0 && <span>• Min: R$ {Number(coupon.min_price).toFixed(2)}</span>}
                    </p>
                  </div>
                </div>

                {!coupon.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400 font-bold flex-shrink-0">INATIVO</span>}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(coupon)}
                    className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-all">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(coupon.id)}
                    className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                    Deletar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
