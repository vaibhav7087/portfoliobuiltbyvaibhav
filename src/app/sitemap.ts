import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = profile.siteUrl;
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/projects/cureslot`, lastModified: new Date() },
    { url: `${base}/projects/curago`, lastModified: new Date() },
  ];
}
