const express = require('express');
const markdownit = require('markdown-it');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const app = express();
const md = markdownit();

// Serve static files from dist
app.use(express.static('dist'));

// Main route
app.get('/', async (req, res) => {
    try {
        // Check for theme query parameter
        const theme = req.query.theme || '';
        let themeClass = '';
        
        if (theme === 'light') {
            themeClass = 'theme--light';
        } else if (theme === 'dark') {
            themeClass = 'dark-theme';
        }
        
        // Read markdown and CSS
        const [markdownContent, cssContent] = await Promise.all([
            fs.promises.readFile('example.md', 'utf-8'),
            fs.promises.readFile(path.join(__dirname, '../dist/output.css'), 'utf-8')
        ]);

        // Generate HTML
        const html = `
            <!DOCTYPE html>
            <html lang="en" class="h-full ${themeClass === 'dark-theme' ? 'bg-gray-900' : 'bg-gray-50'}">
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
                    
                    /* Development mode specific */
                    body::before {
                        content: '${theme ? `${theme} theme` : 'default theme'} - development mode';
                        display: block;
                        position: fixed;
                        bottom: 10px;
                        right: 10px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 4px 8px;
                        font-size: 12px;
                        border-radius: 4px;
                        z-index: 1000;
                    }
                </style>
            </head>
            <body class="h-full">
                <div class="min-h-full">
                    <div class="cv-container ${themeClass}">
                        <div class="cv-grid">
                            <header class="cv-header">
                                <h1 class="text-center">
                                    ${md.render(markdownContent).split('\n')[0].replace(/<[^>]*>/g, '')}
                                </h1>
                            </header>
                            
                            <aside class="cv-sidebar">
                                ${generateSidebar(markdownContent)}
                            </aside>

                            <main class="cv-main">
                                ${generateMainContent(markdownContent)}
                            </main>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send(`
            <html>
                <head>
                    <title>Error</title>
                    <style>
                        body { font-family: -apple-system, system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 600px; margin: 0 auto; }
                        h1 { color: #ef4444; }
                        pre { background: #f1f5f9; padding: 1rem; border-radius: 4px; overflow: auto; }
                        .suggestion { background: #ecfdf5; padding: 1rem; border-radius: 4px; margin-top: 1rem; }
                    </style>
                </head>
                <body>
                    <h1>Error rendering CV</h1>
                    <p>An error occurred while generating your CV:</p>
                    <pre>${error.message}</pre>
                    
                    <div class="suggestion">
                        <h3>💡 Suggestions:</h3>
                        <ul>
                            <li>Check if your Markdown file (example.md) exists and contains valid content.</li>
                            <li>Make sure you've built the CSS by running <code>npm run build:css</code>.</li>
                            <li>Try restarting the server with <code>npm run dev</code>.</li>
                        </ul>
                    </div>
                </body>
            </html>
        `);
    }
});

function generateSidebar(markdown) {
    const sections = markdown.split('\n## ');
    const sidebarSections = ['Details', 'Links', 'Skills'];
    
    return sections
        .filter(section => sidebarSections.some(title => section.startsWith(title)))
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

function generateMainContent(markdown) {
    const sections = markdown.split('\n## ');
    const mainSections = ['Profile', 'Employment History', 'References'];
    
    return sections
        .filter(section => mainSections.some(title => section.startsWith(title)))
        .map(section => {
            const [title, ...content] = section.split('\n');
            let sectionContent = md.render(content.join('\n'));
            
            if (title.trim() === 'Employment History') {
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
            } else if (title.trim() === 'Profile') {
                sectionContent = sectionContent
                    .replace(/<p>/g, '<p class="text-base text-gray-600 leading-relaxed">')
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(chalk.blue('\n🔍 CV Generator Development Server'));
    console.log(chalk.green(`✓ Preview available at http://localhost:${PORT}`));
    console.log(chalk.cyan(`✓ Theme options: http://localhost:${PORT}?theme=light or http://localhost:${PORT}?theme=dark\n`));
}); 