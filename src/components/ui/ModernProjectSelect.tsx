import React, { useState, useEffect } from 'react';
import { Folder, ChevronDown, Check, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Project } from '../../types/project';
import { LocalProjectRepository } from '../../repositories/localProjectRepository';
import styles from './ModernProjectSelect.module.css';

const projectRepo = new LocalProjectRepository();

interface ModernProjectSelectProps {
  value?: string | null;
  onChange: (projectId: string | null) => void;
}

export const ModernProjectSelect: React.FC<ModernProjectSelectProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(projectRepo.getProjects().filter((p) => !p.archived));
  }, [open]);

  const selectedProject = projects.find((p) => p.id === value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`${styles.trigger} ${selectedProject ? styles.triggerActive : ''}`}
          title={selectedProject ? `Proje: ${selectedProject.name}` : 'Proje Seç'}
        >
          {selectedProject ? (
            <>
              <span
                className={styles.colorDot}
                style={{ backgroundColor: selectedProject.color }}
              />
              <span className={styles.projectText}>{selectedProject.name}</span>
            </>
          ) : (
            <>
              <Folder size={12} />
              <span>Proje</span>
            </>
          )}
          <ChevronDown size={10} style={{ opacity: 0.6 }} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={styles.content} sideOffset={6} align="start">
          <div className={styles.header}>
            <span>Proje Ata</span>
            {value && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                title="Projeyi Kaldır"
              >
                <X size={10} /> Kaldır
              </button>
            )}
          </div>

          <div className={styles.list}>
            {projects.map((proj) => {
              const isSelected = proj.id === value;
              return (
                <button
                  key={proj.id}
                  type="button"
                  className={`${styles.item} ${isSelected ? styles.itemActive : ''}`}
                  onClick={() => {
                    onChange(proj.id);
                    setOpen(false);
                  }}
                >
                  <span className={styles.colorDot} style={{ backgroundColor: proj.color }} />
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{proj.name}</span>
                    <span className={styles.itemArea}>{proj.area}</span>
                  </div>
                  {isSelected && <Check size={12} color="var(--accent)" />}
                </button>
              );
            })}

            {projects.length === 0 && (
              <div className={styles.empty}>Henüz proje oluşturulmadı.</div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
