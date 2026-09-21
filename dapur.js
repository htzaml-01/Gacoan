document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------------------------
  // Audio Alert for New Paid Orders in Kitchen (Web Audio API)
  // ----------------------------------------------------------------------
  const playKitchenBell = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Double bell ring: G5, C6
      const notes = [783.99, 1046.50];
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.75);
      });
    } catch (e) {
      console.warn('Audio alert not allowed:', e);
    }
  };

  // ----------------------------------------------------------------------
  // Database & Real-Time Sync Channel
  // ----------------------------------------------------------------------
  const DB_ORDERS_KEY = 'gacoan_orders_database';

  const DEFAULT_DEMO_ORDERS = [
    {
      orderId: 'ORD-1789950001',
      queueNumber: 'A-001',
      customerName: 'Budi Santoso',
      tableInfo: 'Meja 01',
      diningType: 'Dine In',
      paymentMethod: 'Cash (Bayar di Kasir)',
      items: [
        { id: 'mie-gacoan', title: 'Mie Gacoan', price: 10000, unitPrice: 10000, qty: 2, level: 'LEVEL 2', notes: 'Pedas sedang', total: 20000 },
        { id: 'udang-keju', title: 'Udang Keju', price: 9500, unitPrice: 9500, qty: 1, level: null, notes: '', total: 9500 },
        { id: 'es-gobak-sodor', title: 'Es Gobak Sodor', price: 9000, unitPrice: 9000, qty: 2, level: null, notes: 'Manis sedang', total: 18000 }
      ],
      subtotal: 47500,
      tax: 4750,
      grandTotal: 52250,
      cashPaid: 0,
      cashChange: 0,
      status: 'MENUNGGU_BAYAR',
      createdAt: new Date(Date.now() - 3600000).toLocaleDateString('id-ID') + ' 18:30',
      timestamp: Date.now() - 3600000
    },
    {
      orderId: 'ORD-1789950002',
      queueNumber: 'A-002',
      customerName: 'Siti Rahma',
      tableInfo: 'Meja 03',
      diningType: 'Dine In',
      paymentMethod: 'QRIS (GacoanPay / Midtrans)',
      items: [
        { id: 'mie-hompimpa', title: 'Mie Hompimpa', price: 10000, unitPrice: 10000, qty: 1, level: 'LEVEL 1', notes: 'Asin gurih', total: 10000 },
        { id: 'siomay', title: 'Siomay', price: 9500, unitPrice: 9500, qty: 1, level: null, notes: '', total: 9500 },
        { id: 'es-teh', title: 'Es Teh Manis', price: 4500, unitPrice: 4500, qty: 1, level: null, notes: '', total: 4500 }
      ],
      subtotal: 24000,
      tax: 2400,
      grandTotal: 26400,
      cashPaid: 26400,
      cashChange: 0,
      status: 'LUNAS',
      createdAt: new Date(Date.now() - 1800000).toLocaleDateString('id-ID') + ' 19:15',
      timestamp: Date.now() - 1800000
    },
    {
      orderId: 'ORD-1789950003',
      queueNumber: 'A-003',
      customerName: 'Dimas Pratama',
      tableInfo: 'Take Away',
      diningType: 'Take Away',
      paymentMethod: 'Midtrans Snap (GoPay)',
      items: [
        { id: 'mie-gacoan', title: 'Mie Gacoan', price: 10000, unitPrice: 10000, qty: 3, level: 'LEVEL 3', notes: '', total: 30000 },
        { id: 'udang-rambutan', title: 'Udang Rambutan', price: 9500, unitPrice: 9500, qty: 2, level: null, notes: 'Garing crispy', total: 19000 }
      ],
      subtotal: 49000,
      tax: 4900,
      grandTotal: 53900,
      cashPaid: 53900,
      cashChange: 0,
      status: 'SEDANG_DIMASAK',
      createdAt: new Date(Date.now() - 900000).toLocaleDateString('id-ID') + ' 19:30',
      timestamp: Date.now() - 900000
    },
    {
      orderId: 'RSV-2001',
      reservationId: 'RSV-2001',
      queueNumber: 'RSV-2001',
      customerName: 'Acara Ultah Jessica',
      phone: '081234567890',
      eventDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      eventTime: '18:30',
      tableNumbers: ['Meja 05', 'Meja 06'],
      tableInfo: 'Meja 05, Meja 06',
      seats: 8,
      diningType: 'RESERVASI',
      paymentMethod: 'Cashless (Midtrans)',
      items: [
        { id: 'mie-gacoan', title: 'Mie Gacoan', price: 10000, unitPrice: 10000, qty: 8, total: 80000 },
        { id: 'udang-keju', title: 'Udang Keju', price: 9500, unitPrice: 9500, qty: 5, total: 47500 },
        { id: 'es-gobak-sodor', title: 'Es Gobak Sodor', price: 9000, unitPrice: 9000, qty: 8, total: 72000 }
      ],
      subtotal: 199500,
      tax: 19950,
      grandTotal: 219450,
      dpPaid: 109725,
      dpOption: '50%',
      remainingBalance: 109725,
      status: 'DP_LUNAS',
      createdAt: new Date().toLocaleDateString('id-ID') + ' 17:00',
      timestamp: Date.now()
    }
  ];

  let posChannel = null;
  try {
    posChannel = new BroadcastChannel('gacoan_pos_channel');
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }

  const getOrders = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(DB_ORDERS_KEY));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(DEFAULT_DEMO_ORDERS));
    return DEFAULT_DEMO_ORDERS;
  };

  const saveOrders = (orders) => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(DEFAULT_DEMO_ORDERS));
    } else {
      localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
    }
    if (posChannel) {
      posChannel.postMessage({ type: 'ORDER_UPDATED' });
    }
  };

  const getOrderItemsList = (order) => {
    if (!order || !order.items) return [];
    if (Array.isArray(order.items)) return order.items;
    if (typeof order.items === 'object' && Array.isArray(order.items.products)) return order.items.products;
    if (typeof order.items === 'string') {
      try {
        const parsed = JSON.parse(order.items);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.products)) return parsed.products;
      } catch (e) {}
    }
    return [];
  };

  // ----------------------------------------------------------------------
  // Dapur Authentication & Session
  // ----------------------------------------------------------------------
  const DAPUR_SESSION_KEY = 'gacoan_dapur_session';
  const dapurLoginOverlay = document.getElementById('dapurLoginOverlay');
  const dapurLoginForm = document.getElementById('dapurLoginForm');
  const dapurEmail = document.getElementById('dapurEmail');
  const dapurPassword = document.getElementById('dapurPassword');
  const dapurLoginMsg = document.getElementById('dapurLoginMsg');
  const dapurActiveName = document.getElementById('dapurActiveName');
  const btnDapurLogout = document.getElementById('btnDapurLogout');

  const getDapurSession = () => localStorage.getItem(DAPUR_SESSION_KEY);
  const setDapurSession = (val) => {
    if (val) localStorage.setItem(DAPUR_SESSION_KEY, val);
    else localStorage.removeItem(DAPUR_SESSION_KEY);
    checkDapurAuth();
  };

  function checkDapurAuth() {
    let session = getDapurSession();
    if (!session) {
      session = 'Chef Dapur 01';
      localStorage.setItem(DAPUR_SESSION_KEY, session);
    }
    if (dapurLoginOverlay) {
      dapurLoginOverlay.classList.add('hidden');
      dapurLoginOverlay.style.display = 'none';
    }
    if (dapurActiveName) dapurActiveName.textContent = `Dapur: ${session}`;
    renderKitchenKDS();
  }

  // Password Visibility Toggle Button Handler
  document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const wrapper = btn.closest('.password-wrapper');
      if (!wrapper) return;
      const input = wrapper.querySelector('input');
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      const iconOpen = btn.querySelector('.icon-eye-open');
      const iconClosed = btn.querySelector('.icon-eye-closed');
      if (iconOpen && iconClosed) {
        iconOpen.style.display = isPassword ? 'none' : 'block';
        iconClosed.style.display = isPassword ? 'block' : 'none';
      }
    });
  });

  if (dapurLoginForm) {
    dapurLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailVal = dapurEmail.value.trim().toLowerCase();
      const passVal = dapurPassword.value;

      // Accepted logins: dapur@gacoan.id, dapur@gacoan.com or dapur with password dapur123
      if ((emailVal === 'dapur@gacoan.id' || emailVal === 'dapur@gacoan.com' || emailVal === 'dapur') && passVal === 'dapur123') {
        dapurLoginMsg.className = 'dapur-msg success';
        dapurLoginMsg.textContent = 'Login Dapur berhasil! Membuka KDS...';
        setTimeout(() => {
          setDapurSession('Chef Dapur 01');
          dapurEmail.value = '';
          dapurPassword.value = '';
          dapurLoginMsg.textContent = '';
        }, 500);
      } else {
        dapurLoginMsg.className = 'dapur-msg error';
        dapurLoginMsg.textContent = 'Email atau Password salah! (dapur@gacoan.com / dapur123)';
      }
    });
  }

  if (btnDapurLogout) {
    btnDapurLogout.addEventListener('click', () => {
      if (confirm('Apakah Anda ingin keluar dari Portal Dapur dan kembali ke web menu?')) {
        setDapurSession(null);
        localStorage.removeItem('gacoan_auth_session');
        window.location.href = 'index.html';
      }
    });
  }

  // ----------------------------------------------------------------------
  // Live Clock
  // ----------------------------------------------------------------------
  const liveClock = document.getElementById('liveClock');
  const updateClock = () => {
    const now = new Date();
    liveClock.textContent = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';
  };
  setInterval(updateClock, 1000);
  updateClock();

  // ----------------------------------------------------------------------
  // KDS Rendering & Controls
  // ----------------------------------------------------------------------
  let currentFilter = 'ACTIVE';

  const dapurOrdersGrid = document.getElementById('dapurOrdersGrid');
  const statPendingKitchen = document.getElementById('statPendingKitchen');
  const statCookingKitchen = document.getElementById('statCookingKitchen');
  const statDoneKitchen = document.getElementById('statDoneKitchen');
  const countActiveTab = document.getElementById('countActiveTab');
  const countNewTab = document.getElementById('countNewTab');
  const countCookingTab = document.getElementById('countCookingTab');
  const countDoneTab = document.getElementById('countDoneTab');
  const dapurTabs = document.querySelectorAll('.dapur-tab');
  const btnRefreshKds = document.getElementById('btnRefreshKds');

  function renderKitchenKDS() {
    const orders = getOrders();

    // Only orders that are PAID, IN-PROGRESS (DIPROSES / SEDANG_DIMASAK / CHECK-IN) or DONE appear in kitchen
    const paidOrders = orders.filter(o => {
      const isRsv = o.diningType === 'RESERVASI' || String(o.orderId || '').startsWith('RSV-') || String(o.queueNumber || '').startsWith('RSV-');
      if (isRsv) {
        return o.status === 'DP_LUNAS' || o.status === 'LUNAS' || o.status === 'CHECK-IN' || o.status === 'DIPROSES';
      }
      return o.status === 'LUNAS' || o.status === 'DIPROSES';
    });
    const cookingOrders = orders.filter(o => o.status === 'SEDANG_DIMASAK');
    const readyOrders = orders.filter(o => o.status === 'SIAP_SAJI');
    const doneOrders = orders.filter(o => o.status === 'SIAP_SAJI' || o.status === 'SELESAI');
    const activeOrders = [...paidOrders, ...cookingOrders, ...readyOrders];

    statPendingKitchen.textContent = paidOrders.length;
    statCookingKitchen.textContent = cookingOrders.length;
    statDoneKitchen.textContent = doneOrders.length;

    countActiveTab.textContent = activeOrders.length;
    countNewTab.textContent = paidOrders.length;
    countCookingTab.textContent = cookingOrders.length;
    countDoneTab.textContent = doneOrders.length;

    // Filter displayed orders
    let displayList = [];
    if (currentFilter === 'ACTIVE') {
      displayList = activeOrders;
    } else if (currentFilter === 'LUNAS') {
      displayList = paidOrders;
    } else if (currentFilter === 'SEDANG_DIMASAK') {
      displayList = cookingOrders;
    } else if (currentFilter === 'SELESAI') {
      displayList = doneOrders;
    }

    if (displayList.length === 0) {
      dapurOrdersGrid.innerHTML = `
        <div class="kds-empty-state">
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin: 0 auto;">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
          <h3>Tidak Ada Antrian Pesanan Dapur</h3>
          <p>Pesanan yang sudah dibayar oleh pelanggan atau tamu reservasi yang check-in akan otomatis masuk ke layar dapur ini.</p>
        </div>
      `;
      return;
    }

    dapurOrdersGrid.innerHTML = displayList.map(order => {
      const isRsv = order.diningType === 'RESERVASI' || String(order.orderId || '').startsWith('RSV-') || String(order.queueNumber || '').startsWith('RSV-');
      const isCheckedIn = order.checkedIn === true || order.status === 'CHECK-IN' || order.status === 'SEDANG_DIMASAK' || order.status === 'SIAP_SAJI' || order.status === 'SELESAI';

      let cardStatusClass = 'status-new';
      let pillStatusClass = 'new';
      let pillStatusText = 'Baru Masuk (Perlu Dimasak)';

      if (isRsv && !isCheckedIn) {
        cardStatusClass = 'status-waiting';
        pillStatusClass = 'waiting';
        pillStatusText = 'Menunggu Tamu Check-In';
      } else if (order.status === 'SEDANG_DIMASAK') {
        cardStatusClass = 'status-cooking';
        pillStatusClass = 'cooking';
        pillStatusText = 'Sedang Dimasak';
      } else if (order.status === 'SIAP_SAJI') {
        cardStatusClass = 'status-done';
        pillStatusClass = 'done';
        pillStatusText = 'Selesai Masak (Siap Saji)';
      } else if (order.status === 'SELESAI') {
        cardStatusClass = 'status-done';
        pillStatusClass = 'done';
        pillStatusText = 'Sudah Diambil Pelanggan';
      }

      const itemsList = getOrderItemsList(order);

      return `
        <article class="kds-card ${cardStatusClass}" id="kds-${order.orderId}">
          <div class="kds-card-header">
            <div class="kds-queue-title">
              <span class="kds-queue-no">#${order.queueNumber || order.orderId}</span>
              <span class="kds-table-badge" style="${isRsv ? 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;' : ''}">
                ${isRsv ? `RSV &bull; ${order.tableInfo}` : (order.tableInfo || 'Dine In')}
              </span>
            </div>
            <span class="kds-status-pill ${pillStatusClass}">${pillStatusText}</span>
          </div>

          <div class="kds-card-body">
            <div class="kds-meta-row">
              <span>Pemesan: <strong>${order.customerName}</strong></span>
              <span>Waktu: ${order.createdAt || 'Baru saja'}</span>
            </div>

            <div class="kds-items-list">
              ${itemsList.map((item, idx) => `
                <div class="kds-item-row" id="item-${order.orderId}-${idx}">
                  <div class="kds-item-content">
                    <div class="kds-item-top">
                      <div>
                        <span class="kds-item-qty">${item.qty}x</span>
                        <span class="kds-item-name">${item.title}</span>
                      </div>
                    </div>
                    ${item.level ? `<div class="kds-item-level">&bull; ${item.level}</div>` : ''}
                    ${item.notes ? `<div class="kds-item-note">Catatan: "${item.notes}"</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="kds-card-footer">
            ${isRsv && !isCheckedIn ? `
              <div style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 700; text-align: center; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Tamu Belum Check-In &bull; Belum Bisa Dimasak</span>
              </div>
            ` : ''}

            ${(!isRsv || isCheckedIn) && (order.status === 'LUNAS' || order.status === 'DIPROSES' || order.status === 'CHECK-IN' || (isRsv && order.status === 'DP_LUNAS' && isCheckedIn)) ? `
              <button type="button" class="btn-kds-cook" data-action="start-cook" data-id="${order.orderId}">
                Mulai Masak
              </button>
            ` : ''}

            ${order.status === 'SEDANG_DIMASAK' ? `
              <button type="button" class="btn-kds-done" data-action="finish-cook" data-id="${order.orderId}">
                Selesai Masak (Siap Saji)
              </button>
            ` : ''}

            ${order.status === 'SIAP_SAJI' ? `
              <div style="font-size: 13px; font-weight: 700; color: #16a34a; text-align: center; width: 100%; padding: 4px;">
                Selesai Masak &bull; Menunggu Diambil di Kasir
              </div>
            ` : ''}

            ${order.status === 'SELESAI' ? `
              <div style="font-size: 13px; font-weight: 700; color: #64748b; text-align: center; width: 100%; padding: 4px;">
                Pesanan Telah Diambil Pelanggan
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

    // Attach Action Buttons
    dapurOrdersGrid.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const orderId = btn.getAttribute('data-id');
        handleKitchenAction(action, orderId);
      });
    });
  }

  function handleKitchenAction(action, orderId) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.orderId === orderId);
    if (idx === -1) return;
    const order = orders[idx];

    if (action === 'start-cook') {
      const isRsv = order.diningType === 'RESERVASI' || String(order.orderId || '').startsWith('RSV-') || String(order.queueNumber || '').startsWith('RSV-');
      const isCheckedIn = order.checkedIn === true || order.status === 'CHECK-IN';
      if (isRsv && !isCheckedIn) {
        alert('Pesanan reservasi belum bisa dimasak karena tamu belum check-in di kasir!');
        return;
      }

      orders[idx].status = 'SEDANG_DIMASAK';
      saveOrders(orders);
      renderKitchenKDS();

      // Sync to Supabase Cloud Database
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.updateOrderStatus(orderId, 'SEDANG_DIMASAK');
      }
    } else if (action === 'finish-cook') {
      orders[idx].kitchenDone = true;
      orders[idx].status = 'SIAP_SAJI';
      saveOrders(orders);
      renderKitchenKDS();

      // Sync to Supabase Cloud Database
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.updateOrderStatus(orderId, 'SIAP_SAJI');
      }
    }
  }

  // Filter Tabs Listeners
  dapurTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dapurTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      renderKitchenKDS();
    });
  });

  if (btnRefreshKds) {
    btnRefreshKds.addEventListener('click', () => {
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.getOrders().then(orders => {
          if (orders && orders.length > 0) saveOrders(orders);
          renderKitchenKDS();
        });
      } else {
        renderKitchenKDS();
      }
    });
  }

  // Real-Time Incoming Order Listener
  let lastPaidCount = getOrders().filter(o => o.status === 'LUNAS').length;

  const handleOrderChange = () => {
    const currentOrders = getOrders();
    const currentPaidCount = currentOrders.filter(o => o.status === 'LUNAS').length;
    if (currentPaidCount > lastPaidCount) {
      playKitchenBell();
    }
    lastPaidCount = currentPaidCount;
    renderKitchenKDS();
  };

  if (posChannel) {
    posChannel.onmessage = (e) => {
      if (e.data && e.data.type === 'ORDER_UPDATED') {
        handleOrderChange();
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === DB_ORDERS_KEY) {
      handleOrderChange();
    }
  });

  checkDapurAuth();

  // Supabase Realtime Sync for Kitchen KDS
  if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
    window.GacoanSupabase.getOrders().then(remoteOrders => {
      if (remoteOrders && remoteOrders.length > 0) {
        saveOrders(remoteOrders);
        renderKitchenKDS();
      }
    });

    window.GacoanSupabase.subscribeOrders(() => {
      window.GacoanSupabase.getOrders().then(remoteOrders => {
        if (remoteOrders && remoteOrders.length > 0) {
          saveOrders(remoteOrders);
          handleOrderChange();
        }
      });
    });
  }
});
