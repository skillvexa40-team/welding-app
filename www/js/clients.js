import { db } from './db.js';

export const clients = {
  async addClient(clientData) {
    return await db.add('clients', {
      name: clientData.name,
      phone: clientData.phone || '',
      address: clientData.address || '',
      openingBalance: parseFloat(clientData.openingBalance) || 0,
      createdAt: new Date().toISOString()
    });
  },

  async getAllClients() {
    return await db.getAll('clients');
  },

  async getClient(id) {
    return await db.get('clients', id);
  }
};