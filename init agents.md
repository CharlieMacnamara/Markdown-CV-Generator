# Markdown-CV-Generator

Generate a professional one-page A4 CV from a Markdown file. Outputs HTML (dev preview) or PDF (via Puppeteer).

## Architecture

```
src/
├── cli.js          CLI entry point (commander) — build & serve commands
├── index.js        Express dev server — live preview at localhost
├── template.js     Shared HTML generation (markdown → CV HTML)
└── styles/
    ├── input.css   Tailwind CSS v4 source + custom component styles
    └── themes/     (deprecated — merged into input.css)
```

**Data flow:**

```
example.md  ──→  template.js  ──→  HTML string
                      │
                      ├── dev mode: index.js serves at localhost
                      └── build mode: cli.js puppeteer → A4 PDF
```

## Quick Start

```sh
npm install
npm run build:css    # Compile Tailwind
npm run dev          # Dev server at http://localhost:3000
```

## CLI

```sh
markdowncv build --default          # Build PDF (default light theme)
markdowncv build --default-dark     # Build PDF with dark theme
markdowncv build --light            # Build PDF with light theme
markdowncv build --default --html-only  # HTML only, skip PDF
markdowncv serve                    # Start dev server
```

## Markdown Format

The CV is structured by `##` section headers. Sections route to sidebar or main content:

| Section | Location | Notes |
|---------|----------|-------|
| `## Details` | Sidebar | Contact info, location |
| `## Links` | Sidebar | Portfolio, social links |
| `## Skills` | Sidebar | Bullet list of skills |
| `## Profile` | Main | Summary text |
| `## Employment History` | Main | Jobs with dates, descriptions, achievements |
| `## References` | Main | Cards with name, position, contact |

The first line `# Title | Name` sets the filename and header.

## Testing

```sh
npm test    # Runs Puppeteer integration suite
```

Tests use real headless Chrome (via Puppeteer) to:
1. Render CV markdown to HTML
2. Generate an A4 PDF
3. Assert the PDF is **exactly 1 page**

This guarantees the output fits a single page regardless of content changes.

**Adding tests:** Place `*.test.js` files in `tests/`. Use `pdf-lib` to read PDF page counts deterministically — no visual comparison needed.

## Adding a CV Section

1. Add `## My Section` to `example.md`
2. Add routing logic in `src/template.js` — insert into `generateSidebar()` or `generateMainContent()`
3. Add CSS styles to `src/styles/input.css` if needed
4. Update test fixtures in `tests/fixtures/`
5. Run `npm test` to verify 1-page fit

## Themes

Pass `?theme=dark` or `?theme=light` to the dev server URL. The CLI accepts `--default`, `--default-dark`, `--light`. Styling is driven by CSS custom properties defined in `input.css`.

## CI

GitHub Actions workflow runs on push:
- `npm ci`
- `npm run build:css`
- `npm test` (with `--forceExit` for Puppeteer cleanup)

## Constraints

- **A4 only** (210mm × 297mm) — hardcoded in CSS and Puppeteer options
- **Google Fonts** — Nunito Sans + Playfair Display loaded from CDN
- **1 page** is enforced by test assertions, not by CSS truncation
