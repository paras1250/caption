import React from 'react';
import type { CaptionLine, CaptionPosition, AspectRatio } from '../types';

interface CaptionPreviewProps {
  currentCaption: CaptionLine | null;
  backgroundImage: string | null;
  customStyle?: React.CSSProperties;
  textAlign?: 'left' | 'center' | 'right';
  captionPosition: CaptionPosition;
  aspectRatio: AspectRatio;
}

const positionToFlex = {
    'top-left': 'justify-start items-start',
    'top-center': 'justify-center items-start',
    'top-right': 'justify-end items-start',
    'middle-left': 'justify-start items-center',
    'middle-center': 'justify-center items-center',
    'middle-right': 'justify-end items-center',
    'bottom-left': 'justify-start items-end',
    'bottom-center': 'justify-center items-end',
    'bottom-right': 'justify-end items-end',
};

const aspectRatioToClass: Record<AspectRatio, string> = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
};

export const CaptionPreview: React.FC<CaptionPreviewProps> = ({ currentCaption, backgroundImage, customStyle, textAlign = 'center', captionPosition, aspectRatio }) => {
  const justificationClass = positionToFlex[captionPosition] || 'justify-center items-end';
  const aspectClass = aspectRatioToClass[aspectRatio] || 'aspect-video';

  return (
    <div className={`${aspectClass} w-full bg-gray-900 rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-700/50`}>
      <img 
        src={backgroundImage || "https://picsum.photos/1280/720?grayscale&blur=2"} 
        alt="background" 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      <div className={`absolute inset-0 flex p-8 sm:p-12 md:p-16 ${justificationClass}`}>
        <div style={{ textAlign }}>
          {currentCaption ? (
             <p 
                key={currentCaption.startTime} 
                className={`leading-tight animate-text-focus-in inline-block`}
                style={customStyle}
              >
              {`${currentCaption.emoji || ''} ${currentCaption.text}`.trim()}
            </p>
          ) : (
            <p className="text-xl text-gray-400">Waiting for music to start...</p>
          )}
        </div>
      </div>
    </div>
  );
};