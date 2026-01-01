import React from 'react';
import type { ThemeName, ThemeConfig, FontFamily } from '../types';
import { THEMES } from '../constants';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from './Icons';

interface ThemeSelectorProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  activeThemeConfig: ThemeConfig;
  onActiveThemeConfigChange: (config: ThemeConfig) => void;
}

const fontFamilies: FontFamily[] = ['Montserrat', 'Poppins', 'Fredoka', 'Pacifico', 'Lato', 'Great Vibes', 'Dancing Script', 'VT323'];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange, activeThemeConfig, onActiveThemeConfigChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-2">
        {Object.values(THEMES).map((theme) => (
          <button
            key={theme.name}
            onClick={() => onThemeChange(theme.name)}
            className={`mc-button w-full text-xl py-3 ${currentTheme === theme.name ? 'text-[#ffff55]' : ''}`}
          >
            {theme.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mc-panel bg-[#8b8b8b] space-y-4">
        <div className="flex justify-between items-center">
            <span className="mc-text-shadow text-white">FONT SIZE</span>
            <input 
                type="number" className="mc-input w-20" 
                value={activeThemeConfig.fontSize} 
                onChange={e => onActiveThemeConfigChange({...activeThemeConfig, fontSize: parseInt(e.target.value, 10) || 10})}
            />
        </div>
        <div className="flex justify-between items-center">
            <span className="mc-text-shadow text-white">TEXT COLOR</span>
            <input 
                type="color" className="h-10 w-20 border-2 border-white bg-black cursor-pointer" 
                value={activeThemeConfig.textColor} 
                onChange={e => onActiveThemeConfigChange({...activeThemeConfig, textColor: e.target.value})}
            />
        </div>
        <div className="flex justify-between items-center">
            <span className="mc-text-shadow text-white">ALIGNMENT</span>
            <div className="flex gap-1">
                <button 
                  onClick={() => onActiveThemeConfigChange({...activeThemeConfig, textAlign: 'left'})}
                  className={`mc-button p-2 ${activeThemeConfig.textAlign === 'left' ? 'text-[#ffff55]' : ''}`}
                  title="Align Left"
                >
                  <AlignLeftIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onActiveThemeConfigChange({...activeThemeConfig, textAlign: 'center'})}
                  className={`mc-button p-2 ${activeThemeConfig.textAlign === 'center' ? 'text-[#ffff55]' : ''}`}
                  title="Align Center"
                >
                  <AlignCenterIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onActiveThemeConfigChange({...activeThemeConfig, textAlign: 'right'})}
                  className={`mc-button p-2 ${activeThemeConfig.textAlign === 'right' ? 'text-[#ffff55]' : ''}`}
                  title="Align Right"
                >
                  <AlignRightIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        <div className="flex justify-between items-center">
            <span className="mc-text-shadow text-white">LINE COUNT</span>
            <div className="flex gap-1">
                <button 
                  onClick={() => onActiveThemeConfigChange({...activeThemeConfig, maxLines: 1})}
                  className={`mc-button px-4 py-1 text-xs ${activeThemeConfig.maxLines === 1 ? 'text-[#ffff55]' : ''}`}
                >
                  1 LINE
                </button>
                <button 
                  onClick={() => onActiveThemeConfigChange({...activeThemeConfig, maxLines: 2})}
                  className={`mc-button px-4 py-1 text-xs ${activeThemeConfig.maxLines === 2 ? 'text-[#ffff55]' : ''}`}
                >
                  2 LINES
                </button>
            </div>
        </div>
        <div className="flex justify-between items-center">
            <span className="mc-text-shadow text-white">FONT</span>
            <select 
                className="mc-input bg-black w-32" 
                value={activeThemeConfig.fontFamily}
                onChange={e => onActiveThemeConfigChange({...activeThemeConfig, fontFamily: e.target.value as FontFamily})}
            >
                {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
        </div>
      </div>
    </div>
  );
};