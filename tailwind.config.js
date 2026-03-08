/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F3460',
        accent: '#7C3AED',
        'accent-light': '#A78BFA',
        'bg-base': '#F7F8FC',
        'bg-dark': '#0D1B2A',
        'text-base': '#1E293B',
        'text-muted': '#64748B',
        success: '#059669',
        error: '#DC2626',
        warning: '#D97706',
        border: '#E2E8F0',
      },
      fontFamily: {
        heading: ['var(--font-jakarta)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
      },
      boxShadow: {
        card: '0 4px 32px rgba(15, 52, 96, 0.08)',
        hovCard: '0 8px 40px rgba(124, 58, 237, 0.15)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0F3460 0%, #7C3AED 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(124,58,237,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(15,52,96,0.1) 0px, transparent 50%)',
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(8px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
};
