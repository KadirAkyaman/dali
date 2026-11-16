export type MoodId = 'calm' | 'energetic' | 'focused' | 'resting' | 'tired';

export interface MoodOption {
  id: MoodId;
  icon: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'calm', icon: 'leaf', label: 'Sakin' },
  { id: 'energetic', icon: 'zap', label: 'Enerjik' },
  { id: 'focused', icon: 'target', label: 'Odaklı' },
  { id: 'resting', icon: 'coffee', label: 'Dinlenmede' },
  { id: 'tired', icon: 'cloud', label: 'Yorgun' },
];
