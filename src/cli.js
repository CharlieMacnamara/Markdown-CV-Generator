#!/usr/bin/env node

const { program } = require('commander');
const puppeteer = require('puppeteer');
const express = require('express');
const markdownit = require('markdown-it');
const fs = require('fs').promises;
const path = require('path');

const md = markdownit();
const app = express();

async function ensureDirectoryExists(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

program
    .name('markdowncv')
    .description('CLI to build and serve markdown CV')
    .version('1.0.0');

program.command('build')
    .description('Build CV as PDF')
    .option('--default', 'Use default style')
    .option('--default-dark', 'Use default dark style')
    .action(async (options) => {
        let server;
        let tempHtmlPath;
        let spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        let loadingInterval;

        function startSpinner(text) {
            i = 0;
            process.stdout.write('\n');
            loadingInterval = setInterval(() => {
                process.stdout.write(`\r${spinner[i]} ${text}`);
                i = (i + 1) % spinner.length;
            }, 80);
        }

        function stopSpinner() {
            if (loadingInterval) {
                clearInterval(loadingInterval);
                process.stdout.write('\n');
            }
        }

        try {
            console.log('\n🚀 Initializing CV generation...');
            
            // Ensure dist directory exists and CSS is built
            await ensureDirectoryExists('dist');
            
            startSpinner('Building CSS styles...');
            require('child_process').execSync('npm run build:css', { stdio: ['pipe', 'pipe', 'pipe'] });
            stopSpinner();
            console.log('✓ CSS built successfully');
            
            // Read markdown and CSS content
            startSpinner('Reading CV content...');
            const [markdownContent, cssContent] = await Promise.all([
                fs.readFile('example.md', 'utf-8'),
                fs.readFile(path.join(__dirname, '../dist/output.css'), 'utf-8')
            ]);
            stopSpinner();
            console.log('✓ CV content loaded');
            
            // Extract title and name from first line
            const firstLine = markdownContent.split('\n')[0];
            const [title, name] = firstLine.replace('# ', '').split('|').map(s => s.trim());
            
            // Generate filename in root directory
            const filename = path.join(process.cwd(), `${title.toLowerCase()}-${name.toLowerCase().replace(' ', '-')}-resume.pdf`);
            
            // Generate HTML content
            startSpinner('Generating HTML...');
            const html = generateHTML(markdownContent, cssContent, options);
            
            // Write HTML to temporary file
            tempHtmlPath = path.join(process.cwd(), 'temp-cv.html');
            await fs.writeFile(tempHtmlPath, html);
            stopSpinner();
            console.log('✓ HTML generated');

            startSpinner('Starting server for PDF generation...');
            
            // Create a simple server for PDF generation
            const server = require('http').createServer((req, res) => {
                console.log('Server received request:', req.url);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            });

            // Start server on a random port
            await new Promise((resolve) => {
                server.listen(0, 'localhost', () => {
                    const port = server.address().port;
                    console.log(`Server started on port ${port}`);
                    resolve();
                });
            });

            const port = server.address().port;
            const url = `http://localhost:${port}`;
            console.log(`Attempting to connect to: ${url}`);
            
            try {
                startSpinner('Launching browser...');
                const browser = await puppeteer.launch({
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins,site-per-process'
                    ],
                    executablePath: process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined
                });

                try {
                    const page = await browser.newPage();
                    console.log('Browser page created');
                    
                    // Set viewport for better rendering
                    await page.setViewport({
                        width: 1200,
                        height: 1600,
                        deviceScaleFactor: 1
                    });
                    
                    startSpinner('Loading content...');
                    console.log('Navigating to URL...');
                    
                    // Increase timeout and add error event listener
                    page.on('error', err => console.error('Page error:', err));
                    page.on('pageerror', err => console.error('Page error:', err));
                    
                    const response = await page.goto(url, {
                        waitUntil: ['load', 'networkidle0'],
                        timeout: 60000
                    });
                    
                    if (!response.ok()) {
                        throw new Error(`Page load failed with status ${response.status()}`);
                    }
                    
                    console.log('Page loaded successfully');
                    await page.waitForTimeout(2000); // Wait for any animations

                    startSpinner('Generating PDF...');
                    await page.pdf({
                        path: filename,
                        format: 'A4',
                        printBackground: true,
                        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
                        timeout: 60000
                    });

                    stopSpinner();
                    console.log(`\n✨ Success! CV generated as: ${filename}\n`);
                } catch (pageError) {
                    console.log('Page error details:', {
                        message: pageError.message,
                        stack: pageError.stack,
                        name: pageError.name
                    });
                    throw pageError;
                } finally {
                    await browser.close();
                }
            } finally {
                server.close(() => console.log('Server closed'));
            }
        } catch (error) {
            stopSpinner();
            if (tempHtmlPath) {
                try {
                    await fs.unlink(tempHtmlPath);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        }
    });

program.command('serve')
    .description('Start development server')
    .action(() => {
        console.log('Starting development server...');
        require('child_process').spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true
        });
    });

function generateHTML(markdownContent, cssContent, options) {
    const theme = options['defaultDark'] ? 'dark-theme' : '';
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${cssContent}</style>
        </head>
        <body>
            <div class="cv-container ${theme}">
                <header class="cv-header">
                    <div class="cv-title-outer">
                        <h1 class="cv-title">
                            ${md.render(markdownContent).split('\n')[0].replace(/<[^>]*>/g, '')}
                        </h1>
                    </div>
                </header>

                <main class="cv-content">
                    <div class="cv-left">
                        ${generateLeftColumn(markdownContent)}
                    </div>
                    <div class="cv-right">
                        ${generateRightColumn(markdownContent)}
                    </div>
                </main>
            </div>
        </body>
        </html>
    `;
}

function generateLeftColumn(markdown) {
    const sections = markdown.split('\n## ');
    const leftSections = ['Details', 'Links', 'Skills'];
    
    return sections
        .filter(section => leftSections.some(title => section.startsWith(title)))
        .map(section => {
            const [title, ...content] = section.split('\n');
            let sectionContent = md.render(content.join('\n'));
            
            if (title.trim() === 'Skills') {
                sectionContent = sectionContent.replace(/<ul>/g, '<ul class="skills-list">');
            } else if (title.trim() === 'Details') {
                sectionContent = sectionContent
                    .replace(/<strong>/g, '<strong class="details-label">')
                    .replace(/<p>/g, '<p class="details-item">');
            } else if (title.trim() === 'Links') {
                sectionContent = sectionContent
                    .replace(/<a href/g, '<a class="portfolio-link" href');
            }
            
            return `
                <div class="section">
                    <h2 class="section-title">${title.trim()}</h2>
                    ${sectionContent}
                </div>
            `;
        })
        .join('');
}

function generateRightColumn(markdown) {
    const sections = markdown.split('\n## ');
    const rightSections = ['Profile', 'Employment History', 'References'];
    
    return sections
        .filter(section => rightSections.some(title => section.startsWith(title)))
        .map(section => {
            const [title, ...content] = section.split('\n');
            let sectionContent = md.render(content.join('\n'));
            
            if (title.trim() === 'Employment History') {
                sectionContent = sectionContent
                    .replace(/<h1>/g, '<div class="job"><h3 class="job-title">')
                    .replace(/<\/h1>/g, '</h3>')
                    .replace(/<p>((Jan 2021 — Present|Jun 2018 — Dec 2020))<\/p>/g, 
                        '<span class="job-period">$1</span>')
                    .replace(/<p>((?!Key achievements:|Achievements:).+?)<\/p>/g, 
                        '<p class="job-description">$1</p>')
                    .replace(/<p>(Key achievements:|Achievements:)<\/p>/g, 
                        '<h4 class="achievements-header">$1</h4>')
                    .replace(/<ul>/g, '<ul class="achievements-list">')
                    .replace(/<\/ul>\s*(?!<div class="job">|$)/g, '</ul></div>');
            } else if (title.trim() === 'References') {
                sectionContent = sectionContent
                    .replace(/<h3>/g, '<h3 class="reference-name">')
                    .replace(/<p>/g, '<p class="reference-title">')
                    .replace(/(<a href="mailto:|<a href="tel:)([^"]+)("[^>]*>)/g, 
                        '<span class="reference-contact">$1$2$3');
            }
            
            return `
                <div class="section">
                    <h2 class="section-title">${title.trim()}</h2>
                    ${sectionContent}
                </div>
            `;
        })
        .join('');
}

program.parse(); 