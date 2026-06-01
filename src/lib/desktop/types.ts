export type MasterToolStage = "upload" | "configure" | "processing" | "done";

export function normalizeToolStage(stage: string): MasterToolStage {
  if (stage === "ready" || stage === "arrange") return "configure";
  if (stage === "upload" || stage === "configure" || stage === "processing" || stage === "done") {
    return stage;
  }
  return "upload";
}
