"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash, Link as LinkIcon, CheckCircle } from "@phosphor-icons/react/dist/ssr";

const PERMISSIONS_LIST = [
  { id: "products", label: "Produtos" },
  { id: "orders", label: "Pedidos" },
  { id: "coupons", label: "Cupons" },
  { id: "finance", label: "Financeiro" },
  { id: "ids", label: "IDs In-Game" },
  { id: "tickets", label: "Tickets" }
];

export default function StaffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") return router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "superadmin") {
      router.push("/admin");
    }
    
    if (status === "authenticated" && session?.user?.role === "superadmin") {
      fetchStaff();
    }
  }, [status, session, router]);

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  function togglePerm(id: string) {
    if (selectedPerms.includes(id)) {
      setSelectedPerms(selectedPerms.filter(p => p !== id));
    } else {
      setSelectedPerms([...selectedPerms, id]);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setInviteLink("");
    setCopied(false);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permissions: selectedPerms }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar staff");
        setCreating(false);
        return;
      }

      const link = `${window.location.origin}/invite?token=${data.inviteToken}`;
      setInviteLink(link);
      setEmail("");
      setSelectedPerms([]);
      fetchStaff();
    } catch (err) {
      setError("Erro interno");
    }
    setCreating(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja remover este membro da equipe?")) return;
    try {
      await fetch("/api/admin/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchStaff();
    } catch (error) {
      alert("Erro ao remover staff");
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (loading) {
    return <div className="min-h-screen p-20 flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <div className="pt-28 pb-20 px-6 max-w-[1200px] mx-auto w-full">
      <h1 className="text-3xl font-bold text-white mb-2">Gestão de Equipe (Staff)</h1>
      <p className="text-zinc-400 mb-10">Adicione moderadores e limite o acesso deles ao painel.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULÁRIO DE CRIAÇÃO */}
        <div className="lg:col-span-1 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 h-fit">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <UserPlus size={24} className="text-[var(--color-detroit-red)]" />
            Novo Membro
          </h2>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-1">E-mail do Staff</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@gmail.com"
                className="w-full bg-black/50 border border-white/10 rounded-xl h-12 px-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Permissões de Acesso</label>
              <div className="space-y-2">
                {PERMISSIONS_LIST.map((perm) => (
                  <label 
                    key={perm.id} 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={(e) => { e.preventDefault(); togglePerm(perm.id); }}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPerms.includes(perm.id) ? 'bg-[var(--color-detroit-red)] border-[var(--color-detroit-red)]' : 'bg-black/50 border-white/20 group-hover:border-white/40'}`}>
                      {selectedPerms.includes(perm.id) && <CheckCircle size={14} weight="bold" className="text-white" />}
                    </div>
                    <span className="text-zinc-300 group-hover:text-white transition-colors">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full h-12 mt-2 bg-zinc-100 text-black font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50"
            >
              {creating ? "Gerando Convite..." : "Gerar Link de Convite"}
            </button>
          </form>

          {/* AREA DO LINK GERADO */}
          {inviteLink && (
            <div className="mt-6 p-4 bg-[var(--color-detroit-red)]/10 border border-[var(--color-detroit-red)]/20 rounded-2xl">
              <p className="text-sm text-white font-bold mb-2 flex items-center gap-2">
                <LinkIcon size={16} /> Link de Convite Gerado!
              </p>
              <p className="text-xs text-zinc-400 mb-3">Envie este link para o staff definir a própria senha de acesso.</p>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-xs text-zinc-300 focus:outline-none"
                />
                <button
                  onClick={copyLink}
                  className="h-10 px-4 bg-[var(--color-detroit-red)] hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LISTA DE STAFF */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20">
                    <th className="p-4 text-sm font-medium text-zinc-400">Usuário</th>
                    <th className="p-4 text-sm font-medium text-zinc-400">Cargo</th>
                    <th className="p-4 text-sm font-medium text-zinc-400">Acessos</th>
                    <th className="p-4 text-sm font-medium text-zinc-400">Status</th>
                    <th className="p-4 text-sm font-medium text-zinc-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((user) => {
                    const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions || "[]") : (user.permissions || []);
                    const isSuper = user.role === "superadmin";

                    return (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <p className="text-sm font-bold text-white">{user.email}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${isSuper ? 'bg-[var(--color-detroit-red)]/20 text-[var(--color-detroit-red)]' : 'bg-zinc-800 text-zinc-300'}`}>
                            {isSuper ? "Super Admin" : "Staff"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {isSuper ? (
                              <span className="text-xs text-zinc-500">Acesso Total</span>
                            ) : perms.length > 0 ? (
                              perms.map((p: string) => (
                                <span key={p} className="px-2 py-0.5 bg-black/40 border border-white/10 rounded text-[10px] text-zinc-400">
                                  {PERMISSIONS_LIST.find(pl => pl.id === p)?.label || p}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-zinc-600">Sem acessos</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {isSuper ? (
                            <span className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Ativo</span>
                          ) : user.invite_token ? (
                            <span className="text-xs text-yellow-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pendente</span>
                          ) : (
                            <span className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Ativo</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {!isSuper && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors ml-auto"
                              title="Remover Conta"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {staff.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Nenhum membro encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
