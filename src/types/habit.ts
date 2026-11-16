export interface Habit {
  id: string;
  title: string;
  icon: string;
  category?: string;
  completedDates: string[]; // 'YYYY-MM-DD'
  createdDate: string;
}

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-water',
    title: 'Günde 2 Litre Su İç',
    icon: '💧',
    category: 'Sağlık',
    completedDates: [],
    createdDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'habit-read',
    title: '20 Sayfa Kitap Oku',
    icon: '📖',
    category: 'Gelişim',
    completedDates: [],
    createdDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'habit-walk',
    title: '5000 Adım / Yürüyüş',
    icon: '🚶',
    category: 'Beden',
    completedDates: [],
    createdDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'habit-meditate',
    title: '10 Dakika Sessizlik & Nefes',
    icon: '🧘',
    category: 'Zihin',
    completedDates: [],
    createdDate: new Date().toISOString().split('T')[0],
  },
];

export const HABIT_ICONS = ['💧', '📖', '🚶', '🧘', '🏃', '💻', '🎨', '🌿', '☕', '🍎', '💤', '✍️', '🎵', '🚴'];

export function calculateHabitStreak(
  completedDates: string[],
  todayStr: string
): { currentStreak: number; bestStreak: number } {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const sorted = Array.from(new Set(completedDates)).sort();
  const dateSet = new Set(sorted);

  // Best streak calculation
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sorted) {
    const curr = new Date(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    prevDate = curr;
  }

  // Current streak calculation (backwards from today or yesterday)
  let currentStreak = 0;
  let checkDate = new Date(todayStr);

  // If today is completed, streak counts today
  if (dateSet.has(todayStr)) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if yesterday was completed
    const yesterday = new Date(todayStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateSet.has(yesterdayStr)) {
      currentStreak = 0; // hasn't done today yet, but streak alive
      checkDate = yesterday;
    } else {
      return { currentStreak: 0, bestStreak };
    }
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(dStr)) {
      if (!dateSet.has(todayStr) && currentStreak === 0) {
        currentStreak = 1;
      } else if (dStr !== todayStr) {
        currentStreak += 1;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
}
