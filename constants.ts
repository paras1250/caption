import type { Theme, ThemeName } from './types';

export const THEMES: Record<ThemeName, Theme> = {
  neon: {
    name: 'neon',
    label: 'Neon Glow',
    description: 'Bright and vibrant, perfect for electronic and pop music.',
    config: {
      textColor: '#06B6D4', // cyan-500
      fontWeight: '700',
      backgroundStyle: 'none',
      solidBackgroundColor: '#000000',
      fontFamily: 'Poppins',
      textAlign: 'center',
      fontSize: 60,
      fontStyle: 'normal',
      glowEnabled: true,
      glowColor: '#06B6D4',
      strokeEnabled: false,
      strokeColor: '#000000',
      strokeWidth: 2,
      gradientEnabled: false,
      gradientColor1: '#A78BFA',
      gradientColor2: '#F472B6',
    }
  },
  gradient: {
    name: 'gradient',
    label: 'Cool Gradient',
    description: 'Stylish and modern, great for hip-hop and R&B.',
    config: {
      textColor: '#FFFFFF', // This will be overridden by gradient
      fontWeight: '900',
      backgroundStyle: 'none',
      solidBackgroundColor: '#000000',
      fontFamily: 'Montserrat',
      textAlign: 'center',
      fontSize: 64,
      fontStyle: 'normal',
      glowEnabled: false,
      glowColor: '#FFFFFF',
      strokeEnabled: true,
      strokeColor: 'rgba(0,0,0,0.5)',
      strokeWidth: 2,
      gradientEnabled: true,
      gradientColor1: '#A78BFA', // violet-400
      gradientColor2: '#F472B6', // pink-400
    }
  },
  minimal: {
    name: 'minimal',
    label: 'Minimalist',
    description: 'Clean and readable, ideal for acoustic and classical tracks.',
    config: {
      textColor: '#FFFFFF',
      fontWeight: '700',
      backgroundStyle: 'translucent',
      solidBackgroundColor: '#000000',
      fontFamily: 'Lato',
      textAlign: 'center',
      fontSize: 56,
      fontStyle: 'normal',
      glowEnabled: false,
      glowColor: '#FFFFFF',
      strokeEnabled: false,
      strokeColor: '#000000',
      strokeWidth: 2,
      gradientEnabled: false,
      gradientColor1: '#A78BFA',
      gradientColor2: '#F472B6',
    }
  },
  cinematic: {
    name: 'cinematic',
    label: 'Cinematic',
    description: 'Classic movie subtitle style for a dramatic feel.',
    config: {
      textColor: '#FEF08A', // yellow-200
      fontWeight: '700',
      backgroundStyle: 'none',
      solidBackgroundColor: '#000000',
      fontFamily: 'Lato',
      textAlign: 'center',
      fontSize: 52,
      fontStyle: 'normal',
      glowEnabled: false,
      glowColor: '#000000',
      strokeEnabled: true,
      strokeColor: 'rgba(0,0,0,0.8)',
      strokeWidth: 4,
      gradientEnabled: false,
      gradientColor1: '#A78BFA',
      gradientColor2: '#F472B6',
    }
  },
  signature: {
    name: 'signature',
    label: 'Signature Style',
    description: 'Elegant, handwritten script with AI-suggested emojis.',
    config: {
      textColor: '#FFFFFF',
      fontWeight: '400',
      backgroundStyle: 'none',
      solidBackgroundColor: '#000000',
      fontFamily: 'Pacifico',
      textAlign: 'center',
      fontSize: 72,
      fontStyle: 'normal',
      glowEnabled: false,
      glowColor: '#FFFFFF',
      strokeEnabled: true,
      strokeColor: 'rgba(0,0,0,0.7)',
      strokeWidth: 1,
      gradientEnabled: false,
      gradientColor1: '#A78BFA',
      gradientColor2: '#F472B6',
    }
  },
};