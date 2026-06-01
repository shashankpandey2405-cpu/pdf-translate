import type { Metadata } from "next";
import { BRAND_NAME, SITE_URL } from "@/lib/seo/site";

const OG_IMAGE = `${SITE_URL}/icon-512.png`;

/** Shared Open Graph + Twitter card fields for consistent social previews. */
export function withSocialImages(
  title: string,
  description: string,
  url: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND_NAME,
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 512,
          height: 512,
          alt: `${BRAND_NAME} — AI PDF tools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
