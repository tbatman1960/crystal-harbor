import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#253b32',
        cream: '#faf8f2',
        sage: '#e3e9df',
        clay: '#a45e45',
      },
    },
  },
  plugins: [],
} satisfies Config;
