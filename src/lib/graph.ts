import { VenomCanvas, Stage, SmartObjective, isStageComplete } from "./types";
import { askJson, askText } from "./llm";
import {
  VISION_PROMPT,
  EVALUATION_PROMPT,
  GAPS_PROMPT,
  OBJECTIVES_PROMPT,
  MANAGEMENT_PROMPT,
  ASSEMBLY_PROMPT,
} from "./prompts";

interface StepResult {
  canvas: VenomCanvas;
  reply: string;
}

async function stepVision(canvas: VenomCanvas, userInput: string): Promise<StepResult> {
  const data = await askJson(VISION_PROMPT, userInput);
  if (data.vision10y) canvas.vision10y = data.vision10y as string;
  if (data.desiredFuture) canvas.desiredFuture = data.desiredFuture as string;
  if (Array.isArray(data.coreValues) && data.coreValues.length) canvas.coreValues = data.coreValues as string[];

  if (isStageComplete(canvas, "vision")) canvas.stage = "evaluation";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepEvaluation(canvas: VenomCanvas, userInput: string): Promise<StepResult> {
  const data = await askJson(EVALUATION_PROMPT(canvas.desiredFuture || ""), userInput);
  if (data.lifeSpheres && typeof data.lifeSpheres === "object") {
    canvas.lifeSpheres = { ...canvas.lifeSpheres, ...(data.lifeSpheres as Record<string, string>) };
  }
  if (Array.isArray(data.strengths)) canvas.strengths.push(...(data.strengths as string[]));
  if (Array.isArray(data.weaknesses)) canvas.weaknesses.push(...(data.weaknesses as string[]));
  if (data.environmentNotes) canvas.environmentNotes = data.environmentNotes as string;

  if (isStageComplete(canvas, "evaluation")) canvas.stage = "gaps";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepGaps(canvas: VenomCanvas, userInput: string): Promise<StepResult> {
  const data = await askJson(GAPS_PROMPT, userInput);
  if (Array.isArray(data.stabilityGaps)) canvas.stabilityGaps.push(...(data.stabilityGaps as string[]));
  if (Array.isArray(data.growthGaps)) canvas.growthGaps.push(...(data.growthGaps as string[]));
  if (data.rootCauses && typeof data.rootCauses === "object") {
    canvas.rootCauses = { ...canvas.rootCauses, ...(data.rootCauses as Record<string, string>) };
  }

  if (isStageComplete(canvas, "gaps")) canvas.stage = "objectives";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepObjectives(canvas: VenomCanvas, userInput: string): Promise<StepResult> {
  const data = await askJson(OBJECTIVES_PROMPT, userInput);
  if (Array.isArray(data.strategicGoals)) canvas.strategicGoals.push(...(data.strategicGoals as string[]));
  if (Array.isArray(data.smartObjectives)) {
    canvas.smartObjectives.push(...(data.smartObjectives as SmartObjective[]));
  }

  if (isStageComplete(canvas, "objectives")) canvas.stage = "management";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepManagement(canvas: VenomCanvas, userInput: string): Promise<StepResult> {
  const data = await askJson(MANAGEMENT_PROMPT, userInput);
  if (Array.isArray(data.habitsToBuild)) canvas.habitsToBuild.push(...(data.habitsToBuild as string[]));
  if (data.retrospectiveCadence) canvas.retrospectiveCadence = data.retrospectiveCadence as string;
  if (data.managementSystem) canvas.managementSystem = data.managementSystem as string;

  if (isStageComplete(canvas, "management")) canvas.stage = "assembly";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepAssembly(canvas: VenomCanvas): Promise<StepResult> {
  const report = await askText(ASSEMBLY_PROMPT(JSON.stringify(canvas)));
  canvas.stage = "done";
  return { canvas, reply: report };
}

const STEP_HANDLERS: Partial<Record<Stage, (canvas: VenomCanvas, userInput: string) => Promise<StepResult>>> = {
  vision: stepVision,
  evaluation: stepEvaluation,
  gaps: stepGaps,
  objectives: stepObjectives,
  management: stepManagement,
};

export async function advance(canvas: VenomCanvas, userInput: string): Promise<StepResult> {
  if (canvas.stage === "done") {
    return { canvas, reply: "твоя стратегия уже собрана. начни новую сессию, чтобы пройти путь снова." };
  }

  if (userInput) {
    canvas.history.push({ role: "user", content: userInput, stage: canvas.stage });
  }

  const handler = STEP_HANDLERS[canvas.stage];
  const result = handler ? await handler(canvas, userInput) : await stepAssembly(canvas);

  result.canvas.history.push({ role: "assistant", content: result.reply, stage: canvas.stage });

  if (result.canvas.stage === "assembly" && canvas.stage !== "done") {
    const assembled = await stepAssembly(result.canvas);
    assembled.canvas.history.push({ role: "assistant", content: assembled.reply, stage: "assembly" });
    return assembled;
  }

  return result;
}
