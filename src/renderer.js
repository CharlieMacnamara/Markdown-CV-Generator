const sectionRenderers = {
  Skills(html) {
    return html
      .replace(/<ul>/g, '<div class="skills-grid">')
      .replace(/<\/ul>/g, '</div>')
      .replace(/<li>/g, '<div class="skill-item">')
      .replace(/<\/li>/g, '</div>')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '');
  },

  Details(html) {
    return html
      .replace(/<p><strong>/g, '<div class="details-item"><div class="details-label">')
      .replace(/<\/strong><\/p>/g, '</div>')
      .replace(/<p>/g, '<div class="details-value">')
      .replace(/<\/p>/g, '</div></div>');
  },

  Links(html) {
    return html
      .replace(/<p>/g, '<div class="details-item">')
      .replace(/<\/p>/g, '</div>')
      .replace(/<a /g, '<a class="text-blue-600 hover:text-blue-800" ');
  },

  Profile(html) {
    return html.replace(/<p>/g, '<p class="text-base text-gray-600 leading-relaxed">');
  },

  'Employment History'(html) {
    return html
      .replace(/<h3>/g, '<div class="job-entry"><div class="job-header"><h3 class="job-title">')
      .replace(/<\/h3>/g, '</h3>')
      .replace(
        /<p>((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[—–-]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|Present|Current))<\/p>/g,
        '<div class="job-period">$1</div></div>'
      )
      .replace(/<p>Notable clients:<\/p>/g, '<h4 class="job-section-title">Notable clients:</h4>')
      .replace(
        /<p>((?!Notable clients:|Key achievements:|Achievements:).+?)<\/p>/g,
        '<p class="job-description">$1</p>'
      )
      .replace(
        /<p>(Key achievements:|Achievements:)<\/p>/g,
        '<h4 class="job-section-title">$1</h4>'
      )
      .replace(/<ul>/g, '<ul class="achievements-list">')
      .replace(/<li>/g, '<li class="achievement-item">')
      .replace(/<\/div>\s*(?!<div class="job-entry">|$)/g, '</div>');
  },

  References(html) {
    return (
      '<div class="reference-section">' +
      html
        .replace(/<h3>/g, '<div class="reference-card">\n<h3 class="reference-name">')
        .replace(/<\/h3>\s*<p>/g, '</h3>\n<div class="reference-content">\n<div class="reference-position">')
        .replace(/<br>\s*<a/g, '</div>\n<a')
        .replace(/<a /g, '<a class="reference-contact" ')
        .replace(/<\/p>/g, '</div></div>') +
      '</div>'
    );
  },
};

function renderSection(section) {
  const renderFn = sectionRenderers[section.title];
  if (!renderFn) return '';

  const content = renderFn(section.rawHtml);

  return `
    <section class="section">
      <h2 class="section-title">${section.title}</h2>
      ${content}
    </section>
  `;
}

function renderSidebar(sections) {
  return sections.map(renderSection).join('');
}

function renderMainContent(sections) {
  return sections.map(renderSection).join('');
}

module.exports = { renderSidebar, renderMainContent };
