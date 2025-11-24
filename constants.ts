import { Factor, PlayerRole } from './types';

// Based on the PDF "Требования к базе знаний"
export const KNOWLEDGE_BASE_FACTORS: Factor[] = [
  // --- ATTACK (Forward) ---
  { id: 'f_att_1', name: 'Точное выполнение броска', weight: 10, category: 'Атака', isPositive: true },
  { id: 'f_att_2', name: 'Выбор момента', weight: 8, category: 'Атака', isPositive: true },
  { id: 'f_att_3', name: 'Использование пространства', weight: 9, category: 'Атака', isPositive: true },
  { id: 'f_att_neg_1', name: 'Неточный бросок', weight: 9, category: 'Атака', isPositive: false },
  { id: 'f_att_neg_2', name: 'Медленная подготовка', weight: 4, category: 'Атака', isPositive: false },
  
  // --- DEFENSE (Defender) ---
  { id: 'f_def_1', name: 'Активный прессинг', weight: 9, category: 'Оборона', isPositive: true },
  { id: 'f_def_2', name: 'Перехват', weight: 10, category: 'Оборона', isPositive: true },
  { id: 'f_def_3', name: 'Блокировка броска', weight: 9, category: 'Оборона', isPositive: true },
  { id: 'f_def_neg_1', name: 'Пассивная оборона', weight: 3, category: 'Оборона', isPositive: false },
  { id: 'f_def_neg_2', name: 'Потеря позиции', weight: 5, category: 'Оборона', isPositive: false },

  // --- GOALIE ---
  { id: 'f_gol_1', name: 'Позиционирование', weight: 10, category: 'Вратарь', isPositive: true },
  { id: 'f_gol_2', name: 'Контроль отскока', weight: 9, category: 'Вратарь', isPositive: true },
  { id: 'f_gol_3', name: 'Перекрытие угла', weight: 9, category: 'Вратарь', isPositive: true },
  { id: 'f_gol_neg_1', name: 'Отскок в центр', weight: 3, category: 'Вратарь', isPositive: false },
  { id: 'f_gol_neg_2', name: 'Медленная реакция', weight: 4, category: 'Вратарь', isPositive: false },
];

export const MOCK_PLAYERS = [
  { id: 'p1', name: 'Иванов И.', number: 10, role: PlayerRole.FORWARD },
  { id: 'p2', name: 'Петров П.', number: 17, role: PlayerRole.FORWARD },
  { id: 'p3', name: 'Сидоров С.', number: 55, role: PlayerRole.DEFENDER },
  { id: 'p4', name: 'Кузнецов К.', number: 20, role: PlayerRole.GOALIE },
];