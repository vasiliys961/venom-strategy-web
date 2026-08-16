"use client";

import { useEffect, useRef, useState } from "react";
import { VenomCanvas, STAGE_LABELS, STAGE_ORDER } from "@/lib/types";
import CanvasView from "@/components/CanvasView";
import StageProgress from "@/components/StageProgress";
import BookUploader from "@/components/BookUploader";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("venom-session-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("venom-session-id", id);
  }
  return id;
}

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [canvas, setCanvas] = useState<VenomCanvas | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookConnected, setBookConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    fetch(`/api/venom?sessionId=${id}`)
      .then((r) => r.json())
      .then((data) => setCanvas(data.canvas))
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [canvas?.history.length]);

  async function send(reset = false) {
    if (!sessionId || (!input.trim() && !reset)) return;
    setLoading(true);
    const messageToSend = input;
    setInput("");
    try {
      const res = await fetch("/api/venom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: messageToSend, reset }),
      });
      const data = await res.json();
      if (data.canvas) setCanvas(data.canvas);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canvas && canvas.history.length === 0 && !loading) {
      fetch("/api/venom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: "" }),
      })
        .then((r) => r.json())
        .then((data) => data.canvas && setCanvas(data.canvas));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas === null]);

  if (!canvas) {
    return (
      <div style={{ padding: 40, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />
        загрузка...
      </div>
    );
  }

  return (
    <main style={{ display: "flex", height: "100vh" }}>
      <section
        style={{
          flex: "0 0 440px",
          borderRight: "1px solid var(--card-border)",
          display: "flex",
          flexDirection: "column",
          background: "rgba(10, 8, 20, 0.35)",
        }}
      >
        <header style={{ padding: "20px 20px 16px" }}>
          <h1
            style={{
              fontSize: 20,
              margin: 0,
              background: "linear-gradient(135deg, var(--accent), var(--accent-2), var(--accent-3))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 800,
            }}
          >
            ✨ VENOM Strategy
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#a8a5b8" }}>
            Личная стратегия по методу С. Колосова
          </p>
        </header>

        <StageProgress stages={STAGE_ORDER} current={canvas.stage} labels={STAGE_LABELS} />

        <BookUploader sessionId={sessionId} bookConnected={bookConnected} onBookChange={setBookConnected} />

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
          {canvas.history.map((m, i) => (
            <div key={i} className="fade-in" style={{ marginBottom: 12, textAlign: m.role === "user" ? "right" : "left" }}>
              <div
                style={{
                  display: "inline-block",
                  maxWidth: "88%",
                  padding: "10px 14px",
                  borderRadius: 14,
                  background:
                    m.role === "user"
                      ? "linear-gradient(135deg, var(--accent), var(--accent-2))"
                      : "var(--card-bg)",
                  border: m.role === "user" ? "none" : "1px solid var(--card-border)",
                  color: "#f5f4fa",
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: "1px solid var(--card-border)", display: "flex", gap: 8 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="напиши ответ..."
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              borderRadius: 12,
              border: "1px solid var(--card-border)",
              background: "rgba(255,255,255,0.03)",
              color: "#f1f0f6",
              padding: 12,
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || canvas.stage === "done"}
            style={{
              padding: "0 20px",
              borderRadius: 12,
              border: "none",
              background: loading
                ? "rgba(255,255,255,0.1)"
                : "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {loading ? "..." : "→"}
          </button>
        </div>
        <button
          onClick={() => send(true)}
          style={{
            margin: "0 16px 16px",
            padding: "10px",
            borderRadius: 10,
            border: "1px solid var(--card-border)",
            background: "transparent",
            color: "#9a97ab",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ↻ начать заново
        </button>
      </section>

      <section style={{ flex: 1, overflowY: "auto", padding: 32 }}>
        <CanvasView canvas={canvas} />
      </section>
    </main>
  );
}
