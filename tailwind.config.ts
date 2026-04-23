import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9f5f2',
          100: '#f3e9e1', 
          200: '#e6d2c2',
          300: '#d4b49a',
          400: '#c19670',
          500: '#a07651',
          600: '#5B3A1E', // Dark Brown - Main Primary
          700: '#4a2f18',
          800: '#3d2515',
          900: '#341f14',
          950: '#1a100a',
        },
        secondary: {
          50: '#f7f4f0',
          100: '#ede6de',
          200: '#ddd1c2',
          300: '#c8b49f',
          400: '#b09477',
          500: '#8B6543', // Medium Brown - Main Secondary
          600: '#7a5639',
          700: '#644630',
          800: '#523a29',
          900: '#443126',
          950: '#241914',
        },
        accent: {
          lime: {
            50: '#fef7ed',
            100: '#fdebd4',
            200: '#fad4a8',
            300: '#f6b871',
            400: '#f19438',
            500: '#E8731A', // Sunset Orange - Accent 1
            600: '#d95d16',
            700: '#b44915',
            800: '#903a18',
            900: '#753116',
            950: '#3f1708',
          },
          coral: {
            50: '#fefbf0',
            100: '#fdf5dc',
            200: '#fae9b8',
            300: '#f6d889',
            400: '#f2c655',
            500: '#F5A623', // Golden Yellow - Accent 2
            600: '#e08c1f',
            700: '#ba701c',
            800: '#96571d',
            900: '#7a481b',
            950: '#44250c',
          },
        },
        neutral: {
          50: '#faf8f5',
          100: '#f2ede6',
          200: '#e3d8cb',
          300: '#d1bfa7',
          400: '#bca181',
          500: '#a18863',
          600: '#8b7357',
          700: '#725d48', // Warm Gray Brown - Main Neutral
          800: '#5e4d3d',
          900: '#4d4034',
          950: '#2a221a',
        },
        background: {
          50: '#FFF8F0', // Cream - Main Background
          100: '#fef2e6',
          200: '#fce4cc',
          300: '#3D2415', // Dark Background for footer/dark sections
          light: '#FFECD2', // Light Accent for cards/subtle backgrounds
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        script: ['var(--font-script)', 'Dancing Script', 'cursive'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config