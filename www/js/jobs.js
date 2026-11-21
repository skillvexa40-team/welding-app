import { db } from './db.js';

export const jobs = {
  async addJob(jobData) {
    const jobId = await db.add('jobs', {
      shopId: jobData.shopId,
      clientId: jobData.clientId,
      vehicleType: jobData.vehicleType || '',
      productType: jobData.productType,
      labourCharge: parseFloat(jobData.labourCharge) || 0,
      totalMaterialCost: parseFloat(jobData.totalMaterialCost) || 0,
      totalAmount: parseFloat(jobData.totalAmount) || 0,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    for (const material of jobData.materials) {
      await db.add('job_materials', {
        jobId: jobId,
        itemId: material.itemId,
        itemName: material.itemName,
        qty: material.qty,
        rate: material.rate,
        amount: material.amount
      });

      const item = await db.get('items', material.itemId);
      if (item) {
        item.stock = item.stock - material.qty;
        await db.put('items', item);
      }
    }

    const client = await db.get('clients', jobData.clientId);
    if (client) {
      client.openingBalance = (client.openingBalance || 0) + parseFloat(jobData.totalAmount);
      await db.put('clients', client);
    }
    
    return jobId;
  },

  async getAllJobs(shopId) {
    return await db.getByIndex('jobs', 'shopId', shopId);
  },

  async getClientJobs(clientId) {
    const allJobs = await db.getAll('jobs');
    return allJobs.filter(j => j.clientId === clientId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async updateStatus(jobId, newStatus) {
    const job = await db.get('jobs', jobId);
    if (job) {
      job.status = newStatus;
      await db.put('jobs', job);
    }
  },

  async getJobDetails(jobId) {
    const job = await db.get('jobs', jobId);
    if (!job) return null;

    const client = await db.get('clients', job.clientId);
    const shop = await db.get('shops', job.shopId);
    
    const allMaterials = await db.getAll('job_materials');
    const materials = allMaterials.filter(m => m.jobId === jobId);

    return { job, client, shop, materials };
  }
};