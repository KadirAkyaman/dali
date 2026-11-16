import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';
import styles from './RoutineTemplatesModal.module.css';

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: { title: string; icon?: string; priority?: 'low' | 'medium' | 'high' }[];
}

const TEMPLATES: RoutineTemplate[] = [
  {
    id: 'morning',
    name: 'Güne Başlangıç Rutini',
    description: 'Zihni tazelemek ve güne berrak başlamak için 3 basit adım.',
    icon: 'sun',
    tasks: [
      { title: 'Büyük bir bardak su iç ve hafif esne', icon: 'water', priority: 'medium' },
      { title: 'Bugünün en kritik 3 görevini belirle', icon: 'target', priority: 'high' },
      { title: '15 dakika zihnini dinlendir veya kitap oku', icon: 'book', priority: 'low' },
    ],
  },
  {
    id: 'deep-work',
    name: 'Derin Odaklanma Başlangıcı',
    description: 'Dikkat dağınıklığını sıfırlayıp derin çalışmaya geçiş paketi.',
    icon: 'zap',
    tasks: [
      { title: 'Bildirimleri kapat ve çalışma masasını toparla', icon: 'leaf', priority: 'medium' },
      { title: 'En zorlu ana göreve 45 dk kesintisiz odaklan', icon: 'target', priority: 'high' },
      { title: 'Kısa mola ver ve gözlerini dinlendir', icon: 'coffee', priority: 'low' },
    ],
  },
  {
    id: 'wrap-up',
    name: 'Günün Sakin Kapanışı',
    description: 'Yapılanları gözden geçirip yarın için zihni serbest bırak.',
    icon: 'moon',
    tasks: [
      { title: 'Tamamlanan görevleri kutla ve kalanları incele', icon: 'star', priority: 'medium' },
      { title: 'Açık kalan tarayıcı sekmelerini ve notları temizle', icon: 'code', priority: 'low' },
      { title: 'Yarın için 1 ana odak notu bırak', icon: 'idea', priority: 'high' },
    ],
  },
];

interface RoutineTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (tasks: { title: string; icon?: string; priority?: 'low' | 'medium' | 'high' }[]) => Promise<void>;
}

export const RoutineTemplatesModal: React.FC<RoutineTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  if (!isOpen) return null;

  const handleApply = async (template: RoutineTemplate) => {
    await onApplyTemplate(template.tasks);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent)" />
            <h3 className={styles.title}>Rutin Şablonları</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TEMPLATES.map((tmpl) => (
            <div key={tmpl.id} className={styles.templateCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                  <DynamicIcon name={tmpl.icon} size={15} />
                  <span>{tmpl.name}</span>
                </span>
                <button
                  type="button"
                  className={styles.applyBtn}
                  onClick={() => handleApply(tmpl)}
                >
                  Bugüne Ekle
                </button>
              </div>
              <span className={styles.cardDesc}>{tmpl.description}</span>
              <div className={styles.taskList}>
                {tmpl.tasks.map((t, idx) => (
                  <div key={idx} className={styles.taskItemPreview}>
                    <DynamicIcon name={t.icon} size={13} />
                    <span>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
