export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export interface PaymentInstallment {
  id: string;
  amount: number;
  paid_date: string; // YYYY-MM-DD
  note?: string | null;
  method?: string | null; // Havale/EFT, Kredi Kartı, Nakit vb.
}

export interface MonthlyBillingRecord {
  month: number; // 1 - 12
  year: number;
  target_amount: number;
  is_collection_incomplete?: boolean;
  remaining_amount?: number;
  installments: PaymentInstallment[];
  is_invoiced?: boolean; // Fatura kesildi mi?
  invoice_number?: string | null;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  custom_notes?: string | null;
}

export interface Client {
  id: string;
  name: string; // Kurum / Müşteri Adı
  contact_person?: string | null; // İlgili Kişi / Yetkili
  email?: string | null;
  phone?: string | null;
  monthly_retainer: number; // Aylık Hizmet Bedeli
  is_variable_fee?: boolean; // Aylık ücret önceden sabit değil
  fee_tracking_started_at?: string; // Ücret modelinin geçerlilik başlangıcı
  currency: CurrencyCode;
  billing_start_day: number; // Ödeme başlangıç günü (örn: 1)
  billing_end_day: number; // Ödeme son günü (örn: 10)
  status: 'active' | 'paused' | 'archived';
  notes?: string | null;
  created_at: string;
  records: Record<string, MonthlyBillingRecord>; // key: "YYYY-MM"
}

export const getFirstBillingPeriod = (client: Pick<Client, 'created_at' | 'fee_tracking_started_at'>) => {
  const createdAt = new Date(client.fee_tracking_started_at || client.created_at);
  const nextMonth = createdAt.getMonth() + 2;
  return nextMonth > 12
    ? { year: createdAt.getFullYear() + 1, month: 1 }
    : { year: createdAt.getFullYear(), month: nextMonth };
};

export interface OverdueAlert {
  client_id: string;
  client_name: string;
  month_str: string; // "2026-11"
  month_name: string; // "Kasım 2026"
  target_amount: number;
  paid_amount: number;
  remaining_amount: number;
  currency: CurrencyCode;
  billing_start_day: number;
  billing_end_day: number;
  days_overdue: number;
  amount_unknown?: boolean;
}

export const MONTH_NAMES_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;
