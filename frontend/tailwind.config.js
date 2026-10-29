/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aurora: {
          dark: '#080c14',
          card: 'rgba(15, 23, 42, 0.72)',
          border: 'rgba(51, 65, 85, 0.6)',
          cyan: '#38bdf8',
          mint: '#10b981',
          emerald: '#34d399',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#a855f7',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
