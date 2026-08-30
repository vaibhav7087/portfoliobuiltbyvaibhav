import Link from "next/link";
import { Section } from "@/components/Section";
import { Updated } from "@/components/Updated";
import {
  achievements,
  education,
  experience,
  profile,
  stack,
} from "@/data/profile";
import readmes from "@/data/project-readmes.json";
import {
  deployedProjects,
  experimentProjects,
  featuredProjects,
} from "@/lib/projects";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-prompt mono">
            <span>$</span> {profile.prompt}
          </p>
          <h1>
            {profile.name}
            <span className="hero-role">
              — <em>AI Engineer</em> & Full-Stack Developer
            </span>
          </h1>
          <p className="hero-intro">{profile.intro}</p>
          <div className="hero-actions">
            <Link href="#projects" className="btn btn-primary">
              View Projects
            </Link>
            <a href={profile.resumePath} download className="btn btn-secondary mono">
              Download Resume
            </a>
          </div>
        </div>
      </section>

      <Section id="about" index="01" title="About">
        <div className="about-grid" style={{ marginTop: "8px" }}>
          <div>
            {profile.bio.map((para) => (
              <p key={para.slice(0, 24)} className="about-bio" style={{ marginBottom: "14px" }}>
                {para}
              </p>
            ))}
          </div>
          <div className="edu-list">
            <p className="section-label mono" style={{ marginBottom: "4px" }}>
              <i>&gt;</i> Education
            </p>
            {education.map((e) => (
              <div key={e.short} className="edu-row">
                <p className="edu-school">{e.short}</p>
                <p className="edu-degree mono">{e.degree}</p>
                <p className="edu-degree mono">{e.dates}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="stack" index="02" title="Tech Stack & Tools">
        <div className="stack-table" style={{ marginTop: "8px" }}>
          {stack.map((row) => (
            <div className="stack-row" key={row.category}>
              <span className={`stack-cat mono${row.lead ? " lead" : ""}`}>
                {row.lead ? "> " : ""}
                {row.category}
              </span>
              <div className="pills">
                {row.items.map((item) => (
                  <span className="pill" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="experience" index="03" title="Experience">
        <div className="timeline" style={{ marginTop: "16px" }}>
          {experience.map((job) => (
            <article className="timeline-item" key={job.company}>
              <div className="timeline-head">
                <h3 className="timeline-role">
                  {job.role} · <span className="timeline-company">{job.company}</span>
                </h3>
                <span className="timeline-date mono">{job.dates}</span>
              </div>
              <ul>
                {job.bullets.map((b) => (
                  <li key={b.slice(0, 32)}>{b}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section id="projects" index="04" title="Projects">
        <div className="proj-grid" style={{ marginTop: "16px" }}>
          {featuredProjects.map((p, i) => (
            <article className="proj-card" key={p.slug}>
              <div className="proj-card-top">
                <span className="proj-index mono">0{i + 1}</span>
                <Updated iso={p.updatedAt} />
              </div>
              <h3 className="proj-title">
                {readmes[p.slug as keyof typeof readmes] ? (
                  <Link href={`/projects/${p.slug}`} className="proj-title-link">
                    {p.name}
                  </Link>
                ) : (
                  p.name
                )}
              </h3>
              <p className="proj-desc">{p.tagline}</p>
              <div className="pills">
                {p.stack.map((s) => (
                  <span className="pill" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="proj-links">
                {readmes[p.slug as keyof typeof readmes] && (
                  <Link href={`/projects/${p.slug}`} className="link-arrow">
                    View Details
                  </Link>
                )}
                {p.repoUrl && (
                  <a href={p.repoUrl} className="link-ext" target="_blank" rel="noopener noreferrer">
                    Source
                  </a>
                )}
                {p.liveUrl && (
                  <a href={p.liveUrl} className="link-ext" target="_blank" rel="noopener noreferrer">
                    Live
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="deployed-list">
          {deployedProjects.map((p) => (
            <div className="deployed-row" key={p.slug}>
              <span className="status-dot status-live mono">
                <i /> live
              </span>
              {readmes[p.slug as keyof typeof readmes] ? (
                <Link className="deployed-name" href={`/projects/${p.slug}`}>
                  {p.name}
                </Link>
              ) : p.liveUrl ? (
                <a
                  className="deployed-name"
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.name}
                </a>
              ) : (
                <span className="deployed-name">{p.name}</span>
              )}
              <span className="deployed-desc">{p.tagline}</span>
              <Updated iso={p.updatedAt} />
            </div>
          ))}
        </div>

        <div className="empty-state mono">
          <span>$</span> in-development: no public work in progress right now. New work lands here
          automatically after each nightly sync.
        </div>

        <details className="experiments">
          <summary className="mono">experiments ({experimentProjects.length}) — smaller builds and explorations</summary>
          <div className="exp-grid">
            {experimentProjects.map((p) => (
              <article className="exp-card" key={p.slug}>
                <h4>{p.name}</h4>
                <p>{p.tagline}</p>
              </article>
            ))}
          </div>
        </details>
      </Section>

      <Section id="achievements" index="05" title="Achievements">
        <div className="badges" style={{ marginTop: "16px" }}>
          {achievements.map((a) => (
            <article className="badge-card" key={a.title}>
              <span className={`badge-result badge-${a.variant}`}>{a.result}</span>
              <h3 className="badge-title">{a.title}</h3>
              <p className="badge-sub">{a.sub}</p>
            </article>
          ))}
        </div>
      </Section>

      <footer className="footer" id="contact">
        <div className="container">
          <p className="footer-kicker mono">
            <span style={{ color: "var(--accent)" }}>$</span> contact --one-click
          </p>
          <a className="footer-email" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <div className="footer-links mono">
            <a href={profile.github} target="_blank" rel="noopener noreferrer">
              github
            </a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
              linkedin
            </a>
            <a href={profile.companySite} target="_blank" rel="noopener noreferrer">
              eldeasolutions.com
            </a>
            <a href={profile.resumePath} download>
              ./resume.pdf
            </a>
          </div>
          <div className="footer-base">
            <span>© 2026 Vaibhav Kadam</span>
            <span className="mono">static site · nightly github sync · cloudflare pages</span>
          </div>
        </div>
      </footer>
    </>
  );
}
