import { describe, expect, it } from "vitest";
import {
  GUIDE_TOOL_SLUGS,
  PILOT_GUIDE_SLUGS,
  getGuideBundle,
  getHelpLinksForTool,
  guidePathForSlug,
  faqPathForSlug,
} from "@/data/help/helpCenterRegistry";

describe("helpCenterRegistry", () => {
  it("exposes guide paths for pilot tools", () => {
    for (const slug of PILOT_GUIDE_SLUGS) {
      expect(getGuideBundle(slug)).toBeDefined();
      expect(guidePathForSlug(slug)).toBe(`/guides/${slug}`);
      expect(faqPathForSlug(slug)).toBe(`/faq/${slug}`);
    }
  });

  it("builds help links for tools", () => {
    const links = getHelpLinksForTool("merge-pdf");
    expect(links.guideHref).toBe("/guides/merge-pdf");
    expect(links.faqHref).toBe("/faq/merge-pdf");
    expect(links.toolHref).toContain("merge-pdf");
  });

  it("has bundles for all registered guide slugs", () => {
    const missing = GUIDE_TOOL_SLUGS.filter((slug) => !getGuideBundle(slug));
    expect(missing).toEqual([]);
  });
});
