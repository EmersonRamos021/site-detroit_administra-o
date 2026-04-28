"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, ArrowDown, ArrowUp, Wallet, CheckCircle, X } from "@phosphor-icons/react/dist/ssr";

interface DbTransaction {
  id: number;
  type: "entrada" | "saida";
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formType, setFormType] = useState<"entrada" | "saida">("entrada");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formDesc, setFormDesc] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formAmount || !formDesc) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          amount: parseFloat(formAmount.replace(",", ".")),
          description: formDesc,
          category: "Manual",
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormAmount("");
        setFormDesc("");
        fetchData();
      } else {
        alert("Erro ao salvar transação");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar transação");
    }
    setIsSubmitting(false);
  }

  const { totalIn, totalOut, balance } = useMemo(() => {
    let tIn = 0;
    let tOut = 0;
    transactions.forEach(t => {
      // Garantir que amount seja número (o BD as vezes volta string p/ DECIMAL)
      const val = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
      if (t.type === "entrada") tIn += val;
      if (t.type === "saida") tOut += val;
    });
    return {
      totalIn: tIn,
      totalOut: tOut,
      balance: tIn - tOut
    };
  }, [transactions]);

  function formatDate(isoStr: string) {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  return (
    <div className="pt-28 pb-20 px-6 min-h-screen relative">
      <div className="max-w-[1200px] mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Painel Financeiro</h1>
            <p className="text-zinc-400">Controle o caixa da cidade. Tudo o que entra e tudo o que sai.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--color-detroit-red)] hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20"
          >
            <Plus size={20} weight="bold" />
            Nova Transação
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 font-medium">Entradas</p>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <ArrowUp size={20} weight="bold" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">R$ {totalIn.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
           </div>

           <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 font-medium">Saídas</p>
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <ArrowDown size={20} weight="bold" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">R$ {totalOut.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
           </div>

           <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-white">
                 <Wallet size={120} weight="fill" />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-zinc-400 font-medium">Saldo Atual (Em Caixa)</p>
              </div>
              <p className={"text-4xl font-bold relative z-10 " + (balance >= 0 ? "text-[#10b981]" : "text-[#ef4444]")}>
                R$ {balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </p>
           </div>
        </div>

        {/* HISTÓRICO */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 md:p-8">
           <h2 className="text-xl font-bold text-white mb-6">Histórico de Movimentações</h2>
           
           {loading ? (
             <div className="py-12 text-center text-zinc-500">Carregando livro caixa...</div>
           ) : transactions.length === 0 ? (
             <div className="py-12 text-center text-zinc-500">Nenhuma transação encontrada. Adicione uma ou venda um ID!</div>
           ) : (
             <div className="flex flex-col gap-4">
               {transactions.map(t => {
                 const isEntrada = t.type === "entrada";
                 return (
                   <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className={"w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center " + (isEntrada ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                          {isEntrada ? <ArrowUp size={20} weight="bold" /> : <ArrowDown size={20} weight="bold" />}
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg leading-tight">{t.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                              {t.category}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {formatDate(t.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="md:text-right">
                         <p className={"text-xl font-bold " + (isEntrada ? "text-green-500" : "text-red-500")}>
                           {isEntrada ? "+" : "-"} R$ {typeof t.amount === 'string' ? parseFloat(t.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                         </p>
                      </div>
                   </div>
                 )
               })}
             </div>
           )}
        </div>
      </div>

      {/* MODAL NOVA TRANSAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-[500px] shadow-2xl relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                 <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">Lançamento Manual</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                {/* Switch Tipo */}
                <div className="flex gap-2 p-1 bg-black/50 rounded-xl">
                   <button
                     type="button"
                     onClick={() => setFormType("entrada")}
                     className={"flex-1 py-2 rounded-lg font-bold text-sm transition-all " + (formType === "entrada" ? "bg-green-500 text-white" : "text-zinc-500 hover:text-white")}
                   >
                     Entrada (Lucro)
                   </button>
                   <button
                     type="button"
                     onClick={() => setFormType("saida")}
                     className={"flex-1 py-2 rounded-lg font-bold text-sm transition-all " + (formType === "saida" ? "bg-red-500 text-white" : "text-zinc-500 hover:text-white")}
                   >
                     Saída (Despesa/Saque)
                   </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-detroit-red)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Anotação / Descrição</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Saque Nubank, Pagamento do Host..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-detroit-red)]"
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full mt-4 bg-[var(--color-detroit-red)] hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : <><CheckCircle size={20} weight="bold"/> Confirmar Lançamento</>}
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
