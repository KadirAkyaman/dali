import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Tag } from 'lucide-react';
import styles from './ModernIconPicker.module.css';

export interface IconItem {
  id: string;
  emoji: string;
  label: string;
}

export const ICONS_LIST: IconItem[] = [
  { id: 'work', emoji: '💼', label: 'İş' },
  { id: 'study', emoji: '📚', label: 'Ders / Kitap' },
  { id: 'code', emoji: '💻', label: 'Kodlama' },
  { id: 'sport', emoji: '🏃', label: 'Spor & Sağlık' },
  { id: 'cart', emoji: '🛒', label: 'Alışveriş' },
  { id: 'coffee', emoji: '☕', label: 'Mola / Kişisel' },
  { id: 'art', emoji: '🎨', label: 'Tasarım & Yaratıcı' },
  { id: 'target', emoji: '🎯', label: 'Hedef & Odak' },
  { id: 'leaf', emoji: '🌿', label: 'Huzur & Doğa' },
  { id: 'idea', emoji: '💡', label: 'Fikir' },
  { id: 'home', emoji: '🏠', label: 'Ev' },
  { id: 'travel', emoji: '✈️', label: 'Seyahat' },
  { id: 'star', emoji: '⭐', label: 'Önemli' },
  { id: 'heart', emoji: '❤️', label: 'Sağlık / Sevgi' },
  { id: 'call', emoji: '📞', label: 'Görüşme' },
  { id: 'music', emoji: '🎵', label: 'Müzik' },
];

interface ModernIconPickerProps {
  value: string; // Emoji or ""
  onChange: (emoji: string) => void;
}

export const ModernIconPicker: React.FC<ModernIconPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const selected = ICONS_LIST.find((i) => i.emoji === value);

  const handleSelect = (emoji: string) => {
    onChange(emoji === value ? '' : emoji);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`${styles.trigger} ${value ? styles.triggerActive : ''}`}
          title={selected ? `Kategori: ${selected.label}` : 'İkon / Kategori seç'}
          aria-label="İkon seç"
        >
          {value ? (
            <span style={{ fontSize: '13px' }}>{value}</span>
          ) : (
            <>
              <Tag size={12} strokeWidth={2} />
              <span>İkon</span>
            </>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={styles.popoverContent}
          side="top"
          align="start"
          sideOffset={8}
        >
          <span className={styles.popoverTitle}>Kategori İkonu</span>
          <div className={styles.grid}>
            {ICONS_LIST.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.iconBtn} ${value === item.emoji ? styles.iconBtnActive : ''}`}
                onClick={() => handleSelect(item.emoji)}
                title={item.label}
              >
                {item.emoji}
              </button>
            ))}
          </div>

          {value && (
            <div className={styles.clearBtn} onClick={handleClear}>
              İkonu Kaldır
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
