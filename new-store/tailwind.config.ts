import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#3c2448',
        cream: '#fffaf6',
        sage: '#f2e8f7',
        clay: '#a8215d',
      },
    },
  },
  plugins: [],
} satisfies Config;
