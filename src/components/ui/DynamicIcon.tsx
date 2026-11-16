import React from 'react';
import {
  Briefcase,
  BookOpen,
  Code,
  Activity,
  ShoppingCart,
  Coffee,
  Palette,
  Target,
  Feather,
  Lightbulb,
  Home,
  Plane,
  Star,
  Heart,
  Phone,
  Music,
  Zap,
  Compass,
  Flag,
  Bookmark,
  Flame,
  Droplets,
  Footprints,
  Dumbbell,
  Smile,
  Wind,
  Cloud,
  Moon,
  Sun,
  Clock,
  Sparkles,
  CheckCircle2,
  LucideProps,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  briefcase: Briefcase,
  work: Briefcase,
  book: BookOpen,
  study: BookOpen,
  code: Code,
  sport: Activity,
  cart: ShoppingCart,
  coffee: Coffee,
  art: Palette,
  target: Target,
  leaf: Feather,
  idea: Lightbulb,
  home: Home,
  travel: Plane,
  star: Star,
  heart: Heart,
  call: Phone,
  music: Music,
  zap: Zap,
  compass: Compass,
  flag: Flag,
  bookmark: Bookmark,
  flame: Flame,
  water: Droplets,
  walk: Footprints,
  gym: Dumbbell,
  smile: Smile,
  wind: Wind,
  cloud: Cloud,
  moon: Moon,
  sun: Sun,
  clock: Clock,
  sparkles: Sparkles,
  check: CheckCircle2,
};

interface DynamicIconProps extends Omit<LucideProps, 'name'> {
  name?: string | null;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  if (!name) return null;
  const IconComponent = ICON_MAP[name.toLowerCase()];
  if (IconComponent) {
    return <IconComponent {...props} />;
  }
  return <span style={{ fontSize: `${props.size || 13}px`, lineHeight: 1 }}>{name}</span>;
};
