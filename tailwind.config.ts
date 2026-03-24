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
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1E3A8A', // Navy Blue - Main Primary
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94A3B8', // Silver - Main Secondary
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          lime: {
            50: '#fdfaf3',
            100: '#faf0d6',
            200: '#f5e0ad',
            300: '#edc976',
            400: '#d4a844',
            500: '#C4942A', // Gold - Accent 1
            600: '#a67a22',
            700: '#87611b',
            800: '#6e4f1a',
            900: '#5a4118',
            950: '#33230a',
          },
          coral: {
            50: '#f0f4f8',
            100: '#dce4ed',
            200: '#bcc9d9',
            300: '#9bafc5',
            400: '#7a94b0',
            500: '#8A9DB8', // Silver Blue - Accent 2
            600: '#5c7a9e',
            700: '#4a6380',
            800: '#3d5168',
            900: '#354557',
            950: '#222d3a',
          },
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#374151', // Charcoal - Main Neutral
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        background: {
          50: '#F8FAFC', // Off-White - Main Background
          100: '#f1f5f9',
          200: '#e2e8f0',
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