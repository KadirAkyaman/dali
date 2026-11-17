import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { OverdueAlert, CURRENCY_SYMBOLS } from '../../types/client';
import styles from './OverdueAlertBanner.module.css';

interface OverdueAlertBannerProps {
  alerts: OverdueAlert[];
  onOpenPaymentModal: (clientId: string, monthStr: string) => void;
}

export const OverdueAlertBanner: React.FC<OverdueAlertBannerProps> = ({ alerts, onOpenPaymentModal }) => {
  if (alerts.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.alertIconPulse}>
            <AlertTriangle size={18} />
          </div>
          <span className={styles.title}>Günü Geçen Ödeme Uyarıları ({alerts.length})</span>
        </div>
        <span className={styles.subtext}>
          Aşağıdaki kurumların belirlenen ödeme tarihi geçmiş olup bekleyen alacağınız bulunmaktadır:
        </span>
      </div>

      <div className={styles.alertList}>
        {alerts.map((alert) => {
          const sym = CURRENCY_SYMBOLS[alert.currency] || '₺';
          return (
            <div key={`${alert.client_id}-${alert.month_str}`} className={styles.alertCard}>
              <div className={styles.cardLeft}>
                <div className={styles.clientInfo}>
                  <strong className={styles.clientName}>{alert.client_name}</strong>
                  <span className={styles.monthTag}>{alert.month_name}</span>
                </div>
                <div className={styles.overdueDetails}>
                  <span className={styles.daysOverdue}>
                    <Clock size={13} /> {alert.days_overdue} gün gecikmede
                  </span>
                  <span className={styles.dateRule}>
                    (Ödeme Aralığı: Her ayın {alert.billing_start_day}-{alert.billing_end_day}. günleri)
                  </span>
                </div>
              </div>

              <div className={styles.cardRight}>
                <div className={styles.amountBox}>
                  <span className={styles.amountLabel}>Kalan Alacak:</span>
                  <span className={styles.amountVal}>
                    {alert.remaining_amount.toLocaleString('tr-TR')} {sym}
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => onOpenPaymentModal(alert.client_id, alert.month_str)}
                >
                  <span>Ödeme Girişi Yap</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
