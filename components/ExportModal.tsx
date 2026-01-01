import React, { useState, useEffect } from 'react';
import type { CaptionLine, ExportStatus } from '../types';
import { ClipboardCheckIcon, ClipboardIcon, XIcon, LoaderIcon } from './Icons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  captions: CaptionLine[] | null;
  isExporting: boolean;
  exportStatus: ExportStatus;
  modalContent: 'srt' | 'mp4';
}

const formatSrtTimestamp = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000).toString().padStart(3, '0');
  return `${h}:${m}:${s},${ms}`;
};

const generateSrtContent = (captions: CaptionLine[]): string => {
  return captions
    .map((caption, index) => {
      const start = formatSrtTimestamp(caption.startTime);
      const end = formatSrtTimestamp(caption.endTime);
      const text = `${caption.emoji || ''} ${caption.text}`.trim();
      return `${index + 1}\n${start} --> ${end}\n${text}\n`;
    })
    .join('\n');
};

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, captions, isExporting, exportStatus, modalContent }) => {
  const [srtContent, setSrtContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (captions && modalContent === 'srt') {
      setSrtContent(generateSrtContent(captions));
    }
  }, [captions, modalContent]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(srtContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  const renderSrtContent = () => (
    <>
      <header className="flex justify-between items-center p-4 border-b-4 border-black bg-gray-900">
        <h2 className="text-xl minecraft-title" style={{transform: 'none'}}>Export Captions</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <XIcon className="w-6 h-6" />
        </button>
      </header>
      <div className="p-4 overflow-y-auto bg-black">
        <pre className="w-full text-sm bg-black p-4 border-2 border-[#8b8b8b] text-gray-300 whitespace-pre-wrap font-mono">
          <code>{srtContent}</code>
        </pre>
      </div>
      <footer className="p-4 border-t-4 border-black bg-gray-900">
        <button
          onClick={handleCopy}
          className="minecraft-btn w-full py-3 gap-2"
        >
          {copied ? <ClipboardCheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </footer>
    </>
  );
  
  const renderMp4Progress = () => {
      const STEP_TEXT: Record<string, string> = {
        initializing: 'Preparing pixels...',
        rendering: `Crafting frames... ${Math.round(exportStatus.progress)}%`,
        encoding: 'Saving to world...',
        done: 'Finished!'
      };
      const progressText = STEP_TEXT[exportStatus.step] || 'Working...';

      return (
        <div className="p-8 text-center bg-[#4a4a4a] border-4 border-black">
            <h2 className="text-2xl minecraft-title mb-6" style={{transform: 'none'}}>Exporting Video</h2>
            <div className="flex items-center justify-center gap-4 mb-6 text-[#55FFFF]">
                <LoaderIcon />
                <p className="font-mono uppercase tracking-widest">{progressText}</p>
            </div>
            <div className="w-full bg-black border-2 border-[#8b8b8b] h-8 relative overflow-hidden">
                <div 
                    className="bg-[#55FF55] h-full transition-all duration-150 relative" 
                    style={{width: `${exportStatus.progress}%`}}
                >
                    <div className="absolute inset-0 opacity-30 bg-white/20"></div>
                </div>
            </div>
            {exportStatus.step === 'done' && <p className="text-[#55FF55] mt-6 font-bold font-mono uppercase tracking-widest animate-bounce">Success! Checking loot chest...</p>}
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={isExporting ? undefined : onClose}>
      <div className="bg-gray-800 border-4 border-black shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {modalContent === 'mp4' ? renderMp4Progress() : renderSrtContent()}
      </div>
    </div>
  );
};