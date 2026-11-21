import { db } from './db.js';

export const employees = {
  async addEmployee(empData) {
    return await db.add('employees', {
      shopId: empData.shopId,
      name: empData.name,
      phone: empData.phone || '',
      designation: empData.designation || 'Karigar',
      salaryMonthly: parseFloat(empData.salaryMonthly) || 0,
      weeklyKharcha: parseFloat(empData.weeklyKharcha) || 0,
      createdAt: new Date().toISOString()
    });
  },

  async getAllEmployees(shopId) {
    return await db.getByIndex('employees', 'shopId', shopId);
  }
};