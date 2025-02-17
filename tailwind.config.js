module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Trebuchet MS', 'sans-serif'],
      },
      spacing: {
        'page': '20mm', // For page margins
      },
      colors: {
        gray: {
          50: '#F9FAFB',
          // ... other shades
        },
      },
    },
  },
  plugins: [],
} 