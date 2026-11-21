import { db } from './db.js';

export const shops = {
  async addShop(name, address) {
    return await db.add('shops', { 
      name: name, 
      address: address, 
      createdAt: new Date().toISOString() 
    });
  },

  async getAllShops() {
    return await db.getAll('shops');
  },

  async getShop(id) {
    return await db.get('shops', id);
  }
};