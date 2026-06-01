"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  in_game_command: string | null;
  category_name: string;
  active: boolean;
  featured: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    image_url: "",
    in_game_command: "",
    category_id: "",
    active: true,
    featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Upload state
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  async function fetchData() {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch {
      console.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setForm({ title: "", description: "", price: "", image_url: "", in_game_command: "", category_id: "", active: true, featured: false });
    setEditingId(null);
    setShowForm(false);
    setUploadPreview(null);
    setUploadError(null);
    setImageTab("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openEdit(product: Product) {
    setForm({
      title: product.title,
      description: product.description || "",
      price: String(product.price),
      image_url: product.image_url || "",
      in_game_command: product.in_game_command || "",
      category_id: String(categories.find(c => c.name === product.category_name)?.id || ""),
      active: product.active,
      featured: product.featured,
    });
    setEditingId(product.id);
    setShowForm(true);
    // Ao editar, mostrar a URL atual na aba URL
    setImageTab(product.image_url ? "url" : "upload");
    setUploadPreview(product.image_url || null);
    setUploadError(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    // Preview local imediato
    const localUrl = URL.createObjectURL(file);
    setUploadPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro no upload");

      setForm(prev => ({ ...prev, image_url: data.url }));
      setUploadPreview(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload");
      setUploadPreview(null);
      setForm(prev => ({ ...prev, image_url: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const method = editingId ? "PUT" : "POST";
      const body = { ...form, price: parseFloat(form.price), category_id: parseInt(form.category_id), id: editingId };

      const res = await fetch("/api/admin/products", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: editingId ? "Produto atualizado!" : "Produto criado!" });
      resetForm();
      fetchData();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, isActive: boolean) {
    const isHardDelete = !isActive;
    const msg = isHardDelete 
      ? "Tem certeza que deseja EXCLUIR PERMANENTEMENTE este produto do banco de dados?\n\nAtenção: Se ele já tiver sido vendido para algum jogador, a exclusão será bloqueada para evitar quebrar o histórico de pedidos."
      : "Tem certeza que deseja desativar este produto? Ele ficará invisível na loja para os jogadores.";
      
    if (!confirm(msg)) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hardDelete: isHardDelete }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir");
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
            <h1 className="text-3xl font-bold tracking-tighter text-white">Produtos</h1>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-5 py-3 rounded-xl bg-[var(--color-detroit-red)] text-white font-bold text-sm hover:bg-[var(--color-detroit-red-hover)] transition-all"
          >
            + Novo Produto
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
            <h3 className="text-lg font-bold text-white mb-6">{editingId ? "Editar Produto" : "Novo Produto"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Preço (R$)</label>
                <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Comando In-Game <span className="text-zinc-600 lowercase">(ex: add_car:nissangtr ou add_vip:ouro)</span>
                </label>
                <input value={form.in_game_command} onChange={e => setForm({ ...form, in_game_command: e.target.value })} placeholder="vazio para itens manuais"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors resize-none" />
              </div>
              {/* IMAGE FIELD */}
              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">Imagem do Produto</label>

                {/* Tabs Upload / URL */}
                <div className="flex bg-zinc-800 rounded-xl p-1 w-fit mb-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setImageTab("upload")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      imageTab === "upload" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    📁 Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("url")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      imageTab === "url" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    🔗 URL
                  </button>
                </div>

                {imageTab === "upload" ? (
                  <div className="flex gap-4 items-start">
                    {/* Drop zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--color-detroit-red)]/50 hover:bg-[var(--color-detroit-red)]/5 transition-all"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-zinc-600 border-t-[var(--color-detroit-red)] rounded-full animate-spin" />
                          <span className="text-xs text-zinc-500">Fazendo upload...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">📸</span>
                          <span className="text-sm text-zinc-400">Clique para selecionar</span>
                          <span className="text-xs text-zinc-600">JPG, PNG, WebP, GIF • máx. 5MB</span>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    {(uploadPreview || form.image_url) && (
                      <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 flex-shrink-0">
                        <Image
                          src={uploadPreview || form.image_url}
                          alt="Preview"
                          fill
                          className="object-cover"
                          sizes="128px"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadPreview(null);
                            setForm(prev => ({ ...prev, image_url: "" }));
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-500/80 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    value={form.image_url}
                    onChange={e => {
                      setForm({ ...form, image_url: e.target.value });
                      setUploadPreview(e.target.value || null);
                    }}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors"
                  />
                )}

                {uploadError && (
                  <p className="text-xs text-red-400 mt-2">⚠️ {uploadError}</p>
                )}
                {form.image_url && (
                  <p className="text-xs text-zinc-600 mt-1 truncate">URL: {form.image_url}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Categoria</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded accent-[var(--color-detroit-red)]" />
                  <span className="text-sm text-zinc-300">Ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 rounded accent-[var(--color-detroit-red)]" />
                  <span className="text-sm text-zinc-300">Destaque</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-3 rounded-xl bg-[var(--color-detroit-red)] text-white font-bold text-sm hover:bg-[var(--color-detroit-red-hover)] transition-all disabled:opacity-50">
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar Produto"}
              </button>
              <button onClick={resetForm}
                className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-all">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* PRODUCTS TABLE */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  product.active ? "bg-zinc-900/40 border-white/5" : "bg-zinc-900/20 border-white/3 opacity-60"
                }`}
              >
                {/* Image */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.title} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">N/A</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white truncate">{product.title}</p>
                    {product.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-detroit-red)]/20 text-[var(--color-detroit-red)] font-bold">★</span>}
                    {!product.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400 font-bold">INATIVO</span>}
                  </div>
                  <p className="text-xs text-zinc-500">{product.category_name}</p>
                </div>

                {/* Price */}
                <span className="text-lg font-mono font-bold text-white flex-shrink-0">
                  R$ {Number(product.price).toFixed(2)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(product)}
                    className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-all">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(product.id, product.active)}
                    className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                    {product.active ? "Desativar" : "Excluir"}
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
