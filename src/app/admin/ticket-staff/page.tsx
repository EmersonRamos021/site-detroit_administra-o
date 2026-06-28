"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash, PencilSimple, X, CheckCircle, Ticket } from "@phosphor-icons/react/dist/ssr";

const TICKET_CATEGORIES = [
  { id: "compras", label: "💰 Compras" },
  { id: "suporte", label: "🔧 Suporte" },
  { id: "denuncia", label: "📢 Denúncias" },
  { id: "revisao", label: "⚠️ Revisões" },
];

export default function TicketStaffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [discordId, setDiscordId] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") return router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "superadmin" && !session?.user?.permissions?.includes("staff")) {
      router.push("/admin");
    }
    
    if (status === "authenticated" && (session?.user?.role === "superadmin" || session?.user?.permissions?.includes("staff"))) {
      fetchStaff();
    }
  }, [status, session, router]);

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ticket-staff");
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  function toggleCat(id: string) {
    if (selectedCats.includes(id)) {
      setSelectedCats(selectedCats.filter(c => c !== id));
    } else {
      setSelectedCats([...selectedCats, id]);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/ticket-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discord_id: discordId, categories: selectedCats }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao salvar staff");
        setCreating(false);
        return;
      }

      setSuccess(true);
      setDiscordId("");
      setSelectedCats([]);
      fetchStaff();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError("Ocorreu um erro inesperado.");
    }
    setCreating(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja remover as permissões deste Staff?")) return;
    
    try {
      const res = await fetch("/api/admin/ticket-staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleEdit(member: any) {
    setDiscordId(member.discord_id);
    let cats = [];
    try {
      cats = typeof member.categories === 'string' ? JSON.parse(member.categories) : member.categories;
    } catch(e) {}
    setSelectedCats(cats || []);
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-detroit-red)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3">
              <Ticket className="text-[var(--color-detroit-red)]" />
              Equipe de Tickets
            </h1>
            <p className="text-zinc-400 mt-1">Configure quais categorias de tickets cada membro da Staff do Discord pode atender.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA - LISTA */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Membros Cadastrados ({staff.length})</h2>
            
            {staff.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/30 rounded-2xl border border-white/5">
                <p className="text-zinc-500">Nenhum membro configurado ainda.</p>
              </div>
            ) : (
              staff.map(member => {
                let cats = [];
                try {
                  cats = typeof member.categories === 'string' ? JSON.parse(member.categories) : member.categories;
                } catch(e) {}
                
                return (
                  <div key={member.id} className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-white bg-black/50 px-2 py-1 rounded text-sm border border-white/10">ID: {member.discord_id}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cats && cats.length > 0 ? (
                          cats.map((c: string) => {
                            const found = TICKET_CATEGORIES.find(x => x.id === c);
                            return (
                              <span key={c} className="text-xs bg-[var(--color-detroit-red)]/20 text-[var(--color-detroit-red)] px-2 py-1 rounded-full font-bold">
                                {found?.label || c}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">Nenhuma permissão</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Editar Permissões"
                      >
                        <PencilSimple size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Remover Acesso"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* COLUNA DIREITA - FORMULÁRIO */}
          <div>
            <div className="sticky top-28 bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <UserPlus className="text-[var(--color-detroit-red)]" />
                Adicionar/Editar Acesso
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">ID do Discord do Staff</label>
                  <input
                    type="text"
                    required
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value.replace(/\\D/g, ''))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-all"
                    placeholder="Ex: 303184113639358464"
                  />
                  <p className="text-xs text-zinc-500 mt-2">Pegue o ID copiando no Discord com o Modo Desenvolvedor ativo.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-3">Quais tickets ele pode atender?</label>
                  <div className="space-y-2">
                    {TICKET_CATEGORIES.map(cat => (
                      <label 
                        key={cat.id}
                        className={\`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all \${
                          selectedCats.includes(cat.id) 
                            ? "bg-[var(--color-detroit-red)]/10 border-[var(--color-detroit-red)]/50" 
                            : "bg-black/30 border-white/5 hover:border-white/10"
                        }\`}
                      >
                        <div className={\`w-5 h-5 rounded border flex items-center justify-center transition-all \${
                          selectedCats.includes(cat.id)
                            ? "bg-[var(--color-detroit-red)] border-[var(--color-detroit-red)]"
                            : "border-zinc-600"
                        }\`}>
                          {selectedCats.includes(cat.id) && <CheckCircle weight="bold" className="text-white w-4 h-4" />}
                        </div>
                        <span className="text-sm font-medium text-white">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                    <X className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-2">
                    <CheckCircle className="text-green-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-400">Salvo com sucesso!</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating || !discordId || selectedCats.length === 0}
                  className="w-full bg-[var(--color-detroit-red)] hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Salvar Permissões"
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
