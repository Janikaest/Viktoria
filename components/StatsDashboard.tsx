
import React, { useState, useMemo } from 'react';
import { Episode, Player, PlayerRole, EvaluationScope } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, LineChart, Line
} from 'recharts';
import { 
  Trophy, TrendingUp, Users, Calendar, Filter, Download, Search, 
  PlayCircle, ChevronDown, ChevronUp, Star, ArrowUpRight, ArrowDownRight,
  LayoutGrid, List, BrainCircuit, ChevronRight, Clock, Film,
  Shield, Target, Activity, AlertCircle, Medal, ArrowRight, ArrowLeft, CheckCircle2,
  Lightbulb, Flame, BookOpen, GraduationCap, FileText, Mail, Play, Swords, Zap, AlertTriangle, ClipboardList, PenTool
} from 'lucide-react';

interface StatsDashboardProps {
  episodes: Episode[];
  players: Player[];
}

// --- MOCK DATA ---

const MOCK_SEASON_STATS = [
  { date: 'Окт', rating: 6.5, match: 'против ЦСКА' },
  { date: 'Ноя', rating: 7.2, match: 'против Спартак' },
  { date: 'Дек', rating: 7.0, match: 'против Динамо' },
  { date: 'Янв', rating: 7.8, match: 'против СКА' },
  { date: 'Фев', rating: 8.5, match: 'против Локо' },
  { date: 'Мар', rating: 8.9, match: 'против Академия' },
];

const TEAM_DYNAMICS_DATA = [
    { match: 'М1', rating: 7.1 },
    { match: 'М2', rating: 7.4 },
    { match: 'М3', rating: 7.9 },
    { match: 'М4', rating: 8.0 },
    { match: 'М5', rating: 7.8 },
];

const ROLE_SPECIFIC_DATA = {
  [PlayerRole.FORWARD]: {
    avg: 8.2,
    count: 24,
    best: { name: 'Реализация моментов', val: 8.9 },
    growth: { name: 'Позиционирование', val: 6.5 },
    top3: [
      { rank: 1, name: 'Иванов А.', number: 11, rating: 9.1, id: 'p1' },
      { rank: 2, name: 'Петров С.', number: 23, rating: 8.7, id: 'p2' },
      { rank: 3, name: 'Сидоров М.', number: 45, rating: 8.3, id: 'p3' },
    ]
  },
  [PlayerRole.DEFENDER]: {
    avg: 7.5,
    count: 18,
    best: { name: 'Силовая борьба', val: 8.1 },
    growth: { name: 'Первый пас', val: 6.8 },
    top3: [
      { rank: 1, name: 'Смирнов К.', number: 55, rating: 8.0, id: 'p4' },
      { rank: 2, name: 'Орлов Д.', number: 7, rating: 7.8, id: 'p5' },
      { rank: 3, name: 'Волков А.', number: 2, rating: 7.2, id: 'p6' },
    ]
  },
  [PlayerRole.GOALIE]: {
    avg: 7.6,
    count: 12,
    best: { name: 'Реакция', val: 8.5 },
    growth: { name: 'Игра с шайбой', val: 6.2 },
    top3: [
      { rank: 1, name: 'Кузнецов К.', number: 20, rating: 8.9, id: 'p4' }, 
      { rank: 2, name: 'Васильев И.', number: 30, rating: 7.1, id: 'p7' },
    ]
  }
};

// Extended Player Data for the Table View
interface ExtendedPlayerStats {
  id: string;
  name: string;
  role: string;
  number: number;
  matches: number;
  episodes: number;
  rating: number;
  trend: number;
  bestSide: string;
  growthArea: string;
  openTasks: number;
  lastAnalysis: string;
  status: 'active' | 'injured' | 'reserve';
}

const MOCK_EXTENDED_PLAYERS: ExtendedPlayerStats[] = [
  { id: 'p1', name: 'Иванов Александр', number: 11, role: 'Нападающий', matches: 45, episodes: 387, rating: 8.7, trend: 0.8, bestSide: 'Реализация моментов', growthArea: 'Игра в обороне', openTasks: 3, lastAnalysis: '26.02.2025', status: 'active' },
  { id: 'p2', name: 'Петров Сергей', number: 23, role: 'Нападающий', matches: 41, episodes: 312, rating: 8.2, trend: 0.2, bestSide: 'Использование пространства', growthArea: 'Скорость решений', openTasks: 2, lastAnalysis: '25.02.2025', status: 'active' },
  { id: 'p3', name: 'Сидоров Максим', number: 45, role: 'Нападающий', matches: 43, episodes: 298, rating: 8.0, trend: -0.1, bestSide: 'Чувство ворот', growthArea: 'Позиционирование', openTasks: 1, lastAnalysis: '23.02.2025', status: 'active' },
  { id: 'p4', name: 'Кузнецов Дмитрий', number: 7, role: 'Защитник', matches: 39, episodes: 241, rating: 6.9, trend: -0.8, bestSide: 'Силовая борьба', growthArea: 'Первый пас', openTasks: 4, lastAnalysis: '24.02.2025', status: 'active' },
  { id: 'p5', name: 'Морозов Павел', number: 5, role: 'Защитник', matches: 27, episodes: 163, rating: 5.8, trend: -1.1, bestSide: 'Блокирование бросков', growthArea: 'Потеря позиции', openTasks: 5, lastAnalysis: '20.02.2025', status: 'reserve' },
  { id: 'p6', name: 'Орлов Илья', number: 30, role: 'Вратарь', matches: 32, episodes: 209, rating: 7.4, trend: 0.3, bestSide: 'Реакция', growthArea: 'Игра с шайбой', openTasks: 2, lastAnalysis: '22.02.2025', status: 'active' },
  { id: 'p7', name: 'Васильев Игорь', number: 15, role: 'Нападающий', matches: 12, episodes: 45, rating: 6.2, trend: 0.1, bestSide: 'Скорость', growthArea: 'Бросок', openTasks: 6, lastAnalysis: '15.02.2025', status: 'reserve' },
];

