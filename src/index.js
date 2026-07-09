const express = require('express');
const fs = require('fs');
const path = require('path');
const picocolors = require('picocolors');
const { generateHTML } = require('./template');

const pc = picocolors;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('dist'));

app.get('/', async (req, res) => {
  try {
    const theme = req.query.theme || '';
    const options = {};
    if (theme === 'dark') options.defaultDark = true;
    else if (theme === 'light') options.light = true;
    else options.default = true;

    const [markdownContent, cssContent] = await Promise.all([
      fs.promises.readFile('example.md', 'utf-8'),
      fs.promises.readFile(path.join(__dirname, '../dist/output.css'), 'utf-8'),
    ]);

    const html = generateHTML(markdownContent, cssContent, options);

    const devNotice = `<style>
      body::before {
        content: '${theme || 'default'} theme — dev mode';
        display: block;
        position: fixed; bottom: 10px; right: 10px;
        background: rgba(0,0,0,0.7); color: white;
        padding: 4px 8px; font-size: 12px; border-radius: 4px; z-index: 1000;
      }
    </style>`;

    res.send(html.replace('</body>', devNotice + '\n</body>'));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`
      <html><head><title>Error</title>
      <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:600px;margin:0 auto}
      h1{color:#ef4444} pre{background:#f1f5f9;padding:1rem;border-radius:4px}
      .tip{background:#ecfdf5;padding:1rem;border-radius:4px;margin-top:1rem}</style>
      </head><body>
      <h1>Error rendering CV</h1>
      <pre>${error.message}</pre>
      <div class="tip"><h3>💡 Tips</h3>
      <ul><li>Check that example.md exists</li>
      <li>Run <code>npm run build:css</code> first</li>
      <li>Restart the server</li></ul></div>
      </body></html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(pc.blue('\n🔍 CV Generator'));
  console.log(pc.green(`  Preview: http://localhost:${PORT}`));
  console.log(pc.cyan(`  Themes:  http://localhost:${PORT}?theme=dark`));
  console.log(pc.cyan(`           http://localhost:${PORT}?theme=light\n`));
});
