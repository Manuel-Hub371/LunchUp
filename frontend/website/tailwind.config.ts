import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['var(--font-jakarta)', 'sans-serif'],
        dm: ['var(--font-dm)', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#F97316',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        warm: {
          50: '#FFFBF7',
          100: '#FFF1E6',
        },
        cream: {
          50: '#FFFBF7',
          100: '#FFF1E6',
        },
        charcoal: '#171717',
        muted: '#737373',
        'border-warm': '#ECE7E1',
        'brand-green': '#16A34A',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 6px 20px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 14px rgba(0, 0, 0, 0.06), 0 12px 30px rgba(0, 0, 0, 0.09)',
        'strong': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(249, 115, 22, 0.25)',
      },
    },
  },
  plugins: [],
}
export default config
