import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      // For convenience, Preflight sets the font family on the html element to match your configured sans font, so
      // one way to change the default font for your project is to customize the sans key in your fontFamily
      // configuration. source: https://tailwindcss.com/docs/font-family
      'sans': ['-apple-system','objektiv-mk1','Roboto','sans-serif']
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'rh-blue-900': '#04122F',
        'rh-blue-800': '#062247',
        'rh-blue-700': '#08355E',
        'rh-blue-600': '#0A4276',
        'rh-blue-500': '#0C5394',
        'rh-blue-400': '#429DF0',
        'rh-blue-300': '#71B5F4',
        'rh-blue-200': '#AAD3F8',
        'rh-blue-100': '#AAD3F8',
        'rh-neutral-900': '#161A1D',
        'rh-neutral-800': '#2B333B',
        'rh-neutral-700': '#576775',
        'rh-neutral-600': '#6C8093',
        'rh-neutral-500': '#879AAB',
        'rh-neutral-400': '#A3B4C3',
        'rh-neutral-300': '#CFD9E3',
        'rh-neutral-200': '#F2F5F7',
        'rh-neutral-100': '#FCFCFD',
        'rh-red-900': '#330000',
        'rh-red-800': '#4B0202',
        'rh-red-700': '#8A0F0F',
        'rh-red-600': '#BA1C1C',
        'rh-red-500': '#D22D2D',
        'rh-red-400': '#E14747',
        'rh-red-300': '#F28C8C',
        'rh-red-200': '#F28C8C',
        'rh-red-100': '#FFFAFA',
        'rh-green-900': '#001907',
        'rh-green-800': '#023C12',
        'rh-green-700': '#05611F',
        'rh-green-600': '#087827',
        'rh-green-500': '#0C9432',
        'rh-green-400': '#0DCE43',
        'rh-green-300': '#3DF571',
        'rh-green-200': '#C3FDD4',
        'rh-green-100': '#F5FFF8',
      },
      spacing: {
        '4px': '4px',
        '8px': '8px',
        '12px': '12px',
        '16px': '16px',
        '24px': '24px',
        '32px': '32px',
        '48px': '48px',
        '64px': '64px',
        '96px': '96px',
        '128px': '128px',
        '192px': '192px',
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '36px'],
        '5xl': ['48px', '58px'],
        '6xl': ['60px', '72px'],
        '7xl': ['72px', '86px'],
      },
      boxShadow: {
      //inset 0 0 0 1000px rgba(12,83,148,.95)',
        'rh-blue-transparent': 'inset 0 0 0 1000px rgba(12,83,148,.97)',
      }
    },
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        'h1': { color: theme('colors.rh-blue-800') },
        'h2': { color: theme('colors.rh-blue-700') },
        'h3': { color: theme('colors.rh-neutral-700') },
        'p': { color: theme('colors.rh-neutral-600') },
        'li': { color: theme('colors.rh-neutral-600') },
      })
    }
  ],
} satisfies Config;
