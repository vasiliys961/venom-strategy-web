"use client";

import { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface Props {
  sessionId: string;
  bookConnected: boolean;
  onBookChange: (connected: boolean) => void;
}

const MAX_TEXT_BYTES = 4 * 1024 * 1024;

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

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  const fullText = pages.join("\n\n").replace(/\s+/g, " ").trim();
  if (!fullText || fullText.length < 20) {
    throw new Error(
      "в этом PDF нет текстового слоя (вероятно, это скан). сканированные PDF без OCR пока не поддерживаются."
    );
  }
  return fullText;
}

async function extractText(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    return extractPdfText(file);
  }
  if (lowerName.endsWith(".md") || lowerName.endsWith(".markdown")) {
    return stripMarkdown(await file.text());
  }
  if (lowerName.endsWith(".txt")) {
    return await file.text();
  }
  throw new Error("поддерживается только .txt, .md и .pdf");
}

export default function BookUploader({ sessionId, bookConnected, onBookChange }: Props) {
  const [status, setStatus] = useState<"idle" | "parsing" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setMessage("");
    setStatus("parsing");

    let text: string;
    try {
      text = await extractText(file);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "не удалось обработать файл");
      return;
    }

    const textBytes = new TextEncoder().encode(text).length;
    if (textBytes > MAX_TEXT_BYTES) {
      setStatus("error");
      setMessage(
        `текст книги после извлечения получился слишком большим (${(textBytes / 1024 / 1024).toFixed(1)} Мб, максимум 4 Мб). разбейте книгу на части.`
      );
      return;
    }

    setStatus("uploading");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "ошибка загрузки");
        return;
      }
      setStatus("idle");
      setMessage(`книга подключена (${data.chunkCount} фрагментов)`);
      onBookChange(true);
    } catch {
      setStatus("error");
      setMessage("не удалось загрузить текст на сервер");
    }
  }

  async function handleRemove() {
    try {
      await fetch("/api/book", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      onBookChange(false);
      setMessage("");
    } catch {
      setMessage("не удалось отключить книгу");
    }
  }

  const busy = status === "parsing" || status === "uploading";
  const busyLabel = status === "parsing" ? "разбираю файл..." : "загрузка...";

  return (
    <div
      style={{
        margin: "0 20px 16px",
        padding: 14,
        borderRadius: 14,
        background: bookConnected
          ? "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(139,92,246,0.12))"
          : "var(--card-bg)",
        border: `1px solid ${bookConnected ? "rgba(34,211,238,0.35)" : "var(--card-border)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{bookConnected ? "\ud83d\udcd8" : "\ud83d\udcc4"}</span>
          <span style={{ color: bookConnected ? "#67e8f9" : "#c9c6d8" }}>
            {bookConnected ? "книга подключена" : "подключить книгу (.txt, .md, .pdf)"}
          </span>
        </div>
        {bookConnected ? (
          <button
            onClick={handleRemove}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#c9c6d8",
              cursor: "pointer",
            }}
          >
            отключить
          </button>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#fff",
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? busyLabel : "выбрать файл"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.markdown,.pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {message && (
        <div style={{ fontSize: 11, marginTop: 8, color: status === "error" ? "#f87171" : "#9a9aa5" }}>
          {message}
        </div>
      )}
      {!bookConnected && (
        <div style={{ fontSize: 11, marginTop: 6, color: "#7c7a8a" }}>
          текст извлекается в браузере, на сервер уходит только текст. сканы без текстового слоя пока не поддерживаются.
        </div>
      )}
    </div>
  );
}
