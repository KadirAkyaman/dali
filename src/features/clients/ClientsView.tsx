import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Client, OverdueAlert, CURRENCY_SYMBOLS, MONTH_NAMES_TR } from '../../types/client';
import { localClientRepository } from '../../repositories/localClientRepository';
import { ClientModal } from '../../components/clients/ClientModal';
import { PaymentRecordModal } from '../../components/clients/PaymentRecordModal';
import { OverdueAlertBanner } from '../../components/clients/OverdueAlertBanner';
import styles from './ClientsView.module.css';

export const ClientsView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'archived'>('all');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [paymentModalData, setPaymentModalData] = useState<{
    client: Client;
    yearMonth: string;
  } | null>(null);

  // Today string YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const loadClients = () => {
    setClients(localClientRepository.getClients());
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Overdue alerts
  const overdueAlerts = useMemo(() => {
    return localClientRepository.getOverdueAlerts(todayStr);
  }, [clients, todayStr]);

  // Financial summary metrics for selected year & current month
  const financialSummary = useMemo(() => {
    let currentMonthCollected = 0;
    let currentMonthRemaining = 0;
    let totalOverdue = 0;
    let yearlyCollected = 0;
    let totalMonthlyRetainer = 0;

    clients.forEach((client) => {
      if (client.status === 'active') {
        totalMonthlyRetainer += client.monthly_retainer;
      }

      // Current month check
      const currRec = client.records[currentMonthStr];
      const target = currRec ? currRec.target_amount : client.monthly_retainer;
      const paid = currRec
        ? currRec.installments.reduce((sum, inst) => sum + inst.amount, 0)
        : 0;

      if (client.status === 'active') {
        currentMonthCollected += paid;
        currentMonthRemaining += Math.max(0, target - paid);
      }

      // Check overdue in general
      if (client.status === 'active') {
        const isPastEndDay = today.getDate() > client.billing_end_day;
        if (isPastEndDay && paid < target) {
          totalOverdue += (target - paid);
        }
      }

      // Yearly collected
      Object.entries(client.records).forEach(([ym, rec]) => {
        if (ym.startsWith(String(selectedYear))) {
          const recPaid = rec.installments.reduce((sum, inst) => sum + inst.amount, 0);
          yearlyCollected += recPaid;
        }
      });
    });

    return {
      currentMonthCollected,
      currentMonthRemaining,
      totalOverdue,
      yearlyCollected,
      totalMonthlyRetainer,
    };
  }, [clients, currentMonthStr, selectedYear, today]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return c.status === 'active';
      if (statusFilter === 'archived') return c.status === 'archived';
      if (statusFilter === 'overdue') {
        return overdueAlerts.some((a: OverdueAlert) => a.client_id === c.id);
      }

      return true;
    });
  }, [clients, searchQuery, statusFilter, overdueAlerts]);

  // Handler: Add or Edit Client
  const handleSaveClient = (clientData: Omit<Client, 'id' | 'created_at' | 'records'>) => {
    if (editingClient) {
      localClientRepository.updateClient(editingClient.id, clientData);
    } else {
      localClientRepository.createClient(clientData);
    }
    loadClients();
    setIsClientModalOpen(false);
    setEditingClient(null);
  };

  const handleDeleteClient = (id: string, name: string) => {
    if (confirm(`"${name}" kurumunu ve tüm ödeme geçmişini silmek istediğinize emin misiniz?`)) {
      localClientRepository.deleteClient(id);
      loadClients();
    }
  };

  // Open payment modal
  const handleOpenPayment = (client: Client, year: number, monthNum: number) => {
    const ym = `${year}-${String(monthNum).padStart(2, '0')}`;
    setPaymentModalData({ client, yearMonth: ym });
  };

  const handleOpenPaymentFromAlert = (clientId: string, monthStr: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setPaymentModalData({ client, yearMonth: monthStr });
    }
  };

  // Refresh client in modal if updated
  const activeClientInModal = useMemo(() => {
    if (!paymentModalData) return null;
    return clients.find((c) => c.id === paymentModalData.client.id) || paymentModalData.client;
  }, [paymentModalData, clients]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleArea}>
          {onBack && (
            <button type="button" className={styles.backButton} onClick={onBack} aria-label="Ana sayfaya dön">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className={styles.iconBadge}>
            <Building2 size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Kurum & Gelir Yönetimi</h1>
            <p className={styles.pageSubtitle}>
              Freelance müşteriler, aylık retainer sözleşmeleri ve tahsilat takibi
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.yearSelector}>
            <button
              type="button"
              className={styles.yearNavBtn}
              onClick={() => setSelectedYear((y) => y - 1)}
              title="Önceki Yıl"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.yearDisplay}>{selectedYear}</span>
            <button
              type="button"
              className={styles.yearNavBtn}
              onClick={() => setSelectedYear((y) => y + 1)}
              title="Sonraki Yıl"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className={styles.addClientBtn}
            onClick={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Yeni Kurum Ekle</span>
          </button>
        </div>
      </div>

      {/* Overdue alert banner if any */}
      <OverdueAlertBanner
        alerts={overdueAlerts}
        onOpenPaymentModal={handleOpenPaymentFromAlert}
      />

      {/* KPI Cards Bar */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Bu Ay Tahsil Edilen</span>
            <span className={styles.kpiValue} style={{ color: '#10b981' }}>
              {financialSummary.currentMonthCollected.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
            <Clock size={20} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Kalan Bekleyen Tahsilat</span>
            <span className={styles.kpiValue} style={{ color: '#f59e0b' }}>
              {financialSummary.currentMonthRemaining.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)' }}>
            <AlertTriangle size={20} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Gecikmiş Alacak</span>
            <span className={styles.kpiValue} style={{ color: financialSummary.totalOverdue > 0 ? '#ef4444' : 'inherit' }}>
              {financialSummary.totalOverdue.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)' }}>
            <DollarSign size={20} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>{selectedYear} Yıllık Tahsilat</span>
            <span className={styles.kpiValue} style={{ color: '#818cf8' }}>
              {financialSummary.yearlyCollected.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Kurum adı, yetkili veya hizmet ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.statusChips}>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === 'all' ? styles.activeChip : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tümü ({clients.length})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === 'active' ? styles.activeChip : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Aktif Kurumlar ({clients.filter((c) => c.status === 'active').length})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === 'overdue' ? styles.activeChip : ''}`}
            onClick={() => setStatusFilter('overdue')}
          >
            Gecikenler ({overdueAlerts.length})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === 'archived' ? styles.activeChip : ''}`}
            onClick={() => setStatusFilter('archived')}
          >
            Arşiv
          </button>
        </div>
      </div>

      {/* 12-Month Matrix Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableScrollWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th className={styles.stickyColHeader}>Kurum & Anlaşma</th>
                <th className={styles.rangeColHeader}>Ödeme Aralığı</th>
                {MONTH_NAMES_TR.map((mName) => (
                  <th key={mName} className={styles.monthHeader}>
                    {mName.substring(0, 3)}
                  </th>
                ))}
                <th className={styles.totalColHeader}>Yıllık Tahsilat</th>
                <th className={styles.actionsColHeader}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const currencySym = CURRENCY_SYMBOLS[client.currency] || '₺';

                // Calculate yearly total for this client
                let clientYearTotal = 0;
                for (let m = 1; m <= 12; m++) {
                  const ym = `${selectedYear}-${String(m).padStart(2, '0')}`;
                  const rec = client.records[ym];
                  if (rec) {
                    clientYearTotal += rec.installments.reduce((sum, inst) => sum + inst.amount, 0);
                  }
                }

                return (
                  <tr key={client.id} className={styles.clientRow}>
                    {/* Kurum Adı ve Detayı */}
                    <td className={styles.stickyCol}>
                      <div className={styles.clientCell}>
                        <div className={styles.clientCellMain}>
                          <span className={styles.clientCellName}>{client.name}</span>
                          <span className={styles.clientCellRetainer}>
                            {client.monthly_retainer.toLocaleString('tr-TR')} {currencySym}/ay
                          </span>
                        </div>
                        {client.contact_person && (
                          <span className={styles.clientContact}>
                            Yetkili: {client.contact_person}
                          </span>
                        )}
                        {client.notes && (
                          <span className={styles.clientNotes} title={client.notes}>
                            {client.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ödeme Aralığı */}
                    <td className={styles.rangeCell}>
                      <span className={styles.rangeBadge}>
                        Her ay {client.billing_start_day}-{client.billing_end_day} arası
                      </span>
                    </td>

                    {/* 12 Months Cells */}
                    {MONTH_NAMES_TR.map((_, mIdx) => {
                      const monthNum = mIdx + 1;
                      const ym = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
                      const record = client.records[ym];

                      const target = record ? record.target_amount : client.monthly_retainer;
                      const paid = record
                        ? record.installments.reduce((sum, inst) => sum + inst.amount, 0)
                        : 0;
                      const isFullyPaid = paid >= target && target > 0;
                      const isPartial = paid > 0 && paid < target;

                      // Check overdue
                      const isCurrentOrPastMonth =
                        selectedYear < today.getFullYear() ||
                        (selectedYear === today.getFullYear() && monthNum <= today.getMonth() + 1);

                      let isOverdue = false;
                      if (!isFullyPaid && isCurrentOrPastMonth && client.status === 'active') {
                        if (selectedYear < today.getFullYear() || monthNum < today.getMonth() + 1) {
                          isOverdue = true;
                        } else if (monthNum === today.getMonth() + 1 && today.getDate() > client.billing_end_day) {
                          isOverdue = true;
                        }
                      }

                      return (
                        <td
                          key={ym}
                          className={styles.monthCell}
                          onClick={() => handleOpenPayment(client, selectedYear, monthNum)}
                        >
                          <div
                            className={`${styles.statusPill} ${
                              isFullyPaid
                                ? styles.statusPaid
                                : isOverdue
                                ? styles.statusOverdue
                                : isPartial
                                ? styles.statusPartial
                                : styles.statusPending
                            }`}
                          >
                            {isFullyPaid && (
                              <>
                                <CheckCircle2 size={13} className={styles.statusIcon} />
                                <span>{paid.toLocaleString('tr-TR')}</span>
                              </>
                            )}
                            {isPartial && (
                              <>
                                <Clock size={13} className={styles.statusIcon} />
                                <span>
                                  {paid.toLocaleString('tr-TR')}/{target.toLocaleString('tr-TR')}
                                </span>
                              </>
                            )}
                            {isOverdue && !isPartial && (
                              <>
                                <AlertTriangle size={13} className={styles.statusIcon} />
                                <span>Gecikti</span>
                              </>
                            )}
                            {!isFullyPaid && !isPartial && !isOverdue && (
                              <span className={styles.pendingDot}>—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Yıllık Toplam */}
                    <td className={styles.totalCell}>
                      <span className={styles.yearlyTotalText}>
                        {clientYearTotal.toLocaleString('tr-TR')} {currencySym}
                      </span>
                    </td>

                    {/* İşlemler */}
                    <td className={styles.actionsCell}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.rowActionBtn}
                          onClick={() => {
                            setEditingClient(client);
                            setIsClientModalOpen(true);
                          }}
                          title="Kurumu Düzenle"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.rowActionBtn} ${styles.deleteActionBtn}`}
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          title="Kurumu Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={16} className={styles.emptyTable}>
                    <div className={styles.emptyState}>
                      <Building2 size={36} className={styles.emptyIcon} />
                      <p className={styles.emptyTitle}>Henüz kayıtlı kurum bulunmuyor</p>
                      <p className={styles.emptyDesc}>
                        Freelance müşterilerinizi ekleyerek aylık düzenli ödeme ve tahsilat takibine başlayın.
                      </p>
                      <button
                        type="button"
                        className={styles.addClientBtn}
                        onClick={() => {
                          setEditingClient(null);
                          setIsClientModalOpen(true);
                        }}
                      >
                        <Plus size={16} />
                        <span>İlk Kurumu Ekle</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom spacer for clean viewport breathing room */}
      <div className={styles.bottomSpacer} />

      {/* Client Modal */}
      {isClientModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
          }}
          onSave={handleSaveClient}
        />
      )}

      {/* Payment Record Modal */}
      {paymentModalData && activeClientInModal && (
        <PaymentRecordModal
          client={activeClientInModal}
          yearMonth={paymentModalData.yearMonth}
          todayStr={todayStr}
          onClose={() => setPaymentModalData(null)}
          onAddPayment={(amount, paidDate, note, method) => {
            localClientRepository.addPayment(
              activeClientInModal.id,
              paymentModalData.yearMonth,
              amount,
              paidDate,
              note,
              method
            );
            loadClients();
          }}
          onMarkFullPaid={() => {
            localClientRepository.markMonthFullyPaid(
              activeClientInModal.id,
              paymentModalData.yearMonth,
              todayStr
            );
            loadClients();
          }}
          onResetPayment={() => {
            localClientRepository.resetMonthPayment(
              activeClientInModal.id,
              paymentModalData.yearMonth
            );
            loadClients();
          }}
          onToggleInvoice={(invoiceNo) => {
            localClientRepository.toggleInvoiceStatus(
              activeClientInModal.id,
              paymentModalData.yearMonth,
              invoiceNo
            );
            loadClients();
          }}
        />
      )}
    </div>
  );
};
