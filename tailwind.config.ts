import type { Config } from 'tailwindcss';
const plugin = require('tailwindcss/plugin');

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        brand: ['Inter', 'sans-serif'],
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          from: {
            backgroundPosition: '0 0',
          },
          to: {
            backgroundPosition: '-200% 0',
          },
        },
      },
      colors: {
        bristol: {
          50: '#eff5f6',
          100: '#cfe2e3',
          200: '#afced0',
          300: '#8ebabd',
          400: '#6ea7aa',
          500: '#558d91',
          600: '#426e71',
          700: '#2f4e50',
          800: '#1c2f30',
          900: '#091010',
        },
        athena: {
          50: '#e7fbfe',
          100: '#b7f2fb',
          200: '#87e9f8',
          300: '#57e0f5',
          400: '#27d7f2',
          500: '#0dbed8',
          600: '#0a94a8',
          700: '#076978',
          800: '#043f48',
          900: '#011518',
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }: { addVariant: any }) {
      addVariant('active', ['&.active', '.active &']);
    }),
  ],
};
