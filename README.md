# Fancy Mumble docs

End-user documentation for [Fancy Mumble](https://fancy-mumble.com/),
built with [Astro Starlight](https://starlight.astro.build/).

Live site: <https://docs.fancy-mumble.com>

## Quick start

You need **Node.js 22 or newer** (LTS works fine).

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:4321> with hot reload. Edit
anything under `src/content/docs/` and the page updates instantly.

## Scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start the dev server with hot reload.         |
| `npm run build`    | Build the static site into `dist/`.           |
| `npm run preview`  | Serve the built `dist/` folder for sanity.    |
| `npm run astro`    | Run Astro CLI commands (e.g. `astro check`).  |

## Project layout

```text
docs/
├── astro.config.mjs           # Starlight + astro-icon config; sidebar lives here
├── package.json
├── public/                    # static files (favicon, CNAME for GH Pages)
├── src/
│   ├── assets/                # logo + other imported images
│   ├── content/
│   │   └── docs/              # every .md / .mdx page lives here
│   │       ├── index.mdx              # landing page
│   │       ├── welcome/
│   │       ├── getting-started/
│   │       ├── users/
│   │       ├── server/
│   │       │   └── features/
│   │       ├── admin/
│   │       ├── troubleshooting/
│   │       └── reference/
│   ├── content.config.ts      # registers the docs collection
│   └── styles/
│       └── custom.css         # brand colours, screenshot-placeholder style
└── tsconfig.json
```

The sidebar in `astro.config.mjs` defines the navigation tree. Adding
a new page is two steps: create the MDX file under `src/content/docs/`
and add a `link` to the right section in the sidebar.

## Writing docs

### Frontmatter

Every page starts with a YAML block:

```mdx
---
title: My page
description: One-sentence summary. Shows up in search and meta tags.
sidebar:
  order: 1        # optional, controls position inside its section
---
```

### Components

Common Starlight components used throughout the site:

```mdx
import { Aside, Card, CardGrid, LinkCard, Steps, Tabs, TabItem, Badge } from '@astrojs/starlight/components';
import { Icon } from 'astro-icon/components';
```

- **`<Aside type="tip|note|caution|danger">`** for callouts.
- **`<Steps>`** wrapping an ordered list for big walk-throughs.
- **`<Tabs syncKey="...">`** with **`<TabItem label="...">`** for
  platform variants (Windows / Linux / Android).
- **`<Card>`** and **`<CardGrid>`** for feature grids on landing pages.
- **`<Icon name="lucide:mic-off" />`** for icons. Use the same icon
  family the client uses, see <https://lucide.dev/icons>.

See the [Starlight docs](https://starlight.astro.build/components/asides/)
for the full component list.

### Screenshot placeholders

The site uses styled placeholders so every screenshot slot is visible
while writing:

```mdx
<div class="screenshot-placeholder">
  &nbsp;Screenshot placeholder: short description of what should be here.
</div>
```

The style lives in [src/styles/custom.css](src/styles/custom.css).
Replace the `<div>` with a real `![alt](path.png)` (and drop the image
into `src/assets/`) when the screenshot lands.

### Em-dashes and special characters

By convention this site avoids em-dashes (`-`) and decorative Unicode
that does not render predictably across platforms. Use commas,
periods, or hyphens.

For autolinks, write `[label](https://example.com)` instead of
`<https://example.com>`. MDX is stricter than plain Markdown about
the latter inside lists.

## Verify before pushing

```bash
npm run build
```

If the build fails, CI will fail too. Common gotchas:

- A `<Code lang="..." code={`...`} />` block sitting inside a numbered
  list inside `<Steps>` confuses the MDX parser. Use a fenced code
  block instead.
- Internal links must start with `/`, end with `/`, and match the
  generated route (the directory under `src/content/docs/`, not the
  file name).
- Importing a component you do not use is fine; using a component you
  did not import is a build error.

## Deployment

This repo ships a GitHub Actions workflow at
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) that:

- **On a pull request to `main`**: builds the site and runs any check
  steps. **Does not deploy.** This catches MDX syntax errors and
  broken links before review.
- **On a push to `main`** (typically a merge): builds **and deploys**
  to GitHub Pages.

### One-time setup

1. In the repo settings, **Settings → Pages**, pick
   **Build and deployment → Source: GitHub Actions**.
2. If you want a custom domain (e.g. `docs.fancy-mumble.com`):
   - Put the domain in `public/CNAME` (one line, no scheme, no path).
   - Add the matching `CNAME` / `A` records at your DNS host pointing
     at the GitHub Pages endpoints.
   - In **Settings → Pages**, enter the same domain in the
     **Custom domain** field and tick **Enforce HTTPS** once the
     certificate has provisioned.
3. The workflow needs `pages: write` and `id-token: write`, which are
   granted in the workflow file. No extra repo secret is needed.

### When the deploy fails

Open the failed run in the **Actions** tab. The two most likely
culprits are:

- `npm run build` failed (look for the Astro error). Reproduce
  locally with `npm run build`.
- The `actions/deploy-pages` step failed because Pages is not yet
  enabled or the source is not set to "GitHub Actions". Re-do the
  one-time setup above.

## Branching workflow

- `main` is the only deployed branch. Never push directly.
- Open a pull request from a feature branch into `main`. The build
  check must pass before review.
- Squash-merge on approval. CI runs again on `main` and the deploy
  job picks up the new commit.
- A failed deploy on `main` does not roll back the previous live
  version automatically. Either push a revert or fix forward.

## Contributing screenshots

1. Take a screenshot at a sensible window size (the default app
   width, around 1280 wide, looks best on the docs site).
2. Save as `.png` or `.webp` under `src/assets/screenshots/<section>/`.
3. Replace the matching `<div class="screenshot-placeholder">` with:

   ```mdx
   import myShot from '../../assets/screenshots/section/my-shot.png';

   <Image src={myShot} alt="Short description of the screenshot." />
   ```

4. Run `npm run build` to confirm the image is included and the
   build passes.

## License

The documentation content is dual-licensed under
[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) for prose
and [MIT](https://opensource.org/licenses/MIT) for code samples.
