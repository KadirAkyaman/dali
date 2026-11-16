import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ZenFocusOverlay } from './ZenFocusOverlay';

describe('ZenFocusOverlay', () => {
  it('render edilmediğinde null döner', () => {
    const { container } = render(
      <ZenFocusOverlay
        isOpen={false}
        onClose={vi.fn()}
        onAddTask={vi.fn()}
        todayStr="2026-11-16"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('açıldığında saat, odaklanma süresi ve kısayol ipuçlarını gösterir', () => {
    render(
      <ZenFocusOverlay
        isOpen={true}
        onClose={vi.fn()}
        onAddTask={vi.fn()}
        todayStr="2026-11-16"
      />
    );

    expect(screen.getByText(/Zen Odak Modu/i)).toBeInTheDocument();
    expect(screen.getByText(/saniyedir derin odak modundasınız/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ctrl \+ N/i).length).toBeGreaterThanOrEqual(1);
  });

  it('Ctrl + N ile inline görev ekleme alanını açar ve Enter ile görev ekler', async () => {
    const mockAddTask = vi.fn().mockResolvedValue(undefined);
    render(
      <ZenFocusOverlay
        isOpen={true}
        onClose={vi.fn()}
        onAddTask={mockAddTask}
        todayStr="2026-11-16"
      />
    );

    // Görev Ekle butonuna tıkla
    const addBtn = screen.getByRole('button', { name: /Görev Ekle/i });
    fireEvent.click(addBtn);

    const input = screen.getByPlaceholderText(/Aklına gelen görevi yaz ve \[Enter\]'a bas/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Derin odak görevi' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      // or submit form
      fireEvent.submit(input.closest('form')!);
    });

    expect(mockAddTask).toHaveBeenCalledWith({
      title: 'Derin odak görevi',
      scheduled_date: '2026-11-16',
    });
  });

  it('Esc veya Çıkış butonuna basıldığında onClose çağrılır', () => {
    const mockClose = vi.fn();
    render(
      <ZenFocusOverlay
        isOpen={true}
        onClose={mockClose}
        onAddTask={vi.fn()}
        todayStr="2026-11-16"
      />
    );

    const exitBtn = screen.getByRole('button', { name: /Çıkış \[Esc\]/i });
    fireEvent.click(exitBtn);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
