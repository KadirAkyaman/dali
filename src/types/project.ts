export interface Project {
  id: string;
  name: string;
  color: string; // Hex color code
  icon?: string | null;
  area: 'İş' | 'Kişisel' | 'Müşteri' | 'Eğitim' | 'Diğer';
  description?: string | null;
  created_at: string;
  archived?: boolean;
}

export const DEFAULT_PROJECT_AREAS = ['İş', 'Kişisel', 'Müşteri', 'Eğitim', 'Diğer'] as const;

export const DEFAULT_PROJECT_COLORS = [
  '#8C83D8', // Dali Moru / Accent
  '#38BDF8', // Buz Mavisi
  '#10B981', // Zümrüt Yeşili
  '#F59E0B', // Kehribar Sarısı
  '#EC4899', // Pembe
  '#8B5CF6', // Canlı Mor
  '#F97316', // Turuncu
  '#64748B', // Arduvaz Grisi
] as const;
