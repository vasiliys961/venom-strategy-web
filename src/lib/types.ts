export type Stage =
  | "vision"
  | "evaluation"
  | "gaps"
  | "objectives"
  | "management"
  | "assembly"
  | "done";

export interface SmartObjective {
  title: string;
  horizon: string;
  metric: string;
  first_step: string;
}

export interface VenomCanvas {
  sessionId: string;
  stage: Stage;

  vision10y?: string;
  desiredFuture?: string;
  coreValues: string[];

  lifeSpheres: Record<string, string>;
  strengths: string[];
  weaknesses: string[];
  environmentNotes?: string;

  stabilityGaps: string[];
  growthGaps: string[];
  rootCauses: Record<string, string>;

  strategicGoals: string[];
  smartObjectives: SmartObjective[];

  habitsToBuild: string[];
  retrospectiveCadence?: string;
  managementSystem?: string;

  history: { role: "user" | "assistant"; content: string; stage: Stage }[];
}

export function emptyCanvas(sessionId: string): VenomCanvas {
  return {
    sessionId,
    stage: "vision",
    coreValues: [],
    lifeSpheres: {},
    strengths: [],
    weaknesses: [],
    stabilityGaps: [],
    growthGaps: [],
    rootCauses: {},
    strategicGoals: [],
    smartObjectives: [],
    habitsToBuild: [],
    history: [],
  };
}

export function isStageComplete(canvas: VenomCanvas, stage: Stage): boolean {
  switch (stage) {
    case "vision":
      return Boolean(canvas.vision10y && canvas.desiredFuture);
    case "evaluation":
      return (
        Object.keys(canvas.lifeSpheres).length > 0 &&
        (canvas.strengths.length > 0 || canvas.weaknesses.length > 0)
      );
    case "gaps":
      return canvas.stabilityGaps.length > 0 || canvas.growthGaps.length > 0;
    case "objectives":
      return canvas.smartObjectives.length > 0;
    case "management":
      return Boolean(canvas.managementSystem);
    default:
      return true;
  }
}

export const STAGE_ORDER: Stage[] = [
  "vision",
  "evaluation",
  "gaps",
  "objectives",
  "management",
  "assembly",
  "done",
];

export const STAGE_LABELS: Record<Stage, string> = {
  vision: "Vision — образ будущего",
  evaluation: "Evaluation — анализ текущего",
  gaps: "Narrow gaps — разрывы",
  objectives: "Objectives — цели",
  management: "Management — управление",
  assembly: "Assembly — сборка",
  done: "Готово",
};
