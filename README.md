# Markdown CV Generator

Write your CV in Markdown, run one command, get a polished PDF. Uses Puppeteer with Firefox for pixel-perfect A4 output with adaptive layout.

## Quick Start

```bash
git clone https://github.com/CharlieMacnamara/Markdown-CV-Generator.git
cd Markdown-CV-Generator
npm install
PUPPETEER_BROWSER=firefox npx puppeteer browsers install firefox
npm run build:css
cp input.example.md input.md   # Create your personal CV
./src/cli.js build --default
```

Requires Node 22. The browser is downloaded once into `~/.cache/puppeteer`.

## Usage

Copy `input.example.md` to `input.md` and edit with your CV content. The CLI reads `input.md` by default, falling back to `example.md`.

```bash
markdowncv build --default                 # Light theme
markdowncv build --default-dark            # Dark theme
markdowncv build --light                   # Soft light theme
markdowncv build --default --html-only     # HTML only, no PDF
markdowncv build --default --input my-cv.md  # Custom input file
```

The output saves as `[role]-[name]-resume.pdf` (or `[name]-resume.pdf`).

### Development

```bash
npm run dev          # Live preview at localhost:3000
npm run build:css    # Build Tailwind CSS only
npm test             # Run integration tests
```

## Project Structure

```
├── input.md              # Your CV (gitignored — personal data stays local)
├── input.example.md      # Distributable template example

├── src/
│   ├── cli.js            # CLI entry point (commander) — reads input.md first
│   ├── template.js       # HTML generation from markdown
│   ├── parser.js         # Markdown section parser (sidebar vs main routing)
│   ├── renderer.js       # Section renderers with semantic HTML
│   └── styles/
│       └── input.css     # Tailwind v4 + CV layout (A4-fill, adaptive)
├── tests/
│   └── integration/      # Puppeteer PDF generation tests
├── puppeteer.config.js   # Firefox download & cache config
└── .node-version         # Node 22
```

## Technical Details

| Concern | Tool |
|---------|------|
| PDF gen | Puppeteer + Firefox |
| Markdown | markdown-it |
| Styling | Tailwind CSS v4 |
| CLI | commander |
| Tests | Jest + Puppeteer + pdf-lib |

The layout adapts to content length — the grid fills the full A4 page (297mm), with sidebar and main columns stretching via flex. Skills and job entries distribute evenly to avoid white space.

## License

MIT
