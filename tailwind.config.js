/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dms-dark': '#0a0e17',
        'dms-panel': '#131a2b',
        'dms-accent': '#00d4ff',
        'dms-warning': '#ff6b35',
        'dms-danger': '#ff2d55',
        'dms-success': '#00e676',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
