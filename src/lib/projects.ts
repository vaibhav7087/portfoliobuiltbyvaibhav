import projectsData from "@/data/projects.json";

export type ProjectStatus = "featured" | "deployed" | "development" | "experiment";

export interface Project {
  slug: string;
  repo: string | null;
  name: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  featuredRank: number | null;
  stack: string[];
  liveUrl: string | null;
  repoUrl: string | null;
  updatedAt: string;
  hasDetailPage: boolean;
}

export const projects: Project[] = projectsData as Project[];

export const featuredProjects = projects
  .filter((p) => p.status === "featured")
  .sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99));

export const deployedProjects = projects.filter((p) => p.status === "deployed");

export const experimentProjects = projects.filter((p) => p.status === "experiment");

export function formatDate(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return then.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
