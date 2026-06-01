import type { WorkspaceSaveInput } from "@/lib/workspaceHistory/types";

type SaveFn = (input: WorkspaceSaveInput) => Promise<void>;

/** Fire-and-forget workspace save (never blocks UI). */
export function persistWorkspaceOutput(
  saveSession: SaveFn | undefined,
  input: WorkspaceSaveInput,
): void {
  if (!saveSession || typeof window === "undefined") return;
  void saveSession(input).catch((err) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[workspace] save failed", err);
    }
  });
}
