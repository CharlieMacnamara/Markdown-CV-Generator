# Markdown CV Generator

Write your CV in Markdown, run one command, get a polished PDF. Uses Puppeteer with Firefox for pixel-perfect A4 output.

## Quick Start

```bash
git clone https://github.com/CharlieMacnamara/Markdown-CV-Generator.git
cd Markdown-CV-Generator
npm install
PUPPETEER_BROWSER=firefox npx puppeteer browsers install firefox
npm run build:css
./src/cli.js build --default
```

Requires Node 22. The browser is downloaded once into `~/.cache/puppeteer`.

## Usage

Edit `example.md` with your CV content, then:

```bash
markdowncv build --default       # Light theme
markdowncv build --default-dark  # Dark theme
markdowncv build --light         # Soft light theme
markdowncv build --default --html-only  # HTML only, no PDF
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
├── src/
│   ├── cli.js          # CLI entry point (commander)
│   ├── template.js     # HTML generation from markdown
│   ├── parser.js       # Markdown section parser
│   ├── renderer.js     # Sidebar/main content renderer
│   └── styles/
│       ├── input.css   # Tailwind entry point
│       └── themes/     # Theme definitions
├── tests/
│   └── integration/    # Puppeteer PDF generation tests
├── puppeteer.config.js # Firefox download & cache config
├── .node-version       # Node 22
└── example.md          # Starter CV
```

## Technical Details

| Concern | Tool |
|---------|------|
| PDF gen | Puppeteer + Firefox |
| Markdown | markdown-it |
| Styling | Tailwind CSS v4 |
| CLI | commander |
| Tests | Jest + Puppeteer + pdf-lib |

## License

MIT
