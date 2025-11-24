
import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Scissors, Pen, Maximize, Volume2, VolumeX, 
  Circle, Square, Type, ArrowRight, MousePointer2, Layers, Trash2, Copy, 
  SkipBack, SkipForward, Clock, ChevronDown
} from 'lucide-react';
import { Annotation, AnnotationType } from '../types';

interface VideoEditorProps {
  videoUrl: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onDraw: (annotation: Annotation) => void;
  onUpdateDrawing: (annotation: Annotation) => void;
  drawings: Annotation[];
  isDrawingMode: boolean;
  toggleDrawingMode: () => void;
  onScreenshot: (imageDataUrl: string) => void;
  onCutFragment: () => void;
}

const COLORS = [
  { hex: '#ef4444', name: 'Красный' },
  { hex: '#3b82f6', name: 'Синий' },
  { hex: '#22c55e', name: 'Зеленый' },
  { hex: '#eab308', name: 'Желтый' },
  { hex: '#ffffff', name: 'Белый' }
];

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export const VideoEditor: React.FC<VideoEditorProps> = ({
  videoUrl,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  onDraw,
  onUpdateDrawing,
  drawings,
  isDrawingMode,
  toggleDrawingMode,
  onScreenshot,
  onCutFragment
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Tool State
  const [selectedTool, setSelectedTool] = useState<AnnotationType>('select');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [showLayers, setShowLayers] = useState(false);

  // Drawing/Moving Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [freehandPath, setFreehandPath] = useState<{ x: number; y: number }[]>([]);
  
  // Selection State
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // --- Video Sync & Controls ---
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.2) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const stepFrame = (direction: 'forward' | 'backward') => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      // Assuming 25fps ~ 0.04s
      const frameTime = 0.04; 
      videoRef.current.currentTime += direction === 'forward' ? frameTime : -frameTime;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && onDurationChange) {
      onDurationChange(videoRef.current.duration);
    }
  };

  const handleScreenshot = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      // Add existing annotations to screenshot (optional/advanced, simplest is just video frame)
      const dataUrl = canvas.toDataURL('image/jpeg');
      onScreenshot(dataUrl);
    }
  };

  // --- Drawing & Moving Logic ---

  const getCoordinates = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const hitTest = (ann: Annotation, x: number, y: number): boolean => {
     // Simplified hit testing
     const threshold = 10;
     if (ann.points) {
         // Check distance to any point for lines/arrows/freehand
         return ann.points.some(p => Math.hypot(p.x - x, p.y - y) < threshold);
     } else if (ann.x !== undefined && ann.y !== undefined) {
         if (ann.type === 'circle') {
             const dist = Math.hypot(ann.x - x, ann.y - y);
             return Math.abs(dist - (ann.width || 0)) < threshold || dist < threshold; // Edge or center
         } else if (ann.type === 'rect') {
             return (x >= ann.x && x <= ann.x + (ann.width || 0) && y >= ann.y && y <= ann.y + (ann.height || 0));
         } else {
             // Text/Player - simple proximity
             return Math.hypot(ann.x - x, ann.y - y) < 20;
         }
     }
     return false;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingMode) return;
    
    const coords = getCoordinates(e);
    setStartPoint(coords);
    setCurrentPoint(coords);

    // Mode: Select/Move
    if (selectedTool === 'select') {
        // Find clicked annotation (reverse to find top-most)
        const visibleAnns = drawings.filter(d => Math.abs(d.timestamp - currentTime) < 2);
        const clicked = [...visibleAnns].reverse().find(ann => hitTest(ann, coords.x, coords.y));
        
        if (clicked) {
            setSelectedAnnotationId(clicked.id);
            setIsDragging(true);
            // Calculate offset based on anchor point (first point or x/y)
            const anchorX = clicked.points ? clicked.points[0].x : (clicked.x || 0);
            const anchorY = clicked.points ? clicked.points[0].y : (clicked.y || 0);
            setDragOffset({ x: coords.x - anchorX, y: coords.y - anchorY });
        } else {
            setSelectedAnnotationId(null);
        }
        return;
    }

    // Mode: Drawing
    setIsDragging(true);
    if (selectedTool === 'freehand') {
      setFreehandPath([coords]);
    } else if (selectedTool === 'text') {
      const text = prompt("Введите текст:");
      if (text) {
        onDraw({
          id: Date.now().toString(),
          type: 'text',
          x: coords.x,
          y: coords.y,
          text: text,
          color: selectedColor,
          strokeWidth: strokeWidth * 4,
          timestamp: currentTime,
          isVisible: true
        });
      }
      setIsDragging(false);
    } else if (selectedTool === 'player') {
       const number = prompt("Номер игрока:");
       if (number) {
         onDraw({
          id: Date.now().toString(),
          type: 'player',
          x: coords.x,
          y: coords.y,
          text: number,
          color: selectedColor,
          strokeWidth: strokeWidth, 
          timestamp: currentTime,
          isVisible: true
         });
       }
       setIsDragging(false);
    }

    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isDrawingMode) return;
    const coords = getCoordinates(e);
    setCurrentPoint(coords);

    // Mode: Moving
    if (selectedTool === 'select' && selectedAnnotationId && dragOffset) {
        const ann = drawings.find(d => d.id === selectedAnnotationId);
        if (!ann) return;

        const newX = coords.x - dragOffset.x;
        const newY = coords.y - dragOffset.y;

        // Calculate Delta for points
        const oldX = ann.points ? ann.points[0].x : (ann.x || 0);
        const oldY = ann.points ? ann.points[0].y : (ann.y || 0);
        const dx = newX - oldX;
        const dy = newY - oldY;

        const updatedAnn = { ...ann };

        if (updatedAnn.points) {
            updatedAnn.points = updatedAnn.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        } else {
            updatedAnn.x = newX;
            updatedAnn.y = newY;
        }
        
        onUpdateDrawing(updatedAnn);
        return;
    }

    // Mode: Drawing Preview
    if (selectedTool === 'freehand') {
      setFreehandPath(prev => [...prev, coords]);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || !isDrawingMode) return;
    setIsDragging(false);

    if (selectedTool === 'select') return;

    if (!startPoint || !currentPoint) return;

    // Check drag distance to avoid accidental dots
    const dist = Math.hypot(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
    if (dist < 5 && selectedTool !== 'freehand') return;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: selectedTool,
      x: startPoint.x,
      y: startPoint.y,
      color: selectedColor,
      strokeWidth: strokeWidth,
      timestamp: currentTime,
      isVisible: true,
    };

    switch (selectedTool) {
      case 'freehand':
        newAnnotation.points = freehandPath;
        break;
      case 'line':
      case 'arrow':
        newAnnotation.points = [startPoint, currentPoint];
        break;
      case 'rect':
        newAnnotation.x = Math.min(startPoint.x, currentPoint.x);
        newAnnotation.y = Math.min(startPoint.y, currentPoint.y);
        newAnnotation.width = Math.abs(currentPoint.x - startPoint.x);
        newAnnotation.height = Math.abs(currentPoint.y - startPoint.y);
        break;
      case 'circle':
        newAnnotation.x = startPoint.x;
        newAnnotation.y = startPoint.y;
        newAnnotation.width = Math.hypot(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
        break;
    }

    if (selectedTool !== 'text' && selectedTool !== 'player') {
        onDraw(newAnnotation);
        // Auto-select the newly created object
        setSelectedTool('select');
        setSelectedAnnotationId(newAnnotation.id);
    }
    
    setFreehandPath([]);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  // --- Rendering Helpers ---

  const renderAnnotation = (ann: Annotation) => {
    if (!ann.isVisible) return null;
    const isSelected = ann.id === selectedAnnotationId && selectedTool === 'select';
    const selectionStyle = isSelected ? { filter: 'drop-shadow(0 0 4px yellow)' } : {};

    switch (ann.type) {
      case 'freehand':
        if (!ann.points) return null;
        return (
          <path
            key={ann.id}
            d={`M ${ann.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
            stroke={ann.color}
            strokeWidth={ann.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={selectionStyle}
          />
        );
      case 'line':
        if (!ann.points) return null;
        return (
          <line
            key={ann.id}
            x1={ann.points[0].x} y1={ann.points[0].y}
            x2={ann.points[1].x} y2={ann.points[1].y}
            stroke={ann.color}
            strokeWidth={ann.strokeWidth}
            strokeLinecap="round"
            style={selectionStyle}
          />
        );
      case 'arrow':
        if (!ann.points) return null;
        return (
           <g key={ann.id} style={selectionStyle}>
            <defs>
              <marker id={`arrowhead-${ann.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={ann.color} />
              </marker>
            </defs>
            <line
              x1={ann.points[0].x} y1={ann.points[0].y}
              x2={ann.points[1].x} y2={ann.points[1].y}
              stroke={ann.color}
              strokeWidth={ann.strokeWidth}
              strokeLinecap="round"
              markerEnd={`url(#arrowhead-${ann.id})`}
            />
          </g>
        );
      case 'rect':
        return (
          <rect
            key={ann.id}
            x={ann.x} y={ann.y}
            width={ann.width} height={ann.height}
            stroke={ann.color}
            strokeWidth={ann.strokeWidth}
            fill={ann.color}
            fillOpacity="0.2"
            style={selectionStyle}
          />
        );
      case 'circle':
        return (
          <circle
            key={ann.id}
            cx={ann.x} cy={ann.y}
            r={ann.width}
            stroke={ann.color}
            strokeWidth={ann.strokeWidth}
            fill={ann.color}
            fillOpacity="0.2"
            style={selectionStyle}
          />
        );
      case 'text':
        return (
          <text
            key={ann.id}
            x={ann.x} y={ann.y}
            fill={ann.color}
            fontSize={ann.strokeWidth ? ann.strokeWidth + 16 : 20}
            fontWeight="bold"
            style={{ textShadow: '1px 1px 2px black', ...selectionStyle }}
          >
            {ann.text}
          </text>
        );
      case 'player':
        return (
            <g key={ann.id} style={selectionStyle}>
                <circle cx={ann.x} cy={ann.y} r={15} fill={ann.color} stroke="white" strokeWidth={2} />
                <text x={ann.x} y={ann.y} dy=".3em" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    {ann.text}
                </text>
            </g>
        )
      default:
        return null;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const visibleDrawings = drawings.filter(d => Math.abs(d.timestamp - currentTime) < 2);

  return (
    <div className="relative flex flex-col bg-black rounded-lg overflow-hidden shadow-2xl border border-slate-700 group select-none">
      
      {/* Video & Canvas Layer */}
      <div className="relative aspect-video bg-slate-900">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          crossOrigin="anonymous"
        />
        
        <svg
          ref={svgRef}
          className={`absolute inset-0 w-full h-full z-10 ${isDrawingMode ? (selectedTool === 'select' ? 'cursor-move' : 'cursor-crosshair') : 'cursor-default'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {visibleDrawings.map(renderAnnotation)}

          {/* Preview */}
          {isDragging && startPoint && currentPoint && selectedTool !== 'select' && (
             <>
                {selectedTool === 'freehand' && (
                   <path d={`M ${freehandPath.map(p => `${p.x} ${p.y}`).join(' L ')}`} stroke={selectedColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
                )}
                {selectedTool === 'line' && (
                   <line x1={startPoint.x} y1={startPoint.y} x2={currentPoint.x} y2={currentPoint.y} stroke={selectedColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray="5,5" />
                )}
                {selectedTool === 'arrow' && (
                   <line x1={startPoint.x} y1={startPoint.y} x2={currentPoint.x} y2={currentPoint.y} stroke={selectedColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray="5,5" />
                )}
                {selectedTool === 'rect' && (
                   <rect 
                      x={Math.min(startPoint.x, currentPoint.x)} 
                      y={Math.min(startPoint.y, currentPoint.y)} 
                      width={Math.abs(currentPoint.x - startPoint.x)} 
                      height={Math.abs(currentPoint.y - startPoint.y)} 
                      stroke={selectedColor} strokeWidth={1} fill={selectedColor} fillOpacity="0.2" strokeDasharray="5,5"
                   />
                )}
                {selectedTool === 'circle' && (
                   <circle 
                      cx={startPoint.x} cy={startPoint.y} 
                      r={Math.hypot(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y)} 
                      stroke={selectedColor} strokeWidth={1} fill={selectedColor} fillOpacity="0.2" strokeDasharray="5,5"
                   />
                )}
             </>
          )}
        </svg>

        {/* Big Play Button Overlay */}
        {!isPlaying && !isDrawingMode && (
          <button 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors z-0"
          >
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full text-white hover:scale-110 transition-transform">
              <Play size={48} fill="currentColor" />
            </div>
          </button>
        )}

        {/* --- RIGHT TOOLBAR: MAIN TOOLS --- */}
        <div className="absolute right-4 top-4 flex flex-col gap-2 z-20">
          <button 
            onClick={toggleDrawingMode}
            className={`p-3 rounded-xl shadow-lg backdrop-blur-md border transition-all duration-200 ${isDrawingMode 
              ? 'bg-blue-600 border-blue-400 text-white' 
              : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Режим рисования"
          >
            <Pen size={20} />
          </button>

          {isDrawingMode && (
            <div className="flex flex-col gap-1 p-2 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-right-4">
                <div className="text-[10px] text-slate-500 font-bold uppercase text-center mb-1">Инструменты</div>
                
                {[
                  { id: 'select', icon: <MousePointer2 size={16} />, label: 'Выбор' },
                  { id: 'freehand', icon: <Pen size={16} />, label: 'Карандаш' },
                  { id: 'line', icon: <div className="w-4 h-0.5 bg-current rotate-45 transform origin-center" />, label: 'Линия' },
                  { id: 'arrow', icon: <ArrowRight size={16} />, label: 'Стрелка' },
                  { id: 'circle', icon: <Circle size={16} />, label: 'Круг' },
                  { id: 'rect', icon: <Square size={16} />, label: 'Квадрат' },
                  { id: 'text', icon: <Type size={16} />, label: 'Текст' },
                  { id: 'player', icon: <MousePointer2 size={16} />, label: 'Игрок' },
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id as AnnotationType)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-colors ${selectedTool === tool.id ? 'bg-slate-700 text-blue-400 shadow-inner' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    title={tool.label}
                  >
                    {tool.icon}
                  </button>
                ))}

                <div className="h-px bg-slate-700 my-1" />
                <div className="grid grid-cols-2 gap-1">
                   {COLORS.map(c => (
                     <button
                        key={c.hex}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${selectedColor === c.hex ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                     />
                   ))}
                </div>
                <div className="h-px bg-slate-700 my-1" />
                <input 
                   type="range" min="2" max="10" value={strokeWidth} 
                   onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                   className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                   title="Толщина линии"
                />
            </div>
          )}
        </div>

        {/* --- LEFT TOOLBAR: ACTIONS --- */}
        <div className="absolute left-4 top-4 flex flex-col gap-2 z-20">
           <button 
            onClick={() => setShowLayers(!showLayers)}
            className={`p-3 rounded-xl shadow-lg backdrop-blur-md border transition-all duration-200 ${showLayers ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}
            title="Слои"
          >
            <Layers size={20} />
            {visibleDrawings.length > 0 && (
               <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>

           <button onClick={onCutFragment} className="p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 shadow-lg transition-all" title="Создать клип">
            <Scissors size={20} />
          </button>
        </div>

        {/* Layers Panel */}
        {showLayers && (
           <div className="absolute left-16 top-4 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-3 z-30">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
                 <span className="text-xs font-bold text-slate-300">СЛОИ</span>
                 <button onClick={() => setShowLayers(false)} className="text-slate-500 text-xs">Закрыть</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                 {visibleDrawings.length === 0 && <div className="text-xs text-slate-500 text-center py-4">Пусто</div>}
                 {visibleDrawings.map(d => (
                    <div key={d.id} className={`flex items-center justify-between p-2 rounded border ${d.id === selectedAnnotationId ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                       <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedTool('select'); setSelectedAnnotationId(d.id); }}>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-xs text-slate-300">
                             {d.type === 'freehand' ? 'Карандаш' : 
                              d.type === 'line' ? 'Линия' : 
                              d.type === 'arrow' ? 'Стрелка' : 
                              d.type === 'rect' ? 'Прямоугольник' :
                              d.type === 'circle' ? 'Круг' :
                              d.type === 'text' ? 'Текст' :
                              d.type === 'player' ? 'Игрок' : d.type}
                          </span>
                       </div>
                       <button className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* --- PLAYER CONTROLS --- */}
      <div className="bg-slate-800 p-2 flex flex-col border-t border-slate-700 gap-2">
         
         {/* Progress Bar */}
         <div className="w-full px-2 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">{formatTime(currentTime)}</span>
            <input
               type="range" min={0} max={videoRef.current?.duration || 100} value={currentTime}
               onChange={(e) => {
                  const time = parseFloat(e.target.value);
                  if (videoRef.current) videoRef.current.currentTime = time;
                  onTimeUpdate(time);
               }}
               className="flex-1 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
            <span className="text-xs font-mono text-slate-400">{formatTime(videoRef.current?.duration || 0)}</span>
         </div>

         {/* Buttons Row */}
         <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <button onClick={() => stepFrame('backward')} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Назад 1 кадр"><SkipBack size={18} /></button>
               <button onClick={togglePlay} className="p-1.5 text-white bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg">
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
               </button>
               <button onClick={() => stepFrame('forward')} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Вперед 1 кадр"><SkipForward size={18} /></button>
            </div>

            <div className="flex items-center gap-4">
               <div className="relative">
                  <button 
                     onClick={() => setShowSpeedMenu(!showSpeedMenu)} 
                     className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-700 px-2 py-1 rounded"
                  >
                     {playbackRate}x <ChevronDown size={12} />
                  </button>
                  {showSpeedMenu && (
                     <div className="absolute bottom-full left-0 mb-2 w-20 bg-slate-800 border border-slate-600 rounded shadow-xl flex flex-col overflow-hidden z-50">
                        {PLAYBACK_SPEEDS.map(rate => (
                           <button 
                              key={rate} 
                              onClick={() => { setPlaybackRate(rate); setShowSpeedMenu(false); }}
                              className={`px-2 py-1 text-xs text-left hover:bg-blue-600 hover:text-white ${playbackRate === rate ? 'bg-blue-900 text-blue-200' : 'text-slate-300'}`}
                           >
                              {rate}x
                           </button>
                        ))}
                     </div>
                  )}
               </div>
               
               <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
               </button>

               <button className="text-slate-400 hover:text-white" title="На весь экран">
                  <Maximize size={18} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};