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
      <header className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Export Captions (.srt format)</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <XIcon className="w-6 h-6" />
        </button>
      </header>
      <div className="p-4 overflow-y-auto">
        <pre className="w-full text-sm bg-gray-900 p-4 rounded-md text-gray-300 whitespace-pre-wrap">
          <code>{srtContent}</code>
        </pre>
      </div>
      <footer className="p-4 border-t border-gray-700">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          {copied ? <ClipboardCheckIcon className="w-5 h-5 mr-2" /> : <ClipboardIcon className="w-5 h-5 mr-2" />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </footer>
    </>
  );
  
  const renderMp4Progress = () => {
      const STEP_TEXT: Record<string, string> = {
        initializing: 'Setting up encoder & processing audio...',
        rendering: `Rendering frames... ${Math.round(exportStatus.progress)}%`,
        encoding: 'Encoding video...',
        done: 'Finalizing...'
      };
      const progressText = STEP_TEXT[exportStatus.step] || 'Processing...';

      return (
        <div className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-4">Exporting Video</h2>
            <div className="flex items-center justify-center gap-4 mb-4 text-cyan-300">
                <LoaderIcon />
                <p>{progressText}</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                    className="bg-cyan-500 h-2.5 rounded-full transition-all duration-150" 
                    style={{width: `${exportStatus.progress}%`}}
                ></div>
            </div>
            {exportStatus.step === 'done' && <p className="text-green-400 mt-4 font-semibold">Done! Your download will begin shortly.</p>}
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={isExporting ? undefined : onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {modalContent === 'mp4' ? renderMp4Progress() : renderSrtContent()}
      </div>
    </div>
  );
};