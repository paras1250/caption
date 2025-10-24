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
    return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
};

const CaptionPlacementSelector: React.FC<{
    current: CaptionPosition;
    onSelect: (pos: CaptionPosition) => void;
}> = ({ current, onSelect }) => {
    const positions: CaptionPosition[] = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right',
    ];
    return (
        <div className="grid grid-cols-3 gap-2">
            {positions.map(pos => (
                <button
                    key={pos}
                    onClick={() => onSelect(pos)}
                    className={`aspect-square rounded-md transition-colors ${
                        current === pos ? 'bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    aria-label={`Position ${pos.replace('-', ' ')}`}
                />
            ))}
        </div>
    );
};

const AspectRatioSelector: React.FC<{
    current: AspectRatio;
    onSelect: (ratio: AspectRatio) => void;
}> = ({ current, onSelect }) => {
    const ratios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:5'];
    return (
        <div className="grid grid-cols-4 gap-2">
            {ratios.map(ratio => (
                <button
                    key={ratio}
                    onClick={() => onSelect(ratio)}
                    className={`py-2 px-1 text-xs rounded-md transition-colors ${
                        current === ratio ? 'bg-purple-500 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    aria-label={`Aspect ratio ${ratio}`}
                >
                    {ratio}
                </button>
            ))}
        </div>
    );
};

export const CaptionEditor: React.FC<CaptionEditorProps> = (props) => {
  const {
    captions, theme, onThemeChange, onUpdateCaption, onAddCaption, onDeleteCaption, 
    onAcceptEmoji, onRejectEmoji, onExportSrt, onExportMp4, isExporting, onSeek, 
    activeThemeConfig, onActiveThemeConfigChange, captionPosition, onCaptionPositionChange, 
    backgroundImage, onBackgroundImageSelect, onRemoveBackgroundImage,
    aspectRatio, onAspectRatioChange,
    onUndo, onRedo, canUndo, canRedo
  } = props;
  
  const [activeTab, setActiveTab] = useState<'captions' | 'style' | 'layout'>('captions');
  const [listeningIndex, setListeningIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any | null>(null); // Use 'any' for browser-prefixed API

  // Effect to clean up speech recognition on component unmount
  useEffect(() => {
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, []);

  const handleToggleVoiceInput = (index: number) => {
    if (listeningIndex === index) {
        recognitionRef.current?.stop();
        setListeningIndex(null);
        return;
    }

    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Sorry, your browser doesn't support speech recognition.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
        setListeningIndex(index);
    };

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const existingText = captions[index].text;
        const newText = existingText ? `${existingText} ${transcript}` : transcript;
        onUpdateCaption(index, newText);
    };

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setListeningIndex(null);
    };

    recognition.onend = () => {
        setListeningIndex(null);
        recognitionRef.current = null;
    };

    recognition.start();
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onBackgroundImageSelect(e.target.files[0]);
      }
  };

  const tabs = [
    { id: 'captions', label: 'Captions', icon: <TypeIcon className="w-5 h-5" /> },
    { id: 'style', label: 'Style', icon: <PaletteIcon className="w-5 h-5" /> },
    { id: 'layout', label: 'Layout', icon: <LayoutIcon className="w-5 h-5" /> },
  ] as const;


  const renderContent = () => {
    switch(activeTab) {
      case 'captions':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-cyan-300">Edit Captions</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {captions.map((caption, index) => (
                <div key={caption.startTime + '-' + index} className="flex items-center gap-2 group">
                  <button 
                      onClick={() => onSeek(caption.startTime)} 
                      className="text-xs font-mono text-gray-400 hover:text-cyan-300 transition-colors p-1 rounded bg-gray-900/50"
                      title="Seek to this caption"
                  >
                      {formatTime(caption.startTime)}
                  </button>
                  {caption.emoji && (
                    <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-md border border-gray-600">
                      <span className="text-lg px-1" role="img" aria-label="Suggested emoji">{caption.emoji}</span>
                      <button
                        onClick={() => onAcceptEmoji(index)}
                        className="p-1 rounded-full bg-green-600/50 hover:bg-green-500 text-white transition-colors"
                        aria-label="Accept emoji suggestion"
                        title="Accept emoji"
                      >
                        <CheckIcon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onRejectEmoji(index)}
                        className="p-1 rounded-full bg-red-600/50 hover:bg-red-500 text-white transition-colors"
                        aria-label="Reject emoji suggestion"
                        title="Reject emoji"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                      type="text"
                      value={caption.text}
                      onChange={(e) => onUpdateCaption(index, e.target.value)}
                      className="flex-grow bg-gray-700/60 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={() => handleToggleVoiceInput(index)}
                    className={`p-2 rounded-md transition-colors ${
                        listeningIndex === index
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'text-gray-400 hover:text-cyan-300'
                    }`}
                    aria-label="Toggle voice input"
                    title="Toggle voice input"
                  >
                    <MicrophoneIcon className="w-4 h-4" />
                  </button>
                  <button
                      onClick={() => onDeleteCaption(index)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-2 opacity-50 group-hover:opacity-100"
                      aria-label="Delete caption"
                  >
                      <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
            ))}
            </div>
            <button
                onClick={onAddCaption}
                className="w-full flex items-center justify-center gap-2 mt-2 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
            >
                <PlusIcon className="w-4 h-4" /> Add Caption Line
            </button>
          </div>
        );
      case 'style':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-purple-300">Theme & Style</h2>
            <ThemeSelector 
                currentTheme={theme} 
                onThemeChange={onThemeChange} 
                activeThemeConfig={activeThemeConfig}
                onActiveThemeConfigChange={onActiveThemeConfigChange}
            />
          </div>
        );
      case 'layout':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-purple-300">Layout & Background</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                    <CaptionPlacementSelector current={captionPosition} onSelect={onCaptionPositionChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <AspectRatioSelector current={aspectRatio} onSelect={onAspectRatioChange} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Background</label>
                    <div className="flex items-stretch gap-2">
                        <label htmlFor="bg-upload" className="flex-grow w-full flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-md transition-colors cursor-pointer text-center">
                            <ImageIcon className="w-8 h-8 mb-1" />
                            <span className="text-xs">{backgroundImage ? 'Change' : 'Upload'} Image</span>
                        </label>
                        <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        {backgroundImage && (
                            <button 
                                onClick={onRemoveBackgroundImage} 
                                className="p-3 bg-red-600/50 hover:bg-red-600 text-white rounded-md transition-colors flex items-center justify-center"
                                aria-label="Remove background image"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
        );
    }
  };


  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-gray-700/50 pr-2">
        <div className="flex">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                activeTab === tab.id
                  ? 'border-b-2 border-cyan-400 text-cyan-300'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-white border-b-2 border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-md transition-colors text-gray-400 enabled:hover:bg-gray-700/50 enabled:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Undo"
            title="Undo"
          >
            <UndoIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-md transition-colors text-gray-400 enabled:hover:bg-gray-700/50 enabled:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Redo"
            title="Redo"
          >
            <RedoIcon className="w-5 h-5" />
          </button>
        </div>
      </div>


      <div className="flex-grow p-6 overflow-y-auto">
        {renderContent()}
      </div>

      <div className="p-6 border-t border-gray-700/50 space-y-4">
        <h2 className="text-lg font-semibold text-green-300">Export</h2>
        <div className="space-y-3">
             <button
              onClick={onExportSrt}
              disabled={isExporting}
              className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors"
            >
              Export .srt File
            </button>
            <button
              onClick={onExportMp4}
              disabled={isExporting}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors"
            >
              {isExporting ? 'Rendering...' : 'Export .mp4 Video'}
            </button>
        </div>
      </div>
    </div>
  );
};