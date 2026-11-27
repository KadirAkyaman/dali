import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, FileText } from 'lucide-react';
import { Client, CurrencyCode, CURRENCY_SYMBOLS } from '../../types/client';
import styles from './ClientModal.module.css';

interface ClientModalProps {
  client?: Client | null; // null if creating
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id' | 'created_at' | 'records'>) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({ client, onClose, onSave }) => {
  const [name, setName] = useState(client?.name || '');
  const [contactPerson, setContactPerson] = useState(client?.contact_person || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [monthlyRetainer, setMonthlyRetainer] = useState(client ? String(client.monthly_retainer) : '');
  const [variableFee, setVariableFee] = useState(Boolean(client?.is_variable_fee));
  const [currency, setCurrency] = useState<CurrencyCode>(client?.currency || 'TRY');
  const [startDay, setStartDay] = useState(client?.billing_start_day ? String(client.billing_start_day) : '1');
  const [endDay, setEndDay] = useState(client?.billing_end_day ? String(client.billing_end_day) : '10');
  const [status, setStatus] = useState<'active' | 'paused' | 'archived'>(client?.status || 'active');
  const [notes, setNotes] = useState(client?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen kurum veya müşteri adını girin.');
      return;
    }
    const retainer = parseFloat(monthlyRetainer);
    if (!variableFee && (isNaN(retainer) || retainer <= 0)) {
      setError('Lütfen geçerli bir aylık ücret girin.');
      return;
    }
    const sDay = parseInt(startDay, 10);
    const eDay = parseInt(endDay, 10);
    if (isNaN(sDay) || sDay < 1 || sDay > 31 || isNaN(eDay) || eDay < 1 || eDay > 31) {
      setError('Ödeme gün aralığı 1 ile 31 arasında olmalıdır.');
      return;
    }
    if (sDay > eDay) {
      setError('Başlangıç günü bitiş gününden büyük olamaz.');
      return;
    }

    onSave({
      name: name.trim(),
      contact_person: contactPerson.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      monthly_retainer: variableFee ? 0 : retainer,
      is_variable_fee: variableFee,
      fee_tracking_started_at: client && variableFee !== Boolean(client.is_variable_fee)
        ? new Date().toISOString()
        : client?.fee_tracking_started_at || (variableFee ? new Date().toISOString() : undefined),
      currency,
      billing_start_day: sDay,
      billing_end_day: eDay,
      status,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Building2 size={20} className={styles.headerIcon} />
            <h2>{client ? 'Kurumu Düzenle' : 'Yeni Kurum / Müşteri Ekle'}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {/* Kurum Bilgisi */}
          <div className={styles.formGroup}>
            <label>
              Kurum / Müşteri Adı <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <Building2 size={16} className={styles.fieldIcon} />
              <input
                type="text"
                placeholder="Örn: Acme Dijital, Lumina Ajans..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Ücret & Para Birimi */}
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: 2 }}>
              <label>
                Aylık Retainer / Ücret {!variableFee && <span className={styles.required}>*</span>}
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencyPrefix}>{CURRENCY_SYMBOLS[currency]}</span>
                <input
                  type="number"
                  placeholder="30000"
                  value={monthlyRetainer}
                  onChange={(e) => setMonthlyRetainer(e.target.value)}
                  disabled={variableFee}
                  min="0"
                  step="any"
                />
              </div>
            </div>

            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Para Birimi</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className={styles.select}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <label className={styles.variableFeeToggle}>
            <input type="checkbox" checked={variableFee} onChange={(event) => setVariableFee(event.target.checked)} />
            <span><strong>Aylık ücret değişken / henüz belli değil</strong><small>Bu kurum için sabit tutar aranmaz; ödeme yoksa tutar belirtmeden uyarı gösterilir.</small></span>
          </label>

          {/* Ödeme Gün Aralığı */}
          <div className={styles.formGroup}>
            <label>
              Ödeme Gün Aralığı <span className={styles.hint}>(Her ay bu günler arasında tahsil edilir)</span>
            </label>
            <div className={styles.dayRangeRow}>
              <div className={styles.dayInputWrapper}>
                <span>Her ayın</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={startDay}
                  onChange={(e) => setStartDay(e.target.value)}
                  className={styles.dayInput}
                />
                <span>. günü ile</span>
              </div>
              <div className={styles.dayInputWrapper}>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={endDay}
                  onChange={(e) => setEndDay(e.target.value)}
                  className={styles.dayInput}
                />
                <span>. günü arası</span>
              </div>
            </div>
          </div>

          {/* İletişim Kişisi & E-posta */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Yetkili Kişi</label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="İsim Soyisim"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Telefon</label>
              <div className={styles.inputWrapper}>
                <Phone size={16} className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="+90 5xx xxx xx xx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* E-posta & Durum */}
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: 2 }}>
              <label>E-posta</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.fieldIcon} />
                <input
                  type="email"
                  placeholder="iletisim@kurum.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Çalışma Durumu</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={styles.select}
              >
                <option value="active">Aktif</option>
                <option value="paused">Durduruldu</option>
                <option value="archived">Arşivlendi</option>
              </select>
            </div>
          </div>

          {/* Hizmet Açıklaması / Notlar */}
          <div className={styles.formGroup}>
              <label>Hizmet kapsamı ve kurum notları</label>
            <div className={styles.inputWrapper}>
              <FileText size={16} className={styles.fieldIconTop} />
              <textarea
                placeholder="Örn: Google ve Meta reklam yönetimi, aylık SEO çalışmaları, içerik optimizasyonu..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={styles.textarea}
              />
            </div>
          </div>

          {/* Footer Butonları */}
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" className={styles.submitBtn}>
              {client ? 'Değişiklikleri Kaydet' : 'Kurumu Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
