// Repeatable QA crawl for the static portfolio export.
// Derives routes from src/data so future repos are covered automatically.
// Usage: npm run qa   (spawns its own server + chromium, prints /10 score)
// Exit 0 when score >= 9.5, else 1.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { startServer } from "./serve.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.QA_PORT || 4173);
const BASE = `http://127.0.0.1:${PORT}`;
const PASS_MARK = 9.5;

const projects = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/projects.json"), "utf8"));
const readmes = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/project-readmes.json"), "utf8"));
const hasReadme = (slug) => !!readmes[slug]?.html;

const detailSlugs = projects.filter((p) => hasReadme(p.slug)).map((p) => p.slug);
const pageRoutes = ["/", ...detailSlugs.map((s) => `/projects/${s}`)];
const fileRoutes = ["/sitemap.xml", "/robots.txt", "/resume.pdf"];

const results = []; // {category, name, pass, detail}
function check(category, name, pass, detail = "") {
  results.push({ category, name, pass: !!pass, detail });
}

function prettify(slug) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function fetchStatus(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    await r.arrayBuffer().catch(() => null);
    return r.status;
  } catch (e) {
    return `ERR:${String(e.cause?.code || e.message).slice(0, 60)}`;
  } finally {
    clearTimeout(t);
  }
}

const { server } = await startServer(PORT);
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`${page.url()} :: ${m.text().slice(0, 160)}`); });
page.on("pageerror", (e) => consoleErrors.push(`${page.url()} :: PAGEERROR ${String(e).slice(0, 160)}`));

const internalHrefs = new Set();
const externalHrefs = new Set();
const timings = {};

// ---- 1. Crawl pages ----
for (const route of pageRoutes) {
  const url = BASE + route;
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null);
  timings[route] = Date.now() - t0;
  check("availability", `GET ${route}`, resp?.status() === 200, `status=${resp?.status()}`);
  if (!resp || resp.status() !== 200) continue;

  const title = await page.title();
  check("seo", `title ${route}`, title.length > 5, title.slice(0, 80));
  const desc = await page.getAttribute('meta[name="description"]', "content").catch(() => null);
  check("seo", `meta description ${route}`, !!desc && desc.length > 10, (desc || "").slice(0, 60));
  const og = await page.getAttribute('meta[property="og:title"]', "content").catch(() => null);
  check("seo", `og:title ${route}`, !!og, (og || "").slice(0, 60));

  const h1Count = await page.locator("h1").count();
  check("a11y", `single h1 ${route}`, h1Count === 1, `h1=${h1Count}`);
  const lang = await page.getAttribute("html", "lang").catch(() => null);
  check("a11y", `html lang ${route}`, !!lang, String(lang));
  const imgsWithoutAlt = await page.evaluate(() =>
    [...document.images].filter((i) => !i.hasAttribute("alt")).length);
  check("a11y", `img alt ${route}`, imgsWithoutAlt === 0, `missing=${imgsWithoutAlt}`);

  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") || ""));
  for (const h of hrefs) {
    if (!h || h.startsWith("#") || h.startsWith("mailto:") || h.startsWith("tel:")) continue;
    if (h.startsWith("http")) externalHrefs.add(h);
    else internalHrefs.add(h.split("?")[0].split("#")[0] || "/");
  }

  if (route.startsWith("/projects/")) {
    const slug = route.split("/").pop();
    const body = await page.locator(".readme-content").first().innerText().catch(() => "");
    check("detail", `${slug} readme renders`, body.length > 300, `chars=${body.length}`);
    const heads = await page.locator(".readme-content h1, .readme-content h2, .readme-content ul, .readme-content pre").count();
    check("detail", `${slug} readme structure`, heads > 0, `elements=${heads}`);
    check("detail", `${slug} no raw fences`, !body.includes("```"), body.includes("```") ? "leaked ```" : "");
  }
}

// ---- 2. Home honesty checks (data-driven) ----
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" }).catch(() => null);
for (const p of projects) {
  const fallback = `${prettify(p.slug)} project`;
  if (p.tagline === fallback) {
    check("honesty", `${p.slug} tagline`, false, `placeholder "${fallback}"`);
  }
}
check("honesty", "no placeholder taglines", !results.some((r) => r.category === "honesty" && !r.pass));
const datedCount = projects.filter((p) => p.updatedAt).length;
const updatedMentions = (await page.content()).split("updated").length - 1;
check("honesty", "updated badges match dated projects",
  updatedMentions >= datedCount, `badges~${updatedMentions} dated=${datedCount}`);
// detail link mapping
const homeHtml = await page.content();
let mappingOk = true;
for (const p of projects) {
  const linked = homeHtml.includes(`/projects/${p.slug}`);
  if (!!linked !== hasReadme(p.slug)) {
    mappingOk = false;
    check("honesty", `detail-link mapping ${p.slug}`, false, `linked=${linked} readme=${hasReadme(p.slug)}`);
  }
}
if (mappingOk) check("honesty", "detail-link mapping all", true, `${detailSlugs.length} pages`);

// ---- 3. Static files + sitemap completeness ----
for (const f of fileRoutes) {
  const st = await fetchStatus(BASE + f);
  check("availability", `GET ${f}`, st === 200, `status=${st}`);
}
const sm = await (await fetch(BASE + "/sitemap.xml")).text().catch(() => "");
for (const s of detailSlugs) {
  check("seo", `sitemap has /projects/${s}`, sm.includes(`/projects/${s}`), "");
}

// ---- 4. Link graph ----
for (const h of internalHrefs) {
  const st = await fetchStatus(BASE + (h.startsWith("/") ? h : `/${h}`));
  check("links", `internal ${h}`, st === 200, `status=${st}`);
}
for (const h of externalHrefs) {
  const st = await fetchStatus(h);
  // 403/999 = anti-bot walls (LinkedIn, Cloudflare signup, faucets): they
  // load fine in real browsers, so count as pass with a note, not failure.
  const botWalled = st === 403 || st === 999;
  check("links", `external ${h}`, (typeof st === "number" && st < 400) || botWalled,
    `status=${st}${botWalled ? " (anti-bot, browser-ok)" : ""}`);
}

// ---- 5. Console + perf ----
check("console", "zero console/page errors", consoleErrors.length === 0,
  consoleErrors.length ? consoleErrors.slice(0, 5).join(" | ") : "clean");
for (const [r, ms] of Object.entries(timings)) {
  check("perf", `load ${r}`, ms < 3000, `${ms}ms`);
}

// ---- Score ----
const WEIGHTS = { availability: 20, honesty: 20, detail: 15, links: 15, console: 10, seo: 10, a11y: 5, perf: 5 };
const byCat = {};
for (const r of results) (byCat[r.category] ||= []).push(r);
let total = 0;
console.log("\n=== QA REPORT ===");
for (const [cat, w] of Object.entries(WEIGHTS)) {
  const arr = byCat[cat] || [];
  const passed = arr.filter((r) => r.pass).length;
  const rate = arr.length ? passed / arr.length : 1;
  total += rate * w;
  console.log(`${cat.padEnd(12)} ${passed}/${arr.length}  (${(rate * 10).toFixed(1)}/10 x${w}%)`);
  for (const r of arr.filter((r) => !r.pass)) console.log(`   FAIL ${r.name} :: ${r.detail}`);
}
const score = total / 10;
console.log(`\nSCORE: ${score.toFixed(2)} / 10  (bar: ${PASS_MARK})`);
await browser.close();
server.close();
process.exit(score >= PASS_MARK ? 0 : 1);
