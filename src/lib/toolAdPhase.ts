/** Ad visibility for tool upload → process → result flows. */
export function isToolWorkflowAdFree(stage: string, doneStage = "done"): boolean {
  return stage !== doneStage;
}

export function showToolSidebarAd(stage: string, doneStage = "done"): boolean {
  return stage === doneStage;
}
