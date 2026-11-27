import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Client, MonthlyBillingRecord, CURRENCY_SYMBOLS, MONTH_NAMES_TR } from '../../types/client';
import styles from './PaymentRecordModal.module.css';

interface PaymentRecordModalProps {
  client: Client;
  yearMonth: string; // "YYYY-MM"
  todayStr: string;
  onClose: () => void;
  onAddPayment: (amount: number, paidDate: string, note?: string, method?: string) => void;
  onMarkFullPaid: () => void;
  onResetPayment: () => void;
  onToggleInvoice: (invoiceNumber?: string) => void;
  onSaveMonthNotes: (notes: string) => void;
}

export const PaymentRecordModal: React.FC<PaymentRecordModalProps> = ({
  client,
  yearMonth,
  todayStr,
  onClose,
  onAddPayment,
  onMarkFullPaid,
  onResetPayment,
  onToggleInvoice,
  onSaveMonthNotes,
}) => {
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthName = MONTH_NAMES_TR[monthNum - 1];

  const record: MonthlyBillingRecord = client.records[yearMonth] || {
    month: monthNum,
    year: parseInt(yearStr, 10),
    target_amount: client.monthly_retainer,
    installments: [],
    status: 'pending',
  };

  const totalPaid = record.installments.reduce((sum, i) => sum + i.amount, 0);
  const remaining = Math.max(0, record.target_amount - totalPaid);
  const currencySymbol = CURRENCY_SYMBOLS[client.currency] || '₺';

  // New partial payment form
  const [amountInput, setAmountInput] = useState<string>(remaining > 0 ? String(remaining) : '');
  const [dateInput, setDateInput] = useState<string>(todayStr);
  const [noteInput, setNoteInput] = useState<string>('');
  const [methodInput, setMethodInput] = useState<string>('Havale/EFT');

  // Invoice form
  const [invoiceNo, setInvoiceNo] = useState<string>(record.invoice_number || '');
  const [monthNotes, setMonthNotes] = useState<string>(record.custom_notes || '');

  const handleCreateInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddPayment(parsedAmount, dateInput, noteInput.trim() || undefined, methodInput);
    setNoteInput('');
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span className={styles.clientTag}>{client.name}</span>
            <h3 className={styles.title}>
              {monthName} {yearStr} Tahsilat & Ödeme Girişi
            </h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tutar & İlerleme Özeti */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCol}>
            <span className={styles.summaryLabel}>Hedef Ücret</span>
            <span className={styles.summaryValue}>
              {record.target_amount.toLocaleString('tr-TR')} {currencySymbol}
            </span>
          </div>

          <div className={styles.summaryCol}>
            <span className={styles.summaryLabel}>Tahsil Edilen</span>
            <span className={styles.summaryValueSuccess}>
              {totalPaid.toLocaleString('tr-TR')} {currencySymbol}
            </span>
          </div>

          <div className={styles.summaryCol}>
            <span className={styles.summaryLabel}>Kalan Bakiye</span>
            <span className={remaining > 0 ? styles.summaryValueDanger : styles.summaryValueSuccess}>
              {remaining.toLocaleString('tr-TR')} {currencySymbol}
            </span>
          </div>
        </div>

        {/* Hızlı Aksiyonlar */}
        <div className={styles.quickActionsRow}>
          {remaining > 0 ? (
            <button
              type="button"
              className={styles.fullPayBtn}
              onClick={onMarkFullPaid}
            >
              <CheckCircle2 size={13} />
              <span>Kalan {remaining.toLocaleString('tr-TR')} {currencySymbol} İçin Tek Tıkla Tam Ödendi İşaretle</span>
            </button>
          ) : (
            <div className={styles.allPaidBanner}>
              <CheckCircle2 size={14} color="var(--success)" />
              <span>Bu ayın ödemesi eksiksiz tahsil edildi!</span>
            </div>
          )}
        </div>

        {/* Parçalı Ödeme Ekleme Formu */}
        <form onSubmit={handleCreateInstallment} className={styles.installmentForm}>
          <span className={styles.formSectionTitle}>
            <Plus size={12} /> Parçalı Ödeme / Taksit Ekle
          </span>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Tutar ({currencySymbol}) *</label>
              <input
                type="number"
                step="any"
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Örn: 15000"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label>Ödeme Tarihi *</label>
              <input
                type="date"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label>Yöntem</label>
              <select
                value={methodInput}
                onChange={(e) => setMethodInput(e.target.value)}
                className={styles.select}
              >
                <option value="Havale/EFT">Havale/EFT</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="Nakit">Nakit</option>
                <option value="Kripto / Diğer">Kripto / Diğer</option>
              </select>
            </div>
          </div>

          <div className={styles.field} style={{ marginTop: 8 }}>
            <label>Açıklama / Dekont Notu (Opsiyonel)</label>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Örn: İlk yarısı ödendi, kalan ay sonu ödenecek..."
              className={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={!amountInput || parseFloat(amountInput) <= 0}
            className={styles.addInstallmentBtn}
          >
            <Plus size={13} />
            <span>Parçalı Ödemeyi Kaydet</span>
          </button>
        </form>

        {/* Girilen Ödeme Geçmişi */}
        <div className={styles.historySection}>
          <span className={styles.formSectionTitle}>
            Bu Ay Alınan Ödemeler ({record.installments.length})
          </span>

          <div className={styles.installmentsList}>
            {record.installments.map((inst, idx) => (
              <div key={inst.id || idx} className={styles.installmentItem}>
                <div className={styles.instLeft}>
                  <span className={styles.instAmount}>
                    +{inst.amount.toLocaleString('tr-TR')} {currencySymbol}
                  </span>
                  <span className={styles.instMeta}>
                    {inst.paid_date} • {inst.method || 'Havale/EFT'}
                  </span>
                  {inst.note && <span className={styles.instNote}>"{inst.note}"</span>}
                </div>
              </div>
            ))}

            {record.installments.length === 0 && (
              <div className={styles.emptyInstallments}>
                Bu ay için henüz ödeme girişi yapılmadı.
              </div>
            )}
          </div>
        </div>

        <div className={styles.monthNotesSection}>
          <label htmlFor="month-notes">{monthName} ayı kurum / iş notu</label>
          <textarea id="month-notes" value={monthNotes} onChange={(event) => setMonthNotes(event.target.value)} placeholder="Örn: SEO teknik denetimi tamamlandı, reklam kampanyası yenilendi…" />
          <button type="button" onClick={() => onSaveMonthNotes(monthNotes)}>Aylık notu kaydet</button>
        </div>

        {/* Fatura Durumu & Sıfırlama */}
        <div className={styles.footerRow}>
          <div className={styles.invoiceRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={Boolean(record.is_invoiced)}
                onChange={() => onToggleInvoice(invoiceNo)}
              />
              <span>Fatura Kesildi</span>
            </label>
            {record.is_invoiced && (
              <input
                type="text"
                placeholder="Fatura No..."
                value={invoiceNo}
                onChange={(e) => {
                  setInvoiceNo(e.target.value);
                  onToggleInvoice(e.target.value);
                }}
                className={styles.invoiceInput}
              />
            )}
          </div>

          {record.installments.length > 0 && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                if (confirm('Bu aya ait tüm ödeme kayıtlarını sıfırlamak istediğinize emin misiniz?')) {
                  onResetPayment();
                }
              }}
              title="Ödemeleri sıfırla"
            >
              <Trash2 size={12} />
              <span>Kayıtları Sıfırla</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
