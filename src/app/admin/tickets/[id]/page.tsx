import { auth } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

interface TicketDetail {
  id: number;
  channel_name: string;
  owner_tag: string;
  ticket_type: string;
  closed_by: string;
  closed_at: Date;
  transcript_html: string;
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;

  const tickets = await query<TicketDetail>(
    "SELECT * FROM tickets WHERE id = ?",
    [id]
  );

  if (tickets.length === 0) {
    return (
      <div className="min-h-[100dvh] pt-28 pb-20 px-6 flex items-center justify-center flex-col gap-4">
        <h1 className="text-3xl font-bold text-white">Ticket não encontrado</h1>
        <Link href="/admin/tickets" className="text-[#3b82f6] hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const ticket = tickets[0];

  return (
    <div className="min-h-[100dvh] pt-24 pb-8 px-6 flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col h-full">
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/tickets"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-white/5 shrink-0"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                Transcrição: #{ticket.channel_name}
              </h1>
              <p className="text-sm text-zinc-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                <span>Dono: <strong className="text-zinc-300">{ticket.owner_tag}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span>Fechado por: <strong className="text-zinc-300">{ticket.closed_by}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span>Data: <strong className="text-zinc-300">{new Date(ticket.closed_at).toLocaleString("pt-BR")}</strong></span>
              </p>
            </div>
          </div>
          
          <div className="px-3 py-1.5 bg-zinc-800 text-sm rounded-lg border border-white/10 text-zinc-300 self-start sm:self-auto">
            {ticket.ticket_type}
          </div>
        </div>

        {/* Visualizador da Transcrição */}
        <div className="flex-1 w-full glass-panel rounded-2xl overflow-hidden border border-white/10 relative min-h-[600px] shadow-2xl">
          <iframe
            srcDoc={ticket.transcript_html}
            className="absolute inset-0 w-full h-full bg-[#313338]"
            title={`Transcrição do Ticket #${ticket.channel_name}`}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
