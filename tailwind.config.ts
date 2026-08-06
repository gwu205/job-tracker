import type { Config } from 'tailwindcss'

// Tokens sourced from DESIGN.md (Linear-inspired dark theme), adapted for an
// app UI rather than a marketing page.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5e6ad2',
          hover: '#828fff',
          focus: '#5e69d1',
        },
        ink: {
          DEFAULT: '#f7f8f8',
          muted: '#d0d6e0',
          subtle: '#8a8f98',
          tertiary: '#62666d',
        },
        canvas: '#010102',
        surface: {
          1: '#0f1011',
          2: '#141516',
          3: '#18191a',
          4: '#191a1b',
        },
        hairline: {
          DEFAULT: '#23252a',
          strong: '#34343a',
          tertiary: '#3e3e44',
        },
        success: '#27a644',
        danger: '#e5484d',
        warning: '#e5a000',
        info: '#4c9eeb',
        neutral: '#8a8f98',
      },
      fontFamily: {
        display: ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        text: ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '24px',
        pill: '9999px',
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '96px',
      },
      boxShadow: {
        'focus-ring': '0 0 0 2px rgba(94, 105, 209, 0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config
