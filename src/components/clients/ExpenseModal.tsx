import React, { useState } from 'react';
import { ArrowDownLeft, X } from 'lucide-react';
import { CURRENCY_SYMBOLS, CurrencyCode } from '../../types/client';
import { Expense, ExpenseCategory, EXPENSE_CATEGORY_LABELS } from '../../types/expense';
import styles from './ExpenseModal.module.css';

interface ExpenseModalProps {
  todayStr: string;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ todayStr, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('TRY');
  const [category, setCategory] = useState<ExpenseCategory>('software');
  const [spentAt, setSpentAt] = useState(todayStr);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!title.trim()) { setError('Gider için kısa bir açıklama yaz.'); return; }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setError('Tutar sıfırdan büyük olmalı.'); return; }
    onSave({ title: title.trim(), vendor: vendor.trim() || null, amount: parsedAmount, currency, category, spent_at: spentAt, note: note.trim() || null });
  };

  return <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className={styles.modal} onSubmit={submit}>
      <header className={styles.header}><div className={styles.headerIcon}><ArrowDownLeft size={18}/></div><div className={styles.headerCopy}><strong>Gider kaydı ekle</strong><span>Yazılım, abonelik, reklam ve diğer işletme giderleri</span></div><button type="button" className={styles.close} onClick={onClose} aria-label="Kapat"><X size={17}/></button></header>
      <div className={styles.body}>
        {error && <div className={styles.error}>{error}</div>}
        <label className={styles.field}><span>Gider açıklaması *</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Örn. Adobe Creative Cloud"/></label>
        <div className={styles.row}>
          <label className={styles.field}><span>Tutar *</span><div className={styles.amountInput}><b>{CURRENCY_SYMBOLS[currency]}</b><input type="number" min="0.01" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00"/></div></label>
          <label className={styles.field}><span>Para birimi</span><select value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}><option value="TRY">TRY · ₺</option><option value="USD">USD · $</option><option value="EUR">EUR · €</option><option value="GBP">GBP · £</option></select></label>
        </div>
        <div className={styles.row}>
          <label className={styles.field}><span>Kategori</span><select value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>{Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className={styles.field}><span>Ödeme tarihi</span><input type="date" value={spentAt} onChange={(event) => setSpentAt(event.target.value)}/></label>
        </div>
        <label className={styles.field}><span>Satıcı / sistem adı</span><input value={vendor} onChange={(event) => setVendor(event.target.value)} placeholder="Örn. Adobe, Google, Figma"/></label>
        <label className={styles.field}><span>Not <small>İsteğe bağlı</small></span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Bu gider hakkında kısa bir not ekle…" rows={3}/></label>
      </div>
      <footer className={styles.footer}><button type="button" className={styles.cancel} onClick={onClose}>Vazgeç</button><button type="submit" className={styles.save}>Gideri kaydet</button></footer>
    </form>
  </div>;
};
