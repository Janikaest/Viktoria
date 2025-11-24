
export enum EvaluationScope {
  TEAM = 'Команда',
  ROLE = 'Роль',
  PLAYER = 'Игрок'
}

export enum PlayerRole {
  GOALIE = 'Вратарь',
  DEFENDER = 'Защитник',
  FORWARD = 'Нападающий'
}

export enum FragmentType {
  ATTACK = 'Атака',
  DEFENSE = 'Оборона',
  GOALIE = 'Вратарь'
}

export interface Player {
  id: string;
  name: string;
  number: number;
  role: PlayerRole;
  avatarUrl?: string;
}

export interface Factor {
  id: string;
  name: string;
  weight: number; // 1-10 scale importance
  category: string; // e.g., "Attack", "Defense", "Goalie"
  isPositive: boolean; // true for "+", false for "-"
  description?: string;
}

export type AnnotationType = 'select' | 'freehand' | 'line' | 'arrow' | 'circle' | 'rect' | 'text' | 'player';

export interface Annotation {
  id: string;
  x: number;
  y: number;
  type: AnnotationType;
  text?: string;
  points?: {x: number, y: number}[]; // For freehand/lines
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  timestamp?: number;
  isVisible?: boolean;
}

export interface EpisodeFactor {
  id: string;
  factorId: string; // Reference to Factor
  scope: EvaluationScope;
  targetId?: string; // Player ID or Role Enum value
  value: number; // Calculated score contribution
}

// Specific time slice within an episode
export interface VideoFragment {
  id: string;
  episodeId: string; // Parent link
  title: string;
  description: string;
  thumbnailUrl?: string; // URL/Base64 of the screenshot
  timestampStart: number;
  timestampEnd: number;
  drawings: Annotation[];
  assignedFactors: EpisodeFactor[];
  tags: string[]; 
  rating: number;
  category?: FragmentType | string;
  subject?: { scope: EvaluationScope, id: string };
  gameScore?: string;
  composition?: string;
  screenshots?: string[];
}

// Container for a logical group of moments with its own time range
export interface Episode {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string; // URL/Base64 of the screenshot
  timestampStart: number;
  timestampEnd: number;
  fragments: VideoFragment[];
}

export interface GameSession {
  id: string;
  title: string;
  date: string;
  videoUrl: string;
  duration: number;
  players: Player[];
  episodes: Episode[];
}