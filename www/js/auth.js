import { db } from './db.js';

export const auth = {
  async setPin(pin) {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    await db.put('settings', { key: 'user_pin', value: hashHex });
  },

  async verifyPin(pin) {
    const savedPinData = await db.get('settings', 'user_pin');
    if (!savedPinData) return false;

    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === savedPinData.value;
  },

  async isPinSet() {
    const savedPinData = await db.get('settings', 'user_pin');
    return !!savedPinData;
  }
};