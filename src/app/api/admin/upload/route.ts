import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.discord_id || session.user.role !== "admin") {
    return null;
  }
  return session;
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Tipo de arquivo não permitido. Use: ${ALLOWED_TYPES.map(t => t.split("/")[1]).join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return Response.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Gera nome único: timestamp + nome sanitizado
    const ext = file.name.split(".").pop() || "jpg";
    const baseName = sanitizeFilename(file.name.replace(`.${ext}`, ""));
    const filename = `${Date.now()}-${baseName}.${ext}`;

    // Garante que o diretório existe
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Salva o arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;

    return Response.json({ success: true, url, filename });
  } catch (error) {
    console.error("❌ Erro ao fazer upload:", error);
    return Response.json({ error: "Erro interno ao processar upload." }, { status: 500 });
  }
}
