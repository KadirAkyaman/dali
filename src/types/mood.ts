export type MoodId = 'calm' | 'energetic' | 'focused' | 'resting' | 'tired';

export interface MoodOption {
  id: MoodId;
  emoji: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'calm', emoji: '🌿', label: 'Sakin' },
  { id: 'energetic', emoji: '⚡', label: 'Enerjik' },
  { id: 'focused', emoji: '🎯', label: 'Odaklı' },
  { id: 'resting', emoji: '☕', label: 'Dinlenmede' },
  { id: 'tired', emoji: '☁️', label: 'Yorgun' },
];
