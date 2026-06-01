/** Infer MIME type for enhanced cloud uploads when the browser omits file.type. */
export function inferUploadContentType(file: File): string {
  const declared = file.type?.split(";")[0]?.trim().toLowerCase();
  if (declared && declared !== "application/octet-stream") return declared;

  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (name.endsWith(".doc")) return "application/msword";
  if (name.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (name.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  return "application/pdf";
}

export function inferContentTypeFromFilename(filename: string): string {
  return inferUploadContentType({ name: filename, type: "" } as File);
}
