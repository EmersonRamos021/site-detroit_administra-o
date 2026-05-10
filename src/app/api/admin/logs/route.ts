import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth-check";

export async function GET() {
  const session = await requirePermission("logs");
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await query("SELECT id, admin_email, action, details, created_at FROM admin_logs ORDER BY created_at DESC LIMIT 500");
    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
