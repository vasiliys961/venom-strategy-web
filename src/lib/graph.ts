import { VenomCanvas, Stage, SmartObjective, isStageComplete } from "./types";
import { askJson, askText } from "./llm";
import { retrieveFromBook } from "./bookRag";
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

async function stepVision(canvas: VenomCanvas, userInput: string, bookContext?: string): Promise<StepResult> {
  const data = await askJson(VISION_PROMPT(bookContext), userInput);
  if (data.vision10y) canvas.vision10y = data.vision10y as string;
  if (data.desiredFuture) canvas.desiredFuture = data.desiredFuture as string;
  if (Array.isArray(data.coreValues) && data.coreValues.length) canvas.coreValues = data.coreValues as string[];
  if (isStageComplete(canvas, "vision")) canvas.stage = "evaluation";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepEvaluation(canvas: VenomCanvas, userInput: string, bookContext?: string): Promise<StepResult> {
  const data = await askJson(EVALUATION_PROMPT(canvas.desiredFuture || "", bookContext), userInput);
  if (data.lifeSpheres && typeof data.lifeSpheres === "object") {
    canvas.lifeSpheres = { ...canvas.lifeSpheres, ...(data.lifeSpheres as Record<string, string>) };
  }
  if (Array.isArray(data.strengths)) canvas.strengths.push(...(data.strengths as string[]));
  if (Array.isArray(data.weaknesses)) canvas.weaknesses.push(...(data.weaknesses as string[]));
  if (data.environmentNotes) canvas.environmentNotes = data.environmentNotes as string;
  if (isStageComplete(canvas, "evaluation")) canvas.stage = "gaps";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepGaps(canvas: VenomCanvas, userInput: string, bookContext?: string): Promise<StepResult> {
  const data = await askJson(GAPS_PROMPT(bookContext), userInput);
  if (Array.isArray(data.stabilityGaps)) canvas.stabilityGaps.push(...(data.stabilityGaps as string[]));
  if (Array.isArray(data.growthGaps)) canvas.growthGaps.push(...(data.growthGaps as string[]));
  if (data.rootCauses && typeof data.rootCauses === "object") {
    canvas.rootCauses = { ...canvas.rootCauses, ...(data.rootCauses as Record<string, string>) };
  }
  if (isStageComplete(canvas, "gaps")) canvas.stage = "objectives";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepObjectives(canvas: VenomCanvas, userInput: string, bookContext?: string): Promise<StepResult> {
  const data = await askJson(OBJECTIVES_PROMPT(bookContext), userInput);
  if (Array.isArray(data.strategicGoals)) canvas.strategicGoals.push(...(data.strategicGoals as string[]));
  if (Array.isArray(data.smartObjectives)) {
    canvas.smartObjectives.push(...(data.smartObjectives as SmartObjective[]));
  }
  if (isStageComplete(canvas, "objectives")) canvas.stage = "management";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepManagement(canvas: VenomCanvas, userInput: string, bookContext?: string): Promise<StepResult> {
  const data = await askJson(MANAGEMENT_PROMPT(bookContext), userInput);
  if (Array.isArray(data.habitsToBuild)) canvas.habitsToBuild.push(...(data.habitsToBuild as string[]));
  if (data.retrospectiveCadence) canvas.retrospectiveCadence = data.retrospectiveCadence as string;
  if (data.managementSystem) canvas.managementSystem = data.managementSystem as string;
  if (isStageComplete(canvas, "management")) canvas.stage = "assembly";
  return { canvas, reply: (data.reply as string) || "" };
}

async function stepAssembly(canvas: VenomCanvas, bookContext?: string): Promise<StepResult> {
  const report = await askText(ASSEMBLY_PROMPT(JSON.stringify(canvas), bookContext));
  canvas.stage = "done";
  return { canvas, reply: report };
}

const STEP_HANDLERS: Partial<
  Record<Stage, (canvas: VenomCanvas, userInput: string, bookContext?: string) => Promise<StepResult>>
> = {
  vision: stepVision,
  evaluation: stepEvaluation,
  gaps: stepGaps,
  objectives: stepObjectives,
  management: stepManagement,
};

function wasNotDone(stage: Stage): boolean {
  const s: string = stage;
  return s !== "done";
}

export async function advance(canvas: VenomCanvas, userInput: string, sessionId?: string): Promise<StepResult> {
  const initialStage: Stage = canvas.stage;

  if (initialStage === "done") {
    return { canvas, reply: "твоя стратегия уже собрана. начни новую сессию, чтобы пройти путь снова." };
  }

  if (userInput) {
    canvas.history.push({ role: "user", content: userInput, stage: canvas.stage });
  }

  let bookContext: string | undefined;
  if (sessionId && userInput) {
    try {
      const ctx = await retrieveFromBook(sessionId, userInput);
      bookContext = ctx || undefined;
    } catch (err) {
      console.error("book search failed, continuing without book context", err);
    }
  }

  const handler = STEP_HANDLERS[initialStage];
  const result = handler
    ? await handler(canvas, userInput, bookContext)
    : await stepAssembly(canvas, bookContext);
  result.canvas.history.push({ role: "assistant", content: result.reply, stage: initialStage });

  const stageAfterStep: Stage = result.canvas.stage;
  if (stageAfterStep === "assembly" && wasNotDone(initialStage)) {
    const assembled = await stepAssembly(result.canvas, bookContext);
    assembled.canvas.history.push({ role: "assistant", content: assembled.reply, stage: "assembly" });
    return assembled;
  }

  return result;
}
