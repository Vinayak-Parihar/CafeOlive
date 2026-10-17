/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Existing oliv-* tokens (used by admin/chef/waiter dashboards) ──
        oliv: {
          green: '#3E5641',
          gold: '#C5A059',
          cream: '#F9F6EE',
          dark: '#2C2621',
          brown: '#8B5A2B',
        },
        // ── Stitch "Organic Sophistication" design system tokens ──
        primary: '#004435',
        'primary-container': '#0b5d4b',
        'deep-olive': '#0b5d4b',
        'on-primary': '#ffffff',
        'on-primary-container': '#8cd3bc',
        'on-primary-fixed': '#002018',
        'on-primary-fixed-variant': '#005140',
        'primary-fixed': '#a9f1d9',
        'primary-fixed-dim': '#8dd4bd',
        'inverse-primary': '#8dd4bd',

        secondary: '#605e58',
        'secondary-container': '#e6e2da',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#66645e',
        'secondary-fixed': '#e6e2da',
        'secondary-fixed-dim': '#c9c6bf',
        'on-secondary-fixed': '#1c1c17',
        'on-secondary-fixed-variant': '#484741',

        tertiary: '#4e3700',
        'tertiary-container': '#684e11',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#e6c179',
        'tertiary-fixed': '#ffdea3',
        'tertiary-fixed-dim': '#e7c17a',
        'on-tertiary-fixed': '#261900',
        'on-tertiary-fixed-variant': '#5c4304',

        'soft-gold': '#e7c17a',
        'ivory-surface': '#fff8f5',

        surface: '#fff8f5',
        'surface-dim': '#e1d8d4',
        'surface-bright': '#fff8f5',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#fbf2ed',
        'surface-container': '#f5ece7',
        'surface-container-high': '#efe6e2',
        'surface-container-highest': '#e9e1dc',
        'surface-tint': '#1f6a57',
        'surface-variant': '#e9e1dc',
        'surface-border': '#e9e1dc',

        background: '#fff8f5',
        'on-background': '#1e1b18',
        'on-surface': '#1e1b18',
        'on-surface-variant': '#3f4945',
        'inverse-surface': '#34302c',
        'inverse-on-surface': '#f8efea',

        outline: '#6f7975',
        'outline-variant': '#bec9c3',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // ── Design Cafe tokens ──
        linen: '#fbf9f3',
        'linen-dark': '#f3efe6',
        'cream-surface': '#f5f3ee',
        'olive-deep': '#1e2a1b',
        'olive-rich': '#253723',
        'olive-muted': '#4a5b46',
        'olive-light': '#e9ede6',
        'sage-accent': '#8b9d83',
        'gold-accent': '#c2a677',
        'gold-subtle': '#e7d8bd',
        'charcoal-soft': '#2c2d2b',
      },
      fontFamily: {
        // Stitch typography
        'display-lg': ['"Playfair Display"', 'serif'],
        'headline-lg': ['"Playfair Display"', 'serif'],
        'headline-lg-mobile': ['"Playfair Display"', 'serif'],
        'headline-md': ['"Playfair Display"', 'serif'],
        'body-lg': ['"Plus Jakarta Sans"', '"Montserrat"', 'sans-serif'],
        'body-md': ['"Plus Jakarta Sans"', '"Montserrat"', 'sans-serif'],
        'label-caps': ['"Plus Jakarta Sans"', '"Montserrat"', 'sans-serif'],
        // Existing tokens
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Montserrat"', '"Inter"', '"Poppins"', 'sans-serif'],
      },
      fontSize: {
        // Stitch type scale
        'display-lg': ['64px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['48px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg-mobile': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'headline-md': ['32px', { lineHeight: '1.3', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0.01em', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '1.0', letterSpacing: '0.1em', fontWeight: '600' }],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      spacing: {
        'section-gap': '120px',
        'margin-desktop': '64px',
        'margin-mobile': '20px',
        'container-max': '1280px',
        gutter: '24px',
        unit: '8px',
      },
      maxWidth: {
        'container-max': '1280px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scroll-left': 'scroll-left 80s linear infinite',
        'scroll-right': 'scroll-right 80s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}