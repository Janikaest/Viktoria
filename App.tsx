
import React, { useState, useCallback, useMemo } from 'react';
import { VideoEditor } from './components/VideoEditor';
import { EpisodeManager } from './components/EpisodeManager';
import { StatsDashboard } from './components/StatsDashboard';
import { Episode, VideoFragment, Annotation, Factor, EvaluationScope, EpisodeFactor, FragmentType, PlayerRole } from './types';
import { KNOWLEDGE_BASE_FACTORS, MOCK_PLAYERS } from './constants';
import { Layout, Video, User, Activity, Scissors, FolderPlus, Layers, Film } from 'lucide-react';

// Initial Mock Data
const MOCK_EPISODES: Episode[] = [
  {
    id: 'ep1',
    title: '1-й Период: Атака',
    description: 'Анализ атакующих действий в зоне нападения.',
    thumbnailUrl: 'https://media.istockphoto.com/id/1188462544/photo/ice-hockey-player-in-action.jpg?s=612x612&w=0&k=20&c=9d4h_u5bQ4z4_r1wE7j_t8_y6_f5_d4_s3_a2_1.jpg',
    timestampStart: 5,
    timestampEnd: 30,
    fragments: [
      {
        id: 'frag1',
        episodeId: 'ep1',
        title: 'Вход в зону',
        description: 'Хорошее позиционирование в зоне атаки. Точный бросок в ближний угол после финта.',
        category: FragmentType.ATTACK,
        subject: { scope: EvaluationScope.PLAYER, id: 'p1' }, // Ivanov
        gameScore: "3:2",
        composition: "5x5",
        thumbnailUrl: "https://media.istockphoto.com/id/1188462544/photo/ice-hockey-player-in-action.jpg?s=612x612&w=0&k=20&c=9d4h_u5bQ4z4_r1wE7j_t8_y6_f5_d4_s3_a2_1.jpg",
        screenshots: ["https://media.istockphoto.com/id/1188462544/photo/ice-hockey-player-in-action.jpg?s=612x612&w=0&k=20&c=9d4h_u5bQ4z4_r1wE7j_t8_y6_f5_d4_s3_a2_1.jpg"],
        timestampStart: 10,
        timestampEnd: 25,
        drawings: [],
        assignedFactors: [],
        tags: ['Вход в зону'],
        rating: 8.5
      }
    ]
  },
  {
    id: 'ep2',
    title: 'Ошибки в обороне',
    description: 'Разбор позиционных ошибок защитников.',
    thumbnailUrl: 'https://media.istockphoto.com/id/1188462544/photo/ice-hockey-player-in-action.jpg?s=612x612&w=0&k=20&c=9d4h_u5bQ4z4_r1wE7j_t8_y6_f5_d4_s3_a2_1.jpg',
    timestampStart: 40,
    timestampEnd: 70,
    fragments: [
      {
        id: 'frag2',
        episodeId: 'ep2',
        title: 'Провал на фланге',
        description: 'Перегрузка левого фланга, защитник #55 опоздал.',
        category: FragmentType.DEFENSE,
        subject: { scope: EvaluationScope.ROLE, id: PlayerRole.DEFENDER },
        gameScore: "3:2",
        composition: "4x5",
        screenshots: [],
        timestampStart: 45,
        timestampEnd: 60,
        drawings: [],
        assignedFactors: [],
        tags: ['Оборона'],
        rating: -4.5
      }
    ]
  }
];

const App: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<'editor' | 'stats'>('editor');
  const [episodes, setEpisodes] = useState<Episode[]>(MOCK_EPISODES);
  
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(MOCK_EPISODES[0].id);
  const [currentFragmentId, setCurrentFragmentId] = useState<string | null>(MOCK_EPISODES[0].fragments[0].id);
  
  const [currentTime, setCurrentTime] = useState(10);
  const [duration, setDuration] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  
  // Timeline Dragging State
  const [draggingHandle, setDraggingHandle] = useState<{ targetId: string, targetType: 'episode' | 'fragment', handleType: 'start' | 'end' } | null>(null);

  // Helpers to get current objects
  const currentEpisode = useMemo(() => 
    episodes.find(e => e.id === currentEpisodeId), [episodes, currentEpisodeId]);

  const currentFragment = useMemo(() => 
    currentEpisode?.fragments.find(f => f.id === currentFragmentId), [currentEpisode, currentFragmentId]);

  // Handlers
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDraw = (annotation: Annotation) => {
    if (!currentEpisodeId || !currentFragmentId) return;
    
    setEpisodes(prev => prev.map(ep => {
      if (ep.id === currentEpisodeId) {
        return {
          ...ep,
          fragments: ep.fragments.map(fr => {
            if (fr.id === currentFragmentId) {
              return { ...fr, drawings: [...fr.drawings, annotation] };
            }
            return fr;
          })
        };
      }
      return ep;
    }));
  };

  const handleUpdateDrawing = (annotation: Annotation) => {
    if (!currentEpisodeId || !currentFragmentId) return;

    setEpisodes(prev => prev.map(ep => {
      if (ep.id === currentEpisodeId) {
        return {
          ...ep,
          fragments: ep.fragments.map(fr => {
            if (fr.id === currentFragmentId) {
              return { 
                ...fr, 
                drawings: fr.drawings.map(d => d.id === annotation.id ? annotation : d) 
              };
            }
            return fr;
          })
        };
      }
      return ep;
    }));
  };

  const handleAddFactor = (fragmentId: string, factor: Factor, scope: EvaluationScope, targetId?: string) => {
    setEpisodes(prev => prev.map(ep => {
      const hasFragment = ep.fragments.some(f => f.id === fragmentId);
      if (!hasFragment) return ep;

      return {
        ...ep,
        fragments: ep.fragments.map(fr => {
          if (fr.id === fragmentId) {
            const newFactor: EpisodeFactor = {
              id: Date.now().toString(),
              factorId: factor.id,
              scope,
              targetId,
              value: factor.isPositive ? factor.weight : -factor.weight
            };
            const newFactors = [...fr.assignedFactors, newFactor];
            const totalScore = newFactors.reduce((acc, f) => acc + f.value, 0);
            const normalizedRating = Math.min(Math.max(totalScore / 5, -10), 10);
            return { ...fr, assignedFactors: newFactors, rating: normalizedRating };
          }
          return fr;
        })
      };
    }));
  };

  const handleRemoveFactor = (fragmentId: string, factorInstanceId: string) => {
    setEpisodes(prev => prev.map(ep => {
      const hasFragment = ep.fragments.some(f => f.id === fragmentId);
      if (!hasFragment) return ep;

      return {
        ...ep,
        fragments: ep.fragments.map(fr => {
          if (fr.id === fragmentId) {
            const newFactors = fr.assignedFactors.filter(f => f.id !== factorInstanceId);
            const totalScore = newFactors.reduce((acc, f) => acc + f.value, 0);
            const normalizedRating = Math.min(Math.max(totalScore / 5, -10), 10);
            return { ...fr, assignedFactors: newFactors, rating: normalizedRating };
          }
          return fr;
        })
      };
    }));
  };

  const handleUpdateEpisodeDescription = (id: string, desc: string) => {
    setEpisodes(prev => prev.map(ep => (ep.id === id ? { ...ep, description: desc } : ep)));
  };

  const handleUpdateFragmentDescription = (id: string, desc: string) => {
    setEpisodes(prev => prev.map(ep => {
       const hasFrag = ep.fragments.some(f => f.id === id);
       if (!hasFrag) return ep;
       return {
         ...ep,
         fragments: ep.fragments.map(f => f.id === id ? { ...f, description: desc } : f)
       };
    }));
  };

  // NEW: Update Timing Handler
  const handleUpdateTiming = (id: string, type: 'episode' | 'fragment', start: number, end: number) => {
    setEpisodes(prev => prev.map(ep => {
      if (type === 'episode' && ep.id === id) {
        return { ...ep, timestampStart: start, timestampEnd: end };
      }
      if (type === 'fragment') {
        // Check if this episode contains the fragment
        const hasFrag = ep.fragments.some(f => f.id === id);
        if (!hasFrag) return ep;
        
        return {
          ...ep,
          fragments: ep.fragments.map(f => 
            f.id === id ? { ...f, timestampStart: start, timestampEnd: end } : f
          )
        };
      }
      return ep;
    }));
  };

  const handleScreenshot = (imageDataUrl: string) => {
    if (currentFragmentId) {
       setEpisodes(prev => prev.map(ep => {
         const hasFrag = ep.fragments.some(f => f.id === currentFragmentId);
         if(!hasFrag) return ep;
         return {
            ...ep,
            fragments: ep.fragments.map(f => f.id === currentFragmentId ? { ...f, thumbnailUrl: imageDataUrl } : f)
         }
       }));
    } else if (currentEpisodeId) {
        setEpisodes(prev => prev.map(ep => ep.id === currentEpisodeId ? { ...ep, thumbnailUrl: imageDataUrl } : ep));
    } else {
        alert("Сначала выберите эпизод или фрагмент для сохранения скриншота.");
    }
  };

  const handleCreateEpisode = () => {
    const newEpId = `ep_${Date.now()}`;
    const start = currentTime;
    const end = Math.min(duration, currentTime + 30);
    
    const newEpisode: Episode = {
      id: newEpId,
      title: `Новый Эпизод ${episodes.length + 1}`,
      description: '',
      timestampStart: start,
      timestampEnd: end,
      fragments: []
    };
    setEpisodes(prev => [...prev, newEpisode]);
    setCurrentEpisodeId(newEpId);
    setCurrentFragmentId(null);
  };

  const handleCutFragment = () => {
     if (!currentEpisodeId) {
       alert("Сначала выберите или создайте эпизод!");
       return;
     }

     const newId = `frag_${Date.now()}`;
     const start = Math.max(0, currentTime - 2.5);
     const end = Math.min(duration, currentTime + 2.5);
     
     const newFragment: VideoFragment = {
        id: newId,
        episodeId: currentEpisodeId,
        title: `Фрагмент ${formatTimeSimple(start)}`,
        description: 'Вырезанный момент',
        category: FragmentType.ATTACK,
        timestampStart: start,
        timestampEnd: end,
        drawings: [],
        assignedFactors: [],
        tags: [],
        rating: 0
     };
     
     setEpisodes(prev => prev.map(ep => {
       if (ep.id === currentEpisodeId) {
         const updatedEpStart = Math.min(ep.timestampStart, start);
         const updatedEpEnd = Math.max(ep.timestampEnd, end);
         
         return { 
            ...ep, 
            timestampStart: updatedEpStart,
            timestampEnd: updatedEpEnd,
            fragments: [...ep.fragments, newFragment] 
         };
       }
       return ep;
     }));
     setCurrentFragmentId(newId);
  };

  const handleDeleteFragment = (episodeId: string, fragmentId: string) => {
      if (confirm("Вы уверены, что хотите удалить этот фрагмент?")) {
          setEpisodes(prev => prev.map(ep => {
              if (ep.id === episodeId) {
                  return {
                      ...ep,
                      fragments: ep.fragments.filter(f => f.id !== fragmentId)
                  }
              }
              return ep;
          }));
          if (currentFragmentId === fragmentId) {
              setCurrentFragmentId(null);
          }
      }
  };

  // Timeline Resize Logic
  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingHandle && duration > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newTime = Math.max(0, Math.min(duration, (x / rect.width) * duration));
        
        setEpisodes(prev => prev.map(ep => {
            if (draggingHandle.targetType === 'episode' && ep.id === draggingHandle.targetId) {
                if (draggingHandle.handleType === 'start') {
                    return { ...ep, timestampStart: Math.min(newTime, ep.timestampEnd - 1) };
                } else {
                    return { ...ep, timestampEnd: Math.max(newTime, ep.timestampStart + 1) };
                }
            }
            if (draggingHandle.targetType === 'fragment') {
                const updatedFragments = ep.fragments.map(fr => {
                    if (fr.id === draggingHandle.targetId) {
                        if (draggingHandle.handleType === 'start') {
                            return { ...fr, timestampStart: Math.min(newTime, fr.timestampEnd - 1) };
                        } else {
                            return { ...fr, timestampEnd: Math.max(newTime, fr.timestampStart + 1) };
                        }
                    }
                    return fr;
                });
                return { ...ep, fragments: updatedFragments };
            }
            return ep;
        }));
    }
  }, [draggingHandle, duration]);

  const handleTimelineMouseUp = () => {
    setDraggingHandle(null);
  };

  const formatTimeSimple = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2,'0')}`;
  };

  return (
    <div 
      className="flex flex-col h-screen bg-slate-900 text-white font-sans"
      onMouseUp={handleTimelineMouseUp} 
    >
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-700 bg-hockey-card flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <Activity className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">WayUp <span className="font-light text-slate-400">Аналитика</span></h1>
        </div>

        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
          <button 
            onClick={() => setCurrentView('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'editor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Video size={16} /> Редактор
          </button>
          <button 
             onClick={() => setCurrentView('stats')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'stats' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Layout size={16} /> Статистика
          </button>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Матч: Армада vs Академия
           </div>
           <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
             <User size={16} />
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {currentView === 'editor' ? (
          <>
            {/* Left Panel: Video Player */}
            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
               {/* Video Container */}
               <div className="w-full max-w-5xl mx-auto">
                 <VideoEditor 
                    videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    currentTime={currentTime}
                    onTimeUpdate={handleTimeUpdate}
                    onDurationChange={setDuration}
                    onDraw={handleDraw}
                    onUpdateDrawing={handleUpdateDrawing}
                    drawings={currentFragment?.drawings || []}
                    isDrawingMode={isDrawingMode}
                    toggleDrawingMode={() => setIsDrawingMode(!isDrawingMode)}
                    onScreenshot={handleScreenshot}
                    onCutFragment={handleCutFragment}
                 />
               </div>

               {/* Timeline Slider / Visualizer */}
               <div className="w-full max-w-5xl mx-auto bg-slate-800/50 rounded-lg p-4 border border-slate-700 select-none">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Layout size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Таймлайн</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleCreateEpisode}
                        className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-white flex items-center gap-1 transition-colors border border-slate-600"
                        title="Создать новую секцию эпизода"
                      >
                        <FolderPlus size={14} /> Новый Эпизод
                      </button>
                      <button 
                        onClick={handleCutFragment}
                        className="text-xs bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded text-white flex items-center gap-1 transition-colors border border-blue-600 shadow-md"
                        title="Вырезать фрагмент в текущем эпизоде"
                      >
                        <Scissors size={14} /> Вырезать Фрагмент
                      </button>
                    </div>
                  </div>

                  {/* Interactive Timeline Tracks */}
                  <div 
                      className={`relative h-32 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-inner ${draggingHandle ? 'cursor-col-resize' : 'cursor-pointer'}`}
                      onClick={(e) => {
                          if (!draggingHandle && duration > 0) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const percentage = x / rect.width;
                              handleTimeUpdate(percentage * duration);
                          }
                      }}
                      onMouseMove={handleTimelineMouseMove}
                  >
                      {/* Background Grid */}
                      <div className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                           style={{ backgroundImage: 'linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '5% 100%', opacity: 0.1 }} />

                      {/* Playhead */}
                      <div 
                          style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                          className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none"
                      >
                          <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45 rounded-sm"></div>
                      </div>

                      {/* TRACK 1: EPISODES */}
                      <div className="absolute top-0 left-0 w-full h-1/2 border-b border-slate-800">
                          <div className="absolute left-2 top-2 text-[10px] font-bold text-slate-500 z-0 pointer-events-none flex items-center gap-1"><FolderPlus size={10}/> ЭПИЗОДЫ</div>
                          
                          {episodes.map(ep => {
                              const start = (ep.timestampStart / (duration || 1)) * 100;
                              const width = ((ep.timestampEnd - ep.timestampStart) / (duration || 1)) * 100;
                              const isSelected = currentEpisodeId === ep.id;

                              return (
                                <div
                                  key={ep.id}
                                  style={{ left: `${start}%`, width: `${Math.max(width, 0.5)}%` }}
                                  className={`absolute top-6 h-8 rounded border transition-all group/ep z-10 ${isSelected 
                                      ? 'bg-purple-900/60 border-purple-500' 
                                      : 'bg-slate-800/60 border-slate-600 hover:bg-slate-700'}`}
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentEpisodeId(ep.id);
                                      handleTimeUpdate(ep.timestampStart);
                                  }}
                                >
                                    {/* Resize Handles */}
                                    {isSelected && (
                                        <>
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 w-2 hover:bg-purple-400/50 cursor-col-resize z-20"
                                                onMouseDown={(e) => { e.stopPropagation(); setDraggingHandle({ targetId: ep.id, targetType: 'episode', handleType: 'start' }); }}
                                            />
                                            <div 
                                                className="absolute right-0 top-0 bottom-0 w-2 hover:bg-purple-400/50 cursor-col-resize z-20"
                                                onMouseDown={(e) => { e.stopPropagation(); setDraggingHandle({ targetId: ep.id, targetType: 'episode', handleType: 'end' }); }}
                                            />
                                        </>
                                    )}
                                    <div className="w-full h-full flex items-center justify-center px-2">
                                       <span className="text-[10px] text-purple-200 truncate">{ep.title}</span>
                                    </div>
                                </div>
                              );
                          })}
                      </div>

                      {/* TRACK 2: FRAGMENTS */}
                      <div className="absolute top-1/2 left-0 w-full h-1/2 bg-slate-900/50">
                          <div className="absolute left-2 top-2 text-[10px] font-bold text-slate-500 z-0 pointer-events-none flex items-center gap-1"><Layers size={10}/> ФРАГМЕНТЫ</div>
                          
                          {episodes.flatMap(ep => ep.fragments).map(frag => {
                              const start = (frag.timestampStart / (duration || 1)) * 100;
                              const width = ((frag.timestampEnd - frag.timestampStart) / (duration || 1)) * 100;
                              const isSelected = currentFragmentId === frag.id;
                              
                              return (
                                  <div
                                      key={frag.id}
                                      style={{ left: `${start}%`, width: `${Math.max(width, 0.5)}%` }}
                                      className={`absolute top-6 h-8 rounded-md border transition-colors cursor-pointer group/frag z-10 ${isSelected 
                                          ? 'bg-blue-600/60 border-blue-400 ring-1 ring-blue-400' 
                                          : 'bg-slate-700/60 border-slate-600 hover:bg-slate-600'}`}
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setCurrentEpisodeId(frag.episodeId);
                                          setCurrentFragmentId(frag.id);
                                          handleTimeUpdate(frag.timestampStart);
                                      }}
                                  >
                                      {/* Resize Handles */}
                                      {isSelected && (
                                          <>
                                              <div 
                                                  className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400/30 hover:bg-blue-400 cursor-col-resize z-20"
                                                  onMouseDown={(e) => { e.stopPropagation(); setDraggingHandle({ targetId: frag.id, targetType: 'fragment', handleType: 'start' }); }}
                                              />
                                              <div 
                                                  className="absolute right-0 top-0 bottom-0 w-2 bg-blue-400/30 hover:bg-blue-400 cursor-col-resize z-20"
                                                  onMouseDown={(e) => { e.stopPropagation(); setDraggingHandle({ targetId: frag.id, targetType: 'fragment', handleType: 'end' }); }}
                                              />
                                          </>
                                      )}

                                      <div className="w-full h-full flex items-center px-2 overflow-hidden">
                                          <span className="text-[10px] text-white truncate font-medium">{frag.title}</span>
                                      </div>
                                      {/* Rating indicator */}
                                      <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-80 ${frag.rating >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                  </div>
                              );
                          })}
                      </div>
                  </div>
                  
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-1">
                      <span>00:00</span>
                      <span>{duration ? new Date(duration * 1000).toISOString().substr(14, 5) : '--:--'}</span>
                  </div>
               </div>
            </div>

            {/* Right Panel: Tools & Analysis */}
            <EpisodeManager 
              episodes={episodes}
              players={MOCK_PLAYERS}
              availableFactors={KNOWLEDGE_BASE_FACTORS}
              currentEpisodeId={currentEpisodeId}
              currentFragmentId={currentFragmentId}
              onSelectEpisode={(id) => {
                 setCurrentEpisodeId(id);
                 const ep = episodes.find(e => e.id === id);
                 if(ep) handleTimeUpdate(ep.timestampStart);
              }}
              onSelectFragment={(epId, fragId) => {
                 setCurrentEpisodeId(epId);
                 setCurrentFragmentId(fragId);
                 const frag = episodes.find(e => e.id === epId)?.fragments.find(f => f.id === fragId);
                 if(frag) handleTimeUpdate(frag.timestampStart);
              }}
              onDeleteFragment={handleDeleteFragment}
              onAddFactor={handleAddFactor}
              onRemoveFactor={handleRemoveFactor}
              onUpdateEpisodeDescription={handleUpdateEpisodeDescription}
              onUpdateFragmentDescription={handleUpdateFragmentDescription}
              onUpdateTiming={handleUpdateTiming}
            />
          </>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <StatsDashboard episodes={episodes} players={MOCK_PLAYERS} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;