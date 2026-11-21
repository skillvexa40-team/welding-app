import { db } from './db.js';

export const payments = {
  async addPayment(clientId, amount, note) {
    // Payment record save karein
    await db.add('payments', {
      clientId: clientId,
      amount: parseFloat(amount),
      note: note,
      date: new Date().toISOString()
    });

    // Client ka udhar kam karein
    const client = await db.get('clients', clientId);
    if (client) {
      client.openingBalance = (client.openingBalance || 0) - parseFloat(amount);
      await db.put('clients', client);
    }
  },

  async getClientPayments(clientId) {
    const allPayments = await db.getAll('payments');
    return allPayments.filter(p => p.clientId === clientId);
  }
};