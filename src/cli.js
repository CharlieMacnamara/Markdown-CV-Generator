#!/usr/bin/env node

const { program } = require('commander');
const puppeteer = require('puppeteer');
const express = require('express');
const markdownit = require('markdown-it');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

const md = markdownit();
const app = express();

// Helper functions for better error messages
const errorMessages = {
    MARKDOWN_NOT_FOUND: {
        message: 'Could not find your Markdown file',
        suggestion: 'Make sure "example.md" exists in the project root directory or create a new one'
    },
    CSS_BUILD_FAILED: {
        message: 'Failed to build CSS styles',
        suggestion: 'Make sure Tailwind CSS is properly installed with "npm install" and try again'
    },
    BROWSER_LAUNCH_FAILED: {
        message: 'Failed to launch the browser',
        suggestion: 'Make sure Google Chrome is installed or try using a different browser by changing the executablePath in the code'
    },
    PAGE_LOAD_FAILED: {
        message: 'Failed to load the page in the browser',
        suggestion: 'Check your network connection and make sure no other process is using the same port'
    },
    PDF_GENERATION_FAILED: {
        message: 'Failed to generate the PDF',
        suggestion: 'Make sure you have enough disk space and permissions to write files in this directory'
    }
};

// Helper for consistent logging
const logger = {
    info: (message) => console.log(chalk.blue(message)),
    success: (message) => console.log(chalk.green(`✓ ${message}`)),
    warn: (message) => console.log(chalk.yellow(`⚠️ ${message}`)),
    error: (message, type) => {
        console.error(chalk.red(`❌ Error: ${message}`));
        if (type && errorMessages[type]) {
            console.error(chalk.yellow(`  → ${errorMessages[type].message}`));
            console.error(chalk.cyan(`  💡 Suggestion: ${errorMessages[type].suggestion}`));
        }
    },
    step: (step, total, message) => {
        console.log(chalk.blue(`[${step}/${total}] ${message}`));
    }
};

async function ensureDirectoryExists(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

// Check for -build format and convert to build
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    if (args[i] === '-build') {
        args[i] = 'build';
    }
}
process.argv = [...process.argv.slice(0, 2), ...args];

program
    .name('markdowncv')
    .description('CLI to build and serve markdown CV')
    .version('1.0.0');

