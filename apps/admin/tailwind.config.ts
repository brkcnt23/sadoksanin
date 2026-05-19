import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/composables/**/*.{js,ts}',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E6F0F5',
          100: '#CCE1EB',
          200: '#99C3D8',
          300: '#66A5C4',
          400: '#3387B1',
          500: '#006A9D',
          600: '#005E89',
          700: '#005275',
          800: '#004266',
          900: '#003152',
          950: '#00213D',
        },
        accent: {
          50:  '#E6F4FC',
          100: '#CCE9F9',
          200: '#99D4F3',
          300: '#66BEED',
          400: '#33A9E7',
          500: '#0092D7',
          600: '#007AB3',
          700: '#00628F',
          800: '#004A6B',
          900: '#003147',
          950: '#001924',
        },
        ink: {
          50:  '#F5F5F5',
          100: '#E8E8E8',
          200: '#D1D1D1',
          300: '#B5B5B5',
          400: '#949494',
          500: '#737373',
          600: '#575757',
          700: '#404040',
          800: '#2B2B2B',
          900: '#1A1A1A',
          950: '#000000',
        },
      },
    },
  },
  plugins: [],
}
