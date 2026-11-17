import React from 'react';
import { DynamicIcon } from '../ui/DynamicIcon';
import styles from './TaskFilterBar.module.css';

interface TaskFilterBarProps {
  availableIcons: string[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  availableIcons,
  activeFilter,
  onFilterChange,
}) => {
  if (availableIcons.length === 0) return null;

  return (
    <div className={styles.container}>
      <span className={styles.label}>Filtrele</span>
      <button
        type="button"
        className={`${styles.pill} ${activeFilter === null ? styles.pillActive : ''}`}
        onClick={() => onFilterChange(null)}
        aria-pressed={activeFilter === null}
      >
        Tümü
      </button>

      {availableIcons.map((icon) => (
        <button
          key={icon}
          type="button"
          className={`${styles.pill} ${activeFilter === icon ? styles.pillActive : ''}`}
          onClick={() => onFilterChange(activeFilter === icon ? null : icon)}
          aria-pressed={activeFilter === icon}
          title={icon}
        >
          <DynamicIcon name={icon} size={13} />
        </button>
      ))}
    </div>
  );
};
