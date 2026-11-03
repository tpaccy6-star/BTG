import colors from 'tailwindcss/colors';

const defaultColors = Object.fromEntries(
  Object.entries(colors).filter(
    ([name]) => !['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray'].includes(name),
  ),
);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      ...defaultColors,
      blue: {
        50: '#eff4fb',
        100: '#dce7f5',
        200: '#bfd1e9',
        300: '#9cb8d9',
        400: '#7398c4',
        500: '#4c78ab',
        600: '#3b6291',
        700: '#2d4d78',
        800: '#223e66',
        900: '#1a365f',
        950: '#10284b',
        955: '#000320',
      },
      yellow: {
        50: '#fff9e6',
        100: '#fff2bf',
        200: '#ffe580',
        300: '#fdd74a',
        350: '#f9d03d',
        400: '#fdc306',
        500: '#e0aa00',
        600: '#b48700',
        700: '#8a6800',
        800: '#695000',
        900: '#4d3a00',
        950: '#302400',
      },
      slate: {
        50: '#f7f7f7',
        100: '#f0f0f0',
        200: '#e9e9e9',
        300: '#d2d2d2',
        400: '#9b9b9b',
        500: '#666666',
        600: '#525252',
        700: '#3d3d3d',
        800: '#2d2d2d',
        805: '#292929',
        850: '#252525',
        900: '#232323',
        950: '#171717',
        955: '#000320',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'],
        display: ['Quicksand', 'Nunito Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
