import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "config/projects.json"), "utf8"));
const GITHUB_API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN;
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

function now() {
  return new Date().toISOString();
}

async function main() {
  const projects = [];
  const readmes = {};

  for (const entry of CONFIG.projects) {
    const slug = entry.slug;
    const name = prettifyName(slug);
    let readmeRaw = null;
    let ghData = null;
    let tagline = "";
    let description = "";
    let stack = entry.stackOverride || [];
    let updatedAt = now();
    let repoUrl = entry.repo ? `https://github.com/${entry.repo}` : null;

    // 1. Read local README if available
    if (entry.localPath) {
      const readmePath = path.join(entry.localPath, "README.md");
      try {
        readmeRaw = fs.readFileSync(readmePath, "utf8");
        const cleaned = cleanMarkdown(readmeRaw);
        tagline = extractTagline(cleaned);
        description = cleaned.slice(0, 600);
        if (!stack.length) stack = extractStackFromReadme(cleaned);
        console.log(`  ${slug}: local README (${cleaned.length} chars)`);
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
          updatedAt = ghData.pushed_at;
          repoUrl = ghData.html_url;
          if (!tagline) tagline = (ghData.description || "").slice(0, 160);
          console.log(`  ${slug}: GitHub sync OK (${ghData.pushed_at})`);
        } else {
          console.log(`  ${slug}: GitHub ${res.status}, using local data`);
        }
      } catch (e) {
        console.log(`  ${slug}: GitHub fetch failed (${e.message})`);
      }
    } else if (entry.repo) {
      // Non-sync mode: try to get pushed_at from existing data
      console.log(`  ${slug}: non-sync mode, keeping existing timestamps`);
    }

    // 3. Build project entry
    const project = {
      slug,
      name: ghData ? titleCase(ghData.name) : name,
      tagline: tagline || description.slice(0, 160) || `${name} project`,
      description: description || tagline || "",
      status: entry.status,
      featuredRank: entry.featuredRank ?? null,
      stack,
      liveUrl: entry.liveUrl,
      repoUrl,
      updatedAt,
    };
    projects.push(project);

    // 4. Build readme HTML
    if (readmeRaw) {
      const cleaned = cleanMarkdown(readmeRaw);
      readmes[slug] = { html: marked.parse(cleaned), description: description.slice(0, 400) };
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
    console.log(`  ${p.status.padEnd(12)} ${p.name.padEnd(28)} ${r}`);
  }
}

main();
