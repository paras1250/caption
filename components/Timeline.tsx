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

  const activeCaption = useMemo(() => {
    if (!captions) return null;
    return captions.find(cap => currentTime >= cap.startTime && currentTime <= cap.endTime) ?? null;
  }, [captions, currentTime]);


  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent seek if a caption drag is initiated from a child element
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('.caption-block')) {
        return;
    }
    if (!timelineRef.current || duration === 0) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    onSeek(newTime);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number, type: 'drag' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    if (!captions) return;

    setActiveDrag({
      index,
      type,
      initialMouseX: e.clientX,
      initialStartTime: captions[index].startTime,
      initialEndTime: captions[index].endTime,
    });
  }, [captions]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeDrag || !timelineRef.current || !captions || !duration) return;
    
    e.preventDefault();

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - activeDrag.initialMouseX;
    const deltaTime = (deltaX / timelineRect.width) * duration;
    
    let newStartTime = activeDrag.initialStartTime;
    let newEndTime = activeDrag.initialEndTime;
    const minDuration = 0.2;

    if (activeDrag.type === 'drag') {
        const dragStartTime = activeDrag.initialStartTime + deltaTime;
        const captionDuration = activeDrag.initialEndTime - activeDrag.initialStartTime;
        newStartTime = Math.max(0, dragStartTime);
        newEndTime = newStartTime + captionDuration;
        if (newEndTime > duration) {
            newEndTime = duration;
            newStartTime = duration - captionDuration;
        }
    } else if (activeDrag.type === 'resize-start') {
        newStartTime = activeDrag.initialStartTime + deltaTime;
        if (newStartTime > activeDrag.initialEndTime - minDuration) {
            newStartTime = activeDrag.initialEndTime - minDuration;
        }
        newStartTime = Math.max(0, newStartTime);
        newEndTime = activeDrag.initialEndTime;
    } else if (activeDrag.type === 'resize-end') {
        newEndTime = activeDrag.initialEndTime + deltaTime;
        if (newEndTime < activeDrag.initialStartTime + minDuration) {
            newEndTime = activeDrag.initialStartTime + minDuration;
        }
        newEndTime = Math.min(duration, newEndTime);
        newStartTime = activeDrag.initialStartTime;
    }

    onUpdateCaptionTime(activeDrag.index, newStartTime, newEndTime);

  }, [activeDrag, captions, duration, onUpdateCaptionTime]);

  const handleMouseUp = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    const currentCursor = activeDrag ? (activeDrag.type === 'drag' ? 'grabbing' : 'ew-resize') : 'default';
    document.body.style.cursor = currentCursor;
    
    if (activeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [activeDrag, handleMouseMove, handleMouseUp]);


  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50 flex flex-col gap-4">
      {/* Play Controls */}
      <div className="flex items-center gap-4">
        <button onClick={onPlayPause} className="text-white p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-600 transition-colors">
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>
        <div className="text-sm font-mono text-gray-400 w-12">{formatTime(currentTime)}</div>
        <div className="flex-grow text-sm font-mono text-gray-400 text-right w-12">{formatTime(duration)}</div>
      </div>
      
      {/* Timeline Track */}
      <div 
        ref={timelineRef}
        className="w-full h-20 bg-gray-900/50 rounded cursor-pointer relative group" 
        onClick={handleTimelineClick}
      >
        {/* Seek Bar Background */}
        <div className="h-1 bg-gray-700 absolute top-1/2 -translate-y-1/2 w-full"></div>
        
        {/* Captions Container */}
        <div className="absolute inset-0 w-full h-full z-10">
          {captions && duration > 0 && captions.map((caption, index) => {
            const left = (caption.startTime / duration) * 100;
            const width = ((caption.endTime - caption.startTime) / duration) * 100;
            const isDragging = activeDrag?.index === index;
            
            return (
              <div
                key={caption.startTime + '-' + index}
                className={`caption-block absolute h-12 top-1/2 -translate-y-1/2 flex items-center justify-center bg-purple-600/70 rounded-md border-2 border-purple-400 cursor-grab active:cursor-grabbing text-white text-xs px-2 select-none whitespace-nowrap overflow-hidden text-ellipsis transition-shadow ${isDragging ? 'shadow-lg shadow-purple-500/50 z-30' : 'z-20'}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                onMouseDown={(e) => handleMouseDown(e, index, 'drag')}
              >
                <div 
                    className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
                    onMouseDown={(e) => handleMouseDown(e, index, 'resize-start')}
                ></div>

                {`${caption.emoji || ''} ${caption.text}`.trim()}

                <div 
                    className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
                    onMouseDown={(e) => handleMouseDown(e, index, 'resize-end')}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Current Caption Markers */}
        {activeCaption && duration > 0 && (
          <>
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 -ml-1.5 bg-purple-400 rounded-full z-30 pointer-events-none ring-2 ring-gray-900"
              style={{ left: `${(activeCaption.startTime / duration) * 100}%` }}
              title={`Start: ${formatTime(activeCaption.startTime)}`}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 -ml-1.5 bg-purple-400 rounded-full z-30 pointer-events-none ring-2 ring-gray-900"
              style={{ left: `${(activeCaption.endTime / duration) * 100}%` }}
              title={`End: ${formatTime(activeCaption.endTime)}`}
            />
          </>
        )}

        {/* Playhead */}
        <div className="absolute h-full w-1 bg-red-500 z-40 pointer-events-none" style={{ left: `${progress}%` }}>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};