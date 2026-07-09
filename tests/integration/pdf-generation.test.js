const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const { generateHTML } = require('../../src/template');

const FIXTURES = path.join(__dirname, '..', 'fixtures');

async function getPDFPageCount(pdfPath) {
  const data = await fs.promises.readFile(pdfPath);
  const doc = await PDFDocument.load(data);
  return doc.getPageCount();
}

describe('PDF Generation — 1-page determinism', () => {
  let browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      browser: 'firefox',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }, 30000);

  afterAll(async () => {
    if (browser) await browser.close();
  });

  test('renders standard CV as exactly 1 A4 page', async () => {
    const markdown = await fs.promises.readFile(path.join(FIXTURES, 'basic-cv.md'), 'utf-8');
    const cssPath = path.join(__dirname, '..', '..', 'dist', 'output.css');

    let cssContent;
    try {
      cssContent = await fs.promises.readFile(cssPath, 'utf-8');
    } catch {
      cssContent = '/* no css built */';
    }

    const html = generateHTML(markdown, cssContent, { default: true });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const tmpPdf = path.join(__dirname, '..', '..', 'test-output.pdf');
    await page.pdf({
      path: tmpPdf,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      timeout: 30000,
    });

    const pageCount = await getPDFPageCount(tmpPdf);
    await fs.promises.unlink(tmpPdf).catch(() => {});

    expect(pageCount).toBe(1);
  }, 60000);

  test('HTML contains expected CV sections', async () => {
    const markdown = await fs.promises.readFile(path.join(FIXTURES, 'basic-cv.md'), 'utf-8');
    const html = generateHTML(markdown, '', { default: true });

    expect(html).toContain('Developer');
    expect(html).toContain('John Doe');
    expect(html).toContain('cv-container');
    expect(html).toContain('cv-sidebar');
    expect(html).toContain('cv-main');
    expect(html).toContain('section-title');
  });
});
