import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ZenFocusOverlay } from './ZenFocusOverlay';

describe('ZenFocusOverlay', () => {
  it('render edilmediğinde null döner', () => {
    const { container } = render(
      <ZenFocusOverlay
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('açıldığında saat, odaklanma süresi ve bitir butonunu gösterir', () => {
    render(
      <ZenFocusOverlay
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Derin Odak/i)).toBeInTheDocument();
    expect(screen.getByText(/odaklanıldı/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bitir/i })).toBeInTheDocument();
  });

  it('Esc tuşuna veya Bitir butonuna basıldığında onClose çağrılır', () => {
    const mockClose = vi.fn();
    render(
      <ZenFocusOverlay
        isOpen={true}
        onClose={mockClose}
      />
    );

    const exitBtn = screen.getByRole('button', { name: /Bitir/i });
    fireEvent.click(exitBtn);

    expect(mockClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(2);
  });
});
