import { Client, MonthlyBillingRecord, PaymentInstallment, OverdueAlert, MONTH_NAMES_TR, getFirstBillingPeriod } from '../types/client';

const STORAGE_KEY = 'dali_clients';
const LEGACY_DEMO_CLIENT_IDS = new Set(['client-acme', 'client-lumina']);

const DEFAULT_CLIENTS: Client[] = [];

export class LocalClientRepository {
  getClients(): Client[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const clients = parsed.filter((client: Client) => !LEGACY_DEMO_CLIENT_IDS.has(client.id));
          if (clients.length !== parsed.length) this.saveClients(clients);
          return clients;
        }
      }
      const initial = JSON.parse(JSON.stringify(DEFAULT_CLIENTS));
      this.saveClients(initial);
      return initial;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_CLIENTS));
    }
  }

  getClientById(id: string): Client | undefined {
    return this.getClients().find((c) => c.id === id);
  }

  saveClients(clients: Client[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error('Kurumlar kaydedilemedi:', e);
    }
  }

  createClient(
    data: Omit<Client, 'id' | 'created_at' | 'records'>
  ): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      records: {},
    };
    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  }

  updateClient(id: string, updates: Partial<Client>): Client {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Client ${id} not found`);
    }
    const updated = { ...clients[index], ...updates };
    clients[index] = updated;
    this.saveClients(clients);
    return updated;
  }

  deleteClient(id: string): boolean {
    const clients = this.getClients();
    const filtered = clients.filter((c) => c.id !== id);
    if (filtered.length === clients.length) return false;
    this.saveClients(filtered);
    return true;
  }

  // Parçalı veya tam ödeme ekleme
  addPayment(
    clientId: string,
    yearMonth: string,
    amount: number,
    paidDate: string,
    note?: string,
    method?: string
  ): Client {
    const clients = this.getClients();
    const client = clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Client not found');

    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const existingRecord: MonthlyBillingRecord = client.records[yearMonth] || {
      month,
      year,
      target_amount: client.monthly_retainer,
      installments: [],
      status: 'pending',
    };

    const newInstallment: PaymentInstallment = {
      id: `pay-${Date.now()}`,
      amount,
      paid_date: paidDate,
      note: note || null,
      method: method || null,
    };

    const updatedInstallments = [...existingRecord.installments, newInstallment];
    const totalPaid = updatedInstallments.reduce((sum, i) => sum + i.amount, 0);

    let nextStatus: MonthlyBillingRecord['status'] = 'pending';
    if (totalPaid >= existingRecord.target_amount) {
      nextStatus = 'paid';
    } else if (totalPaid > 0) {
      nextStatus = 'partial';
    }

    client.records[yearMonth] = {
      ...existingRecord,
      installments: updatedInstallments,
      status: nextStatus,
    };

    this.saveClients(clients);
    return client;
  }

  // Tek tıkla tam ödendi olarak işaretleme (Hızlı Tik)
  markMonthFullyPaid(clientId: string, yearMonth: string, todayStr: string): Client {
    const clients = this.getClients();
    const client = clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Client not found');

    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const existing = client.records[yearMonth] || {
      month,
      year,
      target_amount: client.monthly_retainer,
      installments: [],
      status: 'pending',
    };

    const currentPaid = existing.installments.reduce((sum, i) => sum + i.amount, 0);
    const remainder = Math.max(0, existing.target_amount - currentPaid);

    if (remainder > 0) {
      existing.installments.push({
        id: `pay-${Date.now()}`,
        amount: remainder,
        paid_date: todayStr,
        note: 'Tam ödeme tahsil edildi',
        method: 'Havale/EFT',
      });
    }

    existing.status = 'paid';
    client.records[yearMonth] = existing;

    this.saveClients(clients);
    return client;
  }

  // Ödeme kaydını sıfırlama / geri alma
  resetMonthPayment(clientId: string, yearMonth: string): Client {
    const clients = this.getClients();
    const client = clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Client not found');

    if (client.records[yearMonth]) {
      client.records[yearMonth].installments = [];
      client.records[yearMonth].status = 'pending';
    }

    this.saveClients(clients);
    return client;
  }

  saveMonthNotes(clientId: string, yearMonth: string, notes: string): Client {
    const clients = this.getClients();
    const client = clients.find((item) => item.id === clientId);
    if (!client) throw new Error('Client not found');
    const [year, month] = yearMonth.split('-').map(Number);
    const record = client.records[yearMonth] || {
      month,
      year,
      target_amount: client.monthly_retainer,
      installments: [],
      status: 'pending' as const,
    };
    record.custom_notes = notes.trim() || null;
    client.records[yearMonth] = record;
    this.saveClients(clients);
    return client;
  }

  // Fatura kesildi durumunu güncelleme
  toggleInvoiceStatus(clientId: string, yearMonth: string, invoiceNumber?: string): Client {
    const clients = this.getClients();
    const client = clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Client not found');

    const [yearStr, monthStr] = yearMonth.split('-');
    const existing = client.records[yearMonth] || {
      month: parseInt(monthStr, 10),
      year: parseInt(yearStr, 10),
      target_amount: client.monthly_retainer,
      installments: [],
      status: 'pending',
    };

    const nextState = !existing.is_invoiced;
    existing.is_invoiced = nextState;
    if (invoiceNumber !== undefined) {
      existing.invoice_number = invoiceNumber || null;
    }

    client.records[yearMonth] = existing;
    this.saveClients(clients);
    return client;
  }

  // Günü geçen ödemeleri hesapla ve uyarı listesi oluştur
  getOverdueAlerts(todayStr: string): OverdueAlert[] {
    const clients = this.getClients().filter((c) => c.status === 'active');
    const alerts: OverdueAlert[] = [];

    const today = new Date(`${todayStr}T12:00:00`);
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;

    clients.forEach((client) => {
      const firstBillingPeriod = getFirstBillingPeriod(client);
      let year = firstBillingPeriod.year;
      let month = firstBillingPeriod.month;
      while (year < currentYear || (year === currentYear && month <= currentMonthNum)) {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        const record = client.records[key];
        const target = record?.target_amount ?? client.monthly_retainer;
        const paid = record?.installments.reduce((sum, item) => sum + item.amount, 0) ?? 0;
        const monthEnd = new Date(year, month, 0).getDate();
        const dueDay = Math.min(client.billing_end_day, monthEnd);
        const dueDate = new Date(year, month - 1, dueDay, 12);
        const remaining = Math.max(0, target - paid);
        if (dueDate < today && remaining > 0) {
          alerts.push({
            client_id: client.id,
            client_name: client.name,
            month_str: key,
            month_name: `${MONTH_NAMES_TR[month - 1]} ${year}`,
            target_amount: target,
            paid_amount: paid,
            remaining_amount: remaining,
            currency: client.currency,
            billing_start_day: client.billing_start_day,
            billing_end_day: client.billing_end_day,
            days_overdue: Math.floor((today.getTime() - dueDate.getTime()) / 86400000),
          });
        }
        month++;
        if (month > 12) { month = 1; year++; }
      }
    });

    return alerts;
  }
}

export const localClientRepository = new LocalClientRepository();
