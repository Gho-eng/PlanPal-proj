/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        dark: '#1E1E1E',
        gold: '#EDCA69',
        purple: '#7345AF'
      },
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 1vw + 0.5rem, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 1.5vw + 0.5rem, 1rem)',
        'fluid-base': 'clamp(1rem, 2vw + 0.5rem, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 2.5vw + 0.5rem, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 3vw + 0.5rem, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 3.5vw + 0.5rem, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 4vw + 0.5rem, 2.5rem)',
      },
      spacing: {
        'mobile-xs': '0.5rem',
        'mobile-sm': '0.75rem',
        'mobile-md': '1rem',
        'mobile-lg': '1.5rem',
        'desktop-xs': '1rem',
        'desktop-sm': '1.5rem',
        'desktop-md': '2rem',
        'desktop-lg': '3rem',
      },
    },
  },
  plugins: [],
}