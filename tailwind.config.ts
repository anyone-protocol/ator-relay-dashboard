import type { Config } from 'tailwindcss';
const plugin = require('tailwindcss/plugin');

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        brand: ['Almarena Mono Display', 'sans-serif'],
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
    },
  },
  plugins: [
    plugin(function ({ addVariant }: { addVariant: any }) {
      addVariant('active', ['&.active', '.active &']);
    }),
  ],
};
