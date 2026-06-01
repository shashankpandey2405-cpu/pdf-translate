/** Lazy-load xlsx (~1MB+) only when spreadsheet tools run. */
let xlsxPromise: Promise<typeof import("xlsx")> | null = null;

export async function loadXlsx() {
  if (!xlsxPromise) {
    xlsxPromise = import("xlsx");
  }
  return xlsxPromise;
}
