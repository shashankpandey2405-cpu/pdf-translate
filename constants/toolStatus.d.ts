export type ToolImplementationStatus = "live" | "coming-soon";

export const HERO_TOOL_SLUGS: readonly string[];
export const COMING_SOON_TOOL_SLUGS: readonly string[];
export const TOOL_IMPLEMENTATION_STATUS: Record<string, ToolImplementationStatus>;

export function getToolImplementationStatus(slug: string): ToolImplementationStatus;
export function isToolLive(slug: string): boolean;
export function isHeroTool(slug: string): boolean;

export type ToolGroupListing<T extends { slug: string }> = {
  category: string;
  categoryKey: string;
  items: T[];
};

export function filterLiveToolGroups<T extends { slug: string }>(
  groups: ToolGroupListing<T>[],
): ToolGroupListing<T>[];

export function filterHeroToolGroups<T extends { slug: string }>(
  groups: ToolGroupListing<T>[],
): ToolGroupListing<T>[];
