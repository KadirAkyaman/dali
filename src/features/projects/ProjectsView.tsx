import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Layers,
} from 'lucide-react';
import { Project, DEFAULT_PROJECT_AREAS, DEFAULT_PROJECT_COLORS } from '../../types/project';
import { LocalProjectRepository } from '../../repositories/localProjectRepository';
import { useTasks } from '../../app/providers/TaskProvider';
import styles from './ProjectsView.module.css';

const projectRepo = new LocalProjectRepository();

export const ProjectsView: React.FC = () => {
  const { tasks, addTask, toggleTask, deleteTask, todayStr } = useTasks();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState('');
  const [formArea, setFormArea] = useState<Project['area']>('İş');
  const [formColor, setFormColor] = useState<string>(DEFAULT_PROJECT_COLORS[0]);
  const [formDesc, setFormDesc] = useState('');

  // Inline task add inside project
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState('');

  const refreshProjects = () => {
    const list = projectRepo.getProjects();
    setProjects(list);
    if (!selectedProjectId && list.length > 0) {
      setSelectedProjectId(list[0].id);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const projectTasks = tasks.filter((t) => t.project_id === selectedProject?.id);
  const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
  const totalCount = projectTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormArea('İş');
    setFormColor(DEFAULT_PROJECT_COLORS[0]);
    setFormDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(proj);
    setFormName(proj.name);
    setFormArea(proj.area);
    setFormColor(proj.color);
    setFormDesc(proj.description || '');
    setIsModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) return;

    if (editingProject) {
      projectRepo.updateProject(editingProject.id, {
        name: trimmed,
        area: formArea,
        color: formColor,
        description: formDesc.trim() || null,
      });
    } else {
      const created = projectRepo.createProject({
        name: trimmed,
        area: formArea,
        color: formColor,
        description: formDesc.trim() || null,
      });
      setSelectedProjectId(created.id);
    }

    refreshProjects();
    setIsModalOpen(false);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bu projeyi silmek istediğinize emin misiniz? (Projeye bağlı görevler silinmez)')) {
      projectRepo.deleteProject(id);
      const list = projectRepo.getProjects();
      setProjects(list);
      if (selectedProjectId === id) {
        setSelectedProjectId(list[0]?.id || null);
      }
    }
  };

  const handleAddProjectTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProjectTaskTitle.trim();
    if (!trimmed || !selectedProject) return;

    await addTask({
      title: trimmed,
      scheduled_date: todayStr,
      project_id: selectedProject.id,
    });

    setNewProjectTaskTitle('');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>
              <Layers size={22} color="var(--accent)" /> Projeler & Odak Alanları
            </h1>
            <p className={styles.subTitle}>
              İşlerini kategorilere ayır, hedeflerini projeler halinde adım adım tamamla.
            </p>
          </div>

          <button
            type="button"
            className={styles.newProjectBtn}
            onClick={handleOpenCreateModal}
          >
            <Plus size={14} />
            <span>Yeni Proje</span>
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Sol Kolon: Proje Listesi */}
        <aside className={styles.projectList}>
          {DEFAULT_PROJECT_AREAS.map((area) => {
            const areaProjects = projects.filter((p) => p.area === area);
            if (areaProjects.length === 0) return null;

            return (
              <div key={area} className={styles.areaGroup}>
                <span className={styles.areaTitle}>{area}</span>
                <div className={styles.areaList}>
                  {areaProjects.map((proj) => {
                    const isSelected = proj.id === selectedProject?.id;
                    const pTasks = tasks.filter((t) => t.project_id === proj.id);
                    const pCompleted = pTasks.filter((t) => t.status === 'completed').length;

                    return (
                      <div
                        key={proj.id}
                        className={`${styles.projectItem} ${isSelected ? styles.projectItemActive : ''}`}
                        onClick={() => setSelectedProjectId(proj.id)}
                      >
                        <span
                          className={styles.projectDot}
                          style={{ backgroundColor: proj.color }}
                        />
                        <span className={styles.projectName}>{proj.name}</span>

                        <span className={styles.projectCountBadge}>
                          {pCompleted}/{pTasks.length}
                        </span>

                        <div className={styles.projectItemActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={(e) => handleOpenEditModal(proj, e)}
                            title="Projeyi düzenle"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={(e) => handleDeleteProject(proj.id, e)}
                            title="Projeyi sil"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Sağ Kolon: Seçili Proje Detayı ve Görevleri */}
        <main className={styles.projectDetail}>
          {selectedProject ? (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className={styles.detailDot}
                      style={{ backgroundColor: selectedProject.color }}
                    />
                    <h2 className={styles.detailTitle}>{selectedProject.name}</h2>
                    <span className={styles.areaPill}>{selectedProject.area}</span>
                  </div>
                </div>

                {selectedProject.description && (
                  <p className={styles.detailDesc}>{selectedProject.description}</p>
                )}

                {/* İlerleme Çubuğu */}
                <div className={styles.progressContainer}>
                  <div className={styles.progressTextRow}>
                    <span>İlerleme ({completedCount} / {totalCount} tamamlandı)</span>
                    <span style={{ fontWeight: 600 }}>%{progressPercent}</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: selectedProject.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Proje İçi Hızlı Görev Ekleme */}
              <form onSubmit={handleAddProjectTask} className={styles.taskAddForm}>
                <input
                  type="text"
                  className={styles.taskAddInput}
                  placeholder={`"${selectedProject.name}" projesine hızlı görev ekle (Enter)...`}
                  value={newProjectTaskTitle}
                  onChange={(e) => setNewProjectTaskTitle(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newProjectTaskTitle.trim()}
                  className={styles.taskAddSubmit}
                >
                  <Plus size={13} />
                  <span>Ekle</span>
                </button>
              </form>

              {/* Projeye Bağlı Görevler */}
              <div className={styles.tasksList}>
                {projectTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`${styles.taskRow} ${t.status === 'completed' ? styles.taskRowCompleted : ''}`}
                  >
                    <button
                      type="button"
                      className={`${styles.taskCheck} ${t.status === 'completed' ? styles.taskCheckDone : ''}`}
                      onClick={() => toggleTask(t.id)}
                    >
                      {t.status === 'completed' ? (
                        <CheckCircle2 size={15} color="var(--success)" />
                      ) : (
                        <Circle size={15} />
                      )}
                    </button>
                    <span className={styles.taskTitleText}>{t.title}</span>
                    <span className={styles.taskDateBadge}>{t.scheduled_date}</span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => deleteTask(t.id)}
                      title="Görevi sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {projectTasks.length === 0 && (
                  <div className={styles.emptyTasks}>
                    Bu projeye henüz bir görev atanmadı. Yukarıdaki kutudan hemen ekleyebilirsiniz.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noProjectSelected}>
              Soldaki listeden bir proje seçin veya yeni bir proje oluşturun.
            </div>
          )}
        </main>
      </div>

      {/* Proje Oluşturma / Düzenleme Modalı */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {editingProject ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}
            </h3>

            <form onSubmit={handleSaveProject} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Proje Adı *</label>
                <input
                  type="text"
                  autoFocus
                  required
                  className={styles.formInput}
                  placeholder="Örn: Yeni Web Sitesi, Mali Raporlama..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Odak Alanı</label>
                  <select
                    className={styles.formSelect}
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value as any)}
                  >
                    {DEFAULT_PROJECT_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Renk Vurgusu</label>
                  <div className={styles.colorPalette}>
                    {DEFAULT_PROJECT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.colorBtn} ${formColor === c ? styles.colorBtnActive : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFormColor(c)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Açıklama (Opsiyonel)</label>
                <textarea
                  className={styles.formTextarea}
                  rows={2}
                  placeholder="Projenin amacı veya kapsamı..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim()}
                  className={styles.modalSubmitBtn}
                >
                  {editingProject ? 'Kaydet' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
