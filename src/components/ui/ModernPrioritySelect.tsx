import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Flag, ChevronDown } from 'lucide-react';
import { TaskPriority } from '../../types/task';
import styles from './ModernPrioritySelect.module.css';

interface ModernPrioritySelectProps {
  value: TaskPriority | '';
  onChange: (value: TaskPriority | '') => void;
}

const PRIORITIES: { id: TaskPriority | ''; label: string; dotClass?: string }[] = [
  { id: '', label: 'Öncelik yok' },
  { id: 'low', label: 'Düşük', dotClass: styles.dotLow },
  { id: 'medium', label: 'Normal', dotClass: styles.dotMedium },
  { id: 'high', label: 'Yüksek', dotClass: styles.dotHigh },
];

export const ModernPrioritySelect: React.FC<ModernPrioritySelectProps> = ({ value, onChange }) => {
  const current = PRIORITIES.find((p) => p.id === value) || PRIORITIES[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`${styles.trigger} ${value ? styles.triggerActive : ''}`}
          title="Öncelik seç"
          aria-label="Öncelik seç"
        >
          {current.dotClass ? (
            <span className={`${styles.dot} ${current.dotClass}`} />
          ) : (
            <Flag size={12} strokeWidth={2} />
          )}
          <span>{current.label}</span>
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
          {PRIORITIES.map((p) => (
            <DropdownMenu.Item
              key={p.id}
              className={`${styles.menuItem} ${value === p.id ? styles.menuItemActive : ''}`}
              onSelect={() => onChange(p.id)}
            >
              {p.dotClass ? (
                <span className={`${styles.dot} ${p.dotClass}`} />
              ) : (
                <span style={{ width: 7 }} />
              )}
              <span>{p.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
