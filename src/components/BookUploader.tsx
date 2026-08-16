"use client";

import { useRef, useState } from "react";

interface Props {
  sessionId: string;
  bookConnected: boolean;
  onBookChange: (connected: boolean) => void;
}

export default function BookUploader({ sessionId, bookConnected, onBookChange }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    setMessage("");
    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("file", file);

    try {
      const res = await fetch("/api/book", { method: "POST", body: formData });
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
      setMessage("не удалось загрузить файл");
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
            {bookConnected ? "книга подключена" : "подключить книгу (.txt, .md)"}
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
            disabled={status === "uploading"}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#fff",
              cursor: status === "uploading" ? "default" : "pointer",
              opacity: status === "uploading" ? 0.7 : 1,
            }}
          >
            {status === "uploading" ? "загрузка..." : "выбрать файл"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.markdown"
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
        <>
          <div style={{ fontSize: 11, marginTop: 6, color: "#7c7a8a", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span>
              поддерживается .txt и .md, до 4\u00a0Мб.
            </span>
            <button
              onClick={() => setShowHelp((v) => !v)}
              style={{
                fontSize: 11,
                color: "#67e8f9",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                whiteSpace: "nowrap",
                padding: 0,
              }}
            >
              {showHelp ? "скрыть" : "а если у меня PDF?"}
            </button>
          </div>

          {showHelp && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 11.5,
                color: "#c9c6d8",
                lineHeight: 1.55,
              }}
            >
              <div style={{ marginBottom: 6, color: "#e5e2f0", fontWeight: 600 }}>
                как подготовить книгу из PDF или Word:
              </div>
              <div style={{ marginBottom: 4 }}>
                1. откройте файл (Adobe, Preview, Google Docs или Word)
              </div>
              <div style={{ marginBottom: 4 }}>
                2. выделите весь текст (Ctrl+A или Cmd+A) и скопируйте
              </div>
              <div style={{ marginBottom: 4 }}>
                3. вставьте в текстовый редактор (блокнот, TextEdit, VS Code)
              </div>
              <div style={{ marginBottom: 4 }}>
                4. сохраните с расширением .txt и загрузите сюда
              </div>
              <div style={{ marginTop: 6, color: "#9a9aa5" }}>
                в Word и Google Docs есть прямой экспорт: «скачать как → обычный текст (.txt)» или «Markdown (.md)» — это быстрее, чем копировать вручную.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
