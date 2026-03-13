# SciMinds Lab Website

Website for the Social Computations & Interacting Minds Research Studio at UC San Diego.  
Built using SvelteKit and styled with Tailwind CSS.

## Project Structure

```
sciminds.github.io/
├── src/
│   ├── routes/              # 📄 Website pages (edit these for content)
│   │   ├── +page.svx        #    Homepage
│   │   ├── +layout.svelte   #    Site-wide layout (nav, footer)
│   │   ├── team/            #    Team page
│   │   ├── focus/           #    Research focus page
│   │   ├── build/           #    Tools/software page
│   │   ├── read/            #    Publications page
│   │   ├── learn/           #    Education page
│   │   └── connect/         #    Contact/openings page
│   │
│   ├── lib/
│   │   ├── components/      # 🧩 Reusable UI components
│   │   ├── layouts/         #    Page layout templates
│   │   └── assets/          #    Images, fonts, icons
│   │
│   ├── app.css              # 🎨 Global styles & Tailwind config
│   └── app.html             #    HTML template
│
├── static/                  # 📁 Static files (PDFs, images)
├── build/                   # 📦 Generated site (don't edit)
└── package.json             #    Dependencies & scripts
```

## Commands Cheatsheet

```bash
# Start development server (opens http://localhost:5173)
bun run dev

# Check for errors
bun run lint

# Auto-fix formatting
bun run format

# Build for production
bun run build

# Preview production build
bun run preview
```

## Editing Content (e.g. pubs)

Most pages use **MDSvex** (`.svx` files) — write Markdown with optional Svelte components.

1. Navigate to `src/routes/<page>/+page.svx`
2. Edit the Markdown content
3. Save and see changes live at `localhost:5173`

## Modifying styles

- Refer to [response-design-guidelines](response-design.md)
- Core pattern to keep in mind: **design for mobile screens as the default, then apply tailwind modifiers to scale-up to larger screen sizes**

## Deployment

### Automatic

- Site deploys on pushes/merges to the `main` branch: https://sciminds.studio
- This is handled automatically by a Github Actions Workflow: `.github/workflows/pages.yml`
- Cloudflare (Eshin's personal account) is setup to redirect a few other `sciminds.XXX` domains to `.studio`:
  - `.ai`
  - `.app`
  - `.blog`
  - `.co`
  - `.fun`
  - `.io`
  - `.help`
  - `.live`
  - `.net`
  - `.org`
  - `.science`
  - `.space`
  - `.tech`
- We also redirect the following domains:
  - `sci-minds.com`
  - `scimindsresearch.com`
- Privacy-preserving website-analytics are available at: https://tinyurl.com/lab-website-analytics

### Manual

- Deploying to `sciminds.ucsd.edu` requires locally building the site and `rsync`-ing the `build/` folder to our lab static web-server
- `rsync build/ ucsd-website:/home/e3jolly/public_html/sciminds/`

## Reference Docs

- [Svelte 5](https://svelte.dev/docs/svelte/overview) — Component framework
- [SvelteKit](https://svelte.dev/docs/kit/introduction) — App framework & routing
- [Tailwind CSS](https://tailwindcss.com/docs) — Utility-first styling
- [MDSvex](https://mdsvex.pngwn.io/docs) — Markdown in Svelte
- [Umami](https://umami.is/docs)
