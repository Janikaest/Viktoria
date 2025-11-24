
import React, { useState, useEffect } from 'react';
import { Episode, EvaluationScope, Factor, Player, PlayerRole, VideoFragment } from '../types';
import { Trash2, ChevronDown, ChevronRight, Plus, Star, BrainCircuit, Folder, Film, Clock, Play, Edit2, Monitor, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { generateEpisodeSummary } from '../services/geminiService';

interface EpisodeManagerProps {
  episodes: Episode[];
  players: Player[];
  availableFactors: Factor[];
  currentEpisodeId: string | null;
  currentFragmentId: string | null;
  onSelectEpisode: (id: string) => void;
  onSelectFragment: (episodeId: string, fragmentId: string) => void;
  onDeleteFragment: (episodeId: string, fragmentId: string) => void;
  onAddFactor: (fragmentId: string, factor: Factor, scope: EvaluationScope, targetId?: string) => void;
  onRemoveFactor: (fragmentId: string, factorInstanceId: string) => void;
  onUpdateEpisodeDescription: (id: string, desc: string) => void;
  onUpdateFragmentDescription: (id: string, desc: string) => void;
  onUpdateTiming: (id: string, type: 'episode' | 'fragment', start: number, end: number) => void;
}

// Internal Helper Component for Time Editing
const TimeEditor: React.FC<{ 
  start: number; 
  end: number; 
  onSave: (s: number, e: number) => void; 
  className?: string 
}> = ({ start, end, onSave, className }) => {
  const [sText, setSText] = useState('');
  const [eText, setEText] = useState('');

  const format = (val: number) => {
    const m = Math.floor(val / 60);
    const s = Math.floor(val % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const parse = (val: string) => {
    const parts = val.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(val) || 0;
  };

  useEffect(() => {
    setSText(format(start));
    setEText(format(end));
  }, [start, end]);

  const handleBlur = () => {
    const newStart = parse(sText);
    const newEnd = parse(eText);
    if (newStart !== start || newEnd !== end) {
      onSave(newStart, newEnd);
    }
  };

  return (
    <div className={`flex items-center gap-1 bg-slate-900/50 rounded px-1 border border-slate-700 ${className}`}>
      <input 
        className="w-10 bg-transparent text-center outline-none text-[10px] font-mono text-slate-300 focus:text-white focus:bg-slate-800 rounded"
        value={sText}
        onChange={(e) => setSText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <span className="text-slate-500 text-[10px]">-</span>
      <input 
        className="w-10 bg-transparent text-center outline-none text-[10px] font-mono text-slate-300 focus:text-white focus:bg-slate-800 rounded"
        value={eText}
        onChange={(e) => setEText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </div>
  );
};

export const EpisodeManager: React.FC<EpisodeManagerProps> = ({
  episodes,
  players,
  availableFactors,
  currentEpisodeId,
  currentFragmentId,
  onSelectEpisode,
  onSelectFragment,
  onDeleteFragment,
  onAddFactor,
  onRemoveFactor,
  onUpdateEpisodeDescription,
  onUpdateFragmentDescription,
  onUpdateTiming
}) => {
  const [aiLoading, setAiLoading] = useState(false);

  // Determine active fragment object for detail view
  const activeEpisode = episodes.find(e => e.id === currentEpisodeId);
  const activeFragment = activeEpisode?.fragments.find(f => f.id === currentFragmentId);

  const handleGenerateSummary = async (fragmentId: string) => {
    if (!activeFragment) return;
    setAiLoading(true);
    const summary = await generateEpisodeSummary(activeFragment, availableFactors, players);
    onUpdateFragmentDescription(fragmentId, summary);
    setAiLoading(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getPlayerName = (id?: string) => {
      const p = players.find(pl => pl.id === id);
      return p ? `#${p.number} ${p.name}` : 'Неизвестно';
  };

  const getSubjectLabel = (frag: VideoFragment) => {
      if (frag.subject?.scope === EvaluationScope.PLAYER) return getPlayerName(frag.subject.id);
      if (frag.subject?.scope === EvaluationScope.ROLE) return frag.subject.id;
      return 'Команда';
  };

  // --- RENDER COMPONENTS ---

  const renderEpisodeDetail = (episode: Episode) => (
     <div className="p-4 space-y-6">
        <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                <Folder size={14} className="text-blue-400"/>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Детали Эпизода</h4>
            </div>
            <div className="p-4 grid grid-cols-1 gap-y-4 text-sm">
                 <div>
                    <label className="text-xs text-slate-500 block mb-1">Название</label>
                    <div className="text-white font-bold text-lg">{episode.title}</div>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-20 shrink-0">• Время:</span>
                    <div className="flex items-center gap-2">
                        <TimeEditor 
                            start={episode.timestampStart}
                            end={episode.timestampEnd}
                            onSave={(s, e) => onUpdateTiming(episode.id, 'episode', s, e)}
                        />
                        <span className="text-[10px] text-slate-500">({Math.round(episode.timestampEnd - episode.timestampStart)} с)</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Описание</label>
                    <textarea 
                        className="w-full bg-slate-800/50 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
                        rows={3}
                        placeholder="Добавьте описание эпизода..."
                        value={episode.description}
                        onChange={(e) => onUpdateEpisodeDescription(episode.id, e.target.value)}
                    />
                </div>
                <div>
                     <span className="text-xs text-slate-500">Количество фрагментов: <span className="text-white font-bold">{episode.fragments.length}</span></span>
                </div>
            </div>
        </div>
     </div>
  );

  const renderFragmentDetail = (fragment: VideoFragment) => (
     <div className="p-4 space-y-6">
        
        {/* 1. Video Preview */}
        <div className="relative w-full aspect-video bg-black rounded-lg border border-slate-600 overflow-hidden shadow-lg group">
            {fragment.thumbnailUrl ? (
                  <img src={fragment.thumbnailUrl} className="w-full h-full object-cover opacity-90" />
            ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Film size={32} />
                      <span className="text-xs">Видео недоступно</span>
                  </div>
            )}
            
            {/* Video Overlay Box */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur border border-white/10 px-3 py-1.5 rounded text-xs text-white font-mono">
                Время {formatTime(fragment.timestampStart)}-{formatTime(fragment.timestampEnd)}
            </div>
            
            {/* Annotations Overlay Hint */}
            <div className="absolute bottom-3 left-3 bg-blue-600/90 backdrop-blur px-2 py-1 rounded text-[10px] text-white border border-blue-400/50 flex items-center gap-1 shadow-lg">
                <Edit2 size={10} />
                {fragment.drawings.length} аннотаций
            </div>
        </div>

        {/* 2. Basic Info Grid (📋 Основное) */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                <Monitor size={14} className="text-blue-400"/>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Основное</h4>
            </div>
            <div className="p-4 grid grid-cols-1 gap-y-2 text-sm">
                <div className="flex items-start gap-2">
                    <span className="text-slate-500 w-20 shrink-0">• Игрок:</span>
                    <span className="font-medium text-blue-300">{getSubjectLabel(fragment)}</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-slate-500 w-20 shrink-0">• Тип:</span>
                    <span className="font-medium text-white">{fragment.category}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-20 shrink-0">• Время:</span>
                    <div className="flex items-center gap-2">
                        <TimeEditor 
                            start={fragment.timestampStart}
                            end={fragment.timestampEnd}
                            onSave={(s, e) => onUpdateTiming(fragment.id, 'fragment', s, e)}
                        />
                        <span className="text-[10px] text-slate-500">({Math.round(fragment.timestampEnd - fragment.timestampStart)} с)</span>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-slate-500 w-20 shrink-0">• Счет:</span>
                    <span className="font-medium text-white">{fragment.gameScore || "0:0"}</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-slate-500 w-20 shrink-0">• Состав:</span>
                    <span className="font-medium text-white">{fragment.composition || "5x5"}</span>
                </div>
            </div>
        </div>

        {/* 3. Description (📝 Описание) */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Edit2 size={14} className="text-green-400"/>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Описание</h4>
                </div>
                <button 
                    onClick={() => handleGenerateSummary(fragment.id)}
                    disabled={aiLoading}
                    className="text-[10px] flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                >
                    <BrainCircuit size={12} /> {aiLoading ? 'Генерация...' : 'AI Анализ'}
                </button>
            </div>
            <div className="p-4">
                <textarea 
                    className="w-full bg-transparent text-sm text-slate-300 focus:outline-none resize-none leading-relaxed placeholder-slate-600"
                    rows={3}
                    placeholder="Добавить комментарий тренера..."
                    value={fragment.description}
                    onChange={(e) => onUpdateFragmentDescription(fragment.id, e.target.value)}
                />
            </div>
        </div>

        {/* 4. Screenshots (📸 Скриншоты) */}
        <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <ImageIcon size={14} className="text-yellow-500"/> 
                Скриншоты ({fragment.screenshots?.length || (fragment.thumbnailUrl ? 1 : 0)})
            </h4>
            <div className="grid grid-cols-3 gap-3">
                {/* Main Thumbnail */}
                {fragment.thumbnailUrl && (
                    <div className="aspect-video rounded-lg bg-black border border-slate-700 overflow-hidden relative group cursor-pointer hover:border-blue-500 transition-all">
                        <img src={fragment.thumbnailUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 size={16} className="text-white"/>
                        </div>
                    </div>
                )}
                
                {/* Gallery */}
                {fragment.screenshots?.map((src, idx) => (
                    <div key={idx} className="aspect-video rounded-lg bg-black border border-slate-700 overflow-hidden relative group cursor-pointer hover:border-blue-500 transition-all">
                        <img src={src} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                            <button className="bg-black/60 p-1 rounded text-white hover:text-red-400"><Trash2 size={12}/></button>
                        </div>
                    </div>
                ))}

                {/* Add Button */}
                <button className="aspect-video rounded-lg border border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-400 transition-colors bg-slate-900/30 hover:bg-slate-800">
                    <Plus size={20} />
                    <span className="text-[10px] mt-1">Добавить</span>
                </button>
            </div>
        </div>
     </div>
  );

  return (
    <div className="flex flex-col h-full bg-hockey-card border-l border-slate-700 w-[500px] shrink-0 shadow-xl relative">
      
      {/* HEADER */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/95 backdrop-blur shrink-0 z-10 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Folder size={18} className="text-blue-400" fill="currentColor" />
          Структура Матча
        </h2>
        <span className="text-xs text-slate-500">{episodes.length} эпизодов</span>
      </div>

      {/* PART 1: LIST (Top Half) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50 min-h-0 border-b border-slate-800">
        {episodes.map((episode) => {
          const isEpExpanded = currentEpisodeId === episode.id;
          
          return (
            <div 
              key={episode.id} 
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${isEpExpanded ? 'border-blue-500/30 bg-slate-800/30' : 'border-slate-700 bg-slate-800'}`}
            >
              {/* Episode Header Line */}
              <div 
                className={`p-3 cursor-pointer flex items-center justify-between select-none hover:bg-slate-700/50 transition-colors ${isEpExpanded && !currentFragmentId ? 'bg-blue-900/20' : 'bg-slate-900/50'}`}
                onClick={() => {
                    onSelectEpisode(episode.id);
                    if (currentFragmentId) {
                        // Deselect fragment if clicking episode header while expanded
                        onSelectFragment(episode.id, ""); // Need a way to clear fragment, passing empty string or handling null
                    }
                }}
              >
                <div className="flex items-center gap-2">
                   {isEpExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                   <span className={`text-sm font-bold ${isEpExpanded && !currentFragmentId ? 'text-blue-300' : 'text-slate-200'}`}>
                      {episode.title}
                   </span>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full ml-2">{episode.fragments.length}</span>
              </div>

              {/* Fragments List */}
              {isEpExpanded && (
                <div className="p-2 space-y-2 bg-slate-900/20 border-t border-slate-700/30">
                   {episode.fragments.map((frag, idx) => {
                       const isFragActive = currentFragmentId === frag.id;
                       
                       return (
                          <div 
                            key={frag.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border group ${
                                isFragActive 
                                ? 'bg-blue-900/20 border-blue-500/50 shadow-md' 
                                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectFragment(episode.id, frag.id);
                            }}
                          >
                             <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`text-sm font-bold truncate ${isFragActive ? 'text-blue-300' : 'text-white'}`}>
                                        {frag.title}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <span className="truncate max-w-[80px]">{getSubjectLabel(frag)}</span>
                                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                        <span>{formatTime(frag.timestampStart)}</span>
                                    </div>
                                </div>
                             </div>
                             
                             <button 
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 hover:text-red-400 text-slate-500 rounded transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteFragment(episode.id, frag.id);
                                }}
                                title="Удалить фрагмент"
                             >
                                 <Trash2 size={12} />
                             </button>
                          </div>
                       );
                   })}
                   
                   {episode.fragments.length === 0 && (
                       <div className="text-center py-4 text-xs text-slate-500 border border-dashed border-slate-700 rounded-lg">
                           Нет фрагментов.
                       </div>
                   )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PART 2: DETAILS (Bottom Half) */}
      <div className="h-1/2 bg-slate-800 overflow-y-auto border-t border-slate-600 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] relative">
        <div className="p-4 bg-slate-900/90 border-b border-slate-700 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                {activeFragment ? (
                    <><span className="text-blue-500 font-mono">ФРАГМЕНТ:</span> {activeFragment.title}</>
                ) : activeEpisode ? (
                    <><span className="text-purple-500 font-mono">ЭПИЗОД:</span> {activeEpisode.title}</>
                ) : (
                    <span className="text-slate-500">Ничего не выбрано</span>
                )}
            </h3>
            <button className="text-slate-400 hover:text-white"><MoreVertical size={16}/></button>
        </div>

        {activeFragment ? renderFragmentDetail(activeFragment) : activeEpisode ? renderEpisodeDetail(activeEpisode) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Folder size={48} className="mb-4 opacity-20" />
                <p>Выберите эпизод или фрагмент для просмотра деталей</p>
            </div>
        )}
      </div>

    </div>
  );
};