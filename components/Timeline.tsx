import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PlayIcon, PauseIcon } from './Icons';
import type { CaptionLine } from '../types';

interface TimelineProps {
  captions: CaptionLine[] | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onUpdateCaptionTime: (index: number, startTime: number, endTime: number) => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Timeline: React.FC<TimelineProps> = ({ captions, currentTime, duration, isPlaying, onPlayPause, onSeek, onUpdateCaptionTime }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<{
    index: number;
    type: 'drag' | 'resize-start' | 'resize-end';
    initialMouseX: number;
    initialStartTime: number;
    initialEndTime: number;
  } | null>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('.caption-block')) return;
    if (!timelineRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * duration;
    onSeek(newTime);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number, type: 'drag' | 'resize-start' | 'resize-end') => {
    e.stopPropagation(); if (!captions) return;
    setActiveDrag({
      index, type, initialMouseX: e.clientX,
      initialStartTime: captions[index].startTime,
      initialEndTime: captions[index].endTime,
    });
  }, [captions]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeDrag || !timelineRef.current || !captions || !duration) return;
    e.preventDefault();
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const deltaTime = ((e.clientX - activeDrag.initialMouseX) / timelineRect.width) * duration;
    
    let newStartTime = activeDrag.initialStartTime;
    let newEndTime = activeDrag.initialEndTime;
    const minDur = 0.2;

    if (activeDrag.type === 'drag') {
        const d = activeDrag.initialEndTime - activeDrag.initialStartTime;
        newStartTime = Math.max(0, Math.min(duration - d, activeDrag.initialStartTime + deltaTime));
        newEndTime = newStartTime + d;
    } else if (activeDrag.type === 'resize-start') {
        newStartTime = Math.max(0, Math.min(activeDrag.initialEndTime - minDur, activeDrag.initialStartTime + deltaTime));
    } else if (activeDrag.type === 'resize-end') {
        newEndTime = Math.max(activeDrag.initialStartTime + minDur, Math.min(duration, activeDrag.initialEndTime + deltaTime));
    }
    onUpdateCaptionTime(activeDrag.index, newStartTime, newEndTime);
  }, [activeDrag, captions, duration, onUpdateCaptionTime]);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setActiveDrag(null), { once: true });
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeDrag, handleMouseMove]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button onClick={onPlayPause} className="mc-button p-2">
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>
        <div className="text-2xl text-[#ffff55] mc-text-shadow font-mono">{formatTime(currentTime)} / {formatTime(duration)}</div>
      </div>
      
      <div 
        ref={timelineRef}
        className="w-full h-12 mc-panel bg-[#4a4a4a] cursor-pointer relative" 
        onClick={handleTimelineClick}
      >
        <div className="absolute inset-0 z-10">
          {captions && duration > 0 && captions.map((caption, index) => {
            const left = (caption.startTime / duration) * 100;
            const width = ((caption.endTime - caption.startTime) / duration) * 100;
            return (
              <div
                key={index}
                className="caption-block absolute h-8 top-1 bg-[#8b8b8b] border-2 border-white cursor-grab active:cursor-grabbing text-white text-xs flex items-center justify-center overflow-hidden"
                style={{ left: `${left}%`, width: `${width}%` }}
                onMouseDown={(e) => handleMouseDown(e, index, 'drag')}
              >
                <div className="absolute left-0 top-0 h-full w-2 cursor-ew-resize" onMouseDown={(e) => handleMouseDown(e, index, 'resize-start')}></div>
                <span className="px-2 truncate">{caption.text}</span>
                <div className="absolute right-0 top-0 h-full w-2 cursor-ew-resize" onMouseDown={(e) => handleMouseDown(e, index, 'resize-end')}></div>
              </div>
            );
          })}
        </div>
        <div className="absolute top-0 bottom-0 w-1 bg-[#ff5555] z-30" style={{ left: `${progress}%` }}>
           <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#ff5555] border border-white"></div>
        </div>
      </div>
    </div>
  );
};