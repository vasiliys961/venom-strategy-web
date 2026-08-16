import { VenomCanvas } from "@/lib/types";

const SECTION_ACCENTS: Record<string, string> = {
  vision: "linear-gradient(135deg, #8b5cf6, #6366f1)",
  evaluation: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
  gaps: "linear-gradient(135deg, #f97316, #ef4444)",
  objectives: "linear-gradient(135deg, #ec4899, #8b5cf6)",
  management: "linear-gradient(135deg, #22c55e, #14b8a6)",
};

function Section({
  title,
  accentKey,
  children,
}: {
  title: string;
  accentKey: keyof typeof SECTION_ACCENTS;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fade-in"
      style={{
        marginBottom: 20,
        padding: 20,
        borderRadius: 18,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid var(--card-border)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          background: SECTION_ACCENTS[accentKey],
        }}
      />
      <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, letterSpacing: 0.3 }}>{title}</h3>
      {children}
    </div>
  );
}

function Tag({ children, accentKey }: { children: React.ReactNode; accentKey: keyof typeof SECTION_ACCENTS }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 12px",
        margin: "0 6px 6px 0",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid var(--card-border)",
        color: "#e4e2ee",
        fontSize: 12,
        position: "relative",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: SECTION_ACCENTS[accentKey],
          marginRight: 6,
        }}
      />
      {children}
    </span>
  );
}

function Empty() {
  return <p style={{ fontSize: 13, color: "#6b6879", fontStyle: "italic" }}>пока не зафолнено</p>;
}

export default function CanvasView({ canvas }: { canvas: VenomCanvas }) {
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, margin: 0, fontWeight: 800 }}>VENOM Canvas</h2>
        <p style={{ fontSize: 13, color: "#9a97ab", margin: "4px 0 0" }}>
          визуальная карта твоей стратегии, заполняется по мере диалога
        </p>
      </div>

      <Section title="\ud83c\udf1f V — Vision" accentKey="vision">
        {canvas.desiredFuture ? (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#e4e2ee" }}>{canvas.desiredFuture}</p>
        ) : (
          <Empty />
        )}
        {canvas.coreValues.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {canvas.coreValues.map((v, i) => (
              <Tag key={i} accentKey="vision">{v}</Tag>
            ))}
          </div>
        )}
      </Section>

      <Section title="\ud83d\udd0d E — Evaluation (модель OrgOS)" accentKey="evaluation">
        {Object.keys(canvas.lifeSpheres).length > 0 ? (
          <ul style={{ fontSize: 14, margin: 0, paddingLeft: 18, color: "#e4e2ee", lineHeight: 1.7 }}>
            {Object.entries(canvas.lifeSpheres).map(([k, v]) => (
              <li key={k} style={{ marginBottom: 4 }}>
                <strong style={{ color: "#67e8f9" }}>{k}:</strong> {v}
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="\u26a0\ufe0f N — Narrow gaps (стресс-тест)" accentKey="gaps">
        {canvas.stabilityGaps.length === 0 && canvas.growthGaps.length === 0 ? (
          <Empty />
        ) : (
          <>
            {canvas.stabilityGaps.map((g, i) => (
              <Tag key={`s-${i}`} accentKey="gaps">устойчивость: {g}</Tag>
            ))}
            {canvas.growthGaps.map((g, i) => (
              <Tag key={`g-${i}`} accentKey="gaps">рост: {g}</Tag>
            ))}
          </>
        )}
      </Section>

      <Section title="\ud83c\udfaf O — Objectives (архитектура изменений)" accentKey="objectives">
        {canvas.smartObjectives.length === 0 ? (
          <Empty />
        ) : (
          canvas.smartObjectives.map((o, i) => (
            <div
              key={i}
              style={{
                marginBottom: 10,
                fontSize: 14,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 700, color: "#f0abfc" }}>{o.title}</div>
              <div style={{ fontSize: 12, color: "#9a97ab", marginTop: 2 }}>
                {o.horizon} \u00b7 метрика: {o.metric} \u00b7 первый шаг: {o.first_step}
              </div>
            </div>
          ))
        )}
      </Section>

      <Section title="\u2699\ufe0f M — Management" accentKey="management">
        {canvas.managementSystem ? (
          <>
            <p style={{ fontSize: 14, color: "#e4e2ee", lineHeight: 1.6 }}>{canvas.managementSystem}</p>
            {canvas.retrospectiveCadence && (
              <p style={{ fontSize: 13, color: "#9a97ab" }}>
                \ud83d\udcc5 ретроспектива: {canvas.retrospectiveCadence}
              </p>
            )}
            {canvas.habitsToBuild.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {canvas.habitsToBuild.map((h, i) => (
                  <Tag key={i} accentKey="management">{h}</Tag>
                ))}
              </div>
            )}
          </>
        ) : (
          <Empty />
        )}
      </Section>

      {canvas.stage === "done" && (
        <div
          className="fade-in"
          style={{
            padding: 20,
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.15))",
            border: "1px solid rgba(34,197,94,0.4)",
          }}
        >
          <strong style={{ color: "#4ade80", fontSize: 16 }}>\ud83c\udf89 стратегия собрана!</strong>
          <p style={{ fontSize: 13, color: "#c9c6d8", marginTop: 8 }}>
            полный итоговый отчёт — в последнем сообщении чата слева.
          </p>
        </div>
      )}
    </div>
  );
}
