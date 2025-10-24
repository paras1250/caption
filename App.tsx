import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { CaptionPreview } from './components/CaptionPreview';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { LoaderIcon, AlertTriangleIcon, RefreshCwIcon } from './components/Icons';
import { generateCaptions } from './services/geminiService';
import type { CaptionLine, ThemeName, ThemeConfig, CaptionPosition, AspectRatio, ExportStatus, EditorState } from './types';
import { THEMES } from './constants';
import { CaptionEditor } from './components/CaptionEditor';

const initialThemeConfigs = Object.fromEntries(
  Object.entries(THEMES).map(([name, theme]) => [name, theme.config])
) as Record<ThemeName, ThemeConfig>;

const initialEditorState: EditorState = {
  captions: null,
  theme: 'neon',
  themeConfigs: initialThemeConfigs,
  backgroundImage: null,
  captionPosition: 'bottom-center',
  aspectRatio: '16:9',
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ step: 'idle', progress: 0 });
  const [modalContent, setModalContent] = useState<'srt' | 'mp4'>('srt');

  const [history, setHistory] = useState<{
    past: EditorState[];
    present: EditorState;
    future: EditorState[];
  }>({
    past: [],
    present: initialEditorState,
    future: [],
  });
  
  const { captions, theme, themeConfigs, backgroundImage, captionPosition, aspectRatio } = history.present;
  const activeThemeConfig = themeConfigs[theme];

  const setState = (newState: Partial<EditorState>, overwrite = false) => {
    setHistory(currentHistory => {
      const newPresent = { ...currentHistory.present, ...newState };
      if (overwrite) {
        return {
          past: currentHistory.past,
          present: newPresent,
          future: currentHistory.future,
        }
      }
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: newPresent,
        future: [], // Clear future on new action
      };
    });
  };

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const handleUndo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.past.length === 0) return currentHistory;

      const newPast = [...currentHistory.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.future.length === 0) return currentHistory;

      const newFuture = [...currentHistory.future];
      const newPresent = newFuture.shift()!;
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);
  
  const handleThemeConfigChange = (newConfig: ThemeConfig) => {
    setState({
      themeConfigs: {
        ...themeConfigs,
        [theme]: newConfig,
      }
    });
  };

  useEffect(() => {
    return () => {
      if (audioSrc) URL.revokeObjectURL(audioSrc);
      // Background image is part of history, revoking should be handled carefully
      // For simplicity, we assume URLs are stable during session
    };
  }, [audioSrc]);

  const handleUpdateCaptionTime = (index: number, newStartTime: number, newEndTime: number) => {
    if (!captions) return;
    
    const newCaptions = [...captions];
    const caption = newCaptions[index];
    
    if (caption) {
      caption.startTime = newStartTime;
      caption.endTime = newEndTime;
      // Use overwrite to prevent creating history for every mouse move drag
      setState({ captions: newCaptions }, true);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Reset relevant parts of history
    setState({ captions: null });
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    setAudioSrc(URL.createObjectURL(selectedFile));
  };
  
  const handleGenerateClick = useCallback(async () => {
    if (!file) {
      setError('No audio file found. Please upload a file again.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setState({ captions: null });

    try {
      const generated = await generateCaptions(file);
      setState({ captions: generated });
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        if (audioRef.current.paused) {
          audioRef.current.play().catch(console.error);
        }
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate captions. The AI may not have been able to process this audio file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const resetState = () => {
    setFile(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    setAudioSrc(null);
    setDuration(0);
    setHistory({ past: [], present: initialEditorState, future: [] });
  };
  
  const currentCaption = useMemo(() => {
    if (!captions) return null;
    return captions.find(cap => currentTime >= cap.startTime && currentTime <= cap.endTime) ?? null;
  }, [captions, currentTime]);

  const handleUpdateCaptionText = (index: number, newText: string) => {
    if (!captions) return;
    const newCaptions = [...captions];
    newCaptions[index] = { ...newCaptions[index], text: newText };
    setState({ captions: newCaptions });
  };

  const handleAcceptEmoji = (index: number) => {
    if (!captions) return;
    const caption = captions[index];
    if (!caption.emoji) return;

    const newCaptions = [...captions];
    newCaptions[index] = {
      ...caption,
      text: `${caption.emoji} ${caption.text}`.trim(),
      emoji: undefined,
    };
    setState({ captions: newCaptions });
  };

  const handleRejectEmoji = (index: number) => {
    if (!captions) return;
    const newCaptions = [...captions];
    newCaptions[index] = { ...newCaptions[index], emoji: undefined };
    setState({ captions: newCaptions });
  };


  const handleAddCaption = () => {
    const newCaption: CaptionLine = {
      startTime: currentTime,
      endTime: currentTime + 3, // Default 3 second duration
      text: 'New Caption',
    };
    
    const updatedCaptions = [...(captions || []), newCaption].sort(
      (a, b) => a.startTime - b.startTime
    );
    setState({ captions: updatedCaptions });
  };

  const handleDeleteCaption = (index: number) => {
    if (!captions) return;
    const newCaptions = captions.filter((_, i) => i !== index);
    setState({ captions: newCaptions });
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleBackgroundImageSelect = (imageFile: File) => {
    if (backgroundImage) {
      URL.revokeObjectURL(backgroundImage);
    }
    setState({ backgroundImage: URL.createObjectURL(imageFile) });
  };

  const handleRemoveBackgroundImage = () => {
    setState({ backgroundImage: null });
  };

  const activeThemeStyle = useMemo(() => {
    if (!activeThemeConfig) return {};

    const FONT_MAP: Record<string, string> = {
        Montserrat: '"Montserrat", sans-serif',
        Poppins: '"Poppins", sans-serif',
        Fredoka: '"Fredoka", cursive',
        Pacifico: '"Pacifico", cursive',
        Lato: '"Lato", sans-serif',
        'Great Vibes': '"Great Vibes", cursive',
        'Dancing Script': '"Dancing Script", cursive',
    };

    const style: React.CSSProperties = {
      fontWeight: activeThemeConfig.fontWeight,
      fontFamily: FONT_MAP[activeThemeConfig.fontFamily] || 'sans-serif',
      textAlign: activeThemeConfig.textAlign,
      fontSize: `${activeThemeConfig.fontSize}px`,
      fontStyle: activeThemeConfig.fontStyle,
    };

    if (activeThemeConfig.gradientEnabled) {
      style.background = `linear-gradient(to right, ${activeThemeConfig.gradientColor1}, ${activeThemeConfig.gradientColor2})`;
      style.WebkitBackgroundClip = 'text';
      style.backgroundClip = 'text';
      style.color = 'transparent';
    } else {
      style.color = activeThemeConfig.textColor;
    }
    
    const textShadows: string[] = [];
    if (activeThemeConfig.glowEnabled) {
      textShadows.push(`0 0 8px ${activeThemeConfig.glowColor}`);
      textShadows.push(`0 0 12px ${activeThemeConfig.glowColor}`);
    } else if (!activeThemeConfig.strokeEnabled && !activeThemeConfig.gradientEnabled) {
      textShadows.push('2px 2px 5px rgba(0,0,0,0.7)');
    }

    if (textShadows.length > 0) {
      style.textShadow = textShadows.join(', ');
    }
    
    if (activeThemeConfig.strokeEnabled) {
        style.WebkitTextStroke = `${activeThemeConfig.strokeWidth}px ${activeThemeConfig.strokeColor}`;
        (style as any).paintOrder = 'stroke fill';
    }

    switch (activeThemeConfig.backgroundStyle) {
      case 'solid':
        style.backgroundColor = activeThemeConfig.solidBackgroundColor; break;
      case 'translucent':
        style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; break;
      case 'none': default:
        style.backgroundColor = 'transparent'; break;
    }
    if (activeThemeConfig.backgroundStyle !== 'none') {
        style.padding = '0.25rem 0.5rem';
        style.borderRadius = '0.375rem';
    }
    return style;
  }, [activeThemeConfig]);

  const handleExportMp4 = useCallback(async () => {
    if (!file || !captions || !audioRef.current) return;

    setIsExporting(true);
    setExportStatus({ step: 'initializing', progress: 0 });
    setModalContent('mp4');
    setIsModalOpen(true);

    const getExportDimensions = (ratio: AspectRatio): { width: number, height: number } => {
        switch (ratio) {
            case '9:16': return { width: 720, height: 1280 };
            case '1:1': return { width: 1080, height: 1080 };
            case '4:5': return { width: 1080, height: 1350 };
            case '16:9': default: return { width: 1280, height: 720 };
        }
    };
    const { width: exportWidth, height: exportHeight } = getExportDimensions(aspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setError('Could not create canvas context for export.');
        setIsExporting(false);
        return;
    }

    try {
        const audio = audioRef.current;
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaElementSource(audio);
        const audioDestination = audioContext.createMediaStreamDestination();
        audioSource.connect(audioDestination);
        
        const videoStream = canvas.captureStream(30);
        const combinedStream = new MediaStream([
            videoStream.getVideoTracks()[0],
            audioDestination.stream.getAudioTracks()[0]
        ]);

        const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => chunks.push(event.data);
        recorder.onstop = () => {
            setExportStatus({ step: 'done', progress: 100 });
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name.split('.')[0]}_video.mp4`;
            a.click();
            URL.revokeObjectURL(url);
            
            setTimeout(() => {
                setIsModalOpen(false);
                setIsExporting(false);
                setExportStatus({ step: 'idle', progress: 0 });
            }, 1500);
        };
        
        const bgImage = new Image();
        bgImage.crossOrigin = "anonymous";
        let imageLoaded = false;
        if (backgroundImage) {
            bgImage.src = backgroundImage;
            await new Promise((resolve, reject) => {
                bgImage.onload = resolve;
                bgImage.onerror = reject;
            });
            imageLoaded = true;
        }

        recorder.start();
        audio.currentTime = 0;
        await audio.play();

        const totalDuration = audio.duration;
        let lastTime = -1;

        const drawFrame = () => {
            const currentTime = audio.currentTime;
            if (currentTime === lastTime) { // Avoid re-drawing if time hasn't advanced
                if (currentTime < totalDuration) requestAnimationFrame(drawFrame);
                return;
            }
            lastTime = currentTime;

            ctx.clearRect(0, 0, exportWidth, exportHeight);
            ctx.fillStyle = '#111827';
            ctx.fillRect(0, 0, exportWidth, exportHeight);

            if (imageLoaded) {
                const canvasAspect = exportWidth / exportHeight;
                const imgAspect = bgImage.width / bgImage.height;
                let sx = 0, sy = 0, sWidth = bgImage.width, sHeight = bgImage.height;
                if (imgAspect > canvasAspect) {
                    sWidth = bgImage.height * canvasAspect;
                    sx = (bgImage.width - sWidth) / 2;
                } else {
                    sHeight = bgImage.width / canvasAspect;
                    sy = (bgImage.height - sHeight) / 2;
                }
                ctx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, exportWidth, exportHeight);
            }

            const currentCaption = captions.find(c => currentTime >= c.startTime && currentTime <= c.endTime);
            if (currentCaption) {
                const textToRender = `${currentCaption.emoji || ''} ${currentCaption.text}`.trim();
                const style = activeThemeConfig;
                ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px "${style.fontFamily}"`;
                ctx.textAlign = style.textAlign as CanvasTextAlign;
                
                const [vAlign, hAlign] = captionPosition.split('-');
                let x = exportWidth / 2;
                if (hAlign === 'left') x = 50;
                if (hAlign === 'right') x = exportWidth - 50;

                let y = exportHeight - 100;
                if (vAlign === 'top') y = 100;
                if (vAlign === 'middle') y = exportHeight / 2;
                
                ctx.textBaseline = vAlign === 'top' ? 'top' : vAlign === 'middle' ? 'middle' : 'bottom';
                const yPos = y;


                if (style.backgroundStyle !== 'none') {
                    ctx.fillStyle = style.backgroundStyle === 'solid' ? style.solidBackgroundColor : 'rgba(0,0,0,0.5)';
                    const textMetrics = ctx.measureText(textToRender);
                    const paddingH = 20;
                    const paddingV = 10;
                    
                    let rectX = x - (textMetrics.actualBoundingBoxLeft);
                    if(style.textAlign === 'right' || hAlign === 'right') {
                       rectX = x - textMetrics.width - paddingH;
                    } else if (style.textAlign === 'center' || hAlign === 'center') {
                       rectX = x - (textMetrics.width / 2) - paddingH;
                    } else if (style.textAlign === 'left' || hAlign === 'left') {
                       rectX = x - paddingH;
                    }
                    
                    const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
                    const rectY = yPos - textMetrics.actualBoundingBoxAscent - paddingV;
                    const rectHeight = textHeight + (paddingV * 2);
                    ctx.fillRect(rectX, rectY, textMetrics.width + paddingH * 2, rectHeight);
                }
                
                ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                ctx.lineWidth = 0; ctx.strokeStyle = 'transparent';

                if (style.strokeEnabled && style.strokeWidth > 0) {
                    ctx.strokeStyle = style.strokeColor;
                    ctx.lineWidth = style.strokeWidth * 2;
                    ctx.lineJoin = 'round';
                    ctx.strokeText(textToRender, x, yPos);
                }

                if (style.glowEnabled) {
                    ctx.shadowColor = style.glowColor;
                    ctx.shadowBlur = 15;
                } else if (!style.strokeEnabled && !style.gradientEnabled) {
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                }

                if (style.gradientEnabled) {
                    const textMetrics = ctx.measureText(textToRender);
                    const gradient = ctx.createLinearGradient(x - textMetrics.width / 2, yPos, x + textMetrics.width / 2, yPos);
                    gradient.addColorStop(0, style.gradientColor1);
                    gradient.addColorStop(1, style.gradientColor2);
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = style.textColor;
                }
                ctx.fillText(textToRender, x, yPos);
            }
            
            setExportStatus({ step: 'rendering', progress: (currentTime / totalDuration) * 100 });

            if (currentTime < totalDuration) {
                requestAnimationFrame(drawFrame);
            } else {
                setExportStatus({ step: 'encoding', progress: 100 });
                recorder.stop();
                audio.pause();
            }
        };
        requestAnimationFrame(drawFrame);

    } catch (err) {
        console.error("Export failed:", err);
        setError("Video export failed. Please try again.");
        setIsExporting(false);
        setExportStatus({ step: 'idle', progress: 0 });
    }
  }, [file, captions, backgroundImage, captionPosition, activeThemeConfig, aspectRatio]);


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            Singer
          </h1>
          {file && (
            <button 
              onClick={resetState} 
              className="flex items-center gap-2 text-sm font-semibold bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 rounded-md px-4 py-2 transition-all duration-200 text-gray-300 hover:text-white hover:border-gray-500"
            >
              <RefreshCwIcon className="w-4 h-4" />
              Start Over
            </button>
          )}
        </header>

        <main>
          {!file ? (
            <FileUpload onFileSelect={handleFileSelect} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <CaptionPreview 
                    currentCaption={currentCaption} 
                    backgroundImage={backgroundImage}
                    customStyle={activeThemeStyle}
                    captionPosition={captionPosition}
                    aspectRatio={aspectRatio}
                    textAlign={activeThemeConfig.textAlign}
                 />
                 <audio
                    ref={audioRef}
                    src={audioSrc || ''}
                    onLoadedMetadata={() => {
                      if (audioRef.current) setDuration(audioRef.current.duration);
                    }}
                    onTimeUpdate={() => {
                      if (audioRef.current && !isExporting) setCurrentTime(audioRef.current.currentTime);
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                 <Timeline 
                    captions={captions}
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    onPlayPause={() => {
                      if (!audioRef.current) return;
                      if (isPlaying) {
                        audioRef.current.pause();
                      } else {
                        if (audioRef.current.ended) {
                           audioRef.current.currentTime = 0;
                        }
                        audioRef.current.play();
                      }
                    }}
                    onSeek={handleSeek}
                    onUpdateCaptionTime={handleUpdateCaptionTime}
                 />
              </div>
              <div className="lg:col-span-1 bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-700/50 flex flex-col">
                {!captions ? (
                  <div className="p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-2 text-cyan-300">1. Generate Captions</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            The AI will listen to your audio and automatically generate synchronized lyrics.
                        </p>
                    </div>
                  
                    {error && (
                      <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-md flex items-center text-sm">
                        <AlertTriangleIcon className="w-5 h-5 mr-2" />
                        {error}
                      </div>
                    )}
                  
                    <button
                      onClick={handleGenerateClick}
                      disabled={isLoading || !file}
                      className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300"
                    >
                      {isLoading ? <><LoaderIcon /> Generating...</> : '✨ Generate Captions'}
                    </button>
                  </div>
                ) : (
                  <CaptionEditor
                    captions={captions}
                    theme={theme}
                    onThemeChange={(newTheme) => setState({ theme: newTheme })}
                    onUpdateCaption={handleUpdateCaptionText}
                    onAddCaption={handleAddCaption}
                    onDeleteCaption={handleDeleteCaption}
                    onAcceptEmoji={handleAcceptEmoji}
                    onRejectEmoji={handleRejectEmoji}
                    onExportSrt={() => { setModalContent('srt'); setIsModalOpen(true); }}
                    onExportMp4={handleExportMp4}
                    isExporting={isExporting}
                    onSeek={handleSeek}
                    activeThemeConfig={activeThemeConfig}
                    onActiveThemeConfigChange={handleThemeConfigChange}
                    captionPosition={captionPosition}
                    onCaptionPositionChange={(pos) => setState({ captionPosition: pos })}
                    backgroundImage={backgroundImage}
                    onBackgroundImageSelect={handleBackgroundImageSelect}
                    onRemoveBackgroundImage={handleRemoveBackgroundImage}
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={(ratio) => setState({ aspectRatio: ratio })}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                  />
                )}
              </div>
            </div>
          )}
        </main>
        
        <ExportModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          captions={captions}
          isExporting={isExporting}
          exportStatus={exportStatus}
          modalContent={modalContent}
        />
      </div>
    </div>
  );
};

export default App;