#!/usr/bin/env node

const { program } = require('commander');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const http = require('http');
const picocolors = require('picocolors');
const { generateHTML } = require('./template');

const pc = picocolors;

const ERROR_HELP = {
  MARKDOWN_NOT_FOUND: { message: 'Could not find input markdown file', suggestion: 'Create input.md or specify --input' },
  CSS_BUILD_FAILED: { message: 'Failed to build CSS', suggestion: 'Run "npm install" and try again' },
  BROWSER_LAUNCH_FAILED: { message: 'Failed to launch browser', suggestion: 'Ensure Chrome is installed' },
  PDF_GENERATION_FAILED: { message: 'Failed to generate PDF', suggestion: 'Check disk space and permissions' },
};

function resolveInputPath(inputOption) {
  if (inputOption) return inputOption;
  if (fsSync.existsSync('input.md')) return 'input.md';
  return 'example.md';
}

const log = {
  info: (msg) => console.log(pc.blue(msg)),
  success: (msg) => console.log(pc.green(`✓ ${msg}`)),
  warn: (msg) => console.log(pc.yellow(`⚠ ${msg}`)),
  error: (msg, type) => {
    console.error(pc.red(`✘ Error: ${msg}`));
    if (type && ERROR_HELP[type]) {
      console.error(pc.yellow(`  → ${ERROR_HELP[type].message}`));
      console.error(pc.cyan(`  💡 ${ERROR_HELP[type].suggestion}`));
    }
  },
  step: (n, total, msg) => console.log(pc.blue(`[${n}/${total}] ${msg}`)),
};

async function ensureDir(dir) {
  try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); }
}

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-build') args[i] = 'build';
}
process.argv = [...process.argv.slice(0, 2), ...args];

program
  .name('markdowncv')
  .description('Build and serve markdown CV')
  .version('1.0.0');

program
  .command('build')
  .alias('-build')
  .description('Build CV as PDF')
  .option('--default', 'Default light theme')
  .option('--default-dark', 'Dark theme')
  .option('--light', 'Light theme')
  .option('--html-only', 'HTML only, skip PDF')
  .option('--input <path>', 'Input markdown file (default: input.md, fallback example.md)')
  .action(async (options) => {
    const activeTheme = ['default', 'defaultDark', 'light'].find(k => options[k]);
    if (!activeTheme) {
      log.error('No theme specified');
      console.log(pc.yellow('\nUsage: markdowncv build --default'));
      process.exit(1);
    }

    let server, tempHtmlPath;

    try {
      log.info('\n🚀 Generating CV...\n');
      await ensureDir('dist');

      log.step(1, 5, 'Building styles');
      require('child_process').execSync('npm run build:css', { stdio: 'pipe' });
      log.success('CSS built');

      log.step(2, 5, 'Reading content');
      const inputPath = resolveInputPath(options.input);
      log.info(`   Source: ${inputPath}`);
      const [markdownContent, cssContent] = await Promise.all([
        fs.readFile(inputPath, 'utf-8'),
        fs.readFile(path.join(__dirname, '../dist/output.css'), 'utf-8'),
      ]);
      log.success('Content loaded');

      log.step(3, 5, 'Generating HTML');
      const html = generateHTML(markdownContent, cssContent, options);

      tempHtmlPath = path.join(process.cwd(), 'temp-cv.html');
      await fs.writeFile(tempHtmlPath, html);
      log.success('HTML generated');

      const heading = markdownContent.split('\n')[0].replace('# ', '');
      const parts = heading.split('|').map(s => s.trim());
      const name = (parts[1] || parts[0] || 'resume').toLowerCase().replace(/\s+/g, '-');
      const role = parts[1] ? parts[0].toLowerCase().replace(/\s+/g, '-') : null;
      const pdfName = role ? `${role}-${name}-resume.pdf` : `${name}-resume.pdf`;
      const pdfPath = path.join(process.cwd(), pdfName);
      const htmlName = role ? `${role}-${name}-resume.html` : `${name}-resume.html`;
      const htmlPath = path.join(process.cwd(), htmlName);

      if (options.htmlOnly) {
        await fs.writeFile(htmlPath, html);
        log.success(`HTML saved to ${htmlPath}`);
        return;
      }

      log.step(4, 5, 'Rendering PDF');
      const browser = await puppeteer.launch({
        browser: 'firefox',
        headless: true,
      });

      try {
        server = http.createServer((req, res) => {
          if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        });

        await new Promise(resolve => server.listen(0, 'localhost', resolve));
        const port = server.address().port;

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1600 });
        await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle0', timeout: 30000 });

        log.step(5, 5, 'Writing PDF');
        await page.pdf({
          path: pdfPath,
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
          timeout: 60000,
        });

        log.success(`PDF saved to ${pdfPath}\n`);
      } finally {
        await browser.close();
      }
    } catch (err) {
      log.error(err.message);
      if (tempHtmlPath) fs.unlink(tempHtmlPath).catch(() => {});
      process.exit(1);
    } finally {
      if (server) {
        server.close(() => {
          if (tempHtmlPath) fs.unlink(tempHtmlPath).catch(() => {});
          setTimeout(() => process.exit(0), 100);
        });
      }
    }
  });

program
  .command('serve')
  .description('Start development server')
  .action(() => {
    console.log(pc.blue('\n🚀 Starting dev server...\n'));
    require('child_process').spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });
  });

program.parse();
