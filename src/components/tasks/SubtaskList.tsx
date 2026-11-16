import React, { useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { Subtask } from '../../types/task';
import styles from './SubtaskList.module.css';

interface SubtaskListProps {
  subtasks: Subtask[];
  isReadOnly?: boolean;
  onChange: (subtasks: Subtask[]) => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  isReadOnly = false,
  onChange,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = (id: string) => {
    if (isReadOnly) return;
    const updated = subtasks.map((st) =>
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    onChange(subtasks.filter((st) => st.id !== id));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: trimmed,
      completed: false,
    };
    onChange([...subtasks, newSubtask]);
    setNewTitle('');
  };

  return (
    <div className={styles.container}>
      {subtasks.map((st) => (
        <div key={st.id} className={styles.item}>
          <button
            type="button"
            className={`${styles.checkbox} ${st.completed ? styles.checkboxChecked : ''}`}
            onClick={() => handleToggle(st.id)}
            disabled={isReadOnly}
            aria-label={st.completed ? 'Alt görevi tamamlanmadı yap' : 'Alt görevi tamamla'}
          >
            {st.completed && <Check size={10} strokeWidth={2.8} />}
          </button>
          <span className={`${styles.title} ${st.completed ? styles.titleCompleted : ''}`}>
            {st.title}
          </span>
          {!isReadOnly && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => handleDelete(st.id)}
              title="Alt görevi sil"
            >
              <X size={11} />
            </button>
          )}
        </div>
      ))}

      {!isReadOnly && (
        <>
          {isAdding ? (
            <form onSubmit={handleAdd} className={styles.addForm}>
              <input
                type="text"
                autoFocus
                className={styles.addInput}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Alt görev ekle (Enter)..."
                onBlur={() => {
                  if (!newTitle.trim()) setIsAdding(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsAdding(false);
                }}
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: 'var(--text-2xs)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginTop: '2px',
                padding: '2px 0',
              }}
            >
              <Plus size={11} />
              <span>Alt görev ekle</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
