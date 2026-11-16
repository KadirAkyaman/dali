import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { RotateCw, Check, ChevronDown } from 'lucide-react';
import { RecurrenceFrequency } from '../../types/recurrence';
import styles from './ModernRepeatSelect.module.css';

interface ModernRepeatSelectProps {
  value: RecurrenceFrequency | '';
  onChange: (value: RecurrenceFrequency | '') => void;
}

const OPTIONS: { label: string; value: RecurrenceFrequency | '' }[] = [
  { label: 'Tekrarlama yok', value: '' },
  { label: 'Her gün', value: 'daily' },
  { label: 'Hafta içi (Pzt-Cum)', value: 'weekdays' },
  { label: 'Her hafta', value: 'weekly' },
  { label: 'Her ay', value: 'monthly' },
];

export const ModernRepeatSelect: React.FC<ModernRepeatSelectProps> = ({ value, onChange }) => {
  const currentOption = OPTIONS.find((o) => o.value === value) || OPTIONS[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`${styles.trigger} ${value ? styles.triggerActive : ''}`}
          aria-label="Tekrar sıklığı seç"
        >
          <RotateCw size={12} strokeWidth={2} />
          <span>{currentOption.label}</span>
          <ChevronDown size={11} strokeWidth={2} style={{ opacity: 0.6 }} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.menuContent}
          side="top"
          align="start"
          sideOffset={8}
        >
          {OPTIONS.map((opt) => (
            <DropdownMenu.Item
              key={opt.value}
              className={`${styles.menuItem} ${value === opt.value ? styles.menuItemActive : ''}`}
              onSelect={() => onChange(opt.value)}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={13} className={styles.checkIcon} />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
