import { describe, it, expect, beforeEach } from 'vitest';
import { localProjectRepository } from './localProjectRepository';

describe('LocalProjectRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial projects when local storage is empty', () => {
    const projects = localProjectRepository.getProjects();
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.some((p) => p.name === 'Dali Uygulaması')).toBe(true);
  });

  it('should create a new project', () => {
    const newProj = localProjectRepository.createProject({
      name: 'Freelance Projesi A',
      color: '#10B981',
      area: 'Müşteri',
      description: 'Müşteri web sitesi geliştirmesi',
    });

    expect(newProj.id).toBeDefined();
    expect(newProj.name).toBe('Freelance Projesi A');
    expect(newProj.area).toBe('Müşteri');

    const all = localProjectRepository.getProjects();
    expect(all.some((p) => p.id === newProj.id)).toBe(true);
  });

  it('should update an existing project', () => {
    const newProj = localProjectRepository.createProject({
      name: 'Eski İsim',
      color: '#6366F1',
      area: 'İş',
    });

    const updated = localProjectRepository.updateProject(newProj.id, {
      name: 'Yeni İsim',
      color: '#F59E0B',
    });

    expect(updated.name).toBe('Yeni İsim');
    expect(updated.color).toBe('#F59E0B');
  });

  it('should delete a project', () => {
    const newProj = localProjectRepository.createProject({
      name: 'Silinecek Proje',
      color: '#EF4444',
      area: 'Diğer',
    });

    const deleted = localProjectRepository.deleteProject(newProj.id);
    expect(deleted).toBe(true);

    const all = localProjectRepository.getProjects();
    expect(all.some((p) => p.id === newProj.id)).toBe(false);
  });
});
