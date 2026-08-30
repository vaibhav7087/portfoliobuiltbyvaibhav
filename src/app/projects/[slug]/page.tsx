import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import readmes from "@/data/project-readmes.json";
import { Updated } from "@/components/Updated";

export function generateStaticParams() {
  return projects.filter((p) => readmes[p.slug as keyof typeof readmes]).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.tagline,
    openGraph: { title: project.name, description: project.tagline },
  };
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = projects.find((p) => p.slug === slug);
  const readme = readmes[slug as keyof typeof readmes];
  if (!project || !readme) notFound();

  return (
    <div className="detail-page">
      <div className="container">
        <Link href="/#projects" className="back-link mono">
          <span>$</span> cd ~/projects
        </Link>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)" }}>{project.name}</h1>
        <div className="detail-meta mono">
          <Updated iso={project.updatedAt} />
          {project.repoUrl && (
            <a href={project.repoUrl} className="link-ext" target="_blank" rel="noopener noreferrer">
              source
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} className="link-ext" target="_blank" rel="noopener noreferrer">
              live
            </a>
          )}
        </div>

        <div className="detail-block">
          <h2>// how it works</h2>
          <div className="detail-intro">{project.description}</div>
        </div>

        <div className="readme-content detail-block" dangerouslySetInnerHTML={{ __html: readme.html }} />

        <div className="detail-block">
          <h2>// stack</h2>
          <div className="pills">
            {project.stack.map((s) => (
              <span className="pill" key={s}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
