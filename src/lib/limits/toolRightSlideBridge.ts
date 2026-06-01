import type { ToolRightSlidePayload } from "@/context/ToolRightSlideContext";

let openSlideImpl: ((payload: ToolRightSlidePayload) => void) | null = null;

export function registerToolRightSlideOpener(fn: (payload: ToolRightSlidePayload) => void) {
  openSlideImpl = fn;
}

export function openToolRightSlide(payload: ToolRightSlidePayload) {
  openSlideImpl?.(payload);
}
