import { NextRequest, NextResponse } from "next/server";
import { storeBook, clearBook } from "@/lib/bookRag";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".txt", ".md", ".markdown"];

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^-{3,}$/gm, " ")
    .replace(/\|/g, " ");
}

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
        { error: "файл слишком большой (максимум 4 Мб)." },
        { status: 400 }
      );
    }

    const lowerName = file.name.toLowerCase();
    const ext = ALLOWED_EXTENSIONS.find((e) => lowerName.endsWith(e));
    if (!ext) {
      return NextResponse.json(
        { error: "поддерживаются форматы .txt и .md. сохраните книгу в одном из этих форматов." },
        { status: 400 }
      );
    }

    let text = await file.text();
    if (ext === ".md" || ext === ".markdown") {
      text = stripMarkdown(text);
    }

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
