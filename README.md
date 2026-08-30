# Portfolio — builtbyvaibhav.bylance.in

CLI-themed static portfolio. Next.js (App Router) static export, deployed on Cloudflare Pages.
All project data is driven by a single config file — no hardcoded project entries.

## Architecture
```
config/projects.json          <- THE source of truth (status, paths, repo URLs)
        |
        v
scripts/build-projects.mjs    <- reads config + local READMEs + GitHub API
        |
        v
src/data/projects.json        <- generated: project metadata
src/data/project-readmes.json <- generated: rendered README HTML
        |
        v
next build                    <- reads generated files, outputs static HTML
```

## Commands
```bash
npm run dev        # local dev
npm run prebuild   # regenerate project data from config
npm run build      # prebuild + static export to out/
npm run sync       # build with GitHub API (--sync flag, needs GITHUB_TOKEN)
```

## Adding a project
1. Add an entry to `config/projects.json`:
```json
{
  "slug": "my-project",
  "localPath": "/path/to/project",
  "repo": "owner/repo",          // optional, for GitHub sync
  "status": "development",       // featured | deployed | development | experiment
  "liveUrl": null,
  "stackOverride": ["React", "Node.js"]  // optional, overrides auto-detection
}
```
2. Run `npm run prebuild` — it reads the README and generates the data files
3. Run `npm run build` — detail page appears at `/projects/my-project`

## Status values
- **featured** — top projects, largest cards, ranked by `featuredRank`
- **deployed** — live at a URL, shown with green dot
- **development** — work in progress, honest framing
- **experiment** — smaller builds, collapsible section

## Nightly sync
`.github/workflows/nightly-project-sync.yml` runs at 15:30 UTC daily with `--sync` flag,
fetching latest `pushed_at` timestamps and descriptions from GitHub. Local README content
always wins over GitHub descriptions for tagline/copy.

## Cloudflare Pages
- Build command: `npm run build`
- Output directory: `out`
- Custom domain: `builtbyvaibhav.bylance.in`

## Placeholders to replace
- `public/og-image.png` — placeholder OG image
- `public/resume.pdf` — placeholder v0.1

Full spec: see `../portfolio-spec.md`.
