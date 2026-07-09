const { parseSections } = require('./parser');
const { renderSidebar, renderMainContent } = require('./renderer');

function generateHTML(markdownContent, cssContent, options = {}) {
  const cv = parseSections(markdownContent);

  let themeClass = '';
  let htmlClass = 'bg-gray-50';
  if (options.defaultDark) {
    themeClass = 'dark-theme';
    htmlClass = 'bg-gray-900';
  } else if (options.light || options.default) {
    themeClass = 'theme--light';
  }

  return `<!DOCTYPE html>
<html lang="en" class="h-full ${htmlClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - ${cv.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet">
  <style>${cssContent}</style>
</head>
<body class="h-full">
  <div class="min-h-full">
    <div class="cv-container ${themeClass}">
      <div class="cv-grid">
        <header class="cv-header">
          <h1 class="text-center">${cv.headerText}</h1>
        </header>
        <aside class="cv-sidebar">
          ${renderSidebar(cv.sidebar)}
        </aside>
        <main class="cv-main">
          ${renderMainContent(cv.main)}
        </main>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { generateHTML };
