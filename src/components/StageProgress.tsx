import { Stage } from "@/lib/types";

interface Props {
  stages: Stage[];
  current: Stage;
  labels: Record<Stage, string>;
}

export default function StageProgress({ stages, current, labels }: Props) {
  const visibleStages = stages.filter((s) => s !== "done");
  const currentIndex = visibleStages.indexOf(current);

  return (
    <div style={{ padding: "12px 20px", borderBottom: "1px solid #23262f" }}>
      {visibleStages.map((s, i) => {
        const isDone = i < currentIndex || current === "done";
        const isActive = s === current;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isDone ? "#2fbf71" : isActive ? "#2c5cf0" : "#3a3d47",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: isActive ? "#e8e8ec" : "#6b6e78",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {labels[s]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
