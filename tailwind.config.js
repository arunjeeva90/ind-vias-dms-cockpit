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
        'lteps-indigo': '#1a1050',
        'lteps-violet': '#2d1b69',
        'lteps-purple': '#4a1080',
        'lteps-magenta': '#e91e63',
        'lteps-pink': '#ff0066',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
