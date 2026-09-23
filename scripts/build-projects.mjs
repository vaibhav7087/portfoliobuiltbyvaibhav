import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "config/projects.json"), "utf8"));
const GITHUB_API = "https://api.github.com";
// SYNC_TOKEN is a fine-grained PAT (needed for private repos); falls back to the
// automatic GITHUB_TOKEN which covers public repos in CI.
const TOKEN = process.env.SYNC_TOKEN || process.env.GITHUB_TOKEN;
const SYNC_MODE = process.argv.includes("--sync");

function ghHeaders() {
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portfolio-builder",
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

function loadJsonSafe(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function cleanMarkdown(raw) {
  let t = raw;
  t = t.replace(/^---[\s\S]*?---\s*/, "");
  t = t.replace(/<!--[\s\S]*?-->/g, "");
  t = t.replace(/^\[!\[.*?\]\(.*?\)\]\(.*?\)\s*$/gm, "");
  t = t.replace(/^!\[.*?\]\(https?:\/\/img\.shields\.io[^\)]*\)\s*$/gm, "");
  t = t.replace(/<img[^>]*shields\.io[^>]*>/g, "");
  t = t.replace(/\p{Emoji_Presentation}+/gu, "");
  t = t.replace(/\p{Extended_Pictographic}+/gu, "");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function extractTagline(md) {
  const lines = md.split("\n");
  let pastTitle = false;
  for (const line of lines) {
    if (!pastTitle && line.startsWith("# ")) { pastTitle = true; continue; }
    if (pastTitle && line.trim() && !line.startsWith("#") && !line.startsWith("[!") && !line.startsWith("---") && !line.startsWith(">") && !line.startsWith("```")) {
      return line.replace(/\*\*/g, "").replace(/`/g, "").trim().slice(0, 160);
    }
  }
  return "";
}

function extractStackFromReadme(md) {
  const stack = [];
  const techPatterns = [
    [/fastapi/gi, "FastAPI"], [/react/gi, "React"], [/next\.?js/gi, "Next.js"],
    [/supabase/gi, "Supabase"], [/cloudflare/gi, "Cloudflare"], [/flask/gi, "Flask"],
    [/django/gi, "Django"], [/postgres/gi, "PostgreSQL"], [/mongodb/gi, "MongoDB"],
    [/tailwind/gi, "Tailwind CSS"], [/typescript/gi, "TypeScript"], [/python/gi, "Python"],
    [/node\.?js/gi, "Node.js"], [/firebase/gi, "Firebase"], [/flutter/gi, "Flutter"],
    [/groq/gi, "Groq"], [/twilio/gi, "Twilio"], [/langgraph/gi, "LangGraph"],
    [/langchain/gi, "LangChain"], [/openai/gi, "OpenAI API"], [/anthropic/gi, "Anthropic"],
    [/sqlite/gi, "SQLite"], [/redis/gi, "Redis"], [/docker/gi, "Docker"],
    [/vapi/gi, "Vapi"], [/whatsapp/gi, "WhatsApp API"],
  ];
  for (const [re, name] of techPatterns) {
    if (re.test(md) && !stack.includes(name)) stack.push(name);
  }
  return stack;
}

function prettifyName(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function titleCase(s) {
  if (s === s.toUpperCase() && s.length > 1) return s.charAt(0) + s.slice(1).toLowerCase();
  return s;
}

// Human-friendly display name from a GitHub repo name:
// "structured_learning_skill" -> "Structured Learning Skill".
function displayNameFromRepo(repoName, fallback) {
  const words = String(repoName || "").split(/[-_]+/).filter(Boolean);
  if (!words.length) return fallback;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function now() {
  return new Date().toISOString();
}

// Raw README markdown from GitHub (follows the repo default branch).
// Works unauthenticated for public repos; private repos need SYNC_TOKEN.
async function fetchReadmeRaw(repo) {  const res = await fetch(`${GITHUB_API}/repos/${repo}/readme`, {
    headers: { ...ghHeaders(), Accept: "application/vnd.github.raw" },
  });
  if (!res.ok) {
    console.log(`  ${repo}: no GitHub README (${res.status})`);
    return null;
  }
  const text = (await res.text()).trim();
  if (!text) {
    console.log(`  ${repo}: GitHub README empty`);
    return null;
  }
  console.log(`  ${repo}: GitHub README (${text.length} chars)`);
  return text;
}

// Topic-based auto-discovery (spec v2): any repo you tag with `portfolio`
// on GitHub is picked up as an experiment card on the next sync — no config
// edit needed. Manual config entries always win on conflicts.
const AUTO_TOPIC = "portfolio";
// Never auto-listed: profile README repo + repos already curated manually.
const AUTO_EXCLUDE = ["vaibhav7087", "portfoliobuiltbyvaibhav"];

async function discoverTaggedRepos(manualRepos) {
  if (!TOKEN) {
    console.log("auto-discover: no token, skipping (public fallback unavailable for /user/repos)");
    return [];
  }
  const covered = new Set(
    [...manualRepos, ...AUTO_EXCLUDE].map((r) => String(r).toLowerCase())
  );
  const found = [];
  let page = 1;
  for (;;) {
    const res = await fetch(
      `${GITHUB_API}/user/repos?per_page=100&page=${page}&affiliation=owner`,
      { headers: ghHeaders() }
    );
    if (!res.ok) {
      console.log(`auto-discover: GitHub ${res.status}, skipping`);
      return [];
    }
    const repos = await res.json();
    if (!repos.length) break;
    for (const r of repos) {
      if (r.fork || r.archived) continue;
      if (covered.has(String(r.full_name).toLowerCase())) continue;
      if (!(r.topics || []).includes(AUTO_TOPIC)) continue;
      found.push({
        slug: String(r.name).toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, ""),
        repo: r.full_name,
        status: "experiment",
        featuredRank: null,
        liveUrl: null,
        auto: true,
        // Private auto repos: listed, but Source link hidden like cureslot.
        showCodeLink: r.private ? false : undefined,
      });
      covered.add(String(r.full_name).toLowerCase());
    }
    if (repos.length < 100) break;
    page += 1;
  }
  console.log(`auto-discover: ${found.length} tagged repo(s)`);
  return found;
}

async function main() {
  // Previously synced snapshot: never throw away good data we already have.
  // Non-sync builds (local dev, Pages) only fill gaps; they never overwrite
  // real taglines/descriptions/timestamps with placeholders.
  const prevProjects = loadJsonSafe(path.join(ROOT, "src/data/projects.json"), []);
  const prevBySlug = Object.fromEntries(prevProjects.map((p) => [p.slug, p]));
  const prevReadmes = loadJsonSafe(path.join(ROOT, "src/data/project-readmes.json"), {});

  const projects = [];
  const readmes = {};

  // Merge manual config with auto-discovered tagged repos (sync mode only).
  // Manual slugs win; untagged auto entries vanish on the next sync.
  let allEntries = [...CONFIG.projects];
  if (SYNC_MODE) {
    const manualRepos = CONFIG.projects.map((e) => e.repo).filter(Boolean);
    const usedSlugs = new Set(CONFIG.projects.map((e) => e.slug));
    for (const a of await discoverTaggedRepos(manualRepos)) {
      if (!a.slug || usedSlugs.has(a.slug)) {
        console.log(`auto-discover: slug '${a.slug}' taken, skipping`);
        continue;
      }
      usedSlugs.add(a.slug);
      allEntries.push(a);
    }
  } else {
    // Non-sync builds (local dev, Pages deploys) can't discover, so carry
    // forward previously synced auto cards instead of dropping them.
    const covered = new Set(allEntries.map((e) => e.slug));
    for (const p of prevProjects) {
      if (p.auto && !covered.has(p.slug)) {
        covered.add(p.slug);
        projects.push(p);
        if (prevReadmes[p.slug]) readmes[p.slug] = prevReadmes[p.slug];
        console.log(`  ${p.slug}: carried forward (auto, from previous sync)`);
      }
    }
  }

  for (const entry of allEntries) {
    const slug = entry.slug;
    const prev = prevBySlug[slug] || {};
    const name = prettifyName(slug);
    let readmeRaw = null;
    let ghData = null;
    let tagline = entry.taglineOverride || "";
    let description = entry.descriptionOverride || "";
    let stack = Array.isArray(entry.stackOverride) && entry.stackOverride.length
      ? [...entry.stackOverride]
      : [];
    // Keep last known values unless we fetch something better.
    // Entries with no repo have no verifiable activity signal, so they get
    // no timestamp at all (rather than a fake sync-date stamp).
    let updatedAt = entry.repo ? (prev.updatedAt || null) : null;
    let repoUrl = prev.repoUrl || null;

    // 1. Read local README if available
    if (entry.localPath) {
      const readmePath = path.join(entry.localPath, "README.md");
      try {
        readmeRaw = fs.readFileSync(readmePath, "utf8");
        console.log(`  ${slug}: local README (${readmeRaw.length} chars)`);
      } catch {
        console.log(`  ${slug}: no README at ${readmePath}`);
      }
    }

    // 2. Fetch GitHub data if in sync mode
    if (SYNC_MODE && entry.repo) {
      try {
        const res = await fetch(`${GITHUB_API}/repos/${entry.repo}`, { headers: ghHeaders() });
        if (res.ok) {
          ghData = await res.json();
          updatedAt = ghData.pushed_at || updatedAt;
          repoUrl = ghData.html_url || repoUrl;
          if (!tagline) tagline = (ghData.description || "").slice(0, 160);
          console.log(`  ${slug}: GitHub sync OK (${ghData.pushed_at})`);
        } else {
          console.log(`  ${slug}: GitHub ${res.status}, keeping previous data`);
        }
      } catch (e) {
        console.log(`  ${slug}: GitHub fetch failed (${e.message}), keeping previous data`);
      }
      if (!readmeRaw) {
        try {
          readmeRaw = await fetchReadmeRaw(entry.repo);
        } catch (e) {
          console.log(`  ${slug}: GitHub README fetch failed (${e.message})`);
        }
      }
    } else if (entry.repo && !SYNC_MODE) {
      if (!repoUrl) repoUrl = `https://github.com/${entry.repo}`;
      console.log(`  ${slug}: non-sync mode, keeping previous data`);
    } else if (!entry.repo && !repoUrl) {
      repoUrl = null;
    }

    // 3. Derive display fields, preferring freshly fetched content.
    const cleaned = readmeRaw ? cleanMarkdown(readmeRaw) : "";
    if (!tagline) tagline = extractTagline(cleaned);
    if (!tagline) tagline = prev.tagline || `${name} project`;
    if (!description) description = cleaned ? cleaned.slice(0, 600) : (prev.description || "");
    if (!stack.length) stack = extractStackFromReadme(cleaned);
    if (!stack.length) stack = prev.stack || [];
    if (!updatedAt && entry.repo) updatedAt = now();

    // Private repos (orHidden code links): card shows, Source link hidden.
    if (entry.showCodeLink === false) repoUrl = null;

    // 3. Build project entry
    const project = {
      slug,
      name: entry.nameOverride || (ghData ? displayNameFromRepo(ghData.name, prev.name || name) : (prev.name || name)),
      tagline,
      description,
      status: entry.status,
      featuredRank: entry.featuredRank ?? null,
      stack,
      liveUrl: entry.liveUrl ?? prev.liveUrl ?? null,
      repoUrl,
      updatedAt,
      hasDetailPage: entry.status === "featured",
      ...(entry.auto === true ? { auto: true } : {}),
    };
    projects.push(project);

    // 4. Build readme HTML (keep previous snapshot when nothing new found)
    if (readmeRaw) {
      readmes[slug] = { html: marked.parse(cleaned), description: description.slice(0, 400) };
    } else if (prevReadmes[slug]) {
      readmes[slug] = prevReadmes[slug];
    } else {
      readmes[slug] = null;
    }
  }

  // Sort: featured by rank, then deployed, then development, then experiment
  const order = { featured: 0, deployed: 1, development: 2, experiment: 3 };
  projects.sort((a, b) => {
    if (a.status === "featured" && b.status === "featured") {
      return (a.featuredRank ?? 99) - (b.featuredRank ?? 99);
    }
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  // Write output files
  fs.writeFileSync(path.join(ROOT, "src/data/projects.json"), JSON.stringify(projects, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "src/data/project-readmes.json"), JSON.stringify(readmes, null, 2) + "\n");

  console.log(`\nBuilt ${projects.length} projects:`);
  for (const p of projects) {
    const r = readmes[p.slug] ? "README" : "no readme";
    console.log(`  ${p.status.padEnd(12)} ${p.name.padEnd(28)} ${r} ${(p.updatedAt || "no-date").slice(0, 10)}`);
  }
}

main();
