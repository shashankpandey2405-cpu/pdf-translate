import type { PageInfo } from "../types";

/**
 * Page management operations.
 */

export function rotatePageInfo(page: PageInfo, degrees: number): PageInfo {
  return {
    ...page,
    rotation: (page.rotation + degrees) % 360,
  };
}

export function getPageThumbnail(
  file: File,
  pageNumber: number,
  scale: number = 0.3
): Promise<string> {
  void pageNumber;
  void scale;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // This is a placeholder - actual thumbnail rendering
      // would use pdfjs-dist to render the page to a canvas
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
}
