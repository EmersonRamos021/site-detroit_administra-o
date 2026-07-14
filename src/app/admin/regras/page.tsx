"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PencilSimple, Plus, Trash, X, FloppyDisk, DotsSixVertical } from "@phosphor-icons/react";

interface Rule {
  id: string;
  title: string;
  html: string;
  order_index: number;
}

export default function AdminRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    id: "",
    title: "",
    html: "",
    order_index: 0,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchRules() {
    try {
      const res = await fetch("/api/admin/rules");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRules(data);
      }
    } catch {
      console.error("Erro ao carregar regras");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRules();
  }, []);

  function resetForm() {
    setForm({ id: "", title: "", html: "", order_index: rules.length + 1 });
    setEditingId(null);
    setShowForm(false);
    setMessage(null);
  }

  function openEdit(rule: Rule) {
    setForm({ ...rule });
    setEditingId(rule.id);
    setShowForm(true);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) throw new Error("Erro ao salvar");
      
      setMessage({ type: "success", text: "Regra salva com sucesso!" });
      fetchRules();
      setTimeout(resetForm, 1500);
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao salvar a regra. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta regra? O site principal perderá este conteúdo.")) return;

    try {
      const res = await fetch(`/api/admin/rules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRules();
      } else {
        alert("Erro ao excluir.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-zinc-400">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Regras</h1>
          <p className="text-zinc-400 mt-1">Gerencie as regras exibidas no site principal</p>
        </div>
        
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Regra
          </button>
        )}
      </div>

      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-white/5 rounded-xl p-6"
        >
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-xl font-semibold text-white">
              {editingId ? "Editar Regra" : "Criar Nova Regra"}
            </h2>
            <button onClick={resetForm} className="text-zinc-400 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  ID Único <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId} // Não pode mudar o ID depois de criado
                  value={form.id}
                  onChange={e => setForm({ ...form, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
                  placeholder="Ex: regras-basicas"
                />
                <p className="text-xs text-zinc-500 mt-1">Identificador usado na URL do site. Apenas letras minúsculas e traços.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Título da Seção <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                  placeholder="Ex: Regras Básicas"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Ordem de Exibição <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={form.order_index}
                onChange={e => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
                className="w-full md:w-48 bg-zinc-950 border border-white/10 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
              />
              <p className="text-xs text-zinc-500 mt-1">Menores números aparecem primeiro na lista lateral.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Conteúdo HTML <span className="text-red-500">*</span>
              </label>
              <div className="bg-zinc-950 border border-white/10 rounded-md focus-within:border-red-500 overflow-hidden">
                <textarea
                  required
                  value={form.html}
                  onChange={e => setForm({ ...form, html: e.target.value })}
                  rows={20}
                  className="w-full bg-transparent px-4 py-3 text-zinc-300 font-mono text-sm leading-relaxed focus:outline-none resize-y"
                  placeholder='Cole o código HTML aqui (ex: <div class="contents">...</div>)'
                  spellCheck={false}
                />
              </div>
              <p className="text-xs text-zinc-400 mt-2 flex items-start gap-1">
                <span className="text-red-400 font-bold">Aviso:</span>
                Edite este código com muito cuidado. Remover classes do GitBook pode quebrar o layout premium do site.
              </p>
            </div>

            {message && (
              <div className={`p-4 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <FloppyDisk className="w-4 h-4" weight="bold" />
                    Salvar Regra
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
          {rules.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              Nenhuma regra cadastrada. Clique em "Nova Regra" para adicionar.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="cursor-grab text-zinc-600 hover:text-zinc-400">
                      <DotsSixVertical className="w-5 h-5" weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{rule.title}</h3>
                      <p className="text-sm text-zinc-500 font-mono mt-0.5">{rule.id} • Ordem: {rule.order_index}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(rule)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                      title="Editar"
                    >
                      <PencilSimple className="w-4 h-4" weight="bold" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <Trash className="w-4 h-4" weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
