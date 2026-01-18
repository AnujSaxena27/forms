/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      // APPLICATION FORM EXACT COLOR PALETTE
      // Deep black with blue tint - Premium dark aesthetic
      colors: {
        // Primary backgrounds
        appBg: '#050B0E',
        appBgSecondary: '#0B1418',
        
        // Accent colors - Teal/Cyan glow
        accentPrimary: '#00E5FF',
        accentPrimarySecondary: '#00B4D8',
        
        // Text colors
        textPrimary: '#EAF6F8',
        textPrimarySecondary: 'rgba(234, 246, 248, 0.7)',
        textPrimaryMuted: 'rgba(234, 246, 248, 0.45)',
        
        // Border color
        zenBorder: 'rgba(255, 255, 255, 0.08)',
        
        // Keep existing primary for backward compatibility
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      // Application Typography - Playfair Display for headings, Inter for body
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'text-hero': ['4.5rem', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.02em' }],
        'text-display': ['3.5rem', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.02em' }],
        'text-headline': ['2.5rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
        'text-title': ['1.75rem', { lineHeight: '1.3', fontWeight: '500' }],
        'text-body': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'text-small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      boxShadow: {
        soft: '0 10px 25px -5px rgba(2, 132, 199, 0.2), 0 8px 10px -6px rgba(2, 132, 199, 0.15)',
        // Application-specific shadows
        'app-glow': '0 0 20px rgba(0, 229, 255, 0.4)',
        'app-glow-lg': '0 0 40px rgba(0, 229, 255, 0.6)',
        'form-card': '0 20px 60px rgba(0, 0, 0, 0.6)',
        'form-input': '0 0 0 1px rgba(0, 229, 255, 0.5)',
      },
      // Application spacing rhythm
      spacing: {
        'space-xs': '0.5rem',
        'space-sm': '1rem',
        'space-md': '2rem',
        'space-lg': '4rem',
        'space-xl': '6rem',
        'space-2xl': '8rem',
      },
      // Border radius for glass panels
      borderRadius: {
        'zen': '14px',
        'space-lg': '20px',
      },
      // Background images for gradients
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #00E5FF, #00B4D8)',
        'app-radial': 'radial-gradient(circle at 50% 0%, rgba(0, 229, 255, 0.1), transparent 50%)',
      },      // Animations for smooth reveals
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 217, 255, 0.6)' },
        },
      },    },
  },
  plugins: [],
}
