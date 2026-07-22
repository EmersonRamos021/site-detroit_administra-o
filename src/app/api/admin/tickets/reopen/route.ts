import { auth } from "@/auth";
import { query } from "@/lib/db";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-check";
import { parseTranscript } from "@/lib/parseHtml";

const DISCORD_API = "https://discord.com/api/v10";

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("tickets");
    if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return Response.json({ error: "Ticket ID obrigatório." }, { status: 400 });
    }

    // Buscar dados do ticket no banco
    const rows = await query<any>("SELECT * FROM tickets WHERE id = ?", [ticketId]);
    if (!rows || rows.length === 0) {
      return Response.json({ error: "Ticket não encontrado." }, { status: 404 });
    }

    const ticket = rows[0];

    // Buscar configurações do banco
    const settingsRows = await query<any>("SELECT `key`, `value` FROM settings");
    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    const token = process.env.DISCORD_TOKEN;
    const guildId = settings.guildId || process.env.GUILD_ID;
    if (!token || !guildId) {
      return Response.json({ error: "Token do bot ou Guild ID ausentes." }, { status: 500 });
    }

    let targetCategory = settings.ticketCategoryId;
    if (ticket.ticket_type === 'ticket_compras') targetCategory = settings.ticketCategoryCompras || targetCategory;
    else if (ticket.ticket_type === 'ticket_suporte') targetCategory = settings.ticketCategorySuporte || targetCategory;
    else if (ticket.ticket_type === 'denuncia') targetCategory = settings.ticketCategoryDenuncia || targetCategory;
    else if (ticket.ticket_type === 'revisao') targetCategory = settings.ticketCategoryRevisao || targetCategory;

    // Configurar permissões
    // ViewChannel = 1024
    // SendMessages = 2048
    // ReadMessageHistory = 65536
    // ManageChannels = 16
    const viewChannel = 1024;
    const sendMessages = 2048;
    const readMessageHistory = 65536;
    const manageChannels = 16;
    
    // bot id requires calling /users/@me first, or we can just give generic allow for bot.
    // However, usually we can get bot id by fetching /users/@me
    const meRes = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bot ${token}` }
    });
    if (!meRes.ok) {
        return Response.json({ error: "Erro ao autenticar com a API do Discord" }, { status: 500 });
    }
    const me = await meRes.json();
    const botId = me.id;

    const permissionOverwrites = [
        {
            id: guildId,
            type: 0, // role
            deny: (viewChannel).toString(),
            allow: "0"
        },
        {
            id: botId,
            type: 1, // member
            allow: (viewChannel | sendMessages | manageChannels | readMessageHistory).toString(),
            deny: "0"
        },
        {
            id: ticket.owner_id,
            type: 1, // member
            allow: (viewChannel | sendMessages | readMessageHistory).toString(),
            deny: "0"
        }
    ];

    if (settings.staffRoleId) {
        permissionOverwrites.push({
            id: settings.staffRoleId,
            type: 0, // role
            allow: (viewChannel | sendMessages | readMessageHistory).toString(),
            deny: "0"
        });
    }

    // Criar o canal
    const createRes = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
        method: 'POST',
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: `reaberto-${ticket.owner_id}`,
            type: 0, // text channel
            topic: `owner:${ticket.owner_id} | type:${ticket.ticket_type} | status:open | ticket:${ticket.id}`,
            parent_id: targetCategory || null,
            permission_overwrites: permissionOverwrites
        })
    });

    if (!createRes.ok) {
        const err = await createRes.text();
        console.error("Discord API Error:", err);
        return Response.json({ error: "Erro ao criar canal no Discord.", details: err }, { status: 500 });
    }

    const channel = await createRes.json();

    // Recuperar nome do admin ou email
    const adminName = session.user.email ? session.user.email.split('@')[0] : 'Admin';

    // Primeiro enviar a mensagem informando da reabertura e anexando o HTML por garantia
    const formData = new FormData();
    const payload_json = {
        content: `<@${ticket.owner_id}> Seu ticket foi reaberto por **${adminName}** pelo Painel Admin!`,
        embeds: [{
            color: 3447003, // blue
            title: "🔓 Ticket Reaberto",
            description: "Este ticket foi reaberto através do Painel Web.\nO histórico antigo do chat foi restaurado abaixo.",
            timestamp: new Date().toISOString()
        }]
    };
    formData.append("payload_json", JSON.stringify(payload_json));
    
    if (ticket.transcript_html) {
        const blob = new Blob([ticket.transcript_html], { type: 'text/html' });
        formData.append("files[0]", blob, "historico_anterior.html");
    }

    await fetch(`${DISCORD_API}/channels/${channel.id}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bot ${token}`
        },
        body: formData
    });

    // Restaurar mensagens como Webhooks se houver transcript_html
    if (ticket.transcript_html) {
        const messages = parseTranscript(ticket.transcript_html);
        
        if (messages.length > 0) {
            // Limitar a 50 mensagens para evitar timeout e lentidão
            const msgsToSend = messages.slice(-50);

            // Criar webhook
            const whRes = await fetch(`${DISCORD_API}/channels/${channel.id}/webhooks`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: "Reabertura Ticket" })
            });

            if (whRes.ok) {
                const webhook = await whRes.json();
                const whUrl = `${DISCORD_API}/webhooks/${webhook.id}/${webhook.token}`;

                // Enviar cada mensagem sequencialmente
                for (const msg of msgsToSend) {
                    await fetch(whUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: msg.author,
                            avatar_url: msg.avatar,
                            content: msg.content.substring(0, 2000)
                        })
                    });
                    // pequeno delay para não atingir rate limit de webhooks (5 por 2s)
                    await new Promise(r => setTimeout(r, 400));
                }

                // Deletar webhook após o uso
                await fetch(whUrl, {
                    method: 'DELETE',
                    headers: { Authorization: `Bot ${token}` }
                });
            }
        }
    }
    return Response.json({ success: true, channelId: channel.id });

  } catch (error: any) {
    console.error("Reopen ticket error:", error);
    return Response.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
