import { auth } from './auth.js';
import { shops } from './shops.js';
import { items } from './items.js';
import { clients } from './clients.js';
import { jobs } from './jobs.js';
import { payments } from './payments.js';
import { employees } from './employees.js';
import { expenses } from './expenses.js';
import { db } from './db.js';

export const app = {
  currentPin: '',
  isSetupMode: false,
  activeShopId: null,
  jobTempMaterials: [],
  activeClientIdForPayment: null,
  allShopsData: [],
  
  searchClientTerm: '',
  searchJobTerm: '',
  currentLang: 'ur', // 'ur' ya 'en'

  async init() {
    const savedLang = localStorage.getItem('appLang');
    if (savedLang) this.currentLang = savedLang;
    this.applyLanguage();

    const pinExists = await auth.isPinSet();
    this.isSetupMode = !pinExists;
    if (!pinExists) this.renderLogin();
    else await this.checkShopSetup();
  },

  toggleLanguage() {
    this.currentLang = this.currentLang === 'ur' ? 'en' : 'ur';
    localStorage.setItem('appLang', this.currentLang);
    this.applyLanguage();
    document.getElementById('lang-btn-text').innerText = this.currentLang === 'ur' ? 'EN' : 'UR';
  },

  applyLanguage() {
    const isUrdu = this.currentLang === 'ur';
    document.documentElement.dir = isUrdu ? 'rtl' : 'ltr';
    document.body.className = `bg-gray-100 font-${isUrdu ? 'urdu' : 'english'}`;
    
    document.querySelectorAll('[data-lang-ur]').forEach(el => {
      el.innerText = isUrdu ? el.getAttribute('data-lang-ur') : el.getAttribute('data-lang-en');
    });

    document.querySelectorAll('[data-placeholder-ur]').forEach(el => {
      el.placeholder = isUrdu ? el.getAttribute('data-placeholder-ur') : el.getAttribute('data-placeholder-en');
    });
  },

  // --- FIXED VOICE SEARCH ---
  startVoiceSearch(inputId, callbackName) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return alert(this.currentLang === 'ur' ? "آپ کا براؤزر وائس سرچ کو سپورٹ نہیں کرتا۔" : "Browser does not support voice search.");
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Urdu aur English dono ke liye alag settings
    recognition.lang = this.currentLang === 'ur' ? 'ur-PK' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    alert(this.currentLang === 'ur' ? "بولیے... (Listening...)" : "Listening...");

    recognition.start();

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      document.getElementById(inputId).value = speechResult;
      
      // String callback ko function mein convert karein
      if (callbackName === 'filterClients') this.filterClients();
      if (callbackName === 'filterJobs') this.filterJobs();
    };

    recognition.onerror = (event) => {
      // Agar Urdu na pehchane to error handle karein
      if (event.error === 'no-speech' || event.error === 'language-not-supported') {
        alert(this.currentLang === 'ur' ? "آواز صاف نہیں آئی یا اردو سپورٹ نہیں کر رہا۔ دوبارہ کوشش کریں۔" : "Voice not clear or language not supported. Please try again.");
      } else {
        console.log("Speech error:", event.error);
      }
    };
  },

  async checkShopSetup() {
    this.allShopsData = await shops.getAllShops();
    if (this.allShopsData.length === 0) {
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('main-screen').classList.add('hidden');
      document.getElementById('shop-setup-screen').classList.remove('hidden');
    } else {
      this.activeShopId = this.allShopsData[0].id;
      this.renderLogin();
    }
  },

  renderLogin() {
    document.getElementById('login-title').innerText = this.isSetupMode ? (this.currentLang === 'ur' ? 'نیا پن کوڈ بنائیں' : 'Set New PIN') : (this.currentLang === 'ur' ? 'پن کوڈ درج کریں' : 'Enter PIN');
    document.getElementById('login-subtitle').innerText = this.isSetupMode ? (this.currentLang === 'ur' ? '4 ہندسوں کا سیکیورٹی پن بنائیں' : 'Create a 4-digit security PIN') : (this.currentLang === 'ur' ? 'اپنا 4 ہندسوں کا پن درج کریں' : 'Enter your 4-digit PIN');
    document.getElementById('shop-setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    this.currentPin = '';
    this.updateDots();
  },

  pressKey(num) {
    if (this.currentPin.length < 4) {
      this.currentPin += num;
      this.updateDots();
      if (this.currentPin.length === 4) setTimeout(() => this.handlePinComplete(), 200);
    }
  },

  clearKey() {
    this.currentPin = '';
    this.updateDots();
  },

  updateDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (i < this.currentPin.length) {
        dot.classList.add('bg-blue-600', 'scale-110');
        dot.classList.remove('bg-gray-300');
      } else {
        dot.classList.remove('bg-blue-600', 'scale-110');
        dot.classList.add('bg-gray-300');
      }
    }
  },

  async handlePinComplete() {
    if (this.isSetupMode) {
      await auth.setPin(this.currentPin);
      this.isSetupMode = false;
      await this.checkShopSetup();
    } else {
      const isValid = await auth.verifyPin(this.currentPin);
      if (isValid) this.showMainScreen();
      else {
        alert(this.currentLang === 'ur' ? 'غلط پن!' : 'Incorrect PIN!');
        this.clearKey();
      }
    }
  },

  async saveShop() {
    const name = document.getElementById('shop-name').value.trim();
    if (!name) return alert(this.currentLang === 'ur' ? 'دکان کا نام لکھنا ضروری ہے!' : 'Shop name is required!');
    await shops.addShop(name, document.getElementById('shop-address').value);
    document.getElementById('shop-name').value = '';
    document.getElementById('shop-address').value = '';
    alert(this.currentLang === 'ur' ? 'دکان محفوظ ہو گئی!' : 'Shop saved!');
    this.renderLogin();
  },

  showMainScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('shop-setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    this.updateHeaderShop();
    this.switchTab('home');
  },

  updateHeaderShop() {
    const activeShop = this.allShopsData.find(s => s.id === this.activeShopId);
    const shopNameEl = document.getElementById('header-shop-name');
    if (shopNameEl) shopNameEl.innerText = activeShop ? activeShop.name : 'Main Shop';
    
    const selector = document.getElementById('shop-switcher');
    if (selector) {
      selector.innerHTML = this.allShopsData.map(s => 
        `<option value="${s.id}" ${s.id === this.activeShopId ? 'selected' : ''}>${s.name}</option>`
      ).join('');
    }
  },

  switchShop(newShopId) {
    this.activeShopId = parseInt(newShopId);
    this.updateHeaderShop();
    this.switchTab('home');
  },

  async addNewShopFromSwitcher() {
    const name = prompt(this.currentLang === 'ur' ? "نئی دکان کا نام لکھیں:" : "Enter new shop name:");
    if (!name) return;
    await shops.addShop(name, '');
    this.allShopsData = await shops.getAllShops();
    this.updateHeaderShop();
    alert(this.currentLang === 'ur' ? 'نئی دکان شامل ہو گئی!' : 'New shop added!');
  },

  async switchTab(tabName) {
    ['home', 'inventory', 'jobs', 'clients', 'more'].forEach(t => document.getElementById('view-' + t).classList.add('hidden'));
    document.getElementById('view-' + tabName).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('text-blue-600');
      btn.classList.add('text-gray-400');
    });
    document.getElementById('nav-' + tabName).classList.remove('text-gray-400');
    document.getElementById('nav-' + tabName).classList.add('text-blue-600');

    if (tabName === 'home') await this.loadDashboardData();
    if (tabName === 'inventory') await this.loadInventoryData();
    if (tabName === 'clients') await this.loadClientsData();
    if (tabName === 'jobs') await this.loadJobsData();
    if (tabName === 'more') await this.loadMoreData();
  },

  async loadDashboardData() {
    const allJobs = await jobs.getAllJobs(this.activeShopId);
    const allItems = await items.getAllItems(this.activeShopId);
    const allClients = await clients.getAllClients();
    
    let totalUdhar = allClients.reduce((sum, c) => sum + (c.openingBalance || 0), 0);
    let pendingJobs = allJobs.filter(j => j.status !== 'Delivered').length;
    let lowStock = allItems.filter(i => i.stock <= 5).length;
    
    const today = new Date().toISOString().split('T')[0];
    let todaySales = allJobs.filter(j => j.createdAt.startsWith(today)).reduce((sum, j) => sum + j.totalAmount, 0);

    document.getElementById('dash-today-sales').innerText = `Rs. ${todaySales}`;
    document.getElementById('dash-total-udhar').innerText = `Rs. ${totalUdhar}`;
    document.getElementById('dash-pending-jobs').innerText = pendingJobs;
    document.getElementById('dash-low-stock').innerText = lowStock;
    
    const recentJobs = allJobs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const activityList = document.getElementById('dash-recent-activity');
    if (recentJobs.length === 0) {
      activityList.innerHTML = `<p class="text-sm text-gray-500">${this.currentLang === 'ur' ? 'کوئی حالیہ کام نہیں۔' : 'No recent activity.'}</p>`;
    } else {
      activityList.innerHTML = recentJobs.map(job => `
        <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
          <div>
            <p class="font-bold text-sm text-gray-800">${job.productType}</p>
            <p class="text-xs text-gray-500">${new Date(job.createdAt).toLocaleDateString()}</p>
          </div>
          <span class="font-bold text-sm text-green-600">+ Rs. ${job.totalAmount}</span>
        </div>
      `).join('');
    }
  },

  async loadInventoryData() {
    const itemList = document.getElementById('items-list');
    itemList.innerHTML = `<p class="text-center text-gray-500">${this.currentLang === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</p>`;
    const allItems = await items.getAllItems(this.activeShopId);
    if (allItems.length === 0) return itemList.innerHTML = `<p class="text-center text-gray-500">${this.currentLang === 'ur' ? 'کوئی مال نہیں ملا۔' : 'No items found.'}</p>`;
    itemList.innerHTML = allItems.map(item => `
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-3">
        <div>
          <h3 class="font-bold text-gray-800">${item.name}</h3>
          <p class="text-sm text-gray-500">${item.category} | Unit: ${item.unit}</p>
        </div>
        <div class="text-right">
          <p class="font-bold ${item.stock <= 5 ? 'text-red-500' : 'text-green-600'}">Stock: ${item.stock}</p>
          <p class="text-xs text-gray-500">Rate: Rs. ${item.saleRate}</p>
        </div>
      </div>
    `).join('');
  },

  async saveItem() {
    const name = document.getElementById('item-name').value.trim();
    if (!name) return alert(this.currentLang === 'ur' ? 'مال کا نام ضروری ہے!' : 'Item name required!');
    await items.addItem({
      name: name,
      category: document.getElementById('item-category').value || 'General',
      unit: document.getElementById('item-unit').value || 'Pcs',
      purchaseRate: document.getElementById('item-purchase-rate').value,
      saleRate: document.getElementById('item-sale-rate').value,
      stock: document.getElementById('item-stock').value,
      shopId: this.activeShopId
    });
    document.getElementById('item-name').value = '';
    document.getElementById('item-category').value = '';
    document.getElementById('item-unit').value = '';
    document.getElementById('item-purchase-rate').value = '';
    document.getElementById('item-sale-rate').value = '';
    document.getElementById('item-stock').value = '';
    await this.loadInventoryData();
  },

  filterClients() {
    this.searchClientTerm = document.getElementById('search-client').value.toLowerCase();
    this.loadClientsData();
  },

  async loadClientsData() {
    document.getElementById('client-payment-area').classList.add('hidden');
    const clientList = document.getElementById('clients-list');
    const allClients = await clients.getAllClients();
    const filteredClients = allClients.filter(c => c.name.toLowerCase().includes(this.searchClientTerm) || (c.phone && c.phone.includes(this.searchClientTerm)));

    if (filteredClients.length === 0) return clientList.innerHTML = `<p class="text-center text-gray-500">${this.currentLang === 'ur' ? 'کوئی گاہک نہیں ملا۔' : 'No clients found.'}</p>`;
    
    clientList.innerHTML = filteredClients.map(client => `
      <div onclick="app.openClientKhata(${client.id}, '${client.name}', ${client.openingBalance})" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 cursor-pointer hover:bg-gray-50">
        <div class="flex justify-between items-center">
          <div><h3 class="font-bold text-gray-800">${client.name}</h3><p class="text-sm text-gray-500">Phone: ${client.phone || 'N/A'}</p></div>
          <div class="text-right"><p class="text-xs text-gray-500">Udhar</p><p class="text-red-500 font-bold">Rs. ${client.openingBalance}</p></div>
        </div>
      </div>
    `).join('');
  },

  async openClientKhata(id, name, balance) {
    this.activeClientIdForPayment = id;
    document.getElementById('payment-client-name').innerText = name;
    document.getElementById('payment-client-balance').innerText = balance;
    document.getElementById('payment-amount').value = '';
    document.getElementById('client-payment-area').classList.remove('hidden');
    window.scrollTo(0, 0);

    const clientJobs = await jobs.getClientJobs(id);
    const historyList = document.getElementById('client-history-list');
    if (clientJobs.length === 0) {
      historyList.innerHTML = `<p class="text-xs text-gray-500">${this.currentLang === 'ur' ? 'ابھی تک کوئی کام نہیں کروایا۔' : 'No jobs yet.'}</p>`;
    } else {
      historyList.innerHTML = clientJobs.map(j => `
        <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
          <div><p class="font-bold text-gray-800">${j.productType} <span class="text-xs font-normal text-gray-500">(${j.status})</span></p><p class="text-xs text-gray-500">${new Date(j.createdAt).toLocaleDateString()}</p></div>
          <span class="font-bold text-red-500">Rs. ${j.totalAmount}</span>
        </div>
      `).join('');
    }
  },

  async receivePayment() {
    const amount = parseFloat(document.getElementById('payment-amount').value);
    if (!amount || amount <= 0) return alert(this.currentLang === 'ur' ? 'صحیح رقم درج کریں!' : 'Enter valid amount!');
    await payments.addPayment(this.activeClientIdForPayment, amount, 'Cash Received');
    alert(this.currentLang === 'ur' ? 'پیمنٹ وصول ہو گئی!' : 'Payment received!');
    await this.loadClientsData();
    document.getElementById('client-payment-area').classList.add('hidden');
  },

  async saveClient() {
    const name = document.getElementById('client-name').value.trim();
    if (!name) return alert(this.currentLang === 'ur' ? 'گاہک کا نام ضروری ہے!' : 'Client name required!');
    await clients.addClient({
      name: name,
      phone: document.getElementById('client-phone').value,
      address: document.getElementById('client-address').value,
      openingBalance: document.getElementById('client-balance').value
    });
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-address').value = '';
    document.getElementById('client-balance').value = '';
    await this.loadClientsData();
  },

  filterJobs() {
    this.searchJobTerm = document.getElementById('search-job').value.toLowerCase();
    this.loadJobsData();
  },

  async loadJobsData() {
    this.jobTempMaterials = [];
    this.renderTempMaterials();
    const allJobs = await jobs.getAllJobs(this.activeShopId);
    const jobList = document.getElementById('jobs-list');
    
    const filteredJobs = allJobs.filter(j => j.productType.toLowerCase().includes(this.searchJobTerm) || (j.vehicleType && j.vehicleType.toLowerCase().includes(this.searchJobTerm))).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filteredJobs.length === 0) jobList.innerHTML = `<p class="text-center text-gray-500">${this.currentLang === 'ur' ? 'کوئی کام نہیں ملا۔' : 'No jobs found.'}</p>`;
    else {
      jobList.innerHTML = filteredJobs.map(job => {
        let statusColor = 'bg-yellow-100 text-yellow-700';
        if (job.status === 'In Progress') statusColor = 'bg-blue-100 text-blue-700';
        if (job.status === 'Delivered') statusColor = 'bg-green-100 text-green-700';

        return `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
          <div class="flex justify-between items-start">
            <div><h3 class="font-bold text-gray-800">${job.productType}</h3><p class="text-xs text-gray-500">${new Date(job.createdAt).toLocaleDateString()}</p></div>
            <span class="${statusColor} text-xs px-2 py-1 rounded-full font-bold">${job.status}</span>
          </div>
          <div class="flex justify-between items-center mt-3 pt-3 border-t">
            <p class="font-bold text-blue-600">Rs. ${job.totalAmount}</p>
            <div class="flex gap-2">
              <select onchange="app.updateJobStatus(${job.id}, this.value)" class="text-xs border rounded px-2 py-1 bg-gray-50 outline-none">
                <option value="Pending" ${job.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="In Progress" ${job.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Delivered" ${job.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              </select>
              <button onclick="app.printReceipt(${job.id})" class="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-200">Print</button>
            </div>
          </div>
        </div>
      `}).join('');
    }
    
    const allClients = await clients.getAllClients();
    document.getElementById('job-client').innerHTML = `<option value="">${this.currentLang === 'ur' ? 'گاہک منتخب کریں' : 'Select Client'}</option>` + allClients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const allItems = await items.getAllItems(this.activeShopId);
    document.getElementById('job-material-item').innerHTML = `<option value="">${this.currentLang === 'ur' ? 'مال منتخب کریں' : 'Select Material'}</option>` + allItems.map(i => `<option value="${i.id}" data-rate="${i.saleRate}">${i.name} (Stock: ${i.stock})</option>`).join('');
  },

  async updateJobStatus(jobId, newStatus) {
    await jobs.updateStatus(jobId, newStatus);
    await this.loadJobsData();
  },

  addMaterialToJob() {
    const select = document.getElementById('job-material-item');
    const qtyInput = document.getElementById('job-material-qty');
    const itemId = select.value;
    const qty = parseFloat(qtyInput.value);
    if (!itemId || !qty || qty <= 0) return alert(this.currentLang === 'ur' ? 'مال اور مقدار منتخب کریں!' : 'Select material and quantity!');
    const selectedOption = select.options[select.selectedIndex];
    const itemName = selectedOption.text.split(' (')[0];
    const rate = parseFloat(selectedOption.getAttribute('data-rate'));
    const amount = qty * rate;
    this.jobTempMaterials.push({ itemId, itemName, qty, rate, amount });
    qtyInput.value = '';
    select.value = '';
    this.renderTempMaterials();
  },

  removeMaterialFromJob(index) {
    this.jobTempMaterials.splice(index, 1);
    this.renderTempMaterials();
  },

  renderTempMaterials() {
    const list = document.getElementById('job-materials-list');
    if (this.jobTempMaterials.length === 0) {
      list.innerHTML = `<p class="text-xs text-gray-400 text-center">${this.currentLang === 'ur' ? 'کوئی مال شامل نہیں کیا گیا۔' : 'No material added.'}</p>`;
      document.getElementById('job-total-material').innerText = '0';
      return;
    }
    let total = 0;
    list.innerHTML = this.jobTempMaterials.map((m, index) => {
      total += m.amount;
      return `<div class="flex justify-between items-center bg-gray-50 p-2 rounded border mb-2 text-sm"><div><span class="font-bold">${m.itemName}</span> (${m.qty})</div><div class="flex items-center space-x-2 space-x-reverse"><span class="font-bold text-blue-600">Rs. ${m.amount}</span><button onclick="app.removeMaterialFromJob(${index})" class="text-red-500">&times;</button></div></div>`;
    }).join('');
    document.getElementById('job-total-material').innerText = total;
  },

  async saveJob() {
    const clientId = document.getElementById('job-client').value;
    const vehicleType = document.getElementById('job-vehicle').value;
    const productType = document.getElementById('job-product').value.trim();
    const labourCharge = parseFloat(document.getElementById('job-labour').value) || 0;
    if (!clientId || !productType) return alert(this.currentLang === 'ur' ? 'گاہک اور کام کا نام ضروری ہے!' : 'Client and job name required!');

    const totalMaterialCost = this.jobTempMaterials.reduce((sum, m) => sum + m.amount, 0);
    const totalAmount = totalMaterialCost + labourCharge;

    await jobs.addJob({
      shopId: this.activeShopId,
      clientId: clientId,
      vehicleType: vehicleType,
      productType: productType,
      labourCharge: labourCharge,
      totalMaterialCost: totalMaterialCost,
      totalAmount: totalAmount,
      materials: this.jobTempMaterials
    });

    document.getElementById('job-vehicle').value = '';
    document.getElementById('job-product').value = '';
    document.getElementById('job-labour').value = '';
    this.jobTempMaterials = [];
    this.renderTempMaterials();
    alert(this.currentLang === 'ur' ? 'کام محفوظ ہو گیا اور ادھار میں شامل ہو گیا!' : 'Job saved and added to credit!');
    await this.loadJobsData();
  },

  async printReceipt(jobId) {
    const data = await jobs.getJobDetails(jobId);
    if (!data) return alert('Job details not found!');

    const { job, client, shop, materials } = data;
    const receiptDiv = document.getElementById('print-receipt');

    let materialsHtml = materials.map(m => `
      <tr><td class="py-1">${m.itemName}</td><td class="text-center py-1">${m.qty}</td><td class="text-right py-1">${m.rate}</td><td class="text-right py-1">${m.amount}</td></tr>
    `).join('');

    receiptDiv.innerHTML = `
      <div class="text-center mb-4 border-b border-dashed border-gray-400 pb-2">
        <h2 class="text-xl font-bold uppercase">${shop ? shop.name : 'Welding Shop'}</h2>
        <p class="text-xs">${shop ? shop.address : ''}</p>
      </div>
      <div class="text-sm mb-3">
        <p><span class="font-bold">Date:</span> ${new Date(job.createdAt).toLocaleDateString()}</p>
        <p><span class="font-bold">Client:</span> ${client ? client.name : 'Unknown'}</p>
        <p><span class="font-bold">Kaam:</span> ${job.productType}</p>
        ${job.vehicleType ? `<p><span class="font-bold">Gaari:</span> ${job.vehicleType}</p>` : ''}
      </div>
      <table class="w-full text-sm mb-3">
        <thead><tr class="border-b border-gray-400"><th class="text-left py-1">Item</th><th class="text-center py-1">Qty</th><th class="text-right py-1">Rate</th><th class="text-right py-1">Amt</th></tr></thead>
        <tbody>${materialsHtml}</tbody>
      </table>
      <div class="border-t border-dashed border-gray-400 pt-2 text-sm space-y-1">
        <div class="flex justify-between"><span>Material Total:</span><span>Rs. ${job.totalMaterialCost}</span></div>
        <div class="flex justify-between"><span>Mazdoori:</span><span>Rs. ${job.labourCharge}</span></div>
        <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-400"><span>Total:</span><span>Rs. ${job.totalAmount}</span></div>
      </div>
      <div class="text-center text-xs mt-6"><p>Shukriya! Dobara tashreef laayen.</p></div>
    `;
    window.print();
  },

  async generateReport() {
    const month = document.getElementById('report-month').value;
    const year = document.getElementById('report-year').value;
    if (!month || !year) return alert("Select month and year!");

    const allJobs = await jobs.getAllJobs(this.activeShopId);
    const allExps = await expenses.getAllExpenses(this.activeShopId);
    const allEmps = await employees.getAllEmployees(this.activeShopId);

    const filteredJobs = allJobs.filter(j => {
      const d = new Date(j.createdAt);
      return d.getMonth() == (month - 1) && d.getFullYear() == year;
    });

    const filteredExps = allExps.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() == (month - 1) && d.getFullYear() == year;
    });

    let totalSales = filteredJobs.reduce((sum, j) => sum + j.totalAmount, 0);
    let totalExp = filteredExps.reduce((sum, e) => sum + e.amount, 0);
    let totalSalaries = allEmps.reduce((sum, emp) => sum + (emp.salaryMonthly || 0), 0);
    let netProfit = totalSales - totalExp - totalSalaries;

    document.getElementById('report-total-sales').innerText = `Rs. ${totalSales}`;
    document.getElementById('report-total-expenses').innerText = `Rs. ${totalExp}`;
    document.getElementById('report-total-salaries').innerText = `Rs. ${totalSalaries}`;
    
    const profitEl = document.getElementById('report-net-profit');
    profitEl.innerText = `Rs. ${netProfit}`;
    if (netProfit >= 0) {
      profitEl.classList.remove('text-red-600');
      profitEl.classList.add('text-green-600');
    } else {
      profitEl.classList.remove('text-green-600');
      profitEl.classList.add('text-red-600');
    }

    document.getElementById('report-results').classList.remove('hidden');
  },

  printReport() {
    const reportHtml = document.getElementById('report-results').innerHTML;
    const receiptDiv = document.getElementById('print-receipt');
    receiptDiv.innerHTML = `
      <div class="text-center mb-4 border-b pb-2">
        <h2 class="text-xl font-bold uppercase">Monthly Report</h2>
        <p class="text-xs">${document.getElementById('report-month').options[document.getElementById('report-month').selectedIndex].text} ${document.getElementById('report-year').value}</p>
      </div>
      <div class="text-base space-y-2 mt-4">
        ${reportHtml.replace(/bg-gray-50 p-3 rounded-lg border/g, '')}
      </div>
      <div class="text-center text-xs mt-6"><p>Generated by Welding App</p></div>
    `;
    window.print();
  },

  async loadMoreData() {
    const empList = document.getElementById('employees-list');
    empList.innerHTML = `<p class="text-center text-gray-500 text-sm mb-4">${this.currentLang === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</p>`;
    const allEmps = await employees.getAllEmployees(this.activeShopId);
    if (allEmps.length === 0) empList.innerHTML = `<p class="text-center text-gray-500 text-sm mb-4">${this.currentLang === 'ur' ? 'کوئی کاریگر نہیں ملا۔' : 'No employees found.'}</p>`;
    else {
      empList.innerHTML = allEmps.map(emp => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
          <h3 class="font-bold text-gray-800">${emp.name}</h3>
          <p class="text-sm text-gray-500">${emp.designation}</p>
          <div class="flex justify-between mt-2 pt-2 border-t"><p class="text-xs text-gray-600">Salary: Rs. ${emp.salaryMonthly}</p><p class="text-xs text-gray-600">Weekly: Rs. ${emp.weeklyKharcha}</p></div>
        </div>
      `).join('');
    }

    const expList = document.getElementById('expenses-list');
    expList.innerHTML = `<p class="text-center text-gray-500 text-sm mb-4">${this.currentLang === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</p>`;
    const allExps = await expenses.getAllExpenses(this.activeShopId);
    if (allExps.length === 0) expList.innerHTML = `<p class="text-center text-gray-500 text-sm">${this.currentLang === 'ur' ? 'کوئی خرچہ نہیں ملا۔' : 'No expenses found.'}</p>`;
    else {
      expList.innerHTML = allExps.map(exp => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex justify-between items-center">
          <div><h3 class="font-bold text-gray-800">${exp.title}</h3><p class="text-xs text-gray-500">${new Date(exp.date).toLocaleDateString()}</p></div>
          <p class="font-bold text-red-500">- Rs. ${exp.amount}</p>
        </div>
      `).join('');
    }
  },

  async saveEmployee() {
    const name = document.getElementById('emp-name').value.trim();
    if (!name) return alert(this.currentLang === 'ur' ? 'کاریگر کا نام لکھیں!' : 'Enter employee name!');
    await employees.addEmployee({
      shopId: this.activeShopId,
      name: name,
      phone: document.getElementById('emp-phone').value,
      designation: document.getElementById('emp-designation').value,
      salaryMonthly: document.getElementById('emp-salary').value,
      weeklyKharcha: document.getElementById('emp-weekly').value
    });
    document.getElementById('emp-name').value = '';
    document.getElementById('emp-phone').value = '';
    document.getElementById('emp-salary').value = '';
    document.getElementById('emp-weekly').value = '';
    await this.loadMoreData();
  },

  async saveExpense() {
    const title = document.getElementById('exp-title').value.trim();
    const amount = document.getElementById('exp-amount').value;
    if (!title || !amount) return alert(this.currentLang === 'ur' ? 'خرچے کی تفصیل اور رقم لکھیں!' : 'Enter expense details and amount!');
    await expenses.addExpense({
      shopId: this.activeShopId,
      title: title,
      amount: amount
    });
    document.getElementById('exp-title').value = '';
    document.getElementById('exp-amount').value = '';
    await this.loadMoreData();
  },

  async exportData() {
    const data = {
      shops: await db.getAll('shops'), items: await db.getAll('items'), clients: await db.getAll('clients'),
      jobs: await db.getAll('jobs'), job_materials: await db.getAll('job_materials'), payments: await db.getAll('payments'),
      employees: await db.getAll('employees'), expenses: await db.getAll('expenses'), settings: await db.getAll('settings')
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "welding_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        for (const [storeName, records] of Object.entries(data)) {
          if (records.length > 0) {
            await db.clear(storeName);
            for (const record of records) { await db.put(storeName, record); }
          }
        }
        alert('Data restored successfully! App will reload.');
        location.reload();
      } catch (err) {
        alert('Invalid file format!');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }
};

window.app = app;