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
            {bookConnected ? "книга подключена" : "подключить книгу (.txt)"}
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
          accept=".txt"
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
          поддерживается только .txt, до 4 Мб. ответы будут точнее опираться на текст книги.
        </div>
      )}
    </div>
  );
}
