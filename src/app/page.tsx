"use client";

import { useEffect, useRef, useState } from "react";
import { VenomCanvas, STAGE_LABELS, STAGE_ORDER } from "@/lib/types";
import CanvasView from "@/components/CanvasView";
import StageProgress from "@/components/StageProgress";

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
    return <div style={{ padding: 40 }}>загрузка...</div>;
  }

  return (
    <main style={{ display: "flex", height: "100vh" }}>
      <section style={{ flex: "0 0 420px", borderRight: "1px solid #23262f", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "16px 20px", borderBottom: "1px solid #23262f" }}>
          <h1 style={{ fontSize: 18, margin: 0 }}>VENOM Strategy</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9a9aa5" }}>
            Личная стратегия по методу С. Колосова
          </p>
        </header>

        <StageProgress stages={STAGE_ORDER} current={canvas.stage} labels={STAGE_LABELS} />

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {canvas.history.map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: 12,
                textAlign: m.role === "user" ? "right" : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  maxWidth: "90%",
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: m.role === "user" ? "#2c5cf0" : "#1c1f27",
                  color: m.role === "user" ? "#fff" : "#e8e8ec",
                  fontSize: 14,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: "1px solid #23262f", display: "flex", gap: 8 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Напиши ответ..."
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              borderRadius: 8,
              border: "1px solid #2a2d37",
              background: "#14161c",
              color: "#e8e8ec",
              padding: 10,
              fontSize: 14,
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || canvas.stage === "done"}
            style={{
              padding: "0 16px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#444" : "#2c5cf0",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "..." : "Отправить"}
          </button>
        </div>
        <button
          onClick={() => send(true)}
          style={{
            margin: "0 16px 16px",
            padding: "8px",
            borderRadius: 8,
            border: "1px solid #2a2d37",
            background: "transparent",
            color: "#9a9aa5",
            cursor: "pointer",
          }}
        >
          Начать заново
        </button>
      </section>

      <section style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <CanvasView canvas={canvas} />
      </section>
    </main>
  );
}