// Mock Data specific for the Player Profile View request
const PLAYER_MATCH_HISTORY = [
    {
        id: 'm1',
        date: '26.02.2025',
        opponent: 'Армада vs Академия',
        score: '5:4',
        episodes: [
            { id: 'e1', title: 'Голевой момент #1', rating: 9.2, type: 'Атака' },
            { id: 'e2', title: 'Атака с фланга', rating: 8.1, type: 'Атака' },
            { id: 'e3', title: 'Бросок из центра', rating: 7.5, type: 'Атака' },
        ]
    },
    {
        id: 'm2',
        date: '23.02.2025',
        opponent: 'Армада vs Динамо',
        score: '3:3',
        episodes: [
            { id: 'e4', title: 'Реализация большинства', rating: 8.9, type: 'Power Play' },
            { id: 'e5', title: 'Потеря шайбы', rating: 5.2, type: 'Оборона' },
        ]
    },
    {
        id: 'm3',
        date: '20.02.2025',
        opponent: 'Армада vs ЦСКА',
        score: '2:4',
        episodes: [
            { id: 'e6', title: 'Ошибка в позиционировании', rating: 4.5, type: 'Оборона' },
            { id: 'e7', title: 'Блокировка броска', rating: 7.0, type: 'Оборона' },
        ]
    }
];

const VIDEO_COLLECTIONS = [
    { title: 'Лучшие моменты', count: 12, time: '3:45', icon: <Flame size={20} className="text-orange-500" />, type: 'best' },
    { title: 'Ошибки', count: 8, time: '2:20', icon: <BookOpen size={20} className="text-blue-500" />, type: 'errors' },
    { title: 'Обучающие примеры', count: 15, time: '4:10', icon: <GraduationCap size={20} className="text-purple-500" />, type: 'edu' },
];

