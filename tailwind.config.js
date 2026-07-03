/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        /* BUREC brand palette */
        primary: {
          50:  '#e6f4fd',
          100: '#b3dcf9',
          200: '#80c5f6',
          300: '#4daef2',
          400: '#2aa0ef',
          500: '#0A8FEF',  /* Bleu principal */
          600: '#0880d8',
          700: '#066ebf',
          800: '#045da6',
          900: '#005FB8',  /* Bleu foncé */
          950: '#004a92',
        },
        dark: {
          DEFAULT: '#005FB8',
          hover:   '#0A8FEF',
        },
        brand: {
          blue:       '#0A8FEF',
          'blue-dark':'#005FB8',
          green:      '#2DBE39',
          'green-2':  '#5AD14F',
          yellow:     '#F5D000',
        },
        accent: {
          50:  '#fffde6',
          100: '#fff9b3',
          200: '#fff080',
          300: '#ffe84d',
          400: '#F5D000',
          500: '#d4b400',
          600: '#b39900',
          700: '#8c7800',
          800: '#665800',
          900: '#3f3600',
        },
        success: {
          50:  '#edfbee',
          100: '#d0f5d2',
          200: '#a3eaa7',
          300: '#6ddb73',
          400: '#5AD14F',  /* Vert secondaire */
          500: '#2DBE39',  /* Vert principal */
          600: '#25a830',
          700: '#1c9026',
          800: '#14781d',
          900: '#0e5e15',
        },
        warning: {
          50:  '#fffde6',
          100: '#fff9b3',
          200: '#fff080',
          300: '#ffe84d',
          400: '#F5D000',  /* Jaune accent */
          500: '#d4b400',
          600: '#b39900',
          700: '#8c7800',
          800: '#665800',
          900: '#3f3600',
        },
        error: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#DC2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        neutral: {
          50:  '#F5F7FA',  /* Gris clair fond */
          100: '#edf0f5',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#6B7280',  /* Gris texte */
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      boxShadow: {
        soft:     '0 2px 8px -2px rgba(0,0,0,0.08), 0 4px 16px -4px rgba(0,0,0,0.06)',
        card:     '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)',
        elevated: '0 10px 30px -10px rgba(0,0,0,0.15), 0 4px 12px -4px rgba(0,0,0,0.08)',
        sidebar:  '4px 0 16px rgba(0,95,184,0.12)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        shimmer:    'shimmer 2s linear infinite',
        pulse:      'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-8px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.97)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
