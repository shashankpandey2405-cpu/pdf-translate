import { useRoute } from "wouter";

function resolveNestedToolsSlug(toolSlug: string | undefined): string {
  return toolSlug ? `tools/${toolSlug}` : "";
}

export function useGuideSlug(): string {
  const [nestedMatch, nested] = useRoute("/guides/tools/:toolSlug");
  const [flatMatch, flat] = useRoute("/guides/:slug");
  if (nestedMatch && nested?.toolSlug) return resolveNestedToolsSlug(nested.toolSlug);
  if (flatMatch && flat?.slug) return flat.slug;
  return "";
}

export function useFaqSlug(): string {
  const [nestedMatch, nested] = useRoute("/faq/tools/:toolSlug");
  const [flatMatch, flat] = useRoute("/faq/:slug");
  if (nestedMatch && nested?.toolSlug) return resolveNestedToolsSlug(nested.toolSlug);
  if (flatMatch && flat?.slug) return flat.slug;
  return "";
}
