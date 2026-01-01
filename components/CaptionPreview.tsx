import React, { useRef, useState, useEffect } from 'react';
import type { CaptionLine, CaptionPosition, AspectRatio } from '../types';

interface CaptionPreviewProps {
  currentCaption: CaptionLine | null;
  backgroundImage: string | null;
  customStyle?: React.CSSProperties;
  textAlign?: 'left' | 'center' | 'right';
  captionPosition: CaptionPosition;
  onCaptionPositionChange: (pos: CaptionPosition) => void;
  aspectRatio: AspectRatio;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

const aspectRatioToClass: Record<AspectRatio, string> = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
};

export const CaptionPreview: React.FC<CaptionPreviewProps> = ({ 
  currentCaption, 
  backgroundImage, 
  customStyle, 
  textAlign = 'center', 
  captionPosition, 
  onCaptionPositionChange,
  aspectRatio,
  fontSize,
  onFontSizeChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const aspectClass = aspectRatioToClass[aspectRatio] || 'aspect-video';

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent triggering drag if clicking on slider
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate percentage coordinates based on container dimensions
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      onCaptionPositionChange({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onCaptionPositionChange]);

  return (
    <div 
      ref={containerRef}
      className={`${aspectClass} w-full bg-[#000000] overflow-hidden relative border-4 border-[#373737] cursor-crosshair group`}
    >
      <img 
        src={backgroundImage || "https://picsum.photos/1280/720?grayscale&blur=2"} 
        alt="background" 
        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-80" 
      />
      
      <div 
        className="absolute z-20 pointer-events-none select-none w-full flex justify-center"
        style={{
          left: `${captionPosition.x}%`,
          top: `${captionPosition.y}%`,
          transform: `translate(-${captionPosition.x}%, -${captionPosition.y}%)`,
        }}
      >
        <div 
          onMouseDown={handleMouseDown}
          className={`pointer-events-auto p-4 cursor-move border-2 ${isDragging ? 'border-[#ffff55] bg-[#ffff55]/10' : 'border-transparent hover:border-white/20'} transition-colors relative`}
          style={{ textAlign }}
        >
          {currentCaption ? (
             <p 
                key={currentCaption.startTime} 
                className="leading-tight animate-text-focus-in inline-block"
                style={{ ...customStyle, margin: 0 }}
              >
              {`${currentCaption.emoji || ''} ${currentCaption.text}`.trim()}
            </p>
          ) : (
            <p className="text-xl text-[#ffff55] mc-text-shadow mc-pulse">DRAG TO ALIGN</p>
          )}

          {/* Quick Hand-Resize control */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 flex items-center gap-2 border border-white/20">
             <span className="text-[10px] text-white">SIZE</span>
             <input 
                type="range" min="12" max="120" value={fontSize} 
                onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                className="w-20 accent-[#ffff55]"
             />
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-30 font-mono text-xs text-[#ffff55] bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
        X: {Math.round(captionPosition.x)}% Y: {Math.round(captionPosition.y)}% | SIZE: {fontSize}PX
      </div>
    </div>
  );
};