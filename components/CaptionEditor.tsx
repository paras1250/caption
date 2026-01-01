import React, { useState, useRef, useEffect } from 'react';
import type { CaptionLine, ThemeName, ThemeConfig, CaptionPosition, AspectRatio } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { TrashIcon, PlusIcon, ImageIcon, CheckIcon, XIcon, TypeIcon, PaletteIcon, LayoutIcon, MicrophoneIcon, UndoIcon, RedoIcon } from './Icons';

interface CaptionEditorProps {
  captions: CaptionLine[];
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  onUpdateCaption: (index: number, newText: string) => void;
  onAddCaption: () => void;
  onDeleteCaption: (index: number) => void;
  onAcceptEmoji: (index: number) => void;
  onRejectEmoji: (index: number) => void;
  onExportSrt: () => void;
  onExportMp4: () => void;
  isExporting: boolean;
  onSeek: (time: number) => void;
  activeThemeConfig: ThemeConfig;
  onActiveThemeConfigChange: (config: ThemeConfig) => void;
  captionPosition: CaptionPosition;
  onCaptionPositionChange: (position: CaptionPosition) => void;
  backgroundImage: string | null;
  onBackgroundImageSelect: (file: File) => void;
  onRemoveBackgroundImage: () => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(0).padStart(2, '0')}`;
};

export const CaptionEditor: React.FC<CaptionEditorProps> = (props) => {
  const {
    captions, theme, onThemeChange, onUpdateCaption, onAddCaption, onDeleteCaption, 
    onAcceptEmoji, onRejectEmoji, onExportSrt, onExportMp4, isExporting, onSeek, 
    activeThemeConfig, onActiveThemeConfigChange, captionPosition, onCaptionPositionChange, 
    backgroundImage, onBackgroundImageSelect, onRemoveBackgroundImage,
    aspectRatio, onAspectRatioChange, onUndo, onRedo, canUndo, canRedo
  } = props;
  
  const [activeTab, setActiveTab] = useState<'captions' | 'style' | 'layout'>('captions');
  
  const tabs = [
    { id: 'captions', label: 'LYRICS' },
    { id: 'style', label: 'THEME' },
    { id: 'layout', label: 'WORLD' },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 mb-4">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`mc-button flex-grow ${activeTab === tab.id ? 'bg-[#b0b0b0] text-[#ffff55]' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {activeTab === 'captions' && (
          <div className="space-y-3">
            {captions.map((cap, i) => (
              <div key={i} className="flex gap-2 items-center">
                <button onClick={() => onSeek(cap.startTime)} className="mc-button text-xs w-16 h-10">
                  {formatTime(cap.startTime)}
                </button>
                <input 
                  className="mc-input flex-grow h-10" 
                  value={cap.text} 
                  onChange={(e) => onUpdateCaption(i, e.target.value)} 
                />
                <button onClick={() => onDeleteCaption(i)} className="mc-button h-10 text-[#FF5555]">X</button>
              </div>
            ))}
            <button onClick={onAddCaption} className="mc-button w-full py-4 text-xl">
              + ADD LINE
            </button>
          </div>
        )}

        {activeTab === 'style' && (
          <ThemeSelector 
            currentTheme={theme} 
            onThemeChange={onThemeChange} 
            activeThemeConfig={activeThemeConfig} 
            onActiveThemeConfigChange={onActiveThemeConfigChange} 
          />
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
             <div className="space-y-2">
                <p className="text-white mc-text-shadow">ASPECT RATIO</p>
                <div className="grid grid-cols-2 gap-2">
                    {(['16:9', '9:16', '1:1', '4:5'] as AspectRatio[]).map(r => (
                        <button key={r} onClick={() => onAspectRatioChange(r)} className={`mc-button ${aspectRatio === r ? 'text-[#ffff55]' : ''}`}>{r}</button>
                    ))}
                </div>
             </div>
             <div className="space-y-2">
                <p className="text-white mc-text-shadow">BACKGROUND</p>
                <div className="flex gap-2">
                    <label className="mc-button flex-grow cursor-pointer text-center">
                        {backgroundImage ? 'CHANGE IMAGE' : 'UPLOAD IMAGE'}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onBackgroundImageSelect(e.target.files[0])} />
                    </label>
                    {backgroundImage && <button onClick={onRemoveBackgroundImage} className="mc-button text-[#FF5555]">X</button>}
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t-2 border-[#373737] space-y-2">
        <div className="flex gap-2 mb-4">
            <button onClick={onUndo} disabled={!canUndo} className="mc-button flex-grow">UNDO</button>
            <button onClick={onRedo} disabled={!canRedo} className="mc-button flex-grow">REDO</button>
        </div>
        <button onClick={onExportMp4} disabled={isExporting} className="mc-button w-full py-6 text-2xl text-[#55ff55]">
          {isExporting ? 'SAVING...' : 'EXPORT VIDEO'}
        </button>
      </div>
    </div>
  );
};