import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SECRET_TOKEN = process.env.MTA_SECRET_TOKEN ?? "detroit_mta_token_999";

/**
 * GET /api/mta/auth
 * Verificação de autenticidade do MTA.
 * O servidor MTA chama esse endpoint ao iniciar para confirmar
 * que está apontando para a API correta com o token certo.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth || auth !== `Bearer ${SECRET_TOKEN}`) {
    return NextResponse.json(
      { success: false, error: "Token inválido" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    server: "Detroit Roleplay",
    version: "2.0",
    timestamp: new Date().toISOString(),
  });
}
