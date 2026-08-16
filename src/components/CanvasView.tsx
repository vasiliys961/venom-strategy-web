import { VenomCanvas } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: "#161821", border: "1px solid #23262f" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#8fb2ff" }}>{title}</h3>
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        margin: "0 6px 6px 0",
        borderRadius: 999,
        background: "#1c2333",
        color: "#c7d4ff",
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}

export default function CanvasView({ canvas }: { canvas: VenomCanvas }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>VENOM Canvas</h2>

      <Section title="V — Vision">
        {canvas.desiredFuture ? (
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>{canvas.desiredFuture}</p>
        ) : (
          <p style={{ fontSize: 13, color: "#6b6e78" }}>Пока не зафолнено</p>
        )}
        {canvas.coreValues.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {canvas.coreValues.map((v, i) => (
              <Tag key={i}>{v}</Tag>
            ))}
          </div>
        )}
      </Section>

      <Section title="E — Evaluation (модель OrgOS)">
        {Object.keys(canvas.lifeSpheres).length > 0 ? (
          <ul style={{ fontSize: 14, margin: 0, paddingLeft: 18 }}>
            {Object.entries(canvas.lifeSpheres).map(([k, v]) => (
              <li key={k} style={{ marginBottom: 4 }}>
                <strong>{k}:</strong> {v}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: 13, color: "#6b6e78" }}>Пока не зафолнено</p>
        )}
      </Section>

      <Section title="N — Narrow gaps (стресс-тест)">
        {canvas.stabilityGaps.length === 0 && canvas.growthGaps.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6b6e78" }}>Пока не зафолнено</p>
        ) : (
          <>
            {canvas.stabilityGaps.map((g, i) => (
              <Tag key={`s-${i}`}>устойчивость: {g}</Tag>
            ))}
            {canvas.growthGaps.map((g, i) => (
              <Tag key={`g-${i}`}>рост: {g}</Tag>
            ))}
          </>
        )}
      </Section>

      <Section title="O — Objectives (архитектура изменений)">
        {canvas.smartObjectives.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6b6e78" }}>Пока не зафолнено</p>
        ) : (
          canvas.smartObjectives.map((o, i) => (
            <div key={i} style={{ marginBottom: 10, fontSize: 14 }}>
              <div style={{ fontWeight: 600 }}>{o.title}</div>
              <div style={{ fontSize: 12, color: "#9a9aa5" }}>
                {o.horizon} · метрика: {o.metric} · первый шаг: {o.first_step}
              </div>
            </div>
          ))
        )}
      </Section>

      <Section title="M — Management">
        {canvas.managementSystem ? (
          <>
            <p style={{ fontSize: 14 }}>{canvas.managementSystem}</p>
            {canvas.retrospectiveCadence && (
              <p style={{ fontSize: 13, color: "#9a9aa5" }}>Ретроспектива: {canvas.retrospectiveCadence}</p>
            )}
            {canvas.habitsToBuild.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {canvas.habitsToBuild.map((h, i) => (
                  <Tag key={i}>{h}</Tag>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: "#6b6e78" }}>Пока не зафолнено</p>
        )}
      </Section>

      {canvas.stage === "done" && (
        <div style={{ padding: 16, borderRadius: 12, background: "#123322", border: "1px solid #2fbf71" }}>
          <strong style={{ color: "#2fbf71" }}>Стратегия собрана!</strong>
          <p style={{ fontSize: 13, color: "#9a9aa5", marginTop: 6 }}>
            Полный итоговый отчёт — в последнем сообщении чата слева.
          </p>
        </div>
      )}
    </div>
  );
}
