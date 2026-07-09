const markdownit = require('markdown-it');
const md = markdownit({ breaks: true });

const SIDEBAR_SECTIONS = ['Details', 'Links', 'Skills'];
const MAIN_SECTIONS = ['Profile', 'Employment History', 'References'];

function parseHeader(markdown) {
  const firstLine = markdown.split('\n')[0];
  const headerText = firstLine.replace('# ', '').trim();
  const parts = headerText.split('|').map(s => s.trim());
  return {
    title: parts[0] || 'developer',
    name: parts[1] || 'resume',
    headerText: headerText || 'CV',
  };
}

function parseSections(markdown) {
  const blocks = markdown.split('\n## ');
  const headerBlock = blocks[0];
  const sectionBlocks = blocks.slice(1);

  const header = parseHeader(headerBlock);

  const sections = sectionBlocks
    .filter(block => block.trim())
    .map(block => {
      const lines = block.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();

      let type = 'other';
      if (SIDEBAR_SECTIONS.includes(title)) type = 'sidebar';
      else if (MAIN_SECTIONS.includes(title)) type = 'main';

      return { title, content, type, rawHtml: md.render(content) };
    });

  return {
    title: header.title,
    name: header.name,
    headerText: header.headerText,
    sections,
    sidebar: sections.filter(s => s.type === 'sidebar'),
    main: sections.filter(s => s.type === 'main'),
  };
}

module.exports = { parseHeader, parseSections };
