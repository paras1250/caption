import React, { useMemo } from 'react';
import type { ThemeName, ThemeConfig, FontFamily } from '../types';
import { THEMES } from '../constants';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, AlertCircleIcon } from './Icons';

// --- Color Contrast Utilities ---
const hexToRgb = (hex: string): [number, number, number] | null => {
  if (!hex || typeof hex !== 'string') return null;
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
};

const getLuminance = (rgb: [number, number, number]): number => {
  const [r, g, b] = rgb.map(val => {
    const srgb = val / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrastRatio = (hex1: string, hex2: string): number => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

const checkContrast = (color1: string, color2: string): boolean => {
    const ratio = getContrastRatio(color1, color2);
    return ratio >= 4.5;
};
// --- End Color Contrast Utilities ---


interface ThemeSelectorProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  activeThemeConfig: ThemeConfig;
  onActiveThemeConfigChange: (config: ThemeConfig) => void;
}

const fontFamilies: FontFamily[] = ['Montserrat', 'Poppins', 'Fredoka', 'Pacifico', 'Lato', 'Great Vibes', 'Dancing Script'];

const ThemeEditor: React.FC<{ themeConfig: ThemeConfig, onThemeConfigChange: (config: ThemeConfig) => void }> = ({ themeConfig, onThemeConfigChange }) => {
    const hasSufficientContrast = useMemo(() => {
        if (themeConfig.glowEnabled || themeConfig.strokeEnabled || themeConfig.gradientEnabled) {
            return true;
        }
        if (themeConfig.backgroundStyle === 'solid') {
            return checkContrast(themeConfig.textColor, themeConfig.solidBackgroundColor);
        }
        if (themeConfig.backgroundStyle === 'translucent') {
            return checkContrast(themeConfig.textColor, '#000000'); // Approx. check against black for translucent BG
        }
        return true;
    }, [themeConfig]);

    const lowContrastMessage = "Low contrast. Text may be hard to read. (WCAG AA)";

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-purple-300">Customize Theme</h2>
            
            {/* Text & Font Section */}
            <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2">Text & Font</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="textColor" className="text-sm text-gray-300">Text Color</label>
                        <div className="flex items-center gap-2">
                             {!hasSufficientContrast && (
                                <div title={lowContrastMessage}>
                                    <AlertCircleIcon className="w-5 h-5 text-yellow-400" />
                                </div>
                            )}
                            <input 
                                id="textColor"
                                type="color" 
                                value={themeConfig.textColor}
                                onChange={e => onThemeConfigChange({...themeConfig, textColor: e.target.value})}
                                className="w-10 h-8 p-0 border-none rounded bg-transparent cursor-pointer"
                                disabled={themeConfig.gradientEnabled}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="fontFamily" className="text-sm text-gray-300">Font Family</label>
                        <select
                            id="fontFamily"
                            value={themeConfig.fontFamily}
                            onChange={e => onThemeConfigChange({...themeConfig, fontFamily: e.target.value as ThemeConfig['fontFamily']})}
                            className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {fontFamilies.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="fontWeight" className="text-sm text-gray-300">Font Weight</label>
                        <select
                            id="fontWeight"
                            value={themeConfig.fontWeight}
                            onChange={e => onThemeConfigChange({...themeConfig, fontWeight: e.target.value as ThemeConfig['fontWeight']})}
                            className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="400">Normal</option>
                            <option value="700">Bold</option>
                            <option value="900">Extra Black</option>
                        </select>
                    </div>
                     <div className="flex items-center justify-between">
                        <label htmlFor="fontSize" className="text-sm text-gray-300">Font Size</label>
                        <div className="flex items-center gap-2">
                             <input
                                id="fontSize"
                                type="range"
                                min="20"
                                max="120"
                                value={themeConfig.fontSize}
                                onChange={e => onThemeConfigChange({ ...themeConfig, fontSize: parseInt(e.target.value, 10) })}
                                className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <input 
                                type="number"
                                min="10"
                                value={themeConfig.fontSize}
                                onChange={e => onThemeConfigChange({ ...themeConfig, fontSize: parseInt(e.target.value, 10) || 20 })}
                                className="w-16 bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-300">Alignment</label>
                        <div className="flex items-center gap-1 bg-gray-700 border border-gray-600 rounded-md p-1">
                            {(['left', 'center', 'right'] as const).map(align => (
                                <button 
                                    key={align}
                                    onClick={() => onThemeConfigChange({...themeConfig, textAlign: align})}
                                    className={`p-1 rounded transition-colors ${
                                        themeConfig.textAlign === align ? 'bg-purple-500 text-white' : 'text-gray-400 hover:bg-gray-600'
                                    }`}
                                    aria-label={`Align ${align}`}
                                >
                                    {align === 'left' && <AlignLeftIcon className="w-5 h-5" />}
                                    {align === 'center' && <AlignCenterIcon className="w-5 h-5" />}
                                    {align === 'right' && <AlignRightIcon className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Font Style</span>
                        <label htmlFor="fontStyle" className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                            <input
                                id="fontStyle"
                                type="checkbox"
                                checked={themeConfig.fontStyle === 'italic'}
                                onChange={e => onThemeConfigChange({ ...themeConfig, fontStyle: e.target.checked ? 'italic' : 'normal' })}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600 accent-purple-500"
                            />
                            Italic
                        </label>
                    </div>
                </div>
            </div>

            {/* Background Section */}
            <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2">Background</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="backgroundStyle" className="text-sm text-gray-300">Style</label>
                        <select
                            id="backgroundStyle"
                            value={themeConfig.backgroundStyle}
                            onChange={e => onThemeConfigChange({...themeConfig, backgroundStyle: e.target.value as ThemeConfig['backgroundStyle']})}
                            className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="none">None</option>
                            <option value="translucent">Translucent</option>
                            <option value="solid">Solid</option>
                        </select>
                    </div>
                    {themeConfig.backgroundStyle === 'solid' && (
                        <div className="flex items-center justify-between">
                            <label htmlFor="solidBackgroundColor" className="text-sm text-gray-300">BG Color</label>
                            <div className="flex items-center gap-2">
                                {!hasSufficientContrast && (
                                    <div title={lowContrastMessage}>
                                        <AlertCircleIcon className="w-5 h-5 text-yellow-400" />
                                    </div>
                                )}
                                <input 
                                    id="solidBackgroundColor"
                                    type="color" 
                                    value={themeConfig.solidBackgroundColor}
                                    onChange={e => onThemeConfigChange({...themeConfig, solidBackgroundColor: e.target.value})}
                                    className="w-10 h-8 p-0 border-none rounded bg-transparent cursor-pointer" 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
             {/* Text Effects Section */}
            <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2">Text Effects</h3>
                <div className="space-y-3">
                     {/* Gradient Controls */}
                    <div className="flex items-center justify-between">
                        <label htmlFor="gradientEnabled" className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
                            <input
                                id="gradientEnabled"
                                type="checkbox"
                                checked={themeConfig.gradientEnabled}
                                onChange={e => onThemeConfigChange({ ...themeConfig, gradientEnabled: e.target.checked })}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600 accent-purple-500"
                            />
                            Gradient Text
                        </label>
                        {themeConfig.gradientEnabled && (
                            <div className="flex items-center gap-1">
                                <input
                                    type="color"
                                    value={themeConfig.gradientColor1}
                                    onChange={e => onThemeConfigChange({ ...themeConfig, gradientColor1: e.target.value })}
                                    className="w-10 h-8 p-0 border-none rounded bg-transparent cursor-pointer"
                                />
                                <input
                                    type="color"
                                    value={themeConfig.gradientColor2}
                                    onChange={e => onThemeConfigChange({ ...themeConfig, gradientColor2: e.target.value })}
                                    className="w-10 h-8 p-0 border-none rounded bg-transparent cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                    {/* Glow Controls */}
                    <div className="flex items-center justify-between">
                        <label htmlFor="glowEnabled" className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
                            <input
                                id="glowEnabled"
                                type="checkbox"
                                checked={themeConfig.glowEnabled}
                                onChange={e => onThemeConfigChange({ ...themeConfig, glowEnabled: e.target.checked })}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600 accent-purple-500"
                            />
                            Glow
                        </label>
                        {themeConfig.glowEnabled && (
                            <input
                                type="color"
                                value={themeConfig.glowColor}
                                onChange={e => onThemeConfigChange({ ...themeConfig, glowColor: e.target.value })}
                                className="w-10 h-8 p-0 border-none rounded bg-transparent cursor-pointer"
                            />
                        )}
                    </div>
                    {/* Stroke Controls */}
                    <div className="flex items-center justify-between">
                        <label htmlFor="strokeEnabled" className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
                            <input
                                id="strokeEnabled"
                                type="checkbox"
                                checked={themeConfig.strokeEnabled}
                                onChange={e => onThemeConfigChange({ ...themeConfig, strokeEnabled: e.target.checked })}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600 accent-purple-500"
                            />
                            Outline
                        </label>
                        {themeConfig.strokeEnabled && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={themeConfig.strokeColor}
                                    onChange={e => onThemeConfigChange({ ...themeConfig, strokeColor: e.target.value })}
                                    className="w-10 h-8 p-0 border-none rounded bg-transparent cursor-pointer"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={themeConfig.strokeWidth}
                                    onChange={e => onThemeConfigChange({ ...themeConfig, strokeWidth: parseInt(e.target.value, 10) || 1 })}
                                    className="w-16 bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-white"
                                    aria-label="Outline width"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange, activeThemeConfig, onActiveThemeConfigChange }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {Object.values(THEMES).map((theme) => (
          <div key={theme.name}>
            <button
              onClick={() => onThemeChange(theme.name)}
              className={`w-full text-left p-3 rounded-md transition-all border-2 ${
                currentTheme === theme.name 
                  ? 'bg-purple-500/20 border-purple-400' 
                  : 'bg-gray-700/50 border-transparent hover:border-gray-500'
              }`}
            >
              <div className="font-semibold">{theme.label}</div>
              <p className="text-xs text-gray-400">{theme.description}</p>
            </button>
          </div>
        ))}
      </div>
      <ThemeEditor 
        themeConfig={activeThemeConfig}
        onThemeConfigChange={onActiveThemeConfigChange}
      />
    </div>
  );
};