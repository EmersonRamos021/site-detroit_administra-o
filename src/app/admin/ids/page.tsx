"use client";

import { useEffect, useState, useMemo } from "react";
import { MagnifyingGlass, CurrencyDollar, X } from "@phosphor-icons/react/dist/ssr";

type IDStatus = "disponivel" | "reservado" | "vendido" | "indisponivel";

interface DbId {
  game_id: number;
  status: IDStatus;
  owner_name?: string | null;
  owner_discord_id?: string | null;
  owner_email?: string | null;
}

export default function IdsManagerPage() {
  const [idsData, setIdsData] = useState<Record<number, Partial<DbId>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<IDStatus | "all">("all");
  
  // Modal State
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOwnerName, setModalOwnerName] = useState("");
  const [modalOwnerDiscordId, setModalOwnerDiscordId] = useState("");
  const [modalOwnerEmail, setModalOwnerEmail] = useState("");

  useEffect(() => {
    if (selectedId !== null) {
       const existing = idsData[selectedId];
       setModalOwnerName(existing?.owner_name || "");
       setModalOwnerDiscordId(existing?.owner_discord_id || "");
       setModalOwnerEmail(existing?.owner_email || "");
    }
  }, [selectedId, idsData]);

  // Paginação
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 500;
  const MAX_ID = 9999;
  const MIN_ID = 10;

  useEffect(() => {
    fetchIds();
  }, []);

  async function fetchIds() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ids");
      const data: DbId[] = await res.json();
      
      const map: Record<number, Partial<DbId>> = {};
      data.forEach((item) => {
        map[item.game_id] = {
           status: item.status,
           owner_name: item.owner_name,
           owner_discord_id: item.owner_discord_id,
           owner_email: item.owner_email
        };
      });
      setIdsData(map);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function updateStatus(id: number, nextStatus: IDStatus) {
    const current = idsData[id] || { status: "disponivel" };
    
    // Optimistic UI
    setIdsData(prev => ({ 
       ...prev, 
       [id]: { 
         status: nextStatus, 
         owner_name: modalOwnerName, 
         owner_discord_id: modalOwnerDiscordId, 
         owner_email: modalOwnerEmail 
       } 
    }));
    setSelectedId(null); // Fechar modal

    try {
      await fetch("/api/admin/ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           game_id: id, 
           status: nextStatus,
           owner_name: modalOwnerName || null,
           owner_discord_id: modalOwnerDiscordId || null,
           owner_email: modalOwnerEmail || null
        }),
      });
    } catch (e) {
      // Revert if error
      setIdsData(prev => ({ ...prev, [id]: current }));
      console.error(e);
      alert("Erro ao salvar status no banco de dados.");
    }
  }

  function getPrice(id: number) {
    if (id < 10) return 0;
    if (id < 100) return 89.90;    // 2 digitos
    if (id < 1000) return 69.90;   // 3 digitos
    if (id <= 9999) return 49.90;  // 4 digitos
    return 0;
  }

  // Lógica Financeira (Apenas "vendido" e "reservado" entram na conta. Indisponivel = 0)
  const stats = useMemo(() => {
    let sold = 0;
    let reserved = 0;

    Object.entries(idsData).forEach(([strId, data]) => {
      const id = parseInt(strId);
      const price = getPrice(id);
      if (data.status === "vendido") sold += price;
      if (data.status === "reservado") reserved += price;
    });

    return { sold, reserved };
  }, [idsData]);

  const { displayIds, totalPages } = useMemo(() => {
    if (search) {
      const sid = parseInt(search);
      if (!isNaN(sid) && sid >= 10 && sid <= 9999) {
        return { displayIds: [sid], totalPages: 1 };
      }
      return { displayIds: [], totalPages: 1 };
    }

    const matchingIds: number[] = [];
    for (let i = MIN_ID; i <= MAX_ID; i++) {
      const s = idsData[i]?.status || "disponivel";
      if (filter !== "all" && s !== filter) continue;
      matchingIds.push(i);
    }

    const pages = Math.ceil(matchingIds.length / ITEMS_PER_PAGE) || 1;
    const startIdx = page * ITEMS_PER_PAGE;
    const sliced = matchingIds.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return { displayIds: sliced, totalPages: pages };
  }, [page, search, filter, idsData]);


  return (
    <div className="pt-28 pb-20 px-6 min-h-screen relative">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Painel de IDs</h1>
        <p className="text-zinc-400 mb-8">Controle financeiro de numerações in-game (Sorteios e Doações não contam no Lucro).</p>

        {/* FINANCIAL DASHBOARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
           <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-[#10b981]">
                <CurrencyDollar size={24} weight="fill" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Lucro com Vendidos</p>
                <p className="font-bold text-[#10b981] text-2xl">R$ {stats.sold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
           </div>
           <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                <CurrencyDollar size={24} weight="fill" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Potencial em Reservados</p>
                <p className="font-bold text-white text-2xl">R$ {stats.reserved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
           </div>
        </div>

        {/* CONTROLS E LEGENDA */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8 bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-wrap gap-4 items-center mr-auto">
             <div className="flex items-center gap-2 text-sm text-zinc-300">
               <div className="w-4 h-4 rounded bg-white"></div> Disponível
             </div>
             <div className="flex items-center gap-2 text-sm text-zinc-300">
               <div className="w-4 h-4 rounded bg-[#fcd34d]"></div> Reservado
             </div>
             <div className="flex items-center gap-2 text-sm text-zinc-300">
               <div className="w-4 h-4 rounded bg-[#10b981]"></div> Vendido
             </div>
             <div className="flex items-center gap-2 text-sm text-zinc-300">
               <div className="w-4 h-4 rounded bg-[#ef4444]"></div> Indisponível
             </div>
          </div>

          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              setPage(0);
            }}
            className="bg-black/50 border border-white/10 rounded-xl h-10 px-4 text-white focus:outline-none"
          >
            <option value="all">Ver Todos</option>
            <option value="disponivel">Apenas Disponíveis</option>
            <option value="reservado">Apenas Reservados</option>
            <option value="vendido">Apenas Vendidos</option>
            <option value="indisponivel">Apenas Indisponíveis (Sorteios)</option>
          </select>

          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar ID Exato" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-black/50 border border-white/10 rounded-xl h-10 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)]"
            />
          </div>
        </div>

        {/* PAGINATION */}
        {!search && totalPages > 1 && (
          <div className="flex gap-2 flex-wrap items-center justify-center mb-6">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 bg-zinc-800 rounded disabled:opacity-50 text-white">&lt;</button>
            <span className="text-zinc-400 text-sm">Página {page + 1} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="px-4 py-2 bg-zinc-800 rounded disabled:opacity-50 text-white">&gt;</button>
          </div>
        )}

        {/* GRID DE IDs */}
        {loading ? (
          <div className="h-64 flex justify-center items-center text-zinc-500">Carregando tabela do banco...</div>
        ) : displayIds.length === 0 ? (
          <div className="h-64 flex justify-center items-center text-zinc-500">Nenhum ID encontrado nesta seleção.</div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2">
            {displayIds.map((id) => {
               const item = idsData[id];
               const status = item?.status || "disponivel";
               const colorClass = 
                 status === "reservado" ? "bg-[#fcd34d] text-black" :
                 status === "vendido" ? "bg-[#10b981] text-white" :
                 status === "indisponivel" ? "bg-[#ef4444] text-white" :
                 "bg-white text-black"; // disponível

               const titleStr = `ID: ${id} | R$ ${getPrice(id).toFixed(2)}${item?.owner_name ? `\nComprador: ${item.owner_name}` : ''}`;

               return (
                 <button
                   key={id}
                   title={titleStr}
                   onClick={() => setSelectedId(id)}
                   className={"aspect-square flex items-center justify-center text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-transform " + colorClass}
                 >
                   {id}
                 </button>
               )
            })}
          </div>
        )}
      </div>

      {/* MODAL / POP-UP DE SELEÇÃO */}
      {selectedId !== null && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-[400px] shadow-2xl relative">
              <button 
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                 <X size={24} />
              </button>
              
               <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-white mb-1">
                   Gerenciar ID #{selectedId}
                 </h2>
                 <p className="text-zinc-400 text-sm">
                   Valor base: R$ {getPrice(selectedId).toFixed(2)}
                 </p>
              </div>

              <div className="mb-6 flex flex-col gap-3">
                 <div>
                    <label className="block text-xs text-zinc-400 mb-1 ml-1">Nome do Comprador (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: João Silva" 
                      value={modalOwnerName}
                      onChange={e => setModalOwnerName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl h-10 px-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)]"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-zinc-400 mb-1 ml-1">ID do Discord (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 123456789012345678" 
                      value={modalOwnerDiscordId}
                      onChange={e => setModalOwnerDiscordId(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl h-10 px-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)]"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-zinc-400 mb-1 ml-1">Email (Opcional)</label>
                    <input 
                      type="email" 
                      placeholder="Ex: joao@email.com" 
                      value={modalOwnerEmail}
                      onChange={e => setModalOwnerEmail(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl h-10 px-4 text-white focus:outline-none focus:border-[var(--color-detroit-red)]"
                    />
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                   onClick={() => updateStatus(selectedId, "disponivel")}
                   className="w-full py-3 px-4 rounded-xl bg-white text-black font-bold flex items-center gap-3 hover:bg-zinc-200 transition-colors"
                 >
                   <div className="w-3 h-3 rounded-full bg-black/20"></div>
                   Marcar como Disponível
                 </button>

                 <button 
                   onClick={() => updateStatus(selectedId, "reservado")}
                   className="w-full py-3 px-4 rounded-xl bg-[#fcd34d] text-black font-bold flex items-center gap-3 hover:bg-yellow-500 transition-colors"
                 >
                   <div className="w-3 h-3 rounded-full bg-black/20"></div>
                   Marcar como Reservado
                 </button>

                 <button 
                   onClick={() => updateStatus(selectedId, "vendido")}
                   className="w-full py-3 px-4 rounded-xl bg-[#10b981] text-white font-bold flex items-center gap-3 hover:bg-green-600 transition-colors"
                 >
                   <div className="w-3 h-3 rounded-full bg-white/30"></div>
                   Marcar como Vendido (Soma no Lucro)
                 </button>

                 <button 
                   onClick={() => updateStatus(selectedId, "indisponivel")}
                   className="w-full py-3 px-4 rounded-xl bg-[#ef4444] text-white font-bold flex items-center gap-3 hover:bg-red-600 transition-colors"
                 >
                   <div className="w-3 h-3 rounded-full bg-white/30"></div>
                   Sorteio / Doação / Indisponível
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
