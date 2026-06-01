export const CATEGORY_ICONS: Record<string, string>;
export const FEATURED_HOME_TOOL_SLUGS: string[];
export const TRUST_FEATURE_KEYS: string[];
export const LANGUAGES: { code: string; label: string }[];
export const TOOL_GROUPS: {
  categoryKey: string;
  items: {
    slug: string;
    accept: string;
    multiple: boolean;
    routePath?: string;
    processor: "passthrough" | "conversion" | "custom";
    maxFilesGuest: number;
    maxFilesAuthed: number;
    maxSizeMbGuest: number;
    maxSizeMbAuthed: number;
  }[];
}[];
export const RESOURCE_LINKS: { label: string; href: string }[];

type Translator = (key: string, options?: Record<string, unknown>) => string;

export type ToolItem = {
  label: string;
  slug: string;
  desc: string;
  accept: string;
  multiple: boolean;
  routePath?: string;
  processor: "passthrough" | "conversion" | "custom";
  maxFilesGuest: number;
  maxFilesAuthed: number;
  maxSizeMbGuest: number;
  maxSizeMbAuthed: number;
};
export type ToolGroup = {
  category: string;
  categoryKey: string;
  items: ToolItem[];
};
export function getToolGroups(t: Translator): ToolGroup[];
export function getToolGroupsBySlug(t: Translator): Record<string, ToolItem & { category: string }>;
export function findToolBySlug(slug: string, t: Translator): (ToolItem & { category: string; categoryKey: string }) | null;
export function getSecurityBadgeText(t: Translator): string;
export function getResourceLinks(t: Translator): { label: string; href: string }[];
export function getToolHref(tool: { slug: string; routePath?: string }): string;
export const TOOL_GROUPS_BY_SLUG: Record<
  string,
  {
    slug: string;
    accept: string;
    multiple: boolean;
    categoryKey: string;
    routePath?: string;
    processor: "passthrough" | "conversion" | "custom";
    maxFilesGuest: number;
    maxFilesAuthed: number;
    maxSizeMbGuest: number;
    maxSizeMbAuthed: number;
  }
>;
