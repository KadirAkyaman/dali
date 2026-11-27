import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowLeft, ArrowRight, Building2, CalendarDays, Check, CheckCircle2, Clock3, Download, Edit2, Plus, Receipt, Search, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { Client, CURRENCY_SYMBOLS, MONTH_NAMES_TR, getFirstBillingPeriod } from '../../types/client';
import { Expense, EXPENSE_CATEGORY_LABELS } from '../../types/expense';
import { localClientRepository } from '../../repositories/localClientRepository';
import { localExpenseRepository } from '../../repositories/localExpenseRepository';
import { ClientModal } from '../../components/clients/ClientModal';
import { ExpenseModal } from '../../components/clients/ExpenseModal';
import { PaymentRecordModal } from '../../components/clients/PaymentRecordModal';
import styles from './ClientsView.module.css';

type Filter = 'all' | 'active' | 'paused' | 'overdue' | 'archived';
const money = (value: number, currency: Client['currency']) => `${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${CURRENCY_SYMBOLS[currency] || '₺'}`;
const mixedMoney = (totals: Partial<Record<Client['currency'], number>>) => {
  const parts = (Object.entries(totals) as [Client['currency'], number][]).filter(([, value]) => value !== 0).map(([currency, value]) => money(value, currency));
  return parts.length ? parts.join(' · ') : money(0, 'TRY');
};

