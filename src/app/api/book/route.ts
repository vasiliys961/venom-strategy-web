import { NextRequest, NextResponse } from "next/server";
import { storeBook, clearBook } from "@/lib/bookRag";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_SIZE_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get("sessionId");
    const file = formData.get("file");

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "файл не приложен" }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "файл слишком большой (максимум 4 Мб). используйте .txt-версию книги." },
        { status: 400 }
      );
    }
    if (!file.name.toLowerCase().endsWith(".txt")) {
      return NextResponse.json(
        { error: "пока поддерживается только .txt. сохраните книгу в виде простого текста и подгрузите её." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const chunkCount = await storeBook(sessionId, text);

    return NextResponse.json({ ok: true, chunkCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "не удалось обработать файл" }, { status: 500 });
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
