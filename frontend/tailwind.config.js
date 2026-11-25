/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#17324D',     // Deep Civic Navy
          dark: '#0F2133',
          light: '#234668',
        },
        secondary: {
          DEFAULT: '#2563EB',     // Civic Action Blue
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        civic: {
          bg: '#F5F7FA',          // Clean Light Neutral Background
          card: '#FFFFFF',        // Card White
          surface: '#FFFFFF',
          border: '#E2E8F0',      // Soft Border
          primary: '#17324D',     // Primary Brand
          secondary: '#2563EB',   // Action Blue
          text: {
            DEFAULT: '#172B4D',   // Dark Charcoal / Slate Navy
            primary: '#172B4D',
            secondary: '#64748B', // Subdued Slate
            muted: '#94A3B8'
          },
          success: {
            DEFAULT: '#16A34A',
            bg: '#F0FDF4',
            border: '#BBF7D0',
            text: '#166534',
          },
          warning: {
            DEFAULT: '#D97706',
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
          },
          danger: {
            DEFAULT: '#DC2626',
            bg: '#FEF2F2',
            border: '#FECACA',
            text: '#991B1B',
          },
          info: {
            DEFAULT: '#0284C7',
            bg: '#F0F9FF',
            border: '#BAE6FD',
            text: '#0369A1',
          }
        }
      }
    },
  },
  plugins: [],
}
