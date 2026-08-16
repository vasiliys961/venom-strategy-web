import { NextRequest, NextResponse } from "next/server";
import { loadCanvas, saveCanvas } from "@/lib/kvStore";
import { advance } from "@/lib/graph";
import { emptyCanvas } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId: string = body.sessionId;
    const message: string = body.message || "";
    const reset: boolean = Boolean(body.reset);

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    let canvas = reset ? emptyCanvas(sessionId) : await loadCanvas(sessionId);
    const { canvas: updated, reply } = await advance(canvas, message, sessionId);
    await saveCanvas(updated);

    return NextResponse.json({ canvas: updated, reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "внутренняя ошибка сервера. проверьте POLZA_API_KEY в настройках." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  const canvas = await loadCanvas(sessionId);
  return NextResponse.json({ canvas });
}
