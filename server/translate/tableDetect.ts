import type { TextBlock } from "@/server/translate/types";

/**
 * Phase 2: grid detection from aligned text blocks.
 * v1 returns empty — tables are translated per run like dense text.
 */
export function detectTableRegions(_blocks: TextBlock[]): Array<{
  pageIndex: number;
  cellBlockIds: string[][];
}> {
  return [];
}
