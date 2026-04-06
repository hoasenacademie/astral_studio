import { NextResponse } from "next/server";
import { hasPersistentStorage, publishReport } from "@/lib/storage";
export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasPersistentStorage()) {
    return NextResponse.json(
      {
        error:
          "Publication mobile indisponible: stockage persistant non configure sur Vercel. Ajoute DATABASE_URL ou POSTGRES_URL."
      },
      { status: 503 }
    );
  }

  const { id } = await params;
  const report = await publishReport(id);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  return NextResponse.json({ report });
}
