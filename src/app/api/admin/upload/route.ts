import { auth } from "@/auth";
import { writeFile, mkdir, unlink, readFile } from "fs/promises";
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

  const apiKey = process.env.SQUARE_CLOUD_API_KEY;

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

    // Salva o arquivo temporariamente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const localPath = join(uploadDir, filename);
    await writeFile(localPath, buffer);

    let url = `/uploads/${filename}`; // Fallback local

    // Se a SquareCloud estiver configurada, faz o upload para a nuvem
    if (apiKey) {
      try {
        console.log(`☁️ Fazendo upload de ${filename} para a SquareCloud Blob (Via Fetch)...`);
        
        // Lê o arquivo local como buffer para envio
        const fileBuffer = await readFile(localPath);
        const fileBlob = new Blob([fileBuffer], { type: file.type });
        
        const blobFormData = new FormData();
        blobFormData.append('file', fileBlob, filename);

        const response = await fetch(`https://blob.squarecloud.app/v1/objects?name=${baseName}`, {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
          },
          body: blobFormData
        });
        
        const textResponse = await response.text();
        
        if (!response.ok) {
          throw new Error(`SquareCloud API Error (${response.status}): ${textResponse.substring(0, 100)}`);
        }
        
        const data = JSON.parse(textResponse);
        
        if (data?.response?.url) {
          url = data.response.url;
          console.log(`✅ Upload concluído: ${url}`);
          // Remove o arquivo local pois já está na nuvem
          await unlink(localPath).catch(() => {});
        } else {
          throw new Error("Formato de resposta desconhecido: " + textResponse.substring(0, 100));
        }
      } catch (err: any) {
        console.error("❌ Erro ao enviar para SquareCloud:", err);
        // Fallback para URL absoluta (assim funciona no Frontend também)
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        url = `${protocol}://${host}/uploads/${filename}`;
        
        return Response.json({ 
          error: "Erro na nuvem SquareCloud: " + (err.message || String(err)),
          fallbackUrl: url 
        }, { status: 500 });
      }
    } else {
      return Response.json({ 
        error: "SQUARE_CLOUD_API_KEY não encontrada no servidor. Reinicie a aplicação ou configure a variável." 
      }, { status: 500 });
    }

    return Response.json({ success: true, url, filename });
  } catch (error) {
    console.error("❌ Erro ao fazer upload:", error);
    return Response.json({ error: "Erro interno ao processar upload." }, { status: 500 });
  }
}
