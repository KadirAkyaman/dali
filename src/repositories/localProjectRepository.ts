import { Project } from '../types/project';

const STORAGE_KEY = 'dali_projects';

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-dali',
    name: 'Dali Uygulaması',
    color: '#8C83D8',
    area: 'İş',
    description: 'Minimalist kişisel günlük çalışma planlayıcısı geliştirmesi.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'proj-personal',
    name: 'Kişisel Gelişim & Sağlık',
    color: '#10B981',
    area: 'Kişisel',
    description: 'Günlük alışkanlıklar, kitap okuma ve sağlık hedefleri.',
    created_at: new Date().toISOString(),
  },
];

export class LocalProjectRepository {
  getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const initial = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
      this.saveProjects(initial);
      return initial;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    }
  }

  saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Projeler kaydedilemedi:', e);
    }
  }

  createProject(data: Omit<Project, 'id' | 'created_at'>): Project {
    const projects = this.getProjects();
    const newProj: Project = {
      ...data,
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    projects.push(newProj);
    this.saveProjects(projects);
    return newProj;
  }

  updateProject(id: string, updates: Partial<Project>): Project {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Project ${id} not found`);
    }
    const updated = { ...projects[index], ...updates };
    projects[index] = updated;
    this.saveProjects(projects);
    return updated;
  }

  deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) return false;
    this.saveProjects(filtered);
    return true;
  }
}

export const localProjectRepository = new LocalProjectRepository();
