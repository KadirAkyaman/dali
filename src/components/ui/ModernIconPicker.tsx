import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Tag } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import styles from './ModernIconPicker.module.css';

export interface IconItem {
  id: string;
  label: string;
}

export const ICONS_LIST: IconItem[] = [
  { id: 'work', label: 'İş & Kariyer' },
  { id: 'study', label: 'Ders & Kitap' },
  { id: 'code', label: 'Yazılım & Kod' },
  { id: 'sport', label: 'Spor & Egzersiz' },
  { id: 'cart', label: 'Alışveriş' },
  { id: 'coffee', label: 'Mola & Kahve' },
  { id: 'art', label: 'Tasarım & Sanat' },
  { id: 'target', label: 'Hedef & Odak' },
  { id: 'leaf', label: 'Dinginlik & Doğa' },
  { id: 'idea', label: 'Fikir & İlham' },
  { id: 'home', label: 'Ev & Yaşam' },
  { id: 'travel', label: 'Seyahat & Yol' },
  { id: 'star', label: 'Önemli & Yıldız' },
  { id: 'heart', label: 'Sağlık & Sevgi' },
  { id: 'call', label: 'İletişim & Çağrı' },
  { id: 'music', label: 'Müzik & Ses' },
  { id: 'flame', label: 'Acil & Öncelikli' },
  { id: 'zap', label: 'Hızlı Görev' },
];

interface ModernIconPickerProps {
  value: string; // Icon ID or legacy emoji
  onChange: (iconId: string) => void;
}

export const ModernIconPicker: React.FC<ModernIconPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const selected = ICONS_LIST.find((i) => i.id === value);

  const handleSelect = (iconId: string) => {
    onChange(iconId === value ? '' : iconId);
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
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <DynamicIcon name={value} size={13} />
            </span>
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
          <span className={styles.popoverTitle}>Vektör Kategori İkonu</span>
          <div className={styles.grid}>
            {ICONS_LIST.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.iconBtn} ${value === item.id ? styles.iconBtnActive : ''}`}
                onClick={() => handleSelect(item.id)}
                title={item.label}
              >
                <DynamicIcon name={item.id} size={15} />
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
