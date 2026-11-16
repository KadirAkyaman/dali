import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Clock,
  ListPlus,
  BookOpen,
  StickyNote,
  X,
} from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { formatDisplayDate } from '../../domain/date/dateService';
import styles from './NotesView.module.css';

type NoteTab = 'daily' | 'scratchpad';

export const NotesView: React.FC = () => {
  const { selectedDate, addTask } = useTasks();
  const [activeTab, setActiveTab] = useState<NoteTab>('daily');

  // Daily note is scoped to selectedDate; scratchpad is persistent global
  const [dailyNote, setDailyNote] = useState<string>('');
  const [scratchpadNote, setScratchpadNote] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Convert Lines to Tasks Modal state
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [candidateLines, setCandidateLines] = useState<{ text: string; selected: boolean }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes on mount / tab / date change
  useEffect(() => {
    try {
      const savedDaily = localStorage.getItem(`dali_note_${selectedDate}`);
      setDailyNote(savedDaily || '');

      const savedScratch = localStorage.getItem('dali_scratchpad');
      setScratchpadNote(savedScratch || '');
    } catch (e) {
      console.error('Notlar yüklenirken hata:', e);
    }
  }, [selectedDate]);

  // Current note text based on active tab
  const currentContent = activeTab === 'daily' ? dailyNote : scratchpadNote;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setIsSaved(false);

    if (activeTab === 'daily') {
      setDailyNote(val);
      try {
        localStorage.setItem(`dali_note_${selectedDate}`, val);
      } catch (err) {
        console.error('Günlük not kaydedilemedi:', err);
      }
    } else {
      setScratchpadNote(val);
      try {
        localStorage.setItem('dali_scratchpad', val);
      } catch (err) {
        console.error('Karalama notu kaydedilemedi:', err);
      }
    }

    setTimeout(() => setIsSaved(true), 300);
  };

  const handleCopy = async () => {
    if (!currentContent) return;
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    if (!currentContent) return;
    if (window.confirm('Bu alandaki tüm yazıyı silmek istediğine emin misin?')) {
      if (activeTab === 'daily') {
        setDailyNote('');
        localStorage.removeItem(`dali_note_${selectedDate}`);
      } else {
        setScratchpadNote('');
        localStorage.removeItem('dali_scratchpad');
      }
    }
  };

  const handleInsertTimestamp = () => {
    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}] `;
    insertTextAtCursor(timeStr);
  };

  const handleInsertBullet = () => {
    insertTextAtCursor('\n• ');
  };

  const handleInsertTodo = () => {
    insertTextAtCursor('\n[ ] ');
  };

  const insertTextAtCursor = (insertText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const nextVal = val.substring(0, start) + insertText + val.substring(end);

    if (activeTab === 'daily') {
      setDailyNote(nextVal);
      localStorage.setItem(`dali_note_${selectedDate}`, nextVal);
    } else {
      setScratchpadNote(nextVal);
      localStorage.setItem('dali_scratchpad', nextVal);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 0);
  };

  // Open "Convert lines to tasks"
  const handleOpenConvert = () => {
    const lines = currentContent
      .split('\n')
      .map((l) => l.replace(/^[•\-\*\[\]\s]+/, '').trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert('Dönüştürülecek herhangi bir metin satırı bulunamadı.');
      return;
    }

    setCandidateLines(lines.map((text) => ({ text, selected: true })));
    setIsConvertOpen(true);
  };

  const handleConfirmConvert = async () => {
    const selected = candidateLines.filter((l) => l.selected);
    for (const item of selected) {
      await addTask({ title: item.text });
    }
    setIsConvertOpen(false);
  };

  // Stats
  const charCount = currentContent.length;
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <h1 className={styles.title}>
            <FileText size={24} color="var(--accent)" /> Not Defteri & Karalama
          </h1>

          {/* Tab Seçimi: Günün Defteri vs Hızlı Karalama */}
          <div className={styles.tabPillRow}>
            <button
              type="button"
              className={`${styles.tabPill} ${activeTab === 'daily' ? styles.tabPillActive : ''}`}
              onClick={() => setActiveTab('daily')}
            >
              <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
              Günün Notu ({formatDisplayDate(selectedDate)})
            </button>
            <button
              type="button"
              className={`${styles.tabPill} ${activeTab === 'scratchpad' ? styles.tabPillActive : ''}`}
              onClick={() => setActiveTab('scratchpad')}
            >
              <StickyNote size={12} style={{ display: 'inline', marginRight: 4 }} />
              Hızlı Karalama (Genel)
            </button>
          </div>
        </div>

        <p className={styles.subTitle}>
          {activeTab === 'daily'
            ? `${formatDisplayDate(selectedDate)} için günlük düşünceler, toplantı notları veya karalamalar.`
            : 'Sürekli elinin altında olan, kaybolmayan serbest fikir ve taslak alanı.'}
        </p>
      </header>

      <div className={styles.editorCard}>
        {/* Hızlı Araç Çubuğu */}
        <div className={styles.toolbar}>
          <div className={styles.toolGroup}>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={handleInsertTimestamp}
              title="Şu anki saati ekle"
            >
              <Clock size={12} /> Saat Damgası
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={handleInsertBullet}
              title="Madde işareti ekle"
            >
              • Madde
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={handleInsertTodo}
              title="Yapılacak kutusu ekle"
            >
              [ ] Liste
            </button>
          </div>

          <div className={styles.toolGroup}>
            <button
              type="button"
              className={`${styles.toolBtn} ${styles.toolBtnPrimary}`}
              onClick={handleOpenConvert}
              title="Yazdığın satırları bugün için yapılacak göreve dönüştür"
            >
              <ListPlus size={13} /> Göreve Dönüştür
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={handleCopy}
              title="Tüm içeriği panoya kopyala"
            >
              {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={handleClear}
              title="Metni temizle"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Not Alanı */}
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={currentContent}
          onChange={handleContentChange}
          placeholder={
            activeTab === 'daily'
              ? 'Günün notlarını, öğrendiklerini ya da aklına takılanları buraya serbestçe yaz...\n\nÖrnek:\n• 14:00 Toplantı notları\n• Yarın yapılacak acil işler'
              : 'Her an başvurmak istediğin fikirler, linkler, telefon numaraları veya hızlı taslaklar...'
          }
        />

        {/* Alt Bilgi Çubuğu */}
        <div className={styles.footerBar}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>{wordCount} kelime</span>
            <span>{charCount} karakter</span>
          </div>

          <div className={styles.saveStatus}>
            <Sparkles size={11} />
            <span>{isSaved ? 'Otomatik Kaydedildi' : 'Kaydediliyor...'}</span>
          </div>
        </div>
      </div>

      {/* Satırları Göreve Dönüştür Modalı */}
      {isConvertOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsConvertOpen(false)}
        >
          <div className={styles.convertModalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                  Göreve Dönüştür
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Seçtiğin satırlar bugünkü görev listene eklenecek.
                </span>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                onClick={() => setIsConvertOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.lineSelectList}>
              {candidateLines.map((item, idx) => (
                <div
                  key={idx}
                  className={`${styles.lineItem} ${item.selected ? styles.lineItemChecked : ''}`}
                  onClick={() =>
                    setCandidateLines((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, selected: !l.selected } : l))
                    )
                  }
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => {}}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ flex: 1 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={() => setIsConvertOpen(false)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className={`${styles.toolBtn} ${styles.toolBtnPrimary}`}
                onClick={handleConfirmConvert}
                disabled={!candidateLines.some((l) => l.selected)}
              >
                {candidateLines.filter((l) => l.selected).length} Görevi Planlayıcıya Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
