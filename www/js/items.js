import { db } from './db.js';

export const items = {
  async addItem(itemData) {
    return await db.add('items', {
      name: itemData.name,
      category: itemData.category || 'General',
      unit: itemData.unit || 'Pcs',
      purchaseRate: parseFloat(itemData.purchaseRate) || 0,
      saleRate: parseFloat(itemData.saleRate) || 0,
      stock: parseFloat(itemData.stock) || 0,
      shopId: itemData.shopId,
      createdAt: new Date().toISOString()
    });
  },

  async getAllItems(shopId) {
    if (shopId) {
      return await db.getByIndex('items', 'shopId', shopId);
    }
    return await db.getAll('items');
  },

  async updateStock(itemId, newStock) {
    const item = await db.get('items', itemId);
    if (item) {
      item.stock = newStock;
      await db.put('items', item);
    }
  }
};