import React, { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Clock } from 'lucide-react';
import styles from './ModernTimePicker.module.css';

interface ModernTimePickerProps {
  value: string; // "HH:mm" or ""
  onChange: (time: string) => void;
}

const QUICK_TIMES = [
  { label: '09:00', value: '09:00' },
  { label: '12:00', value: '12:00' },
  { label: '15:00', value: '15:00' },
  { label: '18:00', value: '18:00' },
  { label: '21:00', value: '21:00' },
];

export const ModernTimePicker: React.FC<ModernTimePickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHours(h.padStart(2, '0'));
      setMinutes(m.padStart(2, '0'));
    } else {
      setHours('12');
      setMinutes('00');
    }
  }, [value]);

  const handleApply = () => {
    const formattedH = String(Math.min(23, Math.max(0, parseInt(hours, 10) || 0))).padStart(2, '0');
    const formattedM = String(Math.min(59, Math.max(0, parseInt(minutes, 10) || 0))).padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
    setOpen(false);
  };

  const handleSelectQuick = (val: string) => {
    onChange(val);
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
          aria-label="Saat seç"
        >
          <Clock size={13} strokeWidth={2} />
          <span>{value ? value : 'Saat ekle'}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={styles.popoverContent}
          side="top"
          align="start"
          sideOffset={8}
        >
          <div className={styles.quickPills}>
            {QUICK_TIMES.map((qt) => (
              <button
                key={qt.value}
                type="button"
                className={`${styles.pill} ${value === qt.value ? styles.pillActive : ''}`}
                onClick={() => handleSelectQuick(qt.value)}
              >
                {qt.label}
              </button>
            ))}
          </div>

          <div className={styles.timeInputRow}>
            <input
              type="text"
              maxLength={2}
              className={styles.timeBox}
              value={hours}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '');
                setHours(clean);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApply();
              }}
              placeholder="12"
            />
            <span className={styles.colon}>:</span>
            <input
              type="text"
              maxLength={2}
              className={styles.timeBox}
              value={minutes}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '');
                setMinutes(clean);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApply();
              }}
              placeholder="00"
            />
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
            >
              Saati Kaldır
            </button>
            <button
              type="button"
              className={styles.applyButton}
              onClick={handleApply}
            >
              Tamam
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