program
    .command('build')
    .alias('-build')
    .description('Build CV as PDF')
    .option('--default', 'Use default style')
    .option('--default-dark', 'Use default dark style')
    .option('--light', 'Use light theme with softer colors')
    .option('--html-only', 'Generate HTML file only, skip PDF generation')
    .action(async (options) => {
        // Validate that a theme is specified
        const themeOptions = ['default', 'defaultDark', 'light'];
        const hasTheme = themeOptions.some(theme => options[theme]);
        
        if (!hasTheme) {
            logger.error("No theme specified! You must include one of: --default, --default-dark, or --light");
            console.log(chalk.yellow("\nExample: markdowncv -build --default"));
            process.exit(1);
        }
        
        let server;
        let tempHtmlPath;
        let spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        let loadingInterval;

        function startSpinner(text) {
            i = 0;
            process.stdout.write('\n');
            loadingInterval = setInterval(() => {
                process.stdout.write(`\r${chalk.cyan(spinner[i])} ${text}`);
                i = (i + 1) % spinner.length;
            }, 80);
        }

        function stopSpinner(success = true, message = '') {
            if (loadingInterval) {
                clearInterval(loadingInterval);
                process.stdout.write('\r');
                if (success && message) {
                    logger.success(message);
                } else if (!success && message) {
                    logger.error(message);
                } else {
                    process.stdout.write('\n');
                }
            }
        }

        try {
            logger.info('\n🚀 Initializing CV generation...');
            
            // Ensure dist directory exists and CSS is built
            await ensureDirectoryExists('dist');
            
            const totalSteps = 6;
            let currentStep = 1;
            
            logger.step(currentStep++, totalSteps, 'Building styles');
            startSpinner('Compiling Tailwind CSS...');
            try {
                require('child_process').execSync('npm run build:css', { stdio: ['pipe', 'pipe', 'pipe'] });
                stopSpinner(true, 'CSS built successfully');
            } catch (error) {
                stopSpinner(false);
                logger.error('CSS build failed', 'CSS_BUILD_FAILED');
                throw new Error('Failed to build CSS');
            }
            
            // Read markdown and CSS content
            logger.step(currentStep++, totalSteps, 'Reading content');
            startSpinner('Reading CV markdown and styles...');
            let markdownContent, cssContent;
            try {
                [markdownContent, cssContent] = await Promise.all([
                    fs.readFile('example.md', 'utf-8'),
                    fs.readFile(path.join(__dirname, '../dist/output.css'), 'utf-8')
                ]);
                stopSpinner(true, 'CV content loaded successfully');
            } catch (error) {
                stopSpinner(false);
                logger.error('Failed to read files', 'MARKDOWN_NOT_FOUND');
                throw new Error('Failed to read necessary files');
            }
            
            // Extract title and name from first line
            const firstLine = markdownContent.split('\n')[0];
            let title, name;
            try {
                [title, name] = firstLine.replace('# ', '').split('|').map(s => s.trim());
                if (!title || !name) throw new Error('Invalid title format');
            } catch (error) {
                title = 'developer';
                name = 'resume';
                logger.warn('Could not parse CV title, using default filename');
            }
            
            // Generate filename in root directory
            const filename = path.join(process.cwd(), `${title.toLowerCase()}-${name.toLowerCase().replace(' ', '-')}-resume.pdf`);
            const htmlFilename = path.join(process.cwd(), `${title.toLowerCase()}-${name.toLowerCase().replace(' ', '-')}-resume.html`);
            
            // Generate HTML content
            logger.step(currentStep++, totalSteps, 'Generating HTML template');
            startSpinner('Creating HTML from markdown...');
            const html = generateHTML(markdownContent, cssContent, options);
            
            // Write HTML to temporary file
            tempHtmlPath = path.join(process.cwd(), 'temp-cv.html');
            await fs.writeFile(tempHtmlPath, html);
            stopSpinner(true, 'HTML template created');

            // If html-only option is set, save the HTML file and exit
            if (options.htmlOnly) {
                await fs.writeFile(htmlFilename, html);
                logger.success(`HTML file saved to ${htmlFilename}`);
                logger.info('HTML-only mode: PDF generation skipped.');
                return;
            }

            // Start server for PDF generation
            logger.step(currentStep++, totalSteps, 'Setting up rendering environment');
            startSpinner('Starting local server...');
            
            // Create a simple server for PDF generation
            server = require('http').createServer((req, res) => {
                if (req.url === '/favicon.ico') {
                    res.writeHead(204);
                    res.end();
                    return;
                }
                
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            });

            // Start server on a random port
            await new Promise((resolve) => {
                server.listen(0, 'localhost', () => {
                    const port = server.address().port;
                    stopSpinner(true, `Server started on port ${port}`);
                    resolve();
                });
            });

            const port = server.address().port;
            const url = `http://localhost:${port}`;
            
            try {
                logger.step(currentStep++, totalSteps, 'Rendering document');
                startSpinner('Launching browser environment...');
                let browser;
                try {
                    browser = await puppeteer.launch({
                        headless: 'new',
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-web-security'
                        ],
                        executablePath: process.platform === 'darwin' 
                            ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' 
                            : process.platform === 'win32'
                                ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                                : undefined
                    });
                    stopSpinner(true, 'Browser launched successfully');
                } catch (browserError) {
                    stopSpinner(false);
                    logger.error('Failed to launch browser', 'BROWSER_LAUNCH_FAILED');
                    if (browserError.message.includes('shared libraries') || 
                        browserError.message.includes('libnss3.so')) {
                        console.error(chalk.yellow('\nWSL detected. You may need to install Chrome dependencies:'));
                        console.error(chalk.cyan('  sudo apt update && sudo apt install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils'));
                        console.error(chalk.cyan('\nAlternatively, try running with the --html-only option to generate an HTML file instead of a PDF.'));
                    }
                    throw browserError;
                }

                try {
                    startSpinner('Initializing browser page...');
                    const page = await browser.newPage();
                    
                    // Set viewport for better rendering
                    await page.setViewport({
                        width: 1200,
                        height: 1600,
                        deviceScaleFactor: 1
                    });
                    stopSpinner(true, 'Browser page initialized');
                    
                    // Error handling for page errors
                    page.on('error', err => logger.error(`Page error: ${err.message}`));
                    page.on('pageerror', err => logger.error(`Page JS error: ${err.message}`));
                    
                    startSpinner('Loading document in browser...');
                    try {
                        const response = await page.goto(url, {
                            waitUntil: ['load', 'networkidle0'],
                            timeout: 60000
                        });
                        
                        if (!response.ok()) {
                            throw new Error(`Page load failed with status ${response.status()}`);
                        }
                        
                        stopSpinner(true, 'Document loaded successfully');
                    } catch (pageError) {
                        stopSpinner(false);
                        logger.error('Failed to load page in browser', 'PAGE_LOAD_FAILED');
                        throw pageError;
                    }
                    
                    // Wait for rendering and animations
                    startSpinner('Finalizing document rendering...');
                    await page.waitForTimeout(1000);
                    stopSpinner(true, 'Document rendering complete');

                    // Generate PDF
                    logger.step(currentStep++, totalSteps, 'Generating PDF');
                    startSpinner('Creating PDF document...');
                    try {
                        await page.pdf({
                            path: filename,
                            format: 'A4',
                            printBackground: true,
                            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
                            timeout: 60000
                        });
                        stopSpinner(true, 'PDF created successfully');
                    } catch (pdfError) {
                        stopSpinner(false);
                        logger.error('Failed to generate PDF', 'PDF_GENERATION_FAILED');
                        throw pdfError;
                    }

                    logger.info(`\n✨ Success! CV generated at: ${chalk.green(filename)}\n`);
                } finally {
                    await browser.close();
                    logger.info('Browser resources released');
                }
            } finally {
                // Ensure server cleanup
                if (server) {
                    server.close(() => {
                        logger.info('Local server stopped');
                        // Clean up temporary files
                        if (tempHtmlPath) {
                            fs.unlink(tempHtmlPath).catch(() => {});
                        }
                        // Force exit to prevent hanging
                        setTimeout(() => process.exit(0), 100);
                    });
                }
            }
        } catch (error) {
            stopSpinner(false);
            if (tempHtmlPath) {
                try {
                    await fs.unlink(tempHtmlPath);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            
            logger.error(error.message);
            logger.info('\nTry running "npm run dev" to debug in the browser instead.\n');
            process.exit(1);
        }
    });

program.command('serve')
    .description('Start development server')
    .action(() => {
        console.log(chalk.blue('\n🚀 Starting development server...\n'));
        require('child_process').spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true
        });
    });

