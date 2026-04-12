/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#171E45',
          800: '#3C2052',
          700: '#73358B',
          300: '#AAB6DD',
        },
        secondary: {
          amber: '#D89524',
          sand: '#DDCC72',
          graphite: '#4A494A',
          gray: '#969696',
        },
      },
      borderRadius: {
        xl2: '1rem',
      },
      boxShadow: {
        glass: '0 18px 45px rgba(23, 30, 69, 0.12)',
        soft: '0 8px 28px rgba(60, 32, 82, 0.12)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease both',
      },
    },
  },
  plugins: [],
};
