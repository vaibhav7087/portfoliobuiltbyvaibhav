import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";
import { projects } from "@/lib/projects";
import readmesJson from "@/data/project-readmes.json";

export const dynamic = "force-static";

type ReadmeEntry = { html: string; description?: string } | null;
const readmeMap = readmesJson as Record<string, ReadmeEntry>;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = profile.siteUrl;
  // Home plus one entry per README-backed detail page — derived from data,
  // so newly synced repos appear here with zero code changes.
  return [
    { url: base, lastModified: new Date() },
    ...projects
      .filter((p) => readmeMap[p.slug]?.html)
      .map((p) => ({
        url: `${base}/projects/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      })),
  ];
}
