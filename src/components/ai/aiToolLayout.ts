/** Shared desktop split layout for AI tools — chat column matches preview column height. */

export const aiToolDesktopRoot =
  "hidden h-[calc(100dvh-4rem)] w-full overflow-hidden lg:flex";

export const aiToolDesktopRow = "flex min-h-0 flex-1 flex-col lg:flex-row";

export const aiToolPreviewColumn =
  "flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-muted/20 lg:max-w-[45%] lg:border-r";

export const aiToolPreviewColumnNarrow =
  "flex min-h-0 w-full flex-col overflow-y-auto border-border bg-muted/20 lg:w-[340px] lg:shrink-0 lg:border-r";

export const aiToolChatColumn = "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

export const aiToolChatFill = "flex min-h-0 flex-1 flex-col p-4 lg:p-6";

export const aiToolChatPanelClass = "h-full min-h-0 w-full";
