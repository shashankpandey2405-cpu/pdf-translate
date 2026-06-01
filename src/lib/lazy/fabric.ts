/** Lazy fabric — PDF editor annotation overlay only. */
let fabricPromise: Promise<typeof import("fabric")> | null = null;

export async function loadFabric() {
  if (!fabricPromise) {
    fabricPromise = import("fabric");
  }
  return fabricPromise;
}
