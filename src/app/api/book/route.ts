import { NextRequest, NextResponse } from "next/server";
import { storeBook, clearBook } from "@/lib/bookRag";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_TEXT_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, text, fileName } = body as {
      sessionId?: string;
      text?: string;
      fileName?: string;
    };

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json(
        { error: "пустой или слишком короткий текст" },
        { status: 400 }
      );
    }

    const textBytes = Buffer.byteLength(text, "utf-8");
    if (textBytes > MAX_TEXT_BYTES) {
      return NextResponse.json(
        { error: "текст слишком большой (максимум 4 Мб)." },
        { status: 400 }
      );
    }

    const chunkCount = await storeBook(sessionId, text);

    return NextResponse.json({ ok: true, chunkCount, fileName });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "не удалось обработать текст" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    await clearBook(sessionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "не удалось отключить книгу" }, { status: 500 });
  }
}
