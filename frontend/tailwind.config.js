/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#05070e',
        surface: '#0c1020',
        primary: '#0b1220',
        panel: 'rgba(14, 20, 38, 0.75)',
        "panel-border": 'rgba(42, 63, 110, 0.4)',
        // Tactical neon accents (single source of truth for the HUD palette)
        'neon-cyan': '#22e6f2',
        'neon-magenta': '#ff2d78',
        'neon-amber': '#ffb703',
        teal: '#0db7b5',   // safe
        amber: '#e6a23c',  // serious
        crimson: '#c94c4c',// fatal
        emerald: '#10b981',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      rotate: {
        '135': '135deg',
        '225': '225deg',
      },
      boxShadow: {
        'radar-grid': 'inset 0 0 30px rgba(0, 240, 255, 0.08)',
        'glow-cyan': '0 0 18px rgba(34, 230, 242, 0.45), 0 0 44px rgba(34, 230, 242, 0.18)',
        'glow-magenta': '0 0 18px rgba(255, 45, 120, 0.5), 0 0 48px rgba(255, 45, 120, 0.22)',
        'glow-amber': '0 0 18px rgba(255, 183, 3, 0.45), 0 0 44px rgba(255, 183, 3, 0.18)',
        'panel-soft': '0 18px 45px -22px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255,255,255,0.045)',
      },
      animation: {
        'pulse-fatal': 'pulseFatal 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'beacon': 'beacon 2s ease-in-out infinite',
        'spin-slow': 'spin 7s linear infinite',
        'ticker': 'ticker 34s linear infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'float-y': 'floatY 6s ease-in-out infinite',
        'sweep-x': 'sweepX 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'blink-fast': 'blink 1s steps(2, start) infinite',
        'rise-in': 'riseIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fatal-shake': 'fatalShake 0.45s ease-in-out infinite',
      },
      keyframes: {
        pulseFatal: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 45, 120, 0.35), inset 0 0 24px rgba(255, 45, 120, 0.22)' },
          '50%': { boxShadow: '0 0 55px rgba(255, 45, 120, 0.75), inset 0 0 45px rgba(255, 45, 120, 0.4)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        beacon: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
        sweepX: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fatalShake: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '25%': { transform: 'translate3d(-1.5px, 1px, 0)' },
          '75%': { transform: 'translate3d(1.5px, -1px, 0)' },
        },
      },
    },
  },
  plugins: [],
};
