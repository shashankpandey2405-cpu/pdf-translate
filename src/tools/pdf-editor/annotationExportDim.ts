import type { Annotation, CanvasDim, ImageAnnotation } from "./logic";

/**
 * Fabric commits strip custom fields. Keep each signature/image aligned with the
 * canvas↔PDF scale snapshot for the page where it was placed or last edited.
 */
export function mergeAnnotationsPreservingImageExportDim(
  prev: Annotation[],
  next: Annotation[],
  editedPageIndex: number,
  dimForEditedPage: CanvasDim | undefined,
): Annotation[] {
  const prevMeta = new Map(
    prev.filter((a): a is ImageAnnotation => a.type === "image").map((a) => [a.id, a.exportDim]),
  );
  return next.map((a) => {
    if (a.type !== "image") return a;
    const dim =
      a.page === editedPageIndex && dimForEditedPage ? dimForEditedPage : prevMeta.get(a.id);
    return dim ? { ...a, exportDim: dim } : a;
  });
}
