/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Heebo', 'system-ui', 'sans-serif'],
        sans: ['Assistant', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Dark Premium palette
        ink: '#EAE4D8',          // primary text (cream on black)
        ink2: '#C9C2B5',         // secondary text
        muted: '#8A8580',         // warm muted
        line: '#2A2826',          // subtle border on black
        line2: '#3A3835',         // slightly stronger border
        surface: '#141311',       // raised surface
        page: '#0A0908',          // deep black background
        gold: '#A88B5C',          // premium muted gold
        goldHover: '#BFA070',
        goldSoft: 'rgba(168, 139, 92, 0.15)',
        wa: '#25D366',
        waDark: '#1FB855',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
      },
      fontSize: {
        'mega': ['clamp(2.75rem, 7vw, 6rem)', { lineHeight: '0.98', letterSpacing: '-0.035em' }],
        'huge': ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.03', letterSpacing: '-0.025em' }],
      },
      maxWidth: {
        content: '1240px',
      },
    },
  },
  plugins: [],
}