export const ClientsView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [clientModal, setClientModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [paymentMonth, setPaymentMonth] = useState<string | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseMonth, setExpenseMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const currentKey = todayStr.slice(0, 7);
  const refresh = () => setClients(localClientRepository.getClients());
  const refreshExpenses = () => setExpenses(localExpenseRepository.getExpenses());
  useEffect(() => { refresh(); refreshExpenses(); }, []);

  const alerts = useMemo(() => localClientRepository.getOverdueAlerts(todayStr), [clients, todayStr]);
  const selected = clients.find((client) => client.id === selectedId) || null;
  const filtered = clients.filter((client) => {
    const haystack = `${client.name} ${client.contact_person || ''} ${client.notes || ''}`.toLocaleLowerCase('tr-TR');
    return haystack.includes(query.toLocaleLowerCase('tr-TR')) &&
      (filter === 'all' || (filter === 'overdue' ? alerts.some((alert) => alert.client_id === client.id) : client.status === filter));
  });
  const activeClients = clients.filter((client) => client.status === 'active');
  const unknownExpectedCount = activeClients.filter((client) => {
    const firstDue = getFirstBillingPeriod(client);
    const billingStarted = firstDue.year < today.getFullYear() || (firstDue.year === today.getFullYear() && firstDue.month <= today.getMonth() + 1);
    return billingStarted && client.is_variable_fee && !(client.records[currentKey]?.target_amount > 0);
  }).length;
  const collected: Partial<Record<Client['currency'], number>> = {};
  const expected: Partial<Record<Client['currency'], number>> = {};
  const overdue: Partial<Record<Client['currency'], number>> = {};
  const yearly: Partial<Record<Client['currency'], number>> = {};
  const currentExpenses = expenses.filter((expense) => expense.spent_at.slice(0, 7) === currentKey);
  const monthlyExpenses: Partial<Record<Client['currency'], number>> = {};
  const net: Partial<Record<Client['currency'], number>> = {};
  clients.forEach((client) => {
    collected[client.currency] = (collected[client.currency] || 0) + (client.records[currentKey]?.installments.reduce((n, p) => n + p.amount, 0) || 0);
  });
  activeClients.forEach((client) => {
    const firstDue = getFirstBillingPeriod(client);
    if (firstDue.year < today.getFullYear() || (firstDue.year === today.getFullYear() && firstDue.month <= today.getMonth() + 1)) {
      expected[client.currency] = (expected[client.currency] || 0) + (client.records[currentKey]?.target_amount ?? client.monthly_retainer);
    }
  });
  currentExpenses.forEach((expense) => { monthlyExpenses[expense.currency] = (monthlyExpenses[expense.currency] || 0) + expense.amount; });
  new Set([...Object.keys(collected), ...Object.keys(monthlyExpenses)]).forEach((currency) => {
    const code = currency as Client['currency'];
    net[code] = (collected[code] || 0) - (monthlyExpenses[code] || 0);
  });
  alerts.forEach((alert) => { overdue[alert.currency] = (overdue[alert.currency] || 0) + alert.remaining_amount; });
  const unknownOverdueCount = alerts.filter((alert) => alert.amount_unknown).length;
  clients.forEach((client) => Object.entries(client.records).filter(([key]) => key.startsWith(String(year))).forEach(([, record]) => {
    yearly[client.currency] = (yearly[client.currency] || 0) + record.installments.reduce((sum, payment) => sum + payment.amount, 0);
  }));

  const openPayment = (y: number, m: number) => setPaymentMonth(`${y}-${String(m).padStart(2, '0')}`);
  const saveClient = (data: Omit<Client, 'id' | 'created_at' | 'records'>) => {
    if (editing) localClientRepository.updateClient(editing.id, data); else localClientRepository.createClient(data);
    refresh(); setClientModal(false); setEditing(null);
  };
  const deleteClient = (client: Client) => {
    if (confirm(`“${client.name}” kurumunu ve tüm ödeme geçmişini silmek istiyor musunuz?`)) { localClientRepository.deleteClient(client.id); if (selectedId === client.id) setSelectedId(null); refresh(); }
  };
  const saveExpense = (expense: Omit<Expense, 'id' | 'created_at'>) => {
    localExpenseRepository.createExpense(expense);
    refreshExpenses();
    setExpenseModalOpen(false);
  };
  const deleteExpense = (expense: Expense) => {
    if (confirm(`“${expense.title}” gider kaydını silmek istiyor musun?`)) {
      localExpenseRepository.deleteExpense(expense.id);
      refreshExpenses();
    }
  };
  const exportYear = () => {
    const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [['Kurum', 'Hizmet kapsamı', 'Ay', 'Ödeme dönemi', 'Hedef', 'Tahsil edilen', 'Kalan', 'Durum', 'Tahsilat tarihleri', 'Ödeme notları', 'Aylık kurum notu']];
    clients.forEach((client) => MONTH_NAMES_TR.forEach((name, index) => {
      const monthNumber = index + 1;
      const record = client.records[`${year}-${String(monthNumber).padStart(2, '0')}`];
      const target = client.is_variable_fee ? (record?.target_amount ?? 0) : (record?.target_amount ?? client.monthly_retainer);
      const paid = record?.installments.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const monthState = recordFor(client, year, monthNumber);
      const status = client.is_variable_fee
        ? monthState.late ? (paid > 0 ? 'Eksik tahsilat' : 'Ücret yatırılmadı') : paid > 0 ? (record?.is_collection_incomplete ? 'Kısmi ödeme' : 'Tahsilat kaydedildi') : 'Ücret belirlenmedi'
        : paid >= target ? 'Tahsil edildi' : paid > 0 ? 'Kısmi ödeme' : monthState.late ? 'Gecikti' : 'Bekliyor';
      const remaining = client.is_variable_fee ? (record?.is_collection_incomplete ? record.remaining_amount || 0 : paid > 0 ? 0 : '') : Math.max(0, target - paid);
      rows.push([client.name, client.notes || '', `${name} ${year}`, `${client.billing_start_day}-${client.billing_end_day}`, client.is_variable_fee && target <= 0 ? 'Belirsiz' : `${target} ${client.currency}`, `${paid} ${client.currency}`, remaining === '' ? 'Belirsiz' : `${remaining} ${client.currency}`, status, record?.installments.map((payment) => payment.paid_date).join(', ') || '', record?.installments.map((payment) => payment.note || payment.method || '').filter(Boolean).join(' / ') || '', record?.custom_notes || '']);
    }));
    const csv = `\uFEFF${rows.map((row) => row.map(quote).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `dali-kurum-tahsilat-${year}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  };
  const recordFor = (client: Client, y: number, m: number) => {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const record = client.records[key];
    const target = client.is_variable_fee ? (record?.target_amount ?? 0) : (record?.target_amount ?? client.monthly_retainer);
    const paid = record?.installments.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const firstDue = getFirstBillingPeriod(client);
    const billingStarted = y > firstDue.year || (y === firstDue.year && m >= firstDue.month);
    const dueDay = Math.min(client.billing_end_day, new Date(y, m, 0).getDate());
    const dueDatePassed = y < today.getFullYear() || (y === today.getFullYear() && (m < today.getMonth() + 1 || (m === today.getMonth() + 1 && today.getDate() > dueDay)));
    const late = client.status === 'active' && billingStarted && dueDatePassed && (client.is_variable_fee ? (paid === 0 || (record?.is_collection_incomplete && (record.remaining_amount || 0) > 0)) : paid < target);
    const done = client.is_variable_fee ? paid > 0 && !record?.is_collection_incomplete : paid >= target && target > 0;
    return { key, target, paid, late, done };
  };

  return <div className={styles.container}>
    <header className={styles.header}>
      <div className={styles.heading}>
        {onBack && <button className={styles.backButton} onClick={onBack} aria-label="Geri"><ArrowLeft size={17}/></button>}
        <div className={styles.headingIcon}><Building2 size={21}/></div>
        <div><div className={styles.eyebrow}>GELİR & GİDER TAKİBİ</div><h1>Finans yönetimi</h1><p>Kurum gelirlerini, tahsilatları ve işletme giderlerini tek yerden takip et.</p></div>
      </div>
      <button className={styles.primaryButton} onClick={() => { setEditing(null); setClientModal(true); }}><Plus size={17}/> Kurum ekle</button>
    </header>

    {alerts.length > 0 && <section className={styles.alertPanel}>
      <div className={styles.alertMark}><AlertTriangle size={18}/></div><div className={styles.alertCopy}><strong>{alerts.length} tahsilat gecikmede</strong><span>{alerts.slice(0, 3).map((item) => `${item.client_name} · ${item.month_name}${item.amount_unknown ? ' · Ücret yatırılmadı' : ` · Kalan ${money(item.remaining_amount, item.currency)}`}`).join('  /  ')}{alerts.length > 3 ? `  /  +${alerts.length - 3} kayıt` : ''}</span></div>
      <button onClick={() => setFilter('overdue')}>Gecikenleri gör <ArrowRight size={15}/></button>
    </section>}

    <section className={styles.metrics}>
      <article className={styles.metric}><div className={styles.metricIcon}><Wallet size={17}/></div><span>Bu ay tahsil edildi</span><strong>{mixedMoney(collected)}</strong><small>Aktif kurumlardan alınan</small></article>
      <article className={styles.metric}><div className={styles.metricIcon}><CalendarDays size={17}/></div><span>Bu ay beklenen</span><strong>{unknownExpectedCount > 0 && !Object.values(expected).some((amount) => (amount || 0) > 0) ? 'Tutar bekleniyor' : mixedMoney(expected)}</strong><small>{unknownExpectedCount ? `${unknownExpectedCount} kurumda ücret belirsiz` : `${activeClients.length} aktif kurum`}</small></article>
      <article className={`${styles.metric} ${styles.metricExpense}`}><div className={styles.metricIcon}><ArrowDownLeft size={17}/></div><span>Bu ay gider</span><strong>{mixedMoney(monthlyExpenses)}</strong><small>{currentExpenses.length} gider kaydı</small></article>
      <article className={`${styles.metric} ${styles.metricNet}`}><div className={styles.metricIcon}><TrendingUp size={17}/></div><span>Tahsilat − gider</span><strong>{mixedMoney(net)}</strong><small>Bu ay net nakit akışı</small></article>
      <article className={`${styles.metric} ${alerts.length ? styles.metricDanger : ''}`}><div className={styles.metricIcon}><Clock3 size={17}/></div><span>Geciken alacak</span><strong>{unknownOverdueCount > 0 && !alerts.some((alert) => !alert.amount_unknown) ? 'Tutar bekleniyor' : mixedMoney(overdue)}</strong><small>{alerts.length ? `${alerts.length} ödeme · ${unknownOverdueCount ? `${unknownOverdueCount} belirsiz tutar` : 'takip gerekiyor'}` : 'Gecikmiş ödeme yok'}</small></article>
      <article className={styles.metric}><div className={styles.metricIcon}><TrendingUp size={17}/></div><span>{year} tahsilatı</span><strong>{mixedMoney(yearly)}</strong><small>Yıl başından bugüne</small></article>
    </section>

    <section className={styles.expensesPanel}>
      <div className={styles.expenseHeader}><div><span className={styles.eyebrow}>İŞLETME HARCAMALARI</span><h2>Giderler</h2><p>Yazılım abonelikleri, sistemler, reklam ve operasyon harcamaları</p></div><div className={styles.expenseActions}><input aria-label="Gider dönemi" type="month" value={expenseMonth} onChange={(event) => setExpenseMonth(event.target.value)}/><button className={styles.primaryButton} onClick={() => setExpenseModalOpen(true)}><Plus size={16}/> Gider ekle</button></div></div>
      {(() => {
        const periodExpenses = expenses.filter((expense) => expense.spent_at.slice(0, 7) === expenseMonth).sort((a, b) => b.spent_at.localeCompare(a.spent_at));
        const periodTotals: Partial<Record<Client['currency'], number>> = {};
        periodExpenses.forEach((expense) => { periodTotals[expense.currency] = (periodTotals[expense.currency] || 0) + expense.amount; });
        return <>
          <div className={styles.expenseSummary}><div><span>{new Date(`${expenseMonth}-15T12:00:00`).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} toplamı</span><strong>{mixedMoney(periodTotals)}</strong></div><span className={styles.expenseCount}>{periodExpenses.length} kayıt</span></div>
          {periodExpenses.length ? <div className={styles.expenseList}>{periodExpenses.map((expense) => <article key={expense.id} className={styles.expenseRow}><div className={styles.expenseGlyph}><Receipt size={16}/></div><div className={styles.expenseName}><strong>{expense.title}</strong><span>{expense.vendor || EXPENSE_CATEGORY_LABELS[expense.category]}{expense.vendor ? ` · ${EXPENSE_CATEGORY_LABELS[expense.category]}` : ''}</span>{expense.note && <small>{expense.note}</small>}</div><time>{new Date(`${expense.spent_at}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</time><strong className={styles.expenseAmount}>− {money(expense.amount, expense.currency)}</strong><button className={styles.expenseDelete} onClick={() => deleteExpense(expense)} aria-label={`${expense.title} giderini sil`} title="Gideri sil"><Trash2 size={14}/></button></article>)}</div> : <div className={styles.expenseEmpty}><div><Receipt size={18}/></div><span>Bu dönemde gider kaydı yok</span><small>Bir sistem veya işletme harcaması ekleyerek başlayabilirsin.</small></div>}
        </>;
      })()}
    </section>

    <section className={styles.workspace}>
      <div className={styles.toolbar}><div><h2>Kurum portföyü</h2><p>{filtered.length} kurum · {activeClients.length} aktif sözleşme</p></div><div className={styles.toolbarActions}><div className={styles.yearControl}><span>RAPOR YILI</span><button onClick={() => setYear((value) => value - 1)} aria-label="Önceki yıl"><ArrowLeft size={14}/></button><strong>{year}</strong><button onClick={() => setYear((value) => value + 1)} aria-label="Sonraki yıl"><ArrowRight size={14}/></button></div><label className={styles.search}><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kurum veya hizmet ara"/></label><button className={styles.exportButton} onClick={exportYear} title={`${year} tahsilat raporunu CSV indir`}><Download size={15}/><span>CSV raporu</span></button></div></div>
      <nav className={styles.filters} aria-label="Kurum filtreleri">{([['all', 'Tümü'], ['active', 'Aktif'], ['paused', 'Durduruldu'], ['overdue', 'Geciken'], ['archived', 'Arşiv']] as [Filter, string][]).map(([key, label]) => <button key={key} className={filter === key ? styles.selectedFilter : ''} onClick={() => setFilter(key)}>{label}<span>{key === 'all' ? clients.length : key === 'overdue' ? new Set(alerts.map((a) => a.client_id)).size : clients.filter((c) => c.status === key).length}</span></button>)}</nav>
      {filtered.length === 0 ? <div className={styles.empty}><div><Building2 size={22}/></div><strong>{query ? 'Eşleşen kurum bulunamadı' : 'Henüz kurum eklenmemiş'}</strong><p>Hizmet verdiğiniz kurumları ekleyin; ödeme dönemlerini ve tahsilat notlarını burada takip edin.</p>{!query && <button className={styles.primaryButton} onClick={() => { setEditing(null); setClientModal(true); }}><Plus size={16}/> İlk kurumu ekle</button>}</div> : <div className={styles.cardGrid}>{filtered.map((client) => {
        const payment = recordFor(client, today.getFullYear(), today.getMonth() + 1);
        const progress = payment.target > 0 ? Math.min(100, (payment.paid / payment.target) * 100) : 0;
        const state = payment.done ? 'paid' : payment.late ? 'late' : payment.paid ? 'partial' : 'waiting';
        const label = state === 'paid' ? (client.is_variable_fee ? 'Tahsilat kaydedildi' : 'Tahsil edildi') : state === 'late' ? client.is_variable_fee ? payment.paid > 0 ? 'Eksik tahsilat' : 'Ücret yatırılmadı' : 'Ödeme gecikti' : state === 'partial' ? 'Kısmi ödeme' : `Her ay ${client.billing_start_day}–${client.billing_end_day} arası`;
        return <article key={client.id} className={`${styles.clientCard} ${selectedId === client.id ? styles.openCard : ''}`}>
          <button className={styles.cardMain} onClick={() => setSelectedId(selectedId === client.id ? null : client.id)}>
            <div className={styles.cardTop}><div className={styles.avatar}>{client.name.trim().charAt(0).toLocaleUpperCase('tr-TR')}</div><div className={styles.clientIdentity}><strong>{client.name}</strong><span>{client.contact_person || (client.status === 'active' ? 'Aktif kurum' : client.status === 'paused' ? 'Durduruldu' : 'Arşivlendi')}</span></div><span className={`${styles.status} ${styles[state]}`}>{state === 'paid' ? <CheckCircle2 size={13}/> : state === 'late' ? <AlertTriangle size={13}/> : state === 'partial' ? <Clock3 size={13}/> : <CalendarDays size={13}/>} {state === 'waiting' ? client.status === 'active' ? label : client.status === 'paused' ? 'Durduruldu' : 'Arşiv' : label}</span></div>
            <p className={styles.services}>{client.notes || 'Hizmet kapsamı henüz eklenmedi.'}</p>
            <div className={styles.cardBottom}><div><small>Aylık hizmet bedeli</small><strong>{client.is_variable_fee ? 'Değişken ücret' : money(client.monthly_retainer, client.currency)}{!client.is_variable_fee && <em> / ay</em>}</strong></div><div className={styles.paymentRange}><small><CalendarDays size={13}/> Tahsilat dönemi</small><strong>Her ayın {client.billing_start_day}–{client.billing_end_day}. günü</strong></div><div className={styles.cardLink}>{selectedId === client.id ? 'Detayı kapat' : 'Detayları gör'} <ArrowRight size={15}/></div></div>
            <div className={styles.progressBlock}><div className={styles.progressLabels}><span>{MONTH_NAMES_TR[today.getMonth()]} tahsilatı</span><strong>{money(payment.paid, client.currency)} <em>/ {client.is_variable_fee && payment.target <= 0 ? 'tutar belirlenmedi' : money(payment.target, client.currency)}</em></strong></div><div className={styles.progressTrack}><span className={`${styles.progressFill} ${state === 'late' ? styles.progressLate : ''}`} style={{ width: `${progress}%` }}/></div></div>
          </button>
          {selectedId === client.id && <div className={styles.detail}>
            <div className={styles.detailHeader}><div><span className={styles.eyebrow}>AYLIK TAHSİLAT TAKİBİ</span><h3>{client.name} <span>· {year}</span></h3></div><div className={styles.detailActions}><button onClick={() => { setEditing(client); setClientModal(true); }}><Edit2 size={14}/> Düzenle</button><button className={styles.deleteButton} onClick={() => deleteClient(client)}><Trash2 size={14}/></button></div></div>
            <div className={styles.months}>{MONTH_NAMES_TR.map((name, index) => { const m = index + 1; const monthPayment = recordFor(client, year, m); const monthState = monthPayment.done ? 'paid' : monthPayment.late ? 'late' : monthPayment.paid ? 'partial' : 'waiting'; return <button key={m} onClick={() => openPayment(year, m)} className={`${styles.month} ${styles[`month_${monthState}`]} ${year === today.getFullYear() && m === today.getMonth() + 1 ? styles.thisMonth : ''}`}><span>{name.slice(0, 3)}</span><strong>{monthPayment.done ? <Check size={15}/> : monthPayment.late ? <AlertTriangle size={14}/> : monthPayment.paid ? money(monthPayment.paid, client.currency) : '—'}</strong><small>{monthPayment.done ? 'Ödendi' : monthPayment.late ? 'Gecikti' : monthPayment.paid ? 'Kısmi' : 'Bekliyor'}</small></button>; })}</div>
            <div className={styles.detailFooter}><span><span className={styles.legendPaid}/> Tahsil edildi</span><span><span className={styles.legendPartial}/> Kısmi ödeme</span><span><span className={styles.legendLate}/> Gecikmiş</span></div>
          </div>}
        </article>;
      })}</div>}
    </section>

    {clientModal && <ClientModal client={editing} onClose={() => { setClientModal(false); setEditing(null); }} onSave={saveClient}/>}
    {expenseModalOpen && <ExpenseModal todayStr={todayStr} onClose={() => setExpenseModalOpen(false)} onSave={saveExpense}/>}
    {selected && paymentMonth && <PaymentRecordModal client={selected} yearMonth={paymentMonth} todayStr={todayStr} onClose={() => setPaymentMonth(null)} onAddPayment={(amount, date, note, method) => { localClientRepository.addPayment(selected.id, paymentMonth, amount, date, note, method); refresh(); }} onMarkFullPaid={() => { localClientRepository.markMonthFullyPaid(selected.id, paymentMonth, todayStr); refresh(); }} onResetPayment={() => { localClientRepository.resetMonthPayment(selected.id, paymentMonth); refresh(); }} onToggleInvoice={(invoice) => { localClientRepository.toggleInvoiceStatus(selected.id, paymentMonth, invoice); refresh(); }} onSaveMonthNotes={(notes) => { localClientRepository.saveMonthNotes(selected.id, paymentMonth, notes); refresh(); }} onSetMonthCollectionIncomplete={(incomplete, remainingAmount) => { localClientRepository.setMonthCollectionIncomplete(selected.id, paymentMonth, incomplete, remainingAmount); refresh(); }}/ >}
  </div>;
};
