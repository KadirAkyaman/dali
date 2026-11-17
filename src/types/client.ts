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
  currency: CurrencyCode;
  billing_start_day: number; // Ödeme başlangıç günü (örn: 1)
  billing_end_day: number; // Ödeme son günü (örn: 10)
  status: 'active' | 'paused' | 'archived';
  notes?: string | null;
  created_at: string;
  records: Record<string, MonthlyBillingRecord>; // key: "YYYY-MM"
}

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
