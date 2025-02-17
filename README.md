# Markdown CV Generator

A modern, minimalist CV/resume generator that converts markdown to beautifully styled PDF documents. Built with Node.js, Express, and Tailwind CSS.

## Features

- 📝 Write your CV in simple Markdown
- 🎨 Modern, professional design with customizable styles
- 🖨 Export to PDF with perfect formatting
- 💻 Live preview during development
- 🎯 Responsive layout with proper A4 sizing
- ⚡ Fast and lightweight

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Markdown-CV-Generator.git
cd Markdown-CV-Generator

# Install dependencies
npm install

# Install globally for CLI usage
npm install -g .
```

## Usage

### Quick Start

1. Edit `example.md` with your CV content
2. Generate PDF:
```bash
markdowncv build --default
```

The generated PDF will be saved as `[title]-[name]-resume.pdf` in the project root.

### Development Mode

Start the development server to preview changes in real-time:

```bash
npm run dev
```

This will:
- Start a local server at http://localhost:3000
- Watch for changes in your markdown and CSS files
- Auto-reload when changes are detected

## CV Structure

Your markdown CV should follow this structure:

```markdown
# Title|Your Name

## Details
**Phone**  
[+1 234 567 890](tel:+1234567890)

## Links
[Portfolio](https://yoursite.com)

## Skills
- Skill 1
- Skill 2

## Profile
Your professional summary...

## Employment History
# Job Title
Period

Description

Key achievements:
- Achievement 1
- Achievement 2

## References
### Reference Name
Title  
Contact details
```

## Customization

### Styling

The CV uses Tailwind CSS for styling. Main style files:
- `src/styles/input.css`: Base styles and components
- `src/styles/themes/`: Custom theme directory (for future themes)

### Creating New Themes

1. Create a new theme file in `src/styles/themes/`:
```css
/* src/styles/themes/modern.css */
@layer components {
  .cv-container {
    /* Your styles */
  }
}
```

2. Update the CLI to support your theme:
```javascript
program
  .option('--theme <name>', 'Use custom theme')
  .action(async (options) => {
    const theme = options.theme || 'default';
    // Theme handling logic
  });
```

## Project Structure

```
.
├── src/
│   ├── cli.js          # CLI implementation
│   ├── index.js        # Development server
│   └── styles/         # CSS styles
├── dist/               # Built CSS
├── example.md         # Example CV
├── package.json
└── README.md
```

## Commands

- `markdowncv build --default`: Generate PDF with default style
- `markdowncv serve`: Start development server
- `npm run dev`: Start development environment
- `npm run build:css`: Build CSS only

## Technical Details

- **PDF Generation**: Uses Puppeteer for high-quality PDF export
- **Markdown Processing**: markdown-it for parsing
- **Styling**: Tailwind CSS for utility-first styling
- **Development**: Express server with hot reload

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Node.js and Express
- Styled with Tailwind CSS
- PDF generation powered by Puppeteer
- Markdown parsing by markdown-it