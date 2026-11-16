import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  Calendar,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Eye,
  Edit3,
  ListPlus,
  Sparkles,
  Search,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTasks } from '../../app/providers/TaskProvider';
import { DaliNote, SLASH_COMMANDS, SlashCommand } from '../../types/note';
import { formatDisplayDate } from '../../domain/date/dateService';
import styles from './NotesView.module.css';

const DEFAULT_INITIAL_NOTES: DaliNote[] = [
  {
    id: 'note-welcome',
    title: '',
    content: `# Günün Planı & Düşünceleri

- [ ] Öncelikli işi tamamla
- [ ] 20 dakika kitap oku
- Toplantı notları: Yeni sürüm ve özellikler incelendi.

> "Zihnini boşalt, düşüncelerine yer aç."

İpucu: Satırın başına **/h1**, **/h2**, **/b** (madde), **/n** (numara) veya **/q** (alıntı) yazarak hızlı blok oluşturabilirsiniz.`,
    dateStr: new Date().toISOString().split('T')[0],
    updatedAt: Date.now(),
  },
];

export const NotesView: React.FC = () => {
  const { todayStr, addTask } = useTasks();

  // Load collection of notes from localStorage
  const [notes, setNotes] = useState<DaliNote[]>(() => {
    try {
      const saved = localStorage.getItem('dali_notes_collection');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_INITIAL_NOTES;
    } catch {
      return DEFAULT_INITIAL_NOTES;
    }
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Slash command menu state
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);

  // Convert lines to tasks modal
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [candidateLines, setCandidateLines] = useState<{ text: string; selected: boolean }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Escape to minimize expanded note
  useEffect(() => {
    if (!isExpanded) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isExpanded]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dali_notes_collection', JSON.stringify(notes));
    } catch (e) {
      console.error('Notlar kaydedilemedi:', e);
    }
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  // Filtered notes for sidebar
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        n.dateStr.includes(q)
    );
  }, [notes, searchQuery]);

  const handleCreateNote = () => {
    const newNote: DaliNote = {
      id: `note-${Date.now()}`,
      title: '',
      content: '',
      dateStr: todayStr,
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setIsPreview(false);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notes.length <= 1) {
      // Don't leave completely empty, create fresh
      const freshNote: DaliNote = {
        id: `note-${Date.now()}`,
        title: '',
        content: '',
        dateStr: todayStr,
        updatedAt: Date.now(),
      };
      setNotes([freshNote]);
      setActiveNoteId(freshNote.id);
      return;
    }

    if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      if (activeNoteId === id) {
        setActiveNoteId(remaining[0]?.id || '');
      }
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!activeNote) return;
    setIsSaved(false);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id ? { ...n, title: newTitle, updatedAt: Date.now() } : n
      )
    );
    setTimeout(() => setIsSaved(true), 300);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeNote) return;
    const val = e.target.value;
    setIsSaved(false);

    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id ? { ...n, content: val, updatedAt: Date.now() } : n
      )
    );

    // Detect Slash command
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastLine = textBeforeCursor.split('\n').pop() || '';

    const slashMatch = lastLine.match(/\/([a-zA-Z0-9]*)$/);
    if (slashMatch) {
      setSlashQuery(slashMatch[0].toLowerCase());
      setSlashIndex(0);
    } else {
      setSlashQuery(null);
    }

    setTimeout(() => setIsSaved(true), 300);
  };

  // Filter slash commands
  const matchingSlashCommands = useMemo(() => {
    if (!slashQuery) return [];
    return SLASH_COMMANDS.filter((cmd) => cmd.command.startsWith(slashQuery));
  }, [slashQuery]);

  const executeSlashCommand = (cmd: SlashCommand) => {
    const textarea = textareaRef.current;
    if (!textarea || !activeNote) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = activeNote.content.slice(0, cursorPos);
    const textAfter = activeNote.content.slice(cursorPos);

    // Replace the slash token
    const lastSlashIdx = textBefore.lastIndexOf('/');
    if (lastSlashIdx === -1) return;

    let insertion = cmd.snippet;
    if (cmd.id === 'time') {
      const now = new Date();
      insertion = `[${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}] `;
    }

    const nextContent = textBefore.slice(0, lastSlashIdx) + insertion + textAfter;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id ? { ...n, content: nextContent, updatedAt: Date.now() } : n
      )
    );
    setSlashQuery(null);

    setTimeout(() => {
      textarea.focus();
      const newCursor = lastSlashIdx + insertion.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Navigate slash palette if open
    if (slashQuery && matchingSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % matchingSlashCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex((prev) =>
          prev > 0 ? prev - 1 : matchingSlashCommands.length - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        executeSlashCommand(matchingSlashCommands[slashIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashQuery(null);
        return;
      }
    }

    // Auto-list continuation on Enter
    if (e.key === 'Enter' && !slashQuery) {
      const textarea = textareaRef.current;
      if (!textarea || !activeNote) return;

      const cursorPos = textarea.selectionStart;
      const textBefore = activeNote.content.slice(0, cursorPos);
      const currentLine = textBefore.split('\n').pop() || '';

      if (currentLine.startsWith('- [ ] ') && currentLine.length > 6) {
        e.preventDefault();
        insertTextAtCursor('\n- [ ] ');
      } else if (currentLine.startsWith('- ') && currentLine.length > 2) {
        e.preventDefault();
        insertTextAtCursor('\n- ');
      } else if (/^\d+\.\s/.test(currentLine)) {
        const match = currentLine.match(/^(\d+)\.\s/);
        if (match && currentLine.length > match[0].length) {
          e.preventDefault();
          const nextNum = parseInt(match[1], 10) + 1;
          insertTextAtCursor(`\n${nextNum}. `);
        }
      }
    }
  };

  const insertTextAtCursor = (insertText: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !activeNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = activeNote.content;
    const nextVal = val.substring(0, start) + insertText + val.substring(end);

    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id ? { ...n, content: nextVal, updatedAt: Date.now() } : n
      )
    );

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 0);
  };

  const handleCopy = async () => {
    if (!activeNote?.content) return;
    try {
      await navigator.clipboard.writeText(activeNote.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
    }
  };

  // Convert lines to tasks
  const handleOpenConvert = () => {
    if (!activeNote?.content) return;
    const lines = activeNote.content
      .split('\n')
      .map((l) => l.replace(/^[#•\-\*\[\]\s\d\.]+/, '').trim())
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
      await addTask({
        title: item.text,
      });
    }
    setIsConvertOpen(false);
  };

  // Stats
  const charCount = activeNote?.content.length || 0;
  const wordCount = activeNote?.content.trim()
    ? activeNote.content.trim().split(/\s+/).length
    : 0;

  // Simple Markdown Parser for Preview
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className={styles.previewH1}>
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className={styles.previewH2}>
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className={styles.previewH3}>
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className={styles.previewQuote}>
            {line.slice(2)}
          </div>
        );
      }
      if (line.startsWith('- [ ] ') || line.startsWith('[ ] ')) {
        return (
          <div key={idx} className={styles.previewTodo}>
            <input type="checkbox" readOnly />
            <span>{line.replace(/^(\- )?\[ \] /, '')}</span>
          </div>
        );
      }
      if (line.startsWith('- [x] ') || line.startsWith('[x] ')) {
        return (
          <div key={idx} className={styles.previewTodo}>
            <input type="checkbox" checked readOnly />
            <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
              {line.replace(/^(\- )?\[x\] /, '')}
            </span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className={styles.previewBullet}>
            {line.slice(2)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className={styles.previewNumbered}>
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      if (line === '---') {
        return <hr key={idx} className={styles.previewDivider} />;
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: 10 }} />;
      }
      return (
        <p key={idx} style={{ margin: '4px 0' }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div className={styles.container}>
      {/* SOL KENAR ÇUBUĞU: NOT LİSTESİ */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTopRow}>
            <span className={styles.sidebarTitle}>
              <FileText size={14} color="var(--accent)" />
              <span>Notlarım ({notes.length})</span>
            </span>
            <button
              type="button"
              className={styles.newNoteBtn}
              onClick={handleCreateNote}
              title="Yeni Not Oluştur"
            >
              <Plus size={12} />
              <span>Yeni</span>
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Notlarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={11}
              style={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        <div className={styles.notesList}>
          {filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            const displayTitle = note.title.trim() || formatDisplayDate(note.dateStr);

            return (
              <div
                key={note.id}
                className={`${styles.noteItem} ${isActive ? styles.noteItemActive : ''}`}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setIsPreview(false);
                }}
              >
                <div className={styles.noteItemLeft}>
                  <span className={styles.noteItemTitle}>{displayTitle}</span>
                  <div className={styles.noteItemMeta}>
                    <Calendar size={10} />
                    <span>{formatDisplayDate(note.dateStr)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.noteItemDelete}
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  title="Notu sil"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* SAĞ ALAN: NOTION TARZI EDİTÖR */}
      <main className={`${styles.editorArea} ${isExpanded ? styles.editorAreaExpanded : ''}`}>
        {activeNote ? (
          <>
            <div className={styles.editorHeader}>
              <div className={styles.titleDateRow}>
                <input
                  type="text"
                  className={styles.titleInput}
                  placeholder={formatDisplayDate(activeNote.dateStr)}
                  value={activeNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={styles.datePill} title="Bu notun tarihi">
                    <Calendar size={12} />
                    <span>{formatDisplayDate(activeNote.dateStr)}</span>
                  </div>

                  <button
                    type="button"
                    className={`${styles.actionPill} ${isExpanded ? styles.actionPillPrimary : ''}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Normal görünüme dön [Esc]" : "Notu büyüt / Widget modunda odaklan"}
                    aria-label="Notu büyüt"
                  >
                    {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    <span>{isExpanded ? 'Küçült' : 'Büyüt (Widget)'}</span>
                  </button>
                </div>
              </div>

              {/* Hızlı Format & Araç Çubuğu */}
              <div className={styles.toolbarRow}>
                <div className={styles.formatGroup}>
                  <button
                    type="button"
                    className={styles.formatBtn}
                    onClick={() => insertTextAtCursor('\n# ')}
                    title="Büyük Başlık (/h1)"
                  >
                    <Heading1 size={13} /> H1
                  </button>
                  <button
                    type="button"
                    className={styles.formatBtn}
                    onClick={() => insertTextAtCursor('\n## ')}
                    title="Orta Başlık (/h2)"
                  >
                    <Heading2 size={13} /> H2
                  </button>
                  <button
                    type="button"
                    className={styles.formatBtn}
                    onClick={() => insertTextAtCursor('\n- ')}
                    title="Madde Listesi (/b)"
                  >
                    <List size={13} /> Liste
                  </button>
                  <button
                    type="button"
                    className={styles.formatBtn}
                    onClick={() => insertTextAtCursor('\n1. ')}
                    title="Numaralı Liste (/n)"
                  >
                    <ListOrdered size={13} /> Sayı
                  </button>
                  <button
                    type="button"
                    className={styles.formatBtn}
                    onClick={() => insertTextAtCursor('\n- [ ] ')}
                    title="Yapılacak Kutusu (/t)"
                  >
                    <CheckSquare size={13} /> Kutu
                  </button>
                  <button
                    type="button"
                    className={styles.formatBtn}
                    onClick={() => insertTextAtCursor('\n> ')}
                    title="Alıntı Bloğu (/q)"
                  >
                    <Quote size={13} /> Alıntı
                  </button>
                </div>

                <div className={styles.actionsGroup}>
                  <button
                    type="button"
                    className={`${styles.actionPill} ${isPreview ? styles.actionPillPrimary : ''}`}
                    onClick={() => setIsPreview(!isPreview)}
                    title="Önizleme / Düzenleme modu"
                  >
                    {isPreview ? <Edit3 size={12} /> : <Eye size={12} />}
                    <span>{isPreview ? 'Düzenle' : 'Önizle'}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.actionPill} ${styles.actionPillPrimary}`}
                    onClick={handleOpenConvert}
                    title="Not satırlarını bugünün görevlerine aktar"
                  >
                    <ListPlus size={12} />
                    <span>Göreve Dönüştür</span>
                  </button>

                  <button
                    type="button"
                    className={styles.actionPill}
                    onClick={handleCopy}
                    title="Panoya kopyala"
                  >
                    {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* İçerik Alanı & Canlı Slash Menüsü */}
            <div className={styles.contentArea}>
              {isPreview ? (
                <div className={styles.previewContainer}>
                  {activeNote.content ? (
                    renderMarkdownPreview(activeNote.content)
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      Henüz içerik yazılmadı.
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    ref={textareaRef}
                    className={styles.editorTextarea}
                    value={activeNote.content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Düşüncelerini buraya yaz... Notion tarzı bloklar için satır başına /h1, /h2, /b, /n, /q yazabilirsiniz."
                  />

                  {/* Notion Tarzı Slash Komut Menüsü */}
                  {slashQuery && matchingSlashCommands.length > 0 && (
                    <div
                      className={styles.slashPalette}
                      style={{
                        bottom: 40,
                        left: 24,
                      }}
                    >
                      <div className={styles.slashHeader}>Komut Önerileri</div>
                      {matchingSlashCommands.map((cmd, idx) => (
                        <button
                          key={cmd.id}
                          type="button"
                          className={`${styles.slashItem} ${
                            idx === slashIndex ? styles.slashItemActive : ''
                          }`}
                          onClick={() => executeSlashCommand(cmd)}
                        >
                          <div className={styles.slashItemLeft}>
                            <span className={styles.slashItemLabel}>{cmd.label}</span>
                            <span className={styles.slashItemDesc}>{cmd.description}</span>
                          </div>
                          <span className={styles.slashItemBadge}>{cmd.command}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Alt Bilgi Çubuğu */}
            <footer className={styles.editorFooter}>
              <div style={{ display: 'flex', gap: 12 }}>
                <span>{wordCount} kelime</span>
                <span>{charCount} karakter</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
                <Sparkles size={11} />
                <span>{isSaved ? 'Kaydedildi' : 'Kaydediliyor...'}</span>
              </div>
            </footer>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            Seçili bir not bulunmuyor.
          </div>
        )}
      </main>

      {/* Satırları Göreve Dönüştür Modalı */}
      {isConvertOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsConvertOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-popover)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                  Göreve Dönüştür
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Seçtiğiniz satırlar bugünkü görev listesine aktarılacak.
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

            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {candidateLines.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: item.selected ? 'var(--accent-soft)' : 'var(--surface-subtle)',
                    border: `1px solid ${item.selected ? 'var(--accent)' : 'var(--border)'}`,
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                onClick={() => setIsConvertOpen(false)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                style={{
                  fontSize: '11px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
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
