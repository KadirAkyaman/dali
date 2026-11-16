import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';

describe('Dali Uygulaması Uçtan Uca / Entegrasyon Akışı (Türkçe)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('varsayılan olarak Bugün ekranını Dali marka kimliği ile açar', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('dali')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Günlük Akış|Bugün/i })).toBeInTheDocument();
    expect(screen.getByText('Bugüne yer aç.')).toBeInTheDocument();
  });

  it('yeni görev ekleme, tamamlama ve ilerleme çubuğu akışını sorunsuz çalıştırır', async () => {
    await act(async () => {
      render(<App />);
    });

    // "+ Yeni bir görev ekle..." tetikleyici butonuna tıkla
    const triggerBtn = screen.getByRole('button', { name: /görev ekle/i });
    fireEvent.click(triggerBtn);

    // Açılan şık karttaki input'a metin yaz ve "Ekle" butonuna bas
    const input = screen.getByPlaceholderText(/bugün neyi tamamlamak istersin/i);
    fireEvent.change(input, { target: { value: 'Minimalist arayüzü tasarla' } });

    const submitBtn = screen.getByRole('button', { name: /^ekle$/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Görevin listede belirdiğini doğrula
    await waitFor(() => {
      expect(screen.getByText('Minimalist arayüzü tasarla')).toBeInTheDocument();
    });

    // İlerleme metninin "0 / 1 tamamlandı" olduğunu doğrula
    expect(screen.getByText('0 / 1 tamamlandı')).toBeInTheDocument();

    // Görevi tamamla (checkbox)
    const checkbox = screen.getByRole('button', { name: /görevi tamamla/i });
    await act(async () => {
      fireEvent.click(checkbox);
    });

    // İlerlemenin "1 / 1 tamamlandı" olduğunu doğrula
    await waitFor(() => {
      expect(screen.getByText('1 / 1 tamamlandı')).toBeInTheDocument();
    });
    expect(screen.getByText(/tüm görevler tamamlandı/i)).toBeInTheDocument();
  });

  it('günün motivasyon cümlesini render eder ve yeni söz getirebilir', async () => {
    await act(async () => {
      render(<App />);
    });

    const refreshQuoteBtn = screen.getByRole('button', { name: /başka bir motivasyon sözü göster/i });
    expect(refreshQuoteBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(refreshQuoteBtn);
    });
  });

  it('Takvim, Tamamlananlar ve Ayarlar sekmeleri arasında geçiş yapar', async () => {
    await act(async () => {
      render(<App />);
    });

    // Takvime geçiş
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Takvim' }));
    });
    expect(screen.getByText('Pzt')).toBeInTheDocument();
    expect(screen.getByText('Paz')).toBeInTheDocument();

    // Tamamlananlar sekmesine geçiş
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tamamlananlar' }));
    });
    expect(screen.getByText('Tamamladığın işlerin sakin ve düzenli kaydı.')).toBeInTheDocument();

    // Ayarlar sekmesine geçiş
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ayarlar' }));
    });
    expect(screen.getByText('Görünüm')).toBeInTheDocument();
    expect(screen.getByText('Otomatik Aktarım')).toBeInTheDocument();
    expect(screen.getByText('Hatırlatıcılar ve Bildirimler')).toBeInTheDocument();
    expect(screen.getByText('Masaüstü ve Windows Entegrasyonu')).toBeInTheDocument();
    expect(screen.getByText('Veri Yönetimi')).toBeInTheDocument();
  });

  it('Mini Pencere (Companion Widget) moduna geçebilir ve tekrar tam görünüme dönebilir', async () => {
    await act(async () => {
      render(<App />);
    });

    // Mini Mod butonuna tıkla
    const miniModBtn = screen.getByRole('button', { name: /mini pencere modu/i });
    await act(async () => {
      fireEvent.click(miniModBtn);
    });

    // Widget içeriğini doğrula
    expect(screen.getByText("Dali'yi Aç")).toBeInTheDocument();

    // Dali'yi Aç butonuna tıklayarak tam görünüme geri dön
    await act(async () => {
      fireEvent.click(screen.getByText("Dali'yi Aç"));
    });

    expect(screen.getByRole('button', { name: /Günlük Akış|Bugün/i })).toBeInTheDocument();
  });

  it('tekrarlanan görev (recurrence) ekleme akışını başarıyla yönetir', async () => {
    await act(async () => {
      render(<App />);
    });

    const triggerBtn = screen.getByRole('button', { name: /görev ekle/i });
    fireEvent.click(triggerBtn);

    const input = screen.getByPlaceholderText(/bugün neyi tamamlamak istersin/i);
    fireEvent.change(input, { target: { value: 'Her gün 20 sayfa kitap oku' } });

    // Modern tekrar seçici butonuna tıkla ve 'Her gün' seçeneğini belirle
    const repeatBtn = screen.getByRole('button', { name: /tekrar sıklığı seç/i });
    fireEvent.pointerDown(repeatBtn, { pointerType: 'mouse' });
    fireEvent.keyDown(repeatBtn, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getByText('Her gün')).toBeInTheDocument();
    });

    const dailyOption = screen.getByText('Her gün');
    fireEvent.click(dailyOption);

    const submitBtn = screen.getByRole('button', { name: /^ekle$/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Her gün 20 sayfa kitap oku')).toBeInTheDocument();
      expect(screen.getByText('Tekrarlanan')).toBeInTheDocument();
    });
  });

  it('görevi yarına erteleme ve geri alma (undo) akışını başarıyla yürütür', async () => {
    await act(async () => {
      render(<App />);
    });

    const triggerBtn = screen.getByRole('button', { name: /görev ekle/i });
    fireEvent.click(triggerBtn);

    const input = screen.getByPlaceholderText(/bugün neyi tamamlamak istersin/i);
    fireEvent.change(input, { target: { value: 'Erteleme testi görevi' } });

    const submitBtn = screen.getByRole('button', { name: /^ekle$/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Erteleme testi görevi')).toBeInTheDocument();
    });

    // "Yarına ertele" butonuna tıkla
    const snoozeBtn = screen.getByRole('button', { name: /yarına ertele/i });
    await act(async () => {
      fireEvent.click(snoozeBtn);
    });

    // Toast mesajı ve Geri Al butonu görünmeli
    await waitFor(() => {
      expect(screen.getByText(/yarına ertelendi/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /geri al/i })).toBeInTheDocument();
    });

    // Geri Al'a bas
    const undoBtn = screen.getByRole('button', { name: /geri al/i });
    await act(async () => {
      fireEvent.click(undoBtn);
    });

    // Görev tekrar bugünkü listeye dönmeli
    await waitFor(() => {
      expect(screen.getByText('Erteleme testi görevi')).toBeInTheDocument();
    });
  });
});
