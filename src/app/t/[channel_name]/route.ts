import { query } from "@/lib/db";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { channel_name: string } }) {
  const channelName = params.channel_name;

  try {
    const results = await query<{ transcript_html: string }>(
      "SELECT transcript_html FROM tickets WHERE channel_name = ? ORDER BY id DESC LIMIT 1",
      [channelName]
    );

    if (results.length === 0) {
      return new Response(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2>Transcrição não encontrada</h2>
          <p>O ticket <b>#${channelName}</b> não existe ou a transcrição ainda não foi salva.</p>
        </div>
      `, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // Retorna o HTML original do transcript gerado pelo Discord
    return new Response(results[0].transcript_html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Erro ao buscar transcript:", error);
    return new Response(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h2>Erro interno do servidor</h2>
        <p>Não foi possível carregar a transcrição no momento.</p>
      </div>
    `, { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}
