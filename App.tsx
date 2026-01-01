import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { CaptionPreview } from './components/CaptionPreview';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { LoaderIcon, RefreshCwIcon, AlertCircleIcon } from './components/Icons';
import { generateCaptions } from './services/geminiService';
import type { CaptionLine, ThemeName, ThemeConfig, EditorState, ExportStatus, AspectRatio } from './types';
import { THEMES } from './constants';
import { CaptionEditor } from './components/CaptionEditor';

const initialThemeConfigs = Object.fromEntries(
  Object.entries(THEMES).map(([name, theme]) => [name, theme.config])
) as Record<ThemeName, ThemeConfig>;

const initialEditorState: EditorState = {
  captions: null,
  theme: 'minecraft',
  themeConfigs: initialThemeConfigs,
  backgroundImage: null,
  captionPosition: { x: 50, y: 80 },
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
        future: [],
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
      themeConfigs: { ...themeConfigs, [theme]: newConfig }
    });
  };

  useEffect(() => {
    return () => { if (audioSrc) URL.revokeObjectURL(audioSrc); };
  }, [audioSrc]);

  const handleUpdateCaptionTime = (index: number, newStartTime: number, newEndTime: number) => {
    if (!captions) return;
    const newCaptions = captions.map((c, i) => 
      i === index ? { ...c, startTime: newStartTime, endTime: newEndTime } : c
    );
    setState({ captions: newCaptions }, true);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setState({ captions: null });
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    setAudioSrc(URL.createObjectURL(selectedFile));
  };
  
  const handleGenerateClick = useCallback(async () => {
    if (!file) {
      setError('No audio file found.');
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
        if (audioRef.current.paused) audioRef.current.play().catch(console.error);
      }
    } catch (e: any) {
      console.error(e);
      setError('Analysis failed. Try another audio track.');
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
      endTime: currentTime + 3,
      text: 'New Line',
    };
    const updatedCaptions = [...(captions || []), newCaption].sort((a, b) => a.startTime - b.startTime);
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
    if (backgroundImage) URL.revokeObjectURL(backgroundImage);
    setState({ backgroundImage: URL.createObjectURL(imageFile) });
  };

  const handleRemoveBackgroundImage = () => setState({ backgroundImage: null });

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
        'VT323': '"VT323", monospace',
    };

    const style: React.CSSProperties = {
      fontWeight: activeThemeConfig.fontWeight,
      fontFamily: FONT_MAP[activeThemeConfig.fontFamily] || 'sans-serif',
      textAlign: activeThemeConfig.textAlign,
      fontSize: `${activeThemeConfig.fontSize}px`,
      fontStyle: activeThemeConfig.fontStyle,
      whiteSpace: activeThemeConfig.maxLines === 1 ? 'nowrap' : 'normal',
      maxWidth: activeThemeConfig.maxLines === 1 ? 'none' : '80%',
      wordBreak: 'break-word',
    };

    if (activeThemeConfig.fontFamily === 'VT323') {
        (style as any).textTransform = 'uppercase';
        (style as any).letterSpacing = '2px';
        (style as any).imageRendering = 'pixelated';
    }

    if (activeThemeConfig.gradientEnabled) {
      style.background = `linear-gradient(to right, ${activeThemeConfig.gradientColor1}, ${activeThemeConfig.gradientColor2})`;
      style.WebkitBackgroundClip = 'text';
      style.backgroundClip = 'text';
      style.color = 'transparent';
    } else {
      style.color = activeThemeConfig.textColor;
    }
    
    const textShadows: string[] = [];
    if (activeThemeConfig.fontFamily === 'VT323') {
        textShadows.push(`2px 2px 0px #3f3f3f`);
        textShadows.push(`4px 4px 0px #000000`);
    } else if (activeThemeConfig.glowEnabled) {
      textShadows.push(`0 0 8px ${activeThemeConfig.glowColor}`);
      textShadows.push(`0 0 12px ${activeThemeConfig.glowColor}`);
    } else if (!activeThemeConfig.strokeEnabled && !activeThemeConfig.gradientEnabled) {
      textShadows.push('2px 2px 5px rgba(0,0,0,0.7)');
    }

    if (textShadows.length > 0) style.textShadow = textShadows.join(', ');
    
    if (activeThemeConfig.strokeEnabled) {
        style.WebkitTextStroke = `${activeThemeConfig.strokeWidth}px ${activeThemeConfig.strokeColor}`;
        (style as any).paintOrder = 'stroke fill';
    }

    switch (activeThemeConfig.backgroundStyle) {
      case 'solid': style.backgroundColor = activeThemeConfig.solidBackgroundColor; break;
      case 'translucent': style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; break;
      case 'none': default: style.backgroundColor = 'transparent'; break;
    }
    if (activeThemeConfig.backgroundStyle !== 'none') {
        style.padding = '0.25rem 0.5rem';
        style.borderRadius = '0';
        if (activeThemeConfig.fontFamily === 'VT323') style.border = '4px solid #000';
    }
    return style;
  }, [activeThemeConfig]);

  const handleExportMp4 = useCallback(async () => {
    if (!file || !captions || !audioRef.current) return;
    setIsExporting(true);
    setExportStatus({ step: 'initializing', progress: 0 });
    setModalContent('mp4');
    setIsModalOpen(true);

    const getExportDimensions = (ratio: AspectRatio) => {
        switch (ratio) {
            case '9:16': return { width: 720, height: 1280 };
            case '1:1': return { width: 1080, height: 1080 };
            case '4:5': return { width: 1080, height: 1350 };
            default: return { width: 1280, height: 720 };
        }
    };
    const { width: exportWidth, height: exportHeight } = getExportDimensions(aspectRatio);
    const canvas = document.createElement('canvas');
    canvas.width = exportWidth; canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setIsExporting(false); return; }

    try {
        const audio = audioRef.current;
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaElementSource(audio);
        const audioDestination = audioContext.createMediaStreamDestination();
        audioSource.connect(audioDestination);
        const videoStream = canvas.captureStream(30);
        const combinedStream = new MediaStream([videoStream.getVideoTracks()[0], audioDestination.stream.getAudioTracks()[0]]);
        const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            setExportStatus({ step: 'done', progress: 100 });
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${file.name.split('.')[0]}_lyric_video.mp4`;
            a.click(); URL.revokeObjectURL(url);
            setTimeout(() => { setIsModalOpen(false); setIsExporting(false); }, 1500);
        };
        const bgImage = new Image();
        bgImage.crossOrigin = "anonymous";
        if (backgroundImage) {
            bgImage.src = backgroundImage;
            await new Promise((res, rej) => { bgImage.onload = res; bgImage.onerror = rej; });
        }
        recorder.start(); audio.currentTime = 0; await audio.play();
        const drawFrame = () => {
            const time = audio.currentTime;
            ctx.clearRect(0, 0, exportWidth, exportHeight);
            ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, exportWidth, exportHeight);
            if (backgroundImage) {
                const cAspect = exportWidth / exportHeight; const iAspect = bgImage.width / bgImage.height;
                let sx=0, sy=0, sw=bgImage.width, sw_orig = sw, sh=bgImage.height, sh_orig = sh;
                if (iAspect > cAspect) { sw = bgImage.height * cAspect; sx = (bgImage.width - sw) / 2; }
                else { sh = bgImage.width / cAspect; sy = (bgImage.height - sh) / 2; }
                ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, exportWidth, exportHeight);
            }
            const cap = captions.find(c => time >= c.startTime && time <= c.endTime);
            if (cap) {
                let text = (activeThemeConfig.fontFamily === 'VT323' ? `${cap.emoji || ''} ${cap.text}`.toUpperCase() : `${cap.emoji || ''} ${cap.text}`).trim();
                const style = activeThemeConfig;
                ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px "${style.fontFamily}"`;
                ctx.textAlign = style.textAlign as CanvasTextAlign;
                
                const x = (captionPosition.x / 100) * exportWidth;
                const y = (captionPosition.y / 100) * exportHeight;
                ctx.textBaseline = 'middle';

                const lines = [];
                if (style.maxLines === 2 && text.length > 20 && text.includes(' ')) {
                    const mid = Math.floor(text.length / 2);
                    const before = text.lastIndexOf(' ', mid);
                    const after = text.indexOf(' ', mid);
                    let splitPos = (mid - before < after - mid) ? before : after;
                    if (splitPos === -1) splitPos = before !== -1 ? before : after;
                    if (splitPos !== -1) {
                        lines.push(text.substring(0, splitPos).trim());
                        lines.push(text.substring(splitPos).trim());
                    } else {
                        lines.push(text);
                    }
                } else {
                    lines.push(text);
                }

                lines.forEach((line, idx) => {
                    const lineY = y + (idx - (lines.length - 1) / 2) * (style.fontSize * 1.2);
                    if (style.fontFamily === 'VT323') {
                        ctx.fillStyle = '#3f3f3f'; ctx.fillText(line, x+4, lineY+4);
                        ctx.fillStyle = '#000000'; ctx.fillText(line, x+8, lineY+8);
                    }
                    ctx.fillStyle = style.textColor; ctx.fillText(line, x, lineY);
                });
            }
            setExportStatus({ step: 'rendering', progress: (time / audio.duration) * 100 });
            if (time < audio.duration) requestAnimationFrame(drawFrame);
            else recorder.stop();
        };
        requestAnimationFrame(drawFrame);
    } catch (err) { console.error(err); setIsExporting(false); }
  }, [file, captions, backgroundImage, captionPosition, activeThemeConfig, aspectRatio]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-6xl mc-title mc-text-shadow">Singer</h1>
          {file && (
            <button onClick={resetState} className="mc-button text-xl">
              <RefreshCwIcon className="w-6 h-6 mr-2" /> EXIT TO MENU
            </button>
          )}
        </header>

        <main>
          {!file ? (
            <FileUpload onFileSelect={handleFileSelect} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="mc-panel">
                    <CaptionPreview 
                        currentCaption={currentCaption} 
                        backgroundImage={backgroundImage}
                        customStyle={activeThemeStyle}
                        captionPosition={captionPosition}
                        onCaptionPositionChange={(pos) => setState({ captionPosition: pos })}
                        aspectRatio={aspectRatio}
                        textAlign={activeThemeConfig.textAlign}
                        fontSize={activeThemeConfig.fontSize}
                        onFontSizeChange={(size) => handleThemeConfigChange({ ...activeThemeConfig, fontSize: size })}
                    />
                 </div>
                 <audio
                    ref={audioRef} src={audioSrc || ''}
                    onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                    onTimeUpdate={() => audioRef.current && !isExporting && setCurrentTime(audioRef.current.currentTime)}
                    onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                 <div className="mc-panel">
                    <Timeline 
                        captions={captions} currentTime={currentTime} duration={duration} isPlaying={isPlaying}
                        onPlayPause={() => {
                          if (!audioRef.current) return;
                          isPlaying ? audioRef.current.pause() : audioRef.current.play();
                        }}
                        onSeek={handleSeek} onUpdateCaptionTime={handleUpdateCaptionTime}
                    />
                 </div>
              </div>
              <div className="lg:col-span-1 mc-panel flex flex-col">
                {!captions ? (
                  <div className="p-4 space-y-6 flex flex-col items-center justify-center h-full">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4 mc-text-shadow text-[#ffff55]">READY FOR ANALYSIS?</h2>
                        <p className="text-xl text-[#ffffff] font-mono mc-text-shadow mb-4">
                            THE AI WILL CRAFT LYRICS BASED ON THE MUSIC VIBE.
                        </p>
                    </div>

                    {error && <div className="mc-panel bg-[#FF5555] text-white p-4 mc-text-shadow font-mono">{error}</div>}
                    <button 
                      onClick={handleGenerateClick} 
                      disabled={isLoading || !file} 
                      className="mc-button w-full text-2xl py-6"
                    >
                      {isLoading ? <span className="mc-pulse">ANALYZING...</span> : 'START GENERATION'}
                    </button>
                  </div>
                ) : (
                  <CaptionEditor
                    captions={captions} theme={theme}
                    onThemeChange={(newTheme) => setState({ theme: newTheme })}
                    onUpdateCaption={handleUpdateCaptionText} onAddCaption={handleAddCaption} onDeleteCaption={handleDeleteCaption}
                    onAcceptEmoji={handleAcceptEmoji} onRejectEmoji={handleRejectEmoji}
                    onExportSrt={() => { setModalContent('srt'); setIsModalOpen(true); }}
                    onExportMp4={handleExportMp4} isExporting={isExporting} onSeek={handleSeek}
                    activeThemeConfig={activeThemeConfig} onActiveThemeConfigChange={handleThemeConfigChange}
                    captionPosition={captionPosition} onCaptionPositionChange={(pos) => setState({ captionPosition: pos })}
                    backgroundImage={backgroundImage} onBackgroundImageSelect={handleBackgroundImageSelect} onRemoveBackgroundImage={handleRemoveBackgroundImage}
                    aspectRatio={aspectRatio} onAspectRatioChange={(ratio) => setState({ aspectRatio: ratio })}
                    onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo}
                  />
                )}
              </div>
            </div>
          )}
        </main>
        
        <ExportModal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} captions={captions}
          isExporting={isExporting} exportStatus={exportStatus} modalContent={modalContent}
        />
      </div>
    </div>
  );
};

export default App;