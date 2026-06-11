"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function BotSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    guildId: "",
    ticketCategoryId: "",
    permanentCategoryId: "",
    logChannelId: "",
    denunciasChannelId: "",
    automodLogChannelId: "",
    staffRoleId: "",
    autoRoleId: "",
    linkFilterEnabled: "false",
    memberCounterChannelId: "",
    badWords_list: '["fdp","vtnc","filho da puta","arrombado","vsf","vai se fuder","desgraça","corno","puta","vagabundo"]',
    antiFlood_maxMessages: "5",
    antiFlood_timeWindow: "4000"
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/bot-settings");
        const data = await res.json();
        if (data.settings) {
          setForm(prev => ({
            ...prev,
            ...data.settings
          }));
        }
      } catch (e) {
        console.error("Erro ao carregar configurações", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/bot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      
      setMessage({ type: "success", text: "Configurações salvas! O Bot irá atualizar automaticamente em até 60 segundos." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-white focus:border-[var(--color-detroit-red)] focus:outline-none transition-colors";
  const labelClass = "block text-xs text-zinc-500 uppercase tracking-wider mb-2 font-semibold";

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-6">
      <div className="max-w-[800px] mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">← Admin</Link>
        </div>
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tighter text-white">Configurações do Bot</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Altere os IDs de Canais, Categorias e Cargos. O bot aplicará as mudanças automaticamente em até 1 minuto.
          </p>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="h-16 bg-zinc-900/50 animate-pulse rounded-xl" />
            <div className="h-16 bg-zinc-900/50 animate-pulse rounded-xl" />
            <div className="h-16 bg-zinc-900/50 animate-pulse rounded-xl" />
          </div>
        ) : (
          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSave} 
            className="space-y-6 bg-zinc-900 p-6 md:p-8 rounded-2xl border border-white/5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guild ID */}
              <div className="md:col-span-2">
                <label className={labelClass}>ID do Servidor (Guild ID)</label>
                <input 
                  type="text" 
                  value={form.guildId} 
                  onChange={e => setForm({...form, guildId: e.target.value})} 
                  className={inputClass} 
                  placeholder="Ex: 123456789012345678"
                />
              </div>

              {/* Categorias */}
              <div>
                <label className={labelClass}>Categoria de Tickets</label>
                <input 
                  type="text" 
                  value={form.ticketCategoryId} 
                  onChange={e => setForm({...form, ticketCategoryId: e.target.value})} 
                  className={inputClass} 
                  placeholder="ID da Categoria"
                />
              </div>
              <div>
                <label className={labelClass}>Categoria Permanente</label>
                <input 
                  type="text" 
                  value={form.permanentCategoryId} 
                  onChange={e => setForm({...form, permanentCategoryId: e.target.value})} 
                  className={inputClass} 
                  placeholder="ID da Categoria"
                />
              </div>

              {/* Canais */}
              <div>
                <label className={labelClass}>Canal de Logs (Tickets)</label>
                <input 
                  type="text" 
                  value={form.logChannelId} 
                  onChange={e => setForm({...form, logChannelId: e.target.value})} 
                  className={inputClass} 
                  placeholder="ID do Canal"
                />
              </div>
              <div>
                <label className={labelClass}>Canal de Denúncias</label>
                <input 
                  type="text" 
                  value={form.denunciasChannelId} 
                  onChange={e => setForm({...form, denunciasChannelId: e.target.value})} 
                  className={inputClass} 
                  placeholder="ID do Canal"
                />
              </div>
              <div>
                <label className={labelClass}>Canal de Logs Automod</label>
                <input 
                  type="text" 
                  value={form.automodLogChannelId} 
                  onChange={e => setForm({...form, automodLogChannelId: e.target.value})} 
                  className={inputClass} 
                  placeholder="ID do Canal"
                />
              </div>

              {/* Cargos */}
              <div>
                <label className={labelClass}>Cargo Staff (Equipe)</label>
                <input 
                  type="text" 
                  value={form.staffRoleId} 
                  onChange={e => setForm({...form, staffRoleId: e.target.value})} 
                  className={inputClass} 
                  placeholder="ID do Cargo"
                />
              </div>
              <div>
                <label className={labelClass}>Auto-Role (Novos Membros)</label>
                <input 
                  type="text" 
                  value={form.autoRoleId} 
                  onChange={e => setForm({...form, autoRoleId: e.target.value})} 
                  className={inputClass} 
                  placeholder="ID do Cargo"
                />
              </div>
              
              {/* Extras */}
              <div className="md:col-span-2">
                <label className={labelClass}>Canal do Contador de População</label>
                <input 
                  type="text" 
                  value={form.memberCounterChannelId} 
                  onChange={e => setForm({...form, memberCounterChannelId: e.target.value})} 
                  className={inputClass} 
                  placeholder="ID do Canal de Texto (Tópico) ou Voz (Nome) para mostrar o número de membros"
                />
              </div>
            </div>

            <hr className="border-white/5 my-6" />

            <h3 className="text-xl font-bold text-white mb-4">Auto-Moderação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Palavras Bloqueadas (separadas por vírgula)</label>
                <textarea 
                  value={(() => {
                    try { return JSON.parse(form.badWords_list || "[]").join(", "); }
                    catch(e) { return ""; }
                  })()}
                  onChange={e => {
                    const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setForm({...form, badWords_list: JSON.stringify(arr)});
                  }}
                  className={`${inputClass} min-h-[100px] resize-y`} 
                  placeholder="Ex: palavra1, palavra2, palavra3"
                />
              </div>

              <div>
                <label className={labelClass}>Anti-Flood: Limite de Mensagens</label>
                <input 
                  type="number" 
                  value={form.antiFlood_maxMessages} 
                  onChange={e => setForm({...form, antiFlood_maxMessages: e.target.value})} 
                  className={inputClass} 
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <label className={labelClass}>Anti-Flood: Janela de Tempo (segundos)</label>
                <input 
                  type="number" 
                  value={Number(form.antiFlood_timeWindow) / 1000} 
                  onChange={e => setForm({...form, antiFlood_timeWindow: String(Number(e.target.value) * 1000)})} 
                  className={inputClass} 
                  placeholder="Ex: 4"
                />
              </div>
            </div>

            <hr className="border-white/5 my-6" />

            <h3 className="text-xl font-bold text-white mb-4">Status do Servidor MTA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>IP do Servidor (MTA)</label>
                <input 
                  type="text" 
                  value={form.mtaServerIp || ""} 
                  onChange={e => setForm({...form, mtaServerIp: e.target.value})} 
                  className={inputClass} 
                  placeholder="Ex: jogar.complexorp.com.br"
                />
              </div>
              <div>
                <label className={labelClass}>Porta (MTA)</label>
                <input 
                  type="text" 
                  value={form.mtaServerPort || ""} 
                  onChange={e => setForm({...form, mtaServerPort: e.target.value})} 
                  className={inputClass} 
                  placeholder="Padrão: 22003"
                />
              </div>
              
              <div>
                <label className={labelClass}>Link da Loja</label>
                <input 
                  type="text" 
                  value={form.mtaSocialStore || ""} 
                  onChange={e => setForm({...form, mtaSocialStore: e.target.value})} 
                  className={inputClass} 
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className={labelClass}>Link do Instagram</label>
                <input 
                  type="text" 
                  value={form.mtaSocialInsta || ""} 
                  onChange={e => setForm({...form, mtaSocialInsta: e.target.value})} 
                  className={inputClass} 
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className={labelClass}>Link do TikTok</label>
                <input 
                  type="text" 
                  value={form.mtaSocialTiktok || ""} 
                  onChange={e => setForm({...form, mtaSocialTiktok: e.target.value})} 
                  className={inputClass} 
                  placeholder="https://tiktok.com/..."
                />
              </div>
              <div>
                <label className={labelClass}>Link do YouTube</label>
                <input 
                  type="text" 
                  value={form.mtaSocialYoutube || ""} 
                  onChange={e => setForm({...form, mtaSocialYoutube: e.target.value})} 
                  className={inputClass} 
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            <hr className="border-white/5 my-6" />

            {/* Toggles */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-white/5">
              <div>
                <span className="block text-sm font-bold text-white mb-1">Filtro de Links (Anti-Phishing)</span>
                <span className="text-xs text-zinc-500">Deleta mensagens com links não autorizados automaticamente.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={form.linkFilterEnabled === "true"}
                  onChange={e => setForm({...form, linkFilterEnabled: e.target.checked ? "true" : "false"})}
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-detroit-red)]"></div>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-[var(--color-detroit-red)] text-white font-bold text-sm hover:bg-[var(--color-detroit-red-hover)] transition-all disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
