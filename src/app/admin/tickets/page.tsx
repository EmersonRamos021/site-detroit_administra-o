import { auth } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChatTeardropText, FileHtml } from "@phosphor-icons/react/dist/ssr";

interface TicketRow {
  id: number;
  channel_name: string;
  owner_tag: string;
  ticket_type: string;
  closed_by: string;
  closed_at: Date;
}

export default async function TicketsListPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  // Não selecionamos o transcript_html aqui para manter a query leve
  const tickets = await query<TicketRow>(
    "SELECT id, channel_name, owner_tag, ticket_type, closed_by, closed_at FROM tickets ORDER BY closed_at DESC"
  );

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-zinc-400 hover:text-white transition-colors">
            &larr; Voltar
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3">
              <ChatTeardropText size={32} className="text-[#3b82f6]" weight="fill" />
              Histórico de Tickets
            </h1>
            <p className="text-zinc-400 mt-1">Transcrições de tickets fechados no Discord.</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-sm font-medium text-zinc-400">Canal</th>
                  <th className="p-4 text-sm font-medium text-zinc-400">Usuário</th>
                  <th className="p-4 text-sm font-medium text-zinc-400">Tipo</th>
                  <th className="p-4 text-sm font-medium text-zinc-400">Fechado por</th>
                  <th className="p-4 text-sm font-medium text-zinc-400">Data</th>
                  <th className="p-4 text-sm font-medium text-zinc-400 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                      Nenhum ticket encontrado no banco de dados.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-4 text-zinc-300 font-mono text-sm">
                        #{ticket.channel_name}
                      </td>
                      <td className="p-4 text-white font-medium">{ticket.owner_tag}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-zinc-800 text-xs rounded-lg border border-white/10 text-zinc-300">
                          {ticket.ticket_type}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400">{ticket.closed_by}</td>
                      <td className="p-4 text-zinc-400 text-sm">
                        {new Date(ticket.closed_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/tickets/${ticket.id}`}
                          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors text-sm font-medium"
                        >
                          <FileHtml size={16} />
                          Ver HTML
                        </Link>
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
