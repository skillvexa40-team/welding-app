import { db } from './db.js';

export const expenses = {
  async addExpense(expData) {
    return await db.add('expenses', {
      shopId: expData.shopId,
      title: expData.title,
      amount: parseFloat(expData.amount),
      date: new Date().toISOString()
    });
  },

  async getAllExpenses(shopId) {
    return await db.getByIndex('expenses', 'shopId', shopId);
  }
};