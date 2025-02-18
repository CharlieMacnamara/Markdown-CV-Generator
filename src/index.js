const express = require('express');
const markdownit = require('markdown-it');
const fs = require('fs');
const path = require('path');

const app = express();
const md = markdownit();

// Serve static files from dist
app.use(express.static('dist'));

// Main route
app.get('/', async (req, res) => {
    try {
        // Read markdown and CSS
        const [markdownContent, cssContent] = await Promise.all([
            fs.promises.readFile('example.md', 'utf-8'),
            fs.promises.readFile(path.join(__dirname, '../dist/output.css'), 'utf-8')
        ]);

        // Generate HTML
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${cssContent}</style>
            </head>
            <body>
                <div class="cv-container">
                    <div class="cv-split-bg"></div>
                    <div class="cv-wrapper">
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
                </div>
            </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send(error.message);
    }
});

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
                <section class="section">
                    <h2 class="section-title">${title.trim()}</h2>
                    <div class="section-content">
                        ${sectionContent}
                    </div>
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
            
            if (title.trim() === 'Employment History') {
                sectionContent = sectionContent
                    .replace(/<h1>/g, '<div class="job-entry"><h3 class="job-title">')
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
                    .replace(/<h3>/g, '<div class="reference-entry"><h3 class="reference-name">')
                    .replace(/<p>/g, '<p class="reference-title">')
                    .replace(/(<a href="mailto:|<a href="tel:)([^"]+)("[^>]*>)/g, 
                        '<span class="reference-contact">$1$2$3')
                    .replace(/<\/p>\s*(?!<div class="reference-entry">|$)/g, '</p></div>');
            }
            
            return `
                <section class="section">
                    <h2 class="section-title">${title.trim()}</h2>
                    <div class="section-content">
                        ${sectionContent}
                    </div>
                </section>
            `;
        })
        .join('');
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Preview available at http://localhost:${PORT}`);
}); 