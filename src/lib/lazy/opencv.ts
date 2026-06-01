/** Lazy OpenCV WASM — AI scanner perspective/enhance pipeline only. */
let opencvPromise: Promise<typeof import("@techstark/opencv-js")> | null = null;

export async function loadOpenCv() {
  if (!opencvPromise) {
    opencvPromise = import("@techstark/opencv-js");
  }
  return opencvPromise;
}
