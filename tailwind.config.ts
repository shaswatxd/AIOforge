import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#60A5FA',
          pressed: '#2563EB'
        },
        surface: {
          light: 'rgba(255,255,255,0.72)',
          dark: 'rgba(32,32,32,0.72)'
        },
        base: {
          light: '#F3F3F3',
          dark: '#202020'
        }
      },
      borderRadius: {
        fluent: '8px',
        'fluent-lg': '12px'
      },
      backdropBlur: {
        acrylic: '30px'
      },
      boxShadow: {
        fluent: '0 8px 24px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.08)',
        'fluent-lg': '0 16px 48px rgba(0,0,0,0.18)'
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', 'system-ui', 'sans-serif']
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite'
      }
    }
  },
  plugins: []
} satisfies Config