function generateHTML(markdownContent, cssContent, options) {
    let theme = '';
    
    if (options['defaultDark']) {
        theme = 'dark-theme';
    } else if (options['light']) {
        theme = 'theme--light';
    }
    
    return `
        <!DOCTYPE html>
        <html lang="en" class="h-full ${theme === 'dark-theme' ? 'bg-gray-900' : 'bg-gray-50'}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CV - ${md.render(markdownContent).split('\n')[0].replace(/<[^>]*>/g, '')}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet">
            <style>${cssContent}</style>
            <style>
                /* Typography Enhancements */
                body {
                    font-family: 'Nunito Sans', sans-serif;
                    letter-spacing: -0.01em;
                    text-rendering: optimizeLegibility;
                    color: #334155; /* Slate-700: slightly softer than black for body text */
                }
                
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Playfair Display', Georgia, serif;
                    letter-spacing: -0.02em;
                }
                
                /* Header Typography */
                .cv-header h1 {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-weight: 700;
                    font-size: 2.5rem;
                    line-height: 1.1;
                    letter-spacing: -0.035em;
                    max-width: 90%;
                    margin: 0 auto;
                    padding: 1rem 1.5rem;
                    position: relative;
                    transition: transform 0.2s ease;
                    color: #0f172a; /* Slate-900: deeper color for the title */
                }
                
                /* Section Titles */
                .section-title {
                    font-family: 'Nunito Sans', sans-serif;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    font-size: 0.875rem;
                    color: #475569; /* Slate-600: softer than black */
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 0.5rem;
                }
                
                /* Job Titles */
                .job-title {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-weight: 600;
                    color: #1e293b; /* Slate-800: darker for better contrast */
                    font-size: 1.125rem;
                }
                
                /* Detail Labels */
                .details-label {
                    font-family: 'Nunito Sans', sans-serif;
                    font-weight: 700;
                    color: #475569; /* Slate-600 */
                }
                
                /* Refined Container/Cards */
                .cv-container {
                    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03);
                }
                
                .reference-card {
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                
                /* Links */
                a {
                    transition: all 0.15s ease-in-out;
                    color: #2563eb; /* Blue-600: good contrast */
                    text-decoration: none;
                }
                
                a:hover {
                    color: #1d4ed8; /* Blue-700: darker for hover */
                }
                
                /* Modern, refined header styling */
                .cv-header {
                    padding: 2rem 1.5rem;
                    position: relative;
                    border-bottom-width: 1px;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(180deg, 
                        rgba(255,255,255,0.5) 0%, 
                        rgba(255,255,255,0) 100%);
                    z-index: 10;
                }
                
                /* Enhanced two-tone design */
                .cv-grid {
                    position: relative;
                }
                
                .cv-grid::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 33.333%;
                    width: 1px;
                    background: linear-gradient(to bottom, 
                        rgba(0,0,0,0.01), 
                        rgba(0,0,0,0.05) 15%, 
                        rgba(0,0,0,0.05) 85%, 
                        rgba(0,0,0,0.01));
                    z-index: 2;
                }
                
                .cv-sidebar {
                    position: relative;
                    box-shadow: inset -1px 0 0 rgba(0,0,0,0.02);
                    background-image: linear-gradient(to bottom left, 
                        rgba(240, 245, 250, 0.5), 
                        rgba(240, 245, 250, 0));
                }
                
                .cv-main {
                    position: relative;
                    background-image: linear-gradient(to bottom right, 
                        rgba(255, 255, 255, 0.01), 
                        rgba(0, 0, 0, 0.01));
                }
                
                /* Job descriptions and other text */
                .job-description {
                    color: #64748b; /* Slate-500: softer for readability */
                    line-height: 1.6;
                }
                
                .achievement-item {
                    color: #475569; /* Slate-600: better contrast than body */
                    line-height: 1.5;
                }
                
                /* Accessibility improvements */
                a:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                /* Improved spacing */
                .section {
                    margin-bottom: 1.75rem;
                }
                
                .job-entry {
                    padding-bottom: 1.25rem;
                }
                
                /* Dark theme refinements */
                .dark-theme {
                    color-scheme: dark;
                }
                
                .dark-theme .cv-header {
                    background: linear-gradient(180deg, 
                        rgba(31,41,55,0.95) 0%, 
                        rgba(17,24,39,0.6) 100%);
                    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
                }
                
                .dark-theme .cv-header h1 {
                    color: #f8fafc; /* Slate-50: bright for contrast */
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                }
                
                /* Dark theme separator */
                .dark-theme .cv-grid::after {
                    background: linear-gradient(to bottom, 
                        rgba(255,255,255,0.01), 
                        rgba(255,255,255,0.06) 15%, 
                        rgba(255,255,255,0.06) 85%, 
                        rgba(255,255,255,0.01));
                }
                
                .dark-theme .cv-sidebar {
                    box-shadow: inset -1px 0 0 rgba(255,255,255,0.03);
                    background-image: linear-gradient(to bottom left, 
                        rgba(17, 24, 39, 0.7), 
                        rgba(17, 24, 39, 0.3));
                }
                
                .dark-theme .cv-main {
                    background-image: linear-gradient(to bottom right, 
                        rgba(255, 255, 255, 0.01), 
                        rgba(0, 0, 0, 0.1));
                }
                
                .dark-theme .job-title {
                    color: #e0f2fe; /* Blue-50: makes job titles stand out */
                }
                
                .dark-theme .section-title {
                    color: #94a3b8; /* Slate-400: better visibility in dark */
                    border-color: rgba(71, 85, 105, 0.8); /* Slate-600 at 80% */
                }
                
                .dark-theme .job-description {
                    color: #cbd5e1; /* Slate-300: better readability */
                    opacity: 0.9;
                }
                
                .dark-theme .achievement-item,
                .dark-theme .skill-item {
                    color: #e2e8f0; /* Slate-200: bright for dark theme */
                    opacity: 0.95;
                }
                
                .dark-theme .details-label {
                    color: #bfdbfe; /* Blue-100 for better contrast */
                }
                
                .dark-theme .details-value {
                    color: #f8fafc; /* Slate-50 for maximum readability */
                    font-weight: 450;
                }
                
                .dark-theme .achievement-item::before,
                .dark-theme .skill-item::before {
                    color: #60a5fa; /* Blue-400 */
                }
                
                /* Improved contrast for links, addresses, and contact info in dark theme */
                .dark-theme a {
                    color: #93c5fd; /* Blue-300 */
                }
                
                .dark-theme a:hover {
                    color: #dbeafe; /* Blue-100 */
                    text-decoration: underline;
                }
                
                .dark-theme .reference-contact {
                    color: #93c5fd; /* Blue-300 */
                    font-weight: 500;
                }
                
                .dark-theme .reference-contact:hover {
                    color: #dbeafe; /* Blue-100 */
                    text-decoration: underline;
                }

                .dark-theme .cv-main p.text-base {
                    color: #e2e8f0 !important; /* Slate-200: much brighter for better contrast */
                }

                .dark-theme .profile-text {
                    color: #f1f5f9 !important; /* Slate-100: Very bright for maximum contrast in dark mode */
                    opacity: 1;
                }
            </style>
        </head>
        <body class="h-full">
            <div class="min-h-full">
                <div class="cv-container ${theme}">
                    <div class="cv-grid">
                        <header class="cv-header">
                            <h1 class="text-center">
                                ${md.render(markdownContent).split('\n')[0].replace(/<[^>]*>/g, '')}
                            </h1>
                        </header>
                        
                        <aside class="cv-sidebar">
                            ${generateLeftColumn(markdownContent)}
                        </aside>

                        <main class="cv-main">
                            ${generateRightColumn(markdownContent)}
                        </main>
                    </div>
                </div>
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
                sectionContent = sectionContent
                    .replace(/<ul>/g, '<div class="skills-grid">')
                    .replace(/<\/ul>/g, '</div>')
                    .replace(/<li>/g, '<div class="skill-item">')
                    .replace(/<\/li>/g, '</div>')
                    .replace(/<p>/g, '')
                    .replace(/<\/p>/g, '');
            } else if (title.trim() === 'Details') {
                sectionContent = sectionContent
                    .replace(/<p><strong>/g, '<div class="details-item"><div class="details-label">')
                    .replace(/<\/strong><\/p>/g, '</div>')
                    .replace(/<p>/g, '<div class="details-value">')
                    .replace(/<\/p>/g, '</div></div>');
            } else if (title.trim() === 'Links') {
                sectionContent = sectionContent
                    .replace(/<p>/g, '<div class="details-item">')
                    .replace(/<\/p>/g, '</div>')
                    .replace(/<a /g, '<a class="text-blue-600 hover:text-blue-800" ');
            }
            
            return `
                <section class="section">
                    <h2 class="section-title">${title.trim()}</h2>
                    ${sectionContent}
                </section>
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
            
            if (title.trim() === 'Profile') {
                sectionContent = sectionContent
                    .replace(/<p>/g, '<p class="profile-text text-base text-gray-600 leading-relaxed">');
            } else if (title.trim() === 'Employment History') {
                sectionContent = sectionContent
                    .replace(/<h3>/g, '<div class="job-entry"><div class="job-header"><h3 class="job-title">')
                    .replace(/<\/h3>/g, '</h3>')
                    .replace(/<p>((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).+?Present|[0-9]{4})<\/p>/g, 
                        '<div class="job-period">$1</div></div>')
                    .replace(/<p>Notable clients:<\/p>/g, 
                        '<h4 class="job-section-title">Notable clients:</h4>')
                    .replace(/<p>((?!Notable clients:|Key achievements:|Achievements:).+?)<\/p>/g, 
                        '<p class="job-description">$1</p>')
                    .replace(/<p>(Key achievements:|Achievements:)<\/p>/g, 
                        '<h4 class="job-section-title">$1</h4>')
                    .replace(/<ul>/g, '<ul class="achievements-list">')
                    .replace(/<li>/g, '<li class="achievement-item">')
                    .replace(/<\/div>\s*(?!<div class="job-entry">|$)/g, '</div>');
            } else if (title.trim() === 'References') {
                sectionContent = `<div class="reference-section">${
                    sectionContent
                        .replace(/<h3>/g, '<div class="reference-card">\n<h3 class="reference-name">')
                        .replace(/<\/h3>\s*<p>/g, '</h3>\n<div class="reference-content">\n<div class="reference-position">')
                        .replace(/<br>\s*<a/g, '</div>\n<a')
                        .replace(/<a /g, '<a class="reference-contact" ')
                        .replace(/<\/p>/g, '</div></div>')
                }</div>`;
            }
            
            return `
                <section class="section">
                    <h2 class="section-title">${title.trim()}</h2>
                    ${sectionContent}
                </section>
            `;
        })
        .join('');
}

program.parse(); 