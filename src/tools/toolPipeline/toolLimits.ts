import { TOOL_GROUPS_BY_SLUG } from "../../../constants/tools";

export type ToolLimitConfig = {
  maxFilesGuest: number;
  maxFilesAuthed: number;
  maxSizeMbGuest: number;
  maxSizeMbAuthed: number;
};

/** Lightweight limits lookup — avoids importing conversion handlers (xlsx, etc.). */
export function getToolLimitConfig(slug: string): ToolLimitConfig | null {
  const config = (TOOL_GROUPS_BY_SLUG as Record<string, ToolLimitConfig | undefined>)[slug];
  if (!config) return null;
  return {
    maxFilesGuest: config.maxFilesGuest,
    maxFilesAuthed: config.maxFilesAuthed,
    maxSizeMbGuest: config.maxSizeMbGuest,
    maxSizeMbAuthed: config.maxSizeMbAuthed,
  };
}