type StatsViewMode = 'team' | 'roles' | 'players';
type QuickGroupFilter = 'risk' | 'drop' | 'growth' | 'tasks' | null;

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ episodes, players }) => {
  const [statsView, setStatsView] = useState<StatsViewMode>('team');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Players Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [quickGroupFilter, setQuickGroupFilter] = useState<QuickGroupFilter>(null);

  // --- Helpers ---
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400';
    if (rating >= 6.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 8) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (rating >= 6.5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  const navigateToPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setStatsView('players');
  };

  // --- VIEW COMPONENTS ---

  const GlobalEpisodesList = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
       <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-slate-700 flex-1"></div>
          <div className="text-slate-500 text-xs uppercase tracking-widest font-bold">Детальный отчет</div>
          <div className="h-px bg-slate-700 flex-1"></div>
       </div>
       <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
             <List size={20} className="text-blue-500" />
             ВСЕ ЭПИЗОДЫ ({episodes.length})
          </h3>
          <div className="flex flex-wrap gap-2">
             {['Все амплуа', 'Все типы', 'Все игроки'].map(f => (
                <button key={f} className="flex items-center gap-1 bg-slate-800 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded text-xs text-slate-300 transition-colors">
                   {f} <ChevronDown size={12} />
                </button>
             ))}
          </div>
       </div>

       <div className="grid grid-cols-1 gap-3">
          {episodes.map((ep, idx) => {
             const rating = idx === 0 ? 9.2 : 6.5;
             return (
               <div key={ep.id} className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 hover:border-slate-500 transition-all group">
                  <div className="flex items-start justify-between">
                     <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg border ${getRatingBg(rating)}`}>
                           {rating}
                        </div>
                        <div>
                           <div className="font-bold text-white text-base mb-1 flex items-center gap-2">
                              {ep.title}
                              <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 border border-slate-600">#{idx+1}</span>
                           </div>
                           <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Clock size={12}/> 00:0{Math.floor(ep.timestampStart / 60)}:{Math.floor(ep.timestampStart % 60).toString().padStart(2,'0')}</span>
                              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                              <span className="text-blue-300">Иванов А. (#11)</span>
                              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                              <span className="uppercase tracking-wider">{idx % 2 === 0 ? 'Атака' : 'Оборона'}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded border border-slate-600">Детали</button>
                        <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow-lg shadow-blue-900/20">Редактор</button>
                     </div>
                  </div>
               </div>
             );
          })}
       </div>
    </div>
  );

  const RoleStatsGrid = () => (
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
         {[PlayerRole.FORWARD, PlayerRole.DEFENDER, PlayerRole.GOALIE].map((role, idx) => {
           const data = ROLE_SPECIFIC_DATA[role];
           const Icon = role === PlayerRole.GOALIE ? Shield : role === PlayerRole.DEFENDER ? AlertCircle : Target;
           return (
             <div key={role} className="flex flex-col bg-hockey-card border border-slate-700 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-slate-600 transition-all duration-300">
                <div className="bg-slate-800/80 p-5 border-b border-slate-700 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${idx === 0 ? 'bg-blue-500/20 text-blue-400' : idx === 1 ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                         <Icon size={20} />
                      </div>
                      <h3 className="font-bold text-white text-lg uppercase tracking-wide">{role}</h3>
                   </div>
                   <div className={`text-xl font-bold ${getRatingColor(data.avg)}`}>
                      {data.avg}
                   </div>
                </div>
                <div className="p-5 space-y-4 flex-1">
                   <div className="space-y-3 text-sm">
                       <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-2"><Film size={14}/> Эпизодов</span>
                          <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{data.count}</span>
                       </div>
                       <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-3">
                          <div className="flex justify-between text-xs mb-1">
                             <span className="text-green-400 font-bold uppercase tracking-wider">Лучшее</span>
                             <span className="text-green-400 font-bold">{data.best.val}</span>
                          </div>
                          <div className="text-white text-sm font-medium">{data.best.name}</div>
                       </div>
                       <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex justify-between text-xs mb-1">
                             <span className="text-red-400 font-bold uppercase tracking-wider">Зона роста</span>
                             <span className="text-red-400 font-bold">{data.growth.val}</span>
                          </div>
                          <div className="text-white text-sm font-medium">{data.growth.name}</div>
                       </div>
                   </div>
                   <div className="my-4 border-t border-slate-700 border-dashed"></div>
                   <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                         <Medal size={12} className="text-yellow-500" /> Топ-3 Игрока
                      </h4>
                      <div className="space-y-1">
                         {data.top3.map((p, i) => (
                            <button 
                               key={i}
                               onClick={() => navigateToPlayer(p.id)}
                               className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-700/50 transition-colors group text-left"
                            >
                               <div className="flex items-center gap-3">
                                  <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-400 text-black' : 'bg-orange-700 text-orange-200'}`}>
                                     {p.rank}
                                  </span>
                                  <span className="text-sm text-slate-300 group-hover:text-blue-300 transition-colors">
                                     <span className="text-slate-500 mr-1">#{p.number}</span> {p.name}
                                  </span>
                               </div>
                               <div className={`text-sm font-bold ${getRatingColor(p.rating)}`}>{p.rating}</div>
                            </button>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="p-3 bg-slate-800/30 border-t border-slate-700">
                    <button 
                        onClick={() => setStatsView('players')}
                        className="w-full text-xs text-center text-slate-400 hover:text-white py-1 transition-colors flex items-center justify-center gap-1"
                    >
                        Подробная статистика <ArrowRight size={12}/>
                    </button>
                </div>
             </div>
           );
         })}
      </div>
  );

  const TeamOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      {/* 1. HEADER & META */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Activity size={24} className="text-blue-500"/>
                  АНАЛИТИКА ПО КОМАНДЕ
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Swords size={14}/> Матч: <span className="text-white font-medium">Армада vs Академия</span></span>
                  <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                  <span className="flex items-center gap-1"><Calendar size={14}/> Период: <span className="text-white font-medium">Последние 5 матчей</span></span>
                  <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                  <span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded text-xs border border-blue-500/30">Режим: Команда</span>
              </div>
          </div>
          <div className="flex gap-2">
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm border border-slate-600 transition-colors">
                  <Download size={16} /> Отчет PDF
               </button>
          </div>
      </div>

      {/* 2. GENERAL STATE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
              { label: 'Средний рейтинг', val: '7.8', sub: 'Хорошо', color: 'text-green-400', icon: <Star size={16} className="text-green-400"/> },
              { label: 'Всего эпизодов', val: '132', sub: 'Высокая активность', color: 'text-white', icon: <Film size={16} className="text-blue-400"/> },
              { label: 'Ошибок за матч', val: '6.4', sub: 'Ниже среднего', color: 'text-orange-400', icon: <AlertCircle size={16} className="text-orange-400"/> },
              { label: 'Стабильность', val: 'Средняя', sub: 'Колебания в 2 периоде', color: 'text-yellow-400', icon: <Activity size={16} className="text-yellow-400"/> },
              { label: 'Общий тренд', val: 'Рост', sub: 'Нестабильный', color: 'text-blue-300', icon: <TrendingUp size={16} className="text-blue-300"/> },
          ].map((stat, i) => (
             <div key={i} className="bg-hockey-card border border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
                 <div className="flex justify-between items-start mb-2">
                     <span className="text-xs text-slate-500 font-bold uppercase">{stat.label}</span>
                     {stat.icon}
                 </div>
                 <div>
                     <div className={`text-2xl font-bold ${stat.color}`}>{stat.val}</div>
                     <div className="text-[10px] text-slate-400 mt-1">{stat.sub}</div>
                 </div>
             </div>
          ))}
      </div>

      {/* 3. DYNAMICS CHART */}
      <div className="bg-hockey-card border border-slate-700 rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-end mb-6">
              <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Динамика качества игры</h3>
                  <div className="text-sm text-slate-300 flex items-center gap-2">
                      Матчи: 
                      <span className="font-mono text-slate-500">7.1 → 7.4 → 7.9 → 8.0 → 7.8</span>
                  </div>
              </div>
          </div>
          <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={TEAM_DYNAMICS_DATA}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                       <XAxis dataKey="match" stroke="#64748b" tickLine={false} axisLine={false} />
                       <YAxis domain={[6, 10]} stroke="#64748b" tickLine={false} axisLine={false} />
                       <Tooltip 
                          contentStyle={{backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff', borderRadius: '8px'}}
                          itemStyle={{color: '#fff'}}
                       />
                       <Line 
                          type="monotone" 
                          dataKey="rating" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          dot={{fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff'}} 
                          activeDot={{r: 6}}
                       />
                   </LineChart>
               </ResponsiveContainer>
          </div>
      </div>

      {/* 4. GAME PHASES ANALYSIS */}
      <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap size={16} /> Анализ по фазам игры
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[
                 { title: 'Атака', score: 8.3, count: 46, detail: 'Реализация: 78%', color: 'text-green-400', bar: 83 },
                 { title: 'Оборона', score: 6.5, count: 52, detail: 'Опасные моменты: 11', color: 'text-red-400', bar: 65 },
                 { title: 'Переходы', score: 6.2, count: 21, detail: 'Потери (1-й пас): 9', color: 'text-orange-400', bar: 62 },
                 { title: 'Давление', score: 7.1, count: 13, detail: 'Выход из зоны: 60%', color: 'text-yellow-400', bar: 71 },
             ].map((phase, i) => (
                 <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 relative overflow-hidden">
                     <div className="relative z-10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-white">{phase.title}</span>
                            <span className={`text-lg font-bold ${phase.color}`}>{phase.score}</span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-400 mb-3">
                            <div>Эпизодов: <span className="text-slate-200">{phase.count}</span></div>
                            <div>{phase.detail}</div>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                             <div className={`h-full ${phase.color.replace('text-', 'bg-')}`} style={{width: `${phase.bar}%`}}></div>
                        </div>
                     </div>
                 </div>
             ))}
          </div>
      </div>

      {/* 5. STRENGTHS & PROBLEMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-hockey-card border border-slate-700 rounded-xl p-6 shadow-lg">
             <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider mb-5">
                 <div className="p-1 bg-green-500/20 rounded"><Trophy size={16} className="text-green-400"/></div>
                 Системные сильные стороны
             </h3>
             <div className="space-y-4">
                 {[
                     { name: 'Реализация моментов', val: 8.9 },
                     { name: 'Командное взаимодействие в атаке', val: 8.6 },
                     { name: 'Игра на добивании', val: 8.4 },
                     { name: 'Поддержка партнёра при входе', val: 8.2 },
                 ].map((s, i) => (
                     <div key={i} className="group">
                         <div className="flex justify-between text-xs mb-1.5">
                             <span className="text-slate-200 flex gap-2"><span className="text-slate-500 font-mono">{i+1}.</span> {s.name}</span>
                             <span className="text-green-400 font-bold">{s.val}</span>
                         </div>
                         <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                             <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" style={{ width: `${s.val * 10}%` }}></div>
                         </div>
                     </div>
                 ))}
             </div>
          </div>

          {/* Problems */}
          <div className="bg-hockey-card border border-slate-700 rounded-xl p-6 shadow-lg">
             <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider mb-5">
                 <div className="p-1 bg-red-500/20 rounded"><AlertTriangle size={16} className="text-red-400"/></div>
                 Системные проблемы
             </h3>
             <div className="space-y-4">
                 {[
                     { name: 'Потеря позиции в средней зоне', val: 5.8 },
                     { name: 'Медленный первый пас из обороны', val: 6.1 },
                     { name: 'Разрывы между линиями', val: 6.3 },
                 ].map((s, i) => (
                     <div key={i} className="group">
                         <div className="flex justify-between text-xs mb-1.5">
                             <span className="text-slate-200 flex gap-2"><span className="text-slate-500 font-mono">{i+1}.</span> {s.name}</span>
                             <span className="text-red-400 font-bold">{s.val}</span>
                         </div>
                         <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                             <div className="h-full bg-red-500" style={{ width: `${s.val * 10}%` }}></div>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      </div>

      {/* 6. RECURRING ERRORS & STABILITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Повторяющиеся ошибки</h3>
              <ul className="space-y-3">
                  {[
                      { txt: 'Потери в центре при переходе в атаку', count: 7 },
                      { txt: 'Несогласованность защитников при смене', count: 4 },
                      { txt: 'Запаздывание поддержки при быстрых атаках', count: 5 },
                  ].map((err, i) => (
                      <li key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                             <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                             {err.txt}
                          </div>
                          <span className="text-xs font-bold text-slate-500 px-2 py-0.5 bg-slate-800 rounded">{err.count} эп.</span>
                      </li>
                  ))}
              </ul>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Стабильность показателей</h3>
               <div className="space-y-4">
                  <div>
                      <div className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1"><CheckCircle2 size={12}/> Стабильные зоны:</div>
                      <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-green-900/20 text-green-300 border border-green-500/30 rounded text-xs">Реализация бросков</span>
                          <span className="px-3 py-1 bg-green-900/20 text-green-300 border border-green-500/30 rounded text-xs">Командная структура в атаке</span>
                      </div>
                  </div>
                  <div>
                      <div className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Нестабильные зоны:</div>
                      <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-red-900/20 text-red-300 border border-red-500/30 rounded text-xs">Игра в обороне под давлением</span>
                          <span className="px-3 py-1 bg-red-900/20 text-red-300 border border-red-500/30 rounded text-xs">Первый пас из глубины</span>
                      </div>
                  </div>
               </div>
          </div>
      </div>

      {/* 7. COACH ACTIONS & CONCLUSIONS */}
      <div className="bg-hockey-card border border-slate-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PenTool size={16} /> Предварительные выводы тренера
          </h3>
          <textarea 
             className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-blue-500 min-h-[100px] mb-6 placeholder-slate-600"
             placeholder="Введите ваши наблюдения здесь..."
          />
          
          <div className="border-t border-slate-700 pt-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Действия тренера</h3>
              <div className="flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
                      <ClipboardList size={16}/> Создать командную задачу
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                      <FileText size={16}/> Добавить комментарий
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                      <Calendar size={16}/> Перейти к планированию
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                      <Download size={16}/> Экспорт аналитики
                  </button>
              </div>
          </div>
      </div>

    </div>
  );

  const PlayerProfile = () => {
     if (!selectedPlayerId) return null;
     const [openMatchId, setOpenMatchId] = useState<string | null>('m1');

     // Try to find in mock extended, fallback to normal mock
     const extended = MOCK_EXTENDED_PLAYERS.find(p => p.id === selectedPlayerId);
     const basic = players.find(p => p.id === selectedPlayerId) || players[0];
     const name = extended?.name || basic.name;
     const number = extended?.number || basic.number;
     const role = extended?.role || basic.role;

     const toggleMatch = (id: string) => setOpenMatchId(openMatchId === id ? null : id);

     return (
       <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 max-w-6xl mx-auto">
          <button 
             onClick={() => setSelectedPlayerId(null)}
             className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
          >
             <ArrowLeft size={16} /> Назад к списку
          </button>

          {/* 1. HEADER PROFILE CARD */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
             <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-6 border-b lg:border-b-0 lg:border-r border-slate-700 pb-6 lg:pb-0 lg:pr-6 min-w-[300px]">
                   <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-slate-600 relative shrink-0">
                      {number}
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-slate-700 rounded-full"></div>
                   </div>
                   <div>
                       <div className="text-xs text-slate-400 uppercase font-bold mb-1">Профиль игрока</div>
                       <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
                       <div className="text-sm text-slate-300 space-y-1">
                          <div className="flex items-center gap-2"><span className="text-slate-500">Амплуа:</span> <span className="bg-blue-900/40 text-blue-300 px-2 rounded text-xs py-0.5">{role}</span></div>
                          <div className="flex items-center gap-2"><span className="text-slate-500">Возраст:</span> 16 лет</div>
                          <div className="flex items-center gap-2"><span className="text-slate-500">Команда:</span> Армада (Одинцово)</div>
                       </div>
                   </div>
                </div>

                {/* General Stats & Chart */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Stats Grid */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                         <div className="text-xs text-slate-500 mb-1">Средний рейтинг</div>
                         <div className="text-2xl font-bold text-green-400 flex items-center gap-1">
                            <Star size={18} fill="currentColor"/> {extended?.rating || 8.7}
                         </div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                         <div className="text-xs text-slate-500 mb-1">Матчей</div>
                         <div className="text-2xl font-bold text-white">45</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                         <div className="text-xs text-slate-500 mb-1">Эпизодов</div>
                         <div className="text-2xl font-bold text-white">387</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                         <div className="text-xs text-slate-500 mb-1">Динамика (10 игр)</div>
                         <div className="text-2xl font-bold text-green-400 flex items-center gap-1">
                            <TrendingUp size={18}/> +0.8
                         </div>
                      </div>
                   </div>

                   {/* Mini Chart */}
                   <div className="h-full min-h-[140px] bg-slate-900/30 rounded-lg p-2 border border-slate-700/50 relative">
                       <div className="absolute top-2 left-3 text-xs font-bold text-slate-500">Прогресс рейтинга</div>
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={MOCK_SEASON_STATS}>
                            <defs>
                               <linearGradient id="miniChart" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={2} fill="url(#miniChart)" />
                            <YAxis hide domain={[5, 10]} />
                         </AreaChart>
                       </ResponsiveContainer>
                   </div>
                </div>
             </div>
          </div>

          {/* 2. SKILLS ANALYSIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Strengths */}
             <div className="bg-hockey-card border border-slate-700 rounded-xl p-6 shadow-lg">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider mb-5">
                   <div className="p-1 bg-green-500/20 rounded"><Trophy size={16} className="text-green-400"/></div>
                   Сильные стороны
                </h3>
                <div className="space-y-4">
                   {[
                      { name: 'Точная реализация бросков', val: 8.9 },
                      { name: 'Использование пространства', val: 8.7 },
                      { name: 'Чувство ворот', val: 8.6 },
                      { name: 'Выбор момента для атаки', val: 8.4 },
                      { name: 'Игра под давлением', val: 8.2 },
                   ].map((s, i) => (
                      <div key={i} className="group">
                         <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-200 flex gap-2"><span className="text-slate-500 font-mono">{i+1}.</span> {s.name}</span>
                            <span className="text-green-400 font-bold">{s.val}</span>
                         </div>
                         <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                            <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" style={{ width: `${s.val * 10}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Growth Areas */}
             <div className="bg-hockey-card border border-slate-700 rounded-xl p-6 shadow-lg">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider mb-5">
                   <div className="p-1 bg-orange-500/20 rounded"><Target size={16} className="text-orange-400"/></div>
                   Области развития
                </h3>
                <div className="space-y-6">
                   {[
                      { name: 'Разнообразие бросков', val: 6.8, tip: 'Броски с неудобной, упражнения на финты' },
                      { name: 'Скорость решений', val: 7.1, tip: 'Упражнения в тесном пространстве' },
                      { name: 'Игра в обороне', val: 6.5, tip: 'Позиции в обороне, блокировка линий' },
                   ].map((s, i) => (
                      <div key={i} className="group">
                         <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-200 flex gap-2"><span className="text-slate-500 font-mono">{i+1}.</span> {s.name}</span>
                            <span className="text-orange-400 font-bold">{s.val}</span>
                         </div>
                         <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3 border border-slate-700/50">
                            <div className="h-full bg-orange-500" style={{ width: `${s.val * 10}%` }}></div>
                         </div>
                         <div className="flex gap-2 items-start bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                            <Lightbulb size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-400 italic leading-tight">Совет: {s.tip}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* 3. VIDEO COLLECTIONS */}
          <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Film size={16} /> Видео-подборки
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {VIDEO_COLLECTIONS.map((col, i) => (
                      <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-slate-500 transition-all group">
                          <div>
                              <div className="flex items-center justify-between mb-2">
                                  <div className="p-2 bg-slate-900 rounded-lg">{col.icon}</div>
                                  <span className="text-xs text-slate-500 font-mono">{col.time}</span>
                              </div>
                              <h4 className="font-bold text-white mb-1">{col.title}</h4>
                              <p className="text-xs text-slate-400">{col.count} эпизодов</p>
                          </div>
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                              <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded flex items-center justify-center gap-1 font-medium transition-colors">
                                  <Play size={12} fill="currentColor"/> Смотреть
                              </button>
                              <button className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded flex items-center justify-center transition-colors">
                                  <Download size={14} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* 4. EPISODES BY MATCH LIST */}
          <div className="bg-hockey-card border border-slate-700 rounded-xl overflow-hidden shadow-lg">
             <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                 <h3 className="font-bold text-white flex items-center gap-2">
                     <Calendar size={18} className="text-blue-500" /> Эпизоды по матчам
                 </h3>
                 <div className="flex gap-2">
                    <button className="text-xs flex items-center gap-1 bg-slate-900 border border-slate-600 px-3 py-1.5 rounded text-slate-300 hover:text-white">
                        Последние 10 игр <ChevronDown size={12} />
                    </button>
                    <button className="text-xs flex items-center gap-1 bg-slate-900 border border-slate-600 px-3 py-1.5 rounded text-slate-300 hover:text-white">
                        Тип эпизода <ChevronDown size={12} />
                    </button>
                 </div>
             </div>

             <div className="divide-y divide-slate-700/50">
                 {PLAYER_MATCH_HISTORY.map(match => {
                     const isOpen = openMatchId === match.id;
                     return (
                         <div key={match.id} className="bg-slate-900/30">
                             <div 
                                onClick={() => toggleMatch(match.id)}
                                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors ${isOpen ? 'bg-slate-800' : ''}`}
                             >
                                 <div className="flex items-center gap-3">
                                     {isOpen ? <ChevronDown size={16} className="text-blue-400"/> : <ChevronRight size={16} className="text-slate-500"/>}
                                     <div className="text-sm font-bold text-white">
                                         <span className="text-blue-300">{match.date}</span> • {match.opponent} • <span className="text-slate-400">{match.score}</span>
                                     </div>
                                 </div>
                                 <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">{match.episodes.length}</span>
                             </div>

                             {isOpen && (
                                 <div className="bg-slate-900/50 p-2 space-y-1 border-t border-slate-800">
                                     {match.episodes.map((ep, idx) => (
                                         <div key={idx} className="flex items-center justify-between p-2 pl-10 hover:bg-slate-800 rounded group">
                                             <div className="flex items-center gap-3">
                                                 <div className={`text-xs font-bold w-8 text-center py-0.5 rounded ${getRatingBg(ep.rating)}`}>{ep.rating}</div>
                                                 <div>
                                                     <div className="text-sm text-slate-200 font-medium group-hover:text-blue-300 transition-colors">{ep.title}</div>
                                                     <div className="text-[10px] text-slate-500 uppercase">{ep.type}</div>
                                                 </div>
                                             </div>
                                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-500" title="Смотреть"><Play size={12} fill="currentColor"/></button>
                                                 <button className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600" title="Статистика"><Activity size={12}/></button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     );
                 })}
             </div>
             
             <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
                 <button className="flex items-center gap-2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors">
                     <FileText size={14} /> Полный отчет PDF
                 </button>
                 <button className="flex items-center gap-2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors">
                     <Mail size={14} /> Отправить игроку
                 </button>
             </div>
          </div>

       </div>
     );
  };

  const PlayersDashboardView = () => {
      // Filtering Logic
      const filteredPlayers = MOCK_EXTENDED_PLAYERS.filter(p => {
          // Search
          if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.number.toString().includes(searchTerm)) {
              return false;
          }
          // Role
          if (roleFilter !== 'all' && p.role !== roleFilter) {
              return false;
          }
          // Quick Groups
          if (quickGroupFilter === 'risk') return p.rating < 6.5;
          if (quickGroupFilter === 'drop') return p.trend < -0.5;
          if (quickGroupFilter === 'growth') return p.trend > 0.5;
          if (quickGroupFilter === 'tasks') return p.openTasks >= 5;

          return true;
      });

      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* 1. FILTERS BAR */}
            <div className="bg-hockey-card border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative group">
                        <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-sm text-slate-300 px-4 py-2 rounded-lg hover:border-slate-500 transition-colors w-full md:w-auto justify-between">
                            <span className="text-slate-500">Период:</span> Сезон 2024/25 <ChevronDown size={14}/>
                        </button>
                    </div>
                    <div className="relative group">
                        <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-sm text-slate-300 px-4 py-2 rounded-lg hover:border-slate-500 transition-colors w-full md:w-auto justify-between">
                            <span className="text-slate-500">Амплуа:</span> {roleFilter === 'all' ? 'Все' : roleFilter} <ChevronDown size={14}/>
                        </button>
                        {/* Simple dropdown for demo */}
                        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 hidden group-hover:block">
                            <div className="p-1">
                                {['all', 'Нападающий', 'Защитник', 'Вратарь'].map(r => (
                                    <button key={r} onClick={() => setRoleFilter(r)} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded">{r === 'all' ? 'Все амплуа' : r}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-sm text-slate-300 px-4 py-2 rounded-lg hover:border-slate-500 transition-colors">
                        <span className="text-slate-500">Статус:</span> Все игроки <ChevronDown size={14}/>
                    </button>
                    <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-sm text-slate-300 px-4 py-2 rounded-lg hover:border-slate-500 transition-colors">
                        <span className="text-slate-500">Нагрузка:</span> Мин. 3 матча <ChevronDown size={14}/>
                    </button>
                </div>

                <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Фамилия, номер или позиция" 
                        className="w-full bg-slate-900 border border-slate-700 text-sm text-white pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 2. TEAM SUMMARY */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Всего игроков', val: MOCK_EXTENDED_PLAYERS.length, color: 'text-white' },
                    { label: 'Ср. рейтинг', val: '7.8', color: 'text-blue-400' },
                    { label: 'Устойчивый рост', val: '6', color: 'text-green-400', icon: <TrendingUp size={14}/> },
                    { label: 'Падение', val: '4', color: 'text-red-400', icon: <ArrowDownRight size={14}/> },
                    { label: 'Зона риска (<6.5)', val: '3', color: 'text-orange-400', icon: <AlertCircle size={14}/> },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-500 uppercase font-bold mb-1">{stat.label}</span>
                        <div className={`text-2xl font-bold flex items-center gap-1 ${stat.color}`}>
                            {stat.icon} {stat.val}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. PLAYER LIST TABLE */}
            <div className="bg-hockey-card border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Users size={18} className="text-blue-500"/> СПИСОК ИГРОКОВ
                    </h3>
                    <span className="text-xs text-slate-500">Показано: {filteredPlayers.length}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800 text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-4 py-3">Игрок</th>
                                <th className="px-4 py-3">Амплуа</th>
                                <th className="px-4 py-3 text-center">Матчей</th>
                                <th className="px-4 py-3 text-center">Эпизодов</th>
                                <th className="px-4 py-3 text-center">Ср. рейтинг</th>
                                <th className="px-4 py-3 text-center">Тренд</th>
                                <th className="px-4 py-3">Лучшая сторона</th>
                                <th className="px-4 py-3">Зона роста</th>
                                <th className="px-4 py-3 text-center">Задачи</th>
                                <th className="px-4 py-3 text-right">Последний анализ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredPlayers.map((p) => (
                                <tr 
                                    key={p.id} 
                                    onClick={() => navigateToPlayer(p.id)}
                                    className="hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-4 py-3 font-medium text-white group-hover:text-blue-300 transition-colors">
                                        <span className="text-slate-500 mr-2">#{p.number}</span> {p.name}
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${p.role === 'Нападающий' ? 'bg-blue-900/30 border-blue-500/30 text-blue-300' : p.role === 'Защитник' ? 'bg-orange-900/30 border-orange-500/30 text-orange-300' : 'bg-purple-900/30 border-purple-500/30 text-purple-300'}`}>
                                            {p.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-400">{p.matches}</td>
                                    <td className="px-4 py-3 text-center text-slate-400">{p.episodes}</td>
                                    <td className="px-4 py-3 text-center font-bold">
                                        <span className={getRatingColor(p.rating)}>{p.rating}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`flex items-center justify-center gap-0.5 ${p.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {p.trend > 0 ? '+' : ''}{p.trend}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-green-300 text-xs">{p.bestSide}</td>
                                    <td className="px-4 py-3 text-orange-300 text-xs">{p.growthArea}</td>
                                    <td className="px-4 py-3 text-center">
                                        {p.openTasks > 0 ? (
                                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded text-[10px]">{p.openTasks}</span>
                                        ) : (
                                            <span className="text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500 text-xs">{p.lastAnalysis}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. QUICK GROUPS */}
            <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Быстрые группы (Кликабельно)</h4>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => setQuickGroupFilter(quickGroupFilter === 'risk' ? null : 'risk')}
                        className={`px-4 py-2 rounded-lg border transition-all text-sm flex items-center gap-2 ${quickGroupFilter === 'risk' ? 'bg-orange-900/40 border-orange-500 text-orange-200 shadow-lg shadow-orange-900/20' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-orange-500 hover:text-white'}`}
                    >
                        <AlertCircle size={14} className={quickGroupFilter === 'risk' ? 'text-orange-400' : 'text-slate-500'}/>
                        Игроки с рейтингом ниже 6.5 (3)
                    </button>

                    <button 
                        onClick={() => setQuickGroupFilter(quickGroupFilter === 'drop' ? null : 'drop')}
                        className={`px-4 py-2 rounded-lg border transition-all text-sm flex items-center gap-2 ${quickGroupFilter === 'drop' ? 'bg-red-900/40 border-red-500 text-red-200 shadow-lg shadow-red-900/20' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-red-500 hover:text-white'}`}
                    >
                        <ArrowDownRight size={14} className={quickGroupFilter === 'drop' ? 'text-red-400' : 'text-slate-500'}/>
                        Игроки с падением тренда (4)
                    </button>

                    <button 
                        onClick={() => setQuickGroupFilter(quickGroupFilter === 'growth' ? null : 'growth')}
                        className={`px-4 py-2 rounded-lg border transition-all text-sm flex items-center gap-2 ${quickGroupFilter === 'growth' ? 'bg-green-900/40 border-green-500 text-green-200 shadow-lg shadow-green-900/20' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-green-500 hover:text-white'}`}
                    >
                        <TrendingUp size={14} className={quickGroupFilter === 'growth' ? 'text-green-400' : 'text-slate-500'}/>
                        Игроки с устойчивым ростом (6)
                    </button>

                    <button 
                        onClick={() => setQuickGroupFilter(quickGroupFilter === 'tasks' ? null : 'tasks')}
                        className={`px-4 py-2 rounded-lg border transition-all text-sm flex items-center gap-2 ${quickGroupFilter === 'tasks' ? 'bg-blue-900/40 border-blue-500 text-blue-200 shadow-lg shadow-blue-900/20' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-white'}`}
                    >
                        <CheckCircle2 size={14} className={quickGroupFilter === 'tasks' ? 'text-blue-400' : 'text-slate-500'}/>
                        Игроки с 5+ задачами (2)
                    </button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="p-4 md:p-8 bg-slate-900 text-white min-h-full overflow-y-auto">
      {/* Top Tabs */}
      <div className="flex justify-center mb-8">
          <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700 shadow-xl">
              <button 
                onClick={() => { setStatsView('team'); setSelectedPlayerId(null); }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${statsView === 'team' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                  Команда
              </button>
              <button 
                onClick={() => { setStatsView('roles'); setSelectedPlayerId(null); }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${statsView === 'roles' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                  По амплуа
              </button>
              <button 
                onClick={() => { setStatsView('players'); setSelectedPlayerId(null); }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${statsView === 'players' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                  По игрокам
              </button>
          </div>
      </div>

      {statsView === 'team' && <TeamOverview />}
      
      {statsView === 'roles' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 <Target size={24} className="text-blue-500"/> Анализ по амплуа
              </h2>
              <RoleStatsGrid />
              <GlobalEpisodesList />
          </div>
      )}

      {statsView === 'players' && (
          selectedPlayerId ? <PlayerProfile /> : <PlayersDashboardView />
      )}

    </div>
  );
};
