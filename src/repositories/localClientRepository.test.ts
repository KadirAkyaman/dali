import { describe, it, expect, beforeEach } from 'vitest';
import { localClientRepository } from './localClientRepository';

describe('LocalClientRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial default clients', () => {
    const clients = localClientRepository.getClients();
    expect(clients.length).toBeGreaterThan(0);
    expect(clients.some((c) => c.name.includes('Acme'))).toBe(true);
  });

  it('should create a new client with payment schedule', () => {
    const newClient = localClientRepository.createClient({
      name: 'Yenilikçi Yazılım A.Ş.',
      contact_person: 'Ahmet Yılmaz',
      monthly_retainer: 50000,
      currency: 'TRY',
      billing_start_day: 1,
      billing_end_day: 5,
      status: 'active',
      notes: 'Frontend ve mobil uygulama danışmanlığı',
    });

    expect(newClient.id).toBeDefined();
    expect(newClient.name).toBe('Yenilikçi Yazılım A.Ş.');
    expect(newClient.billing_start_day).toBe(1);
    expect(newClient.billing_end_day).toBe(5);

    const retrieved = localClientRepository.getClientById(newClient.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.monthly_retainer).toBe(50000);
  });

  it('should add partial payments (installments) to a month', () => {
    const client = localClientRepository.createClient({
      name: 'Test Ajans',
      monthly_retainer: 30000,
      currency: 'TRY',
      billing_start_day: 1,
      billing_end_day: 10,
      status: 'active',
    });

    // 1st installment: 15.000 TL
    const afterFirst = localClientRepository.addPayment(
      client.id,
      '2026-11',
      15000,
      '2026-11-05',
      'İlk taksit',
      'Havale'
    );

    const novRecord = afterFirst.records['2026-11'];
    expect(novRecord).toBeDefined();
    expect(novRecord.installments.length).toBe(1);
    expect(novRecord.installments[0].amount).toBe(15000);
    expect(novRecord.status).toBe('partial');

    // 2nd installment: 15.000 TL
    const afterSecond = localClientRepository.addPayment(
      client.id,
      '2026-11',
      15000,
      '2026-11-08',
      'Kalan bakiye',
      'EFT'
    );

    const finalRecord = afterSecond.records['2026-11'];
    expect(finalRecord.installments.length).toBe(2);
    expect(finalRecord.status).toBe('paid');
  });

  it('should mark month fully paid with 1-click', () => {
    const client = localClientRepository.createClient({
      name: 'Hızlı Ödeyen Müşteri',
      monthly_retainer: 25000,
      currency: 'TRY',
      billing_start_day: 1,
      billing_end_day: 10,
      status: 'active',
    });

    const updated = localClientRepository.markMonthFullyPaid(client.id, '2026-12', '2026-12-01');
    const decRecord = updated.records['2026-12'];

    expect(decRecord.status).toBe('paid');
    const totalPaid = decRecord.installments.reduce((sum, i) => sum + i.amount, 0);
    expect(totalPaid).toBe(25000);
  });

  it('should correctly calculate overdue alerts when day passes billing_end_day', () => {
    // Client has billing between day 1 and 5
    const client = localClientRepository.createClient({
      name: 'Geciken Kurum',
      monthly_retainer: 40000,
      currency: 'TRY',
      billing_start_day: 1,
      billing_end_day: 5,
      status: 'active',
    });

    // Today is 2026-11-17 (day 17 > billing_end_day 5), and nothing paid yet
    const alerts = localClientRepository.getOverdueAlerts('2026-11-17');
    const clientAlert = alerts.find((a) => a.client_id === client.id);

    expect(clientAlert).toBeDefined();
    expect(clientAlert?.remaining_amount).toBe(40000);
    expect(clientAlert?.days_overdue).toBe(12); // 17 - 5 = 12 days
  });

  it('should toggle invoice status', () => {
    const client = localClientRepository.createClient({
      name: 'Faturalı Kurum',
      monthly_retainer: 20000,
      currency: 'TRY',
      billing_start_day: 1,
      billing_end_day: 15,
      status: 'active',
    });

    const invoiced = localClientRepository.toggleInvoiceStatus(client.id, '2026-11', 'FAT-00123');
    expect(invoiced.records['2026-11'].is_invoiced).toBe(true);
    expect(invoiced.records['2026-11'].invoice_number).toBe('FAT-00123');

    const unInvoiced = localClientRepository.toggleInvoiceStatus(client.id, '2026-11');
    expect(unInvoiced.records['2026-11'].is_invoiced).toBe(false);
  });
});
