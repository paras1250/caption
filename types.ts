export interface CaptionLine {
  startTime: number;
  endTime: number;
  text: string;
  emoji?: string;
}

export type ThemeName = 'neon' | 'gradient' | 'minimal' | 'cinematic' | 'signature';

export type FontFamily = 'Montserrat' | 'Poppins' | 'Fredoka' | 'Pacifico' | 'Lato' | 'Great Vibes' | 'Dancing Script';

export interface ThemeConfig {
  textColor: string;
  fontWeight: '400' | '700' | '900';
  backgroundStyle: 'none' | 'solid' | 'translucent';
  solidBackgroundColor: string;
  fontFamily: FontFamily;
  textAlign: 'left' | 'center' | 'right';
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  glowEnabled: boolean;
  glowColor: string;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  gradientEnabled: boolean;
  gradientColor1: string;
  gradientColor2: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  config: ThemeConfig;
}

export type CaptionPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type ExportStep = 'idle' | 'initializing' | 'rendering' | 'encoding' | 'done';

export interface ExportStatus {
  step: ExportStep;
  progress: number;
}

export interface EditorState {
  captions: CaptionLine[] | null;
  theme: ThemeName;
  themeConfigs: Record<ThemeName, ThemeConfig>;
  backgroundImage: string | null;
  captionPosition: CaptionPosition;
  aspectRatio: AspectRatio;
}