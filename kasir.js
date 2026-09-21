document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------------------------
  // Audio Notifications for Kasir (Web Audio API)
  // ----------------------------------------------------------------------
  const playNewOrderNotification = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const notes = [659.25, 880.00]; // E5, A5 bell chime
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.15);

        gain.gain.setValueAtTime(0, now + index * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, now + index * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 0.65);
      });
    } catch (e) {
      console.warn('Audio alert not permitted:', e);
    }
  };

  const playSuccessChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // ----------------------------------------------------------------------
  // ----------------------------------------------------------------------
  // LocalStorage Database Keys & Real-Time Sync Channel
  // ----------------------------------------------------------------------
  const DB_ORDERS_KEY = 'gacoan_orders_database';
  const DB_PRODUCTS_KEY = 'gacoan_products_database';
  const DB_CATEGORIES_KEY = 'gacoan_categories_database';
  const KASIR_SESSION_KEY = 'gacoan_kasir_session';

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

  const getKasirSession = () => localStorage.getItem(KASIR_SESSION_KEY);
  const setKasirSession = (val) => {
    if (val) localStorage.setItem(KASIR_SESSION_KEY, val);
    else localStorage.removeItem(KASIR_SESSION_KEY);
    checkKasirAuth();
  };

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

  const formatRp = (num) => {
    return 'Rp ' + Number(num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Date Parsing & Comparison Helpers
  const parseOrderDate = (order) => {
    if (!order) return new Date(0);
    if (order.timestamp && !isNaN(Number(order.timestamp))) {
      return new Date(Number(order.timestamp));
    }
    if (order.createdAt) {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) return d;
      const raw = String(order.createdAt).trim();
      const parts = raw.split(/[\s,]+/);
      if (parts[0] && parts[0].includes('/')) {
        const dp = parts[0].split('/');
        if (dp.length === 3) {
          const day = parseInt(dp[0], 10);
          const month = parseInt(dp[1], 10) - 1;
          const year = parseInt(dp[2], 10);
          let h = 0, m = 0;
          if (parts[1] && parts[1].includes(':')) {
            const tp = parts[1].split(':');
            h = parseInt(tp[0], 10) || 0;
            m = parseInt(tp[1], 10) || 0;
          }
          const parsed = new Date(year, month, day, h, m);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
    }
    return new Date();
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isSameMonth = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth();
  };

  const isSameYear = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear();
  };

  const isKitchenFinished = (order) => {
    if (!order) return false;
    return order.status === 'SIAP_SAJI' || order.status === 'SELESAI' || order.kitchenDone === true;
  };

  // ----------------------------------------------------------------------
  // Kasir Authentication
  // ----------------------------------------------------------------------
  const kasirLoginOverlay = document.getElementById('kasirLoginOverlay');
  const kasirLoginForm = document.getElementById('kasirLoginForm');
  const kasirUsername = document.getElementById('kasirUsername');
  const kasirPassword = document.getElementById('kasirPassword');
  const kasirLoginMsg = document.getElementById('kasirLoginMsg');
  const btnKasirLogout = document.getElementById('btnKasirLogout');
  const kasirActiveName = document.getElementById('kasirActiveName');

  function checkKasirAuth() {
    let session = getKasirSession();
    if (!session) {
      session = 'Kasir 01';
      localStorage.setItem(KASIR_SESSION_KEY, 'Kasir 01');
    }
    if (kasirLoginOverlay) kasirLoginOverlay.classList.add('hidden');
    if (kasirActiveName) kasirActiveName.textContent = `Kasir Aktif: ${session}`;
    renderDashboard();
    renderCatalogCategoryFilters();
    renderCatalog();
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

  kasirLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const usn = kasirUsername.value.trim().toLowerCase();
    const pw = kasirPassword.value;

    // Login rule: kasir@gacoan.id, kasir@gacoan.com or kasir, pw: kasir123
    if ((usn === 'kasir@gacoan.id' || usn === 'kasir@gacoan.com' || usn === 'kasir') && pw === 'kasir123') {
      kasirLoginMsg.className = 'kasir-msg success';
      kasirLoginMsg.textContent = 'Login berhasil! Membuka POS...';
      setTimeout(() => {
        setKasirSession('Kasir Mie Gacoan');
        kasirUsername.value = '';
        kasirPassword.value = '';
        kasirLoginMsg.textContent = '';
      }, 500);
    } else {
      kasirLoginMsg.className = 'kasir-msg error';
      kasirLoginMsg.textContent = 'Email/Username atau Password salah! (kasir@gacoan.com / kasir123)';
    }
  });

  btnKasirLogout.addEventListener('click', () => {
    if (confirm('Apakah Anda ingin keluar dari Portal Kasir dan kembali ke web menu?')) {
      setKasirSession(null);
      localStorage.removeItem('gacoan_auth_session');
      window.location.href = 'index.html';
    }
  });

  // ----------------------------------------------------------------------
  // Live Clock
  // ----------------------------------------------------------------------
  const liveClock = document.getElementById('liveClock');
  let lastCheckedDay = new Date().getDate();
  const updateClock = () => {
    const now = new Date();
    if (liveClock) liveClock.textContent = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';
    // When clock passes 00:00 midnight (day rolls over)
    if (now.getDate() !== lastCheckedDay) {
      lastCheckedDay = now.getDate();
      // Omset harian naturally resets to 0
      renderDashboard();
      if (typeof renderSalesReport === 'function') renderSalesReport();
    }
  };
  setInterval(updateClock, 1000);
  updateClock();

  // ----------------------------------------------------------------------
  // Master Product Catalog Database
  // ----------------------------------------------------------------------
  const INITIAL_CATEGORIES = ['MIE', 'DIMSUM', 'BEVERAGE', 'MIRAS'];

  const INITIAL_PRODUCTS = [
    {
      id: 'mie-gacoan',
      title: 'Mie Gacoan',
      category: 'MIE',
      price: 10000,
      img: 'Menu/mie gacoan.webp',
      desc: 'Sensasi pedas manis khas Gacoan dengan taburan ayam cincang & pangsit renyah. Bisa pilih tingkat kepedasan, lho!',
      hasLevel: true,
      levels: [
        { name: 'LEVEL 0', extraPrice: 0 },
        { name: 'LEVEL 1', extraPrice: 0 },
        { name: 'LEVEL 2', extraPrice: 0 },
        { name: 'LEVEL 3', extraPrice: 0 },
        { name: 'LEVEL 4', extraPrice: 0 },
        { name: 'LEVEL 6', extraPrice: 1000 },
        { name: 'LEVEL 8', extraPrice: 1000 }
      ],
      status: 'Tersedia'
    },
    {
      id: 'mie-hompimpa',
      title: 'Mie Hompimpa',
      category: 'MIE',
      price: 10000,
      img: 'Menu/miehompimpa.webp',
      desc: 'Sensasi pedas asin gurih khas dengan bumbu racikan rahasia Gacoan. Bisa pilih tingkat kepedasan!',
      hasLevel: true,
      levels: [
        { name: 'LEVEL 0', extraPrice: 0 },
        { name: 'LEVEL 1', extraPrice: 0 },
        { name: 'LEVEL 2', extraPrice: 0 },
        { name: 'LEVEL 3', extraPrice: 0 },
        { name: 'LEVEL 4', extraPrice: 0 },
        { name: 'LEVEL 6', extraPrice: 1000 },
        { name: 'LEVEL 8', extraPrice: 1000 }
      ],
      status: 'Tersedia'
    },
    {
      id: 'mie-suit',
      title: 'Mie Suit',
      category: 'MIE',
      price: 10000,
      img: 'Menu/miesuit.webp',
      desc: 'Sensasi gurih lembut tidak pedas, lengkap dengan topping ayam cincang & pangsit goreng.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'siomay',
      title: 'Siomay',
      category: 'DIMSUM',
      price: 9500,
      img: 'Menu/siomay.webp',
      desc: 'Dimsum siomay kukus lembut juicy dengan isian daging ayam melimpah dan saus cocolan.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'udang-keju',
      title: 'Udang Keju',
      category: 'DIMSUM',
      price: 9500,
      img: 'Menu/udangkeju.webp',
      desc: 'Dimsum udang goreng berbalut tepung renyah dengan lelehan keju mozarella gurih di dalamnya.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'udang-rambutan',
      title: 'Udang Rambutan',
      category: 'DIMSUM',
      price: 9500,
      img: 'Menu/udahngrambutan.webp',
      desc: 'Bola-bola udang renyah dengan balutan kulit pangsit crispy berserat mirip rambutan.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'lumpia-udang',
      title: 'Lumpia Udang',
      category: 'DIMSUM',
      price: 9500,
      img: 'Menu/lumpiaudang.webp',
      desc: 'Lumpia goreng renyah isi olahan udang segar dan rempah istimewa.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'pangsit-goreng',
      title: 'Pangsit Goreng',
      category: 'DIMSUM',
      price: 10500,
      img: 'Menu/pangsitgoreng.webp',
      desc: 'Pangsit goreng renyah ukuran besar dengan isian olahan ayam gurih khas Gacoan.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'es-gobak-sodor',
      title: 'Es Gobak Sodor',
      category: 'BEVERAGE',
      price: 9500,
      img: 'Menu/esgobaksodor.webp',
      desc: 'Minuman es buah manis segar khas Gacoan dengan potongan buah, cincau, dan selasih.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'thai-tea',
      title: 'Thai Tea',
      category: 'BEVERAGE',
      price: 8500,
      img: 'Menu/thaitea.webp',
      desc: 'Teh khas Thailand otentik berpadu susu kental manis creamy yang disajikan dingin.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'thai-green-tea',
      title: 'Thai Green Tea',
      category: 'BEVERAGE',
      price: 8500,
      img: 'Menu/thaigreentea.webp',
      desc: 'Teh hijau aroma wangi khas Thailand dipadu susu segar manis creamy.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'lemon-tea',
      title: 'Lemon Tea',
      category: 'BEVERAGE',
      price: 6000,
      img: 'Menu/lemontea.webp',
      desc: 'Perpaduan seduhan teh segar dengan perasan jeruk lemon alami pereda dahaga.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'orange',
      title: 'Orange',
      category: 'BEVERAGE',
      price: 5500,
      img: 'Menu/orange.webp',
      desc: 'Minuman sari jeruk manis dingin segar pelepas dahaga dan pereda pedas.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'es-tea',
      title: 'Es Tea',
      category: 'BEVERAGE',
      price: 4500,
      img: 'Menu/Tea.webp',
      desc: 'Es teh manis wangi khas melati tradisional khas Indonesia.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'air-mineral',
      title: 'Air Mineral',
      category: 'BEVERAGE',
      price: 4500,
      img: 'Menu/airmineral.webp',
      desc: 'Air mineral murni kemasan botol higienis dan menyegarkan.',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    },
    {
      id: 'prod-1790004682913',
      title: 'Jack And Daniels',
      category: 'MIRAS',
      price: 100000,
      img: 'Menu/jackdaniels.jpg',
      desc: 'Kesegaran Whiskey yang sangat menyegarkan',
      hasLevel: false,
      levels: [],
      status: 'Tersedia'
    }
  ];

  const getCategories = () => {
    let cats = [];
    try {
      const stored = JSON.parse(localStorage.getItem(DB_CATEGORIES_KEY));
      if (stored && Array.isArray(stored) && stored.length > 0) {
        cats = [...stored];
      }
    } catch (e) {}

    INITIAL_CATEGORIES.forEach(c => {
      if (!cats.some(existing => existing.trim().toUpperCase() === c.trim().toUpperCase())) {
        cats.push(c);
      }
    });

    const prods = getProducts();
    if (Array.isArray(prods)) {
      prods.forEach(p => {
        if (p && p.category) {
          const catName = String(p.category).trim().toUpperCase();
          if (catName && !cats.some(existing => existing.trim().toUpperCase() === catName)) {
            cats.push(catName);
          }
        }
      });
    }

    try {
      localStorage.setItem(DB_CATEGORIES_KEY, JSON.stringify(cats));
    } catch (e) {}
    return cats;
  };

  const getProducts = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(DB_PRODUCTS_KEY));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    localStorage.setItem(DB_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  };

  // ----------------------------------------------------------------------
  // Dashboard & Orders Rendering
  // ----------------------------------------------------------------------
  let currentFilter = 'ALL';
  let searchQuery = '';
  let catalogCatFilter = 'ALL';
  let catalogSearchQuery = '';
  let rsvFilter = 'ALL';

  const tabBtnOrders = document.getElementById('tabBtnOrders');
  const tabBtnTables = document.getElementById('tabBtnTables');
  const tabBtnReservations = document.getElementById('tabBtnReservations');
  const tabBtnProducts = document.getElementById('tabBtnProducts');
  const tabBtnSales = document.getElementById('tabBtnSales');

  const ordersViewContainer = document.getElementById('ordersViewContainer');
  const tablesViewContainer = document.getElementById('tablesViewContainer');
  const reservationsViewContainer = document.getElementById('reservationsViewContainer');
  const productsCatalogSection = document.getElementById('productsCatalogSection');
  const salesReportViewContainer = document.getElementById('salesReportViewContainer');

  const catalogProductsGrid = document.getElementById('catalogProductsGrid');
  const catalogSearchInput = document.getElementById('catalogSearchInput');
  const catalogCatFiltersContainer = document.querySelector('.catalog-category-pills');

  const kasirLiveTablesGrid = document.getElementById('kasirLiveTablesGrid');
  const kasirReservationsList = document.getElementById('kasirReservationsList');

  // Switch between 5 Views
  function setActiveKasirView(viewName) {
    [tabBtnOrders, tabBtnTables, tabBtnReservations, tabBtnProducts, tabBtnSales].forEach(btn => btn && btn.classList.remove('active'));
    [ordersViewContainer, tablesViewContainer, reservationsViewContainer, productsCatalogSection, salesReportViewContainer].forEach(sec => sec && (sec.style.display = 'none'));

    if (viewName === 'orders') {
      if (tabBtnOrders) tabBtnOrders.classList.add('active');
      if (ordersViewContainer) ordersViewContainer.style.display = 'block';
      renderDashboard();
    } else if (viewName === 'tables') {
      if (tabBtnTables) tabBtnTables.classList.add('active');
      if (tablesViewContainer) tablesViewContainer.style.display = 'flex';
      renderLiveTableMap();
    } else if (viewName === 'reservations') {
      if (tabBtnReservations) tabBtnReservations.classList.add('active');
      if (reservationsViewContainer) reservationsViewContainer.style.display = 'flex';
      renderKasirReservations();
    } else if (viewName === 'products') {
      if (tabBtnProducts) tabBtnProducts.classList.add('active');
      if (productsCatalogSection) productsCatalogSection.style.display = 'flex';
      renderCatalogCategoryFilters();
      renderCatalog();
    } else if (viewName === 'sales') {
      if (tabBtnSales) tabBtnSales.classList.add('active');
      if (salesReportViewContainer) salesReportViewContainer.style.display = 'flex';
      renderSalesReport();
    }
  }

  if (tabBtnOrders) tabBtnOrders.addEventListener('click', () => setActiveKasirView('orders'));
  if (tabBtnTables) tabBtnTables.addEventListener('click', () => setActiveKasirView('tables'));
  if (tabBtnReservations) tabBtnReservations.addEventListener('click', () => setActiveKasirView('reservations'));
  if (tabBtnProducts) tabBtnProducts.addEventListener('click', () => setActiveKasirView('products'));
  if (tabBtnSales) tabBtnSales.addEventListener('click', () => setActiveKasirView('sales'));

  function renderCatalogCategoryFilters() {
    if (!catalogCatFiltersContainer) return;
    const categories = getCategories();
    catalogCatFiltersContainer.innerHTML = `
      <button type="button" class="cat-pill ${catalogCatFilter === 'ALL' ? 'active' : ''}" data-cat="ALL">Semua Menu</button>
      ${categories.map(cat => `
        <button type="button" class="cat-pill ${catalogCatFilter === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>
      `).join('')}
    `;

    catalogCatFiltersContainer.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        catalogCatFiltersContainer.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        catalogCatFilter = pill.getAttribute('data-cat');
        renderCatalog();
      });
    });
  }

  if (catalogSearchInput) {
    catalogSearchInput.addEventListener('input', (e) => {
      catalogSearchQuery = e.target.value.toLowerCase().trim();
      renderCatalog();
    });
  }

  function renderCatalog() {
    if (!catalogProductsGrid) return;

    const allProducts = getProducts();
    let filtered = allProducts.filter(p => {
      const catMatch = catalogCatFilter === 'ALL' || p.category === catalogCatFilter;
      const searchMatch = !catalogSearchQuery || 
        p.title.toLowerCase().includes(catalogSearchQuery) || 
        (p.desc && p.desc.toLowerCase().includes(catalogSearchQuery)) || 
        p.category.toLowerCase().includes(catalogSearchQuery);
      return catMatch && searchMatch;
    });

    if (filtered.length === 0) {
      catalogProductsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
          <p style="font-weight: 700; font-size: 15px;">Tidak ada menu yang cocok dengan pencarian.</p>
        </div>
      `;
      return;
    }

    catalogProductsGrid.innerHTML = filtered.map(item => {
      const isAvailable = item.status === 'Tersedia';
      return `
      <article class="product-catalog-card ${!isAvailable ? 'out-of-stock' : ''}">
        <div class="catalog-card-img-wrap">
          <img src="${item.img}" alt="${item.title}" class="catalog-card-img" loading="lazy" />
          <span class="catalog-category-tag">${item.category}</span>
          ${!isAvailable ? '<span class="catalog-habis-badge">HABIS</span>' : ''}
        </div>
        <div class="catalog-card-body">
          <div>
            <h3 class="catalog-card-title">${item.title}</h3>
            <p class="catalog-card-desc">${item.desc}</p>
          </div>
          <div class="catalog-card-footer">
            <span class="catalog-price-tag">${formatRp(item.price)}</span>
            <span class="catalog-status-badge ${isAvailable ? 'available' : 'out-of-stock'}">${item.status}</span>
          </div>
        </div>
      </article>
    `;
    }).join('');
  }

  const statTotalOrders = document.getElementById('statTotalOrders');
  const statPendingOrders = document.getElementById('statPendingOrders');
  const statPaidOrders = document.getElementById('statPaidOrders');
  const statTotalRevenue = document.getElementById('statTotalRevenue');
  const countPendingFilter = document.getElementById('countPendingFilter');
  const countPaidFilter = document.getElementById('countPaidFilter');
  const countDoneFilter = document.getElementById('countDoneFilter');

  const ordersGrid = document.getElementById('ordersGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const queueSearchInput = document.getElementById('queueSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const btnRefreshFeed = document.getElementById('btnRefreshFeed');
  const btnClearOrdersDB = document.getElementById('btnClearOrdersDB');

  // Receipt Modal DOM
  const receiptModal = document.getElementById('receiptModal');
  const receiptContent = document.getElementById('receiptContent');
  const btnCloseReceipt = document.getElementById('btnCloseReceipt');

  // Scanner Modal DOM
  const qrScannerModal = document.getElementById('qrScannerModal');
  const btnScanQrCode = document.getElementById('btnScanQrCode');
  const closeScannerModal = document.getElementById('closeScannerModal');
  const manualQrInput = document.getElementById('manualQrInput');
  const btnSubmitManualQr = document.getElementById('btnSubmitManualQr');

  function renderDashboard() {
    const orders = getOrders();
    const now = new Date();

    // 1. Calculate KPI Statistics for TODAY (Omset Harian)
    // Only orders from today (since 00:00) count for Omset Hari Ini
    // When 00:00 midnight arrives, this resets to 0 automatically
    const todayOrders = orders.filter(o => isSameDay(parseOrderDate(o), now));

    const totalCount = todayOrders.length;
    const pendingCount = todayOrders.filter(o => o.status === 'MENUNGGU_BAYAR').length;
    const paidCount = todayOrders.filter(o => o.status === 'LUNAS' || o.status === 'SEDANG_DIMASAK' || o.status === 'SIAP_SAJI' || o.status === 'SELESAI' || o.status === 'DP_LUNAS' || o.status === 'CHECK-IN' || o.status === 'DIPROSES').length;
    const doneCount = todayOrders.filter(o => o.status === 'SELESAI').length;
    const totalRevenue = todayOrders
      .filter(o => o.status === 'LUNAS' || o.status === 'SEDANG_DIMASAK' || o.status === 'SIAP_SAJI' || o.status === 'SELESAI' || o.status === 'DP_LUNAS' || o.status === 'CHECK-IN' || o.status === 'DIPROSES')
      .reduce((sum, o) => {
        if (o.status === 'DP_LUNAS' && o.dpPaid) return sum + Number(o.dpPaid || 0);
        return sum + Number(o.grandTotal || 0);
      }, 0);

    if (statTotalOrders) statTotalOrders.textContent = totalCount;
    if (statPendingOrders) statPendingOrders.textContent = pendingCount;
    if (statPaidOrders) statPaidOrders.textContent = paidCount;
    if (statTotalRevenue) statTotalRevenue.textContent = formatRp(totalRevenue);

    if (countPendingFilter) countPendingFilter.textContent = pendingCount;
    if (countPaidFilter) countPaidFilter.textContent = paidCount;
    if (countDoneFilter) countDoneFilter.textContent = doneCount;

    // 2. Filter Orders
    let filtered = [...orders].reverse(); // Newest first

    if (currentFilter !== 'ALL') {
      if (currentFilter === 'LUNAS') {
        filtered = filtered.filter(o => o.status === 'LUNAS' || o.status === 'SEDANG_DIMASAK' || o.status === 'SIAP_SAJI' || o.status === 'CHECK-IN' || o.status === 'DIPROSES');
      } else {
        filtered = filtered.filter(o => o.status === currentFilter);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(o => {
        const queueMatch = (o.queueNumber || '').toLowerCase().includes(q);
        const orderIdMatch = (o.orderId || '').toLowerCase().includes(q);
        const nameMatch = (o.customerName || '').toLowerCase().includes(q);
        const tableMatch = (o.tableInfo || '').toLowerCase().includes(q);
        return queueMatch || orderIdMatch || nameMatch || tableMatch;
      });
    }

    // 3. Render Cards
    if (filtered.length === 0) {
      ordersGrid.innerHTML = `
        <div class="orders-empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin: 0 auto 12px auto; display: block;">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <h4 style="font-size: 16px; font-weight: 700; color: #1e293b;">Tidak ada pesanan yang cocok</h4>
          <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Pesanan baru dari web pembeli akan otomatis muncul di sini secara langsung.</p>
        </div>
      `;
      return;
    }

    ordersGrid.innerHTML = filtered.map(order => {
      let statusClass = 'status-pending';
      let pillClass = 'pending';
      let pillText = 'Menunggu Bayar';
      const kitchenDone = isKitchenFinished(order);
      const isRsv = order.diningType === 'RESERVASI' || String(order.orderId || '').startsWith('RSV-') || String(order.queueNumber || '').startsWith('RSV-') || (Boolean(order.reservationId) && String(order.reservationId).startsWith('RSV-'));
      const remainingBalance = Math.max(0, (order.grandTotal || 0) - (order.dpPaid || 0));
      const isCheckedIn = order.checkedIn === true || order.status === 'CHECK-IN' || order.status === 'DIPROSES' || order.status === 'SEDANG_DIMASAK' || order.status === 'SIAP_SAJI' || order.status === 'SELESAI';

      if (order.status === 'DP_LUNAS') {
        statusClass = 'status-paid';
        pillClass = 'cooking';
        pillText = remainingBalance > 0 ? `DP Terbayar (Sisa: ${formatRp(remainingBalance)})` : 'DP Terbayar (Lunas)';
      } else if (order.status === 'DIPROSES' || order.status === 'CHECK-IN') {
        statusClass = 'status-paid';
        pillClass = 'cooking';
        pillText = kitchenDone ? 'Siap Saji (Tamu Check-In)' : 'Tamu Sudah Check-In (Antrian Dapur)';
      } else if (order.status === 'LUNAS') {
        statusClass = 'status-paid';
        pillClass = 'paid';
        pillText = (isRsv && isCheckedIn) ? (kitchenDone ? 'Siap Saji (Tamu Check-In)' : 'Tamu Sudah Check-In (Antrian Dapur)') : (kitchenDone ? 'Siap Saji (Dapur Selesai)' : 'Sudah Lunas (Antrian Dapur)');
      } else if (order.status === 'SEDANG_DIMASAK') {
        statusClass = 'status-paid';
        pillClass = 'cooking';
        pillText = 'Sedang Dimasak di Dapur';
      } else if (order.status === 'SIAP_SAJI') {
        statusClass = 'status-ready';
        pillClass = 'ready';
        pillText = 'Siap Saji (Dapur Selesai Masak)';
      } else if (order.status === 'SELESAI') {
        statusClass = 'status-done';
        pillClass = 'done';
        pillText = 'Selesai (Sudah Diambil)';
      }

      return `
        <article class="order-card ${statusClass}" id="card-${order.orderId}">
          <div class="order-card-header">
            <span class="order-queue-badge">#${order.queueNumber}</span>
            <span class="order-status-pill ${pillClass}">${pillText}</span>
          </div>

          <div class="order-card-body">
            <div class="order-meta-info">
              <div><strong>${order.customerName}</strong> <span>(${order.tableInfo || 'Dine In'})</span></div>
              <span>Waktu: ${order.createdAt}</span>
              <span>Metode: <strong>${order.paymentMethod || 'QRIS'}</strong></span>
            </div>

            <div class="order-items-box">
              ${getOrderItemsList(order).map(item => `
                <div>
                  <div class="order-item-line">
                    <span><strong>${item.qty || 1}x</strong> ${item.title || 'Item'}</span>
                    <span>${formatRp(item.total || ((item.unitPrice || item.price || 0) * (item.qty || 1)))}</span>
                  </div>
                  ${item.level ? `<div class="order-item-desc">&bull; Level: ${item.level}</div>` : ''}
                  ${item.notes ? `<div class="order-item-desc">&bull; Catatan: "${item.notes}"</div>` : ''}
                </div>
              `).join('')}
            </div>

            <div class="order-total-row">
              <span style="font-size: 13px; color: #64748b;">Total Tagihan:</span>
              <span class="order-total-price">${formatRp(order.grandTotal)}</span>
            </div>
          </div>

          <div class="order-card-actions">
            ${order.status === 'MENUNGGU_BAYAR' ? `
              <button type="button" class="btn-confirm-pay" data-action="confirm-pay" data-id="${order.orderId}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Konfirmasi Pembayaran (Tandai Lunas)</span>
              </button>
            ` : ''}

            ${isRsv && !isCheckedIn && order.status !== 'SELESAI' ? `
              <button type="button" class="btn-rsv-checkin" data-action="checkin-rsv" data-id="${order.orderId}">
                <span>Konfirmasi Tamu Check-In</span>
              </button>
            ` : ''}

            ${isRsv && remainingBalance > 0 && order.status !== 'SELESAI' ? `
              <button type="button" class="btn-rsv-settle" data-action="settle-rsv" data-id="${order.orderId}">
                <span>Konfirmasi Lunas (${formatRp(remainingBalance)})</span>
              </button>
            ` : ''}

            ${(order.status === 'LUNAS' || order.status === 'SEDANG_DIMASAK' || order.status === 'DIPROSES') && !kitchenDone ? `
              <button type="button" class="btn-mark-done disabled" data-action="disabled-mark-done" title="Pesanan belum bisa diambil karena dapur belum selesai memasak">
                <span>Menunggu Dapur Selesai Masak</span>
              </button>
            ` : ''}

            ${order.status === 'SIAP_SAJI' || (kitchenDone && order.status !== 'SELESAI') ? `
              <button type="button" class="btn-mark-done ready-pickup" data-action="mark-done" data-id="${order.orderId}" title="Dapur telah selesai masak, klik untuk menyelesaikan saat pesanan diambil">
                <span>Selesaikan Pesanan &bull; Pesanan Diambil</span>
              </button>
            ` : ''}

            ${order.status === 'SELESAI' ? `
              <div class="order-done-badge">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#16a34a" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:4px;">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Pesanan Telah Selesai &amp; Diambil</span>
              </div>
            ` : ''}

            <button type="button" class="btn-print-receipt-card" data-action="print-receipt" data-id="${order.orderId}">
              <span>Cetak Struk Transaksi</span>
            </button>
          </div>
        </article>
      `;
    }).join('');

    ordersGrid.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const orderId = btn.getAttribute('data-id');
        handleOrderAction(action, orderId);
      });
    });
  }

  // Cash Payment Modal DOM
  const cashPaymentModal = document.getElementById('cashPaymentModal');
  const closeCashPaymentModal = document.getElementById('closeCashPaymentModal');
  const btnCancelCashPayment = document.getElementById('btnCancelCashPayment');
  const cashQueueNo = document.getElementById('cashQueueNo');
  const cashCustomerName = document.getElementById('cashCustomerName');
  const cashTotalBill = document.getElementById('cashTotalBill');
  const cashGivenInput = document.getElementById('cashGivenInput');
  const quickCashPills = document.getElementById('quickCashPills');
  const cashChangeBox = document.getElementById('cashChangeBox');
  const cashChangeAmount = document.getElementById('cashChangeAmount');
  const cashChangeStatusMsg = document.getElementById('cashChangeStatusMsg');
  const btnSubmitCashPayment = document.getElementById('btnSubmitCashPayment');

  let activeCashOrder = null;

  function openCashPaymentModal(order) {
    activeCashOrder = order;
    cashQueueNo.textContent = `#${order.queueNumber}`;
    cashCustomerName.textContent = order.customerName || 'Pelanggan';
    cashTotalBill.textContent = formatRp(order.grandTotal);
    cashGivenInput.value = '';

    // Quick Nominal Pills Generator
    const bill = order.grandTotal;
    const nominals = [bill]; // Uang Pas
    [10000, 20000, 50000, 100000].forEach(nom => {
      if (nom > bill && !nominals.includes(nom)) {
        nominals.push(nom);
      }
    });

    quickCashPills.innerHTML = nominals.map(nom => {
      const isExact = nom === bill;
      return `
        <button type="button" class="quick-cash-btn ${isExact ? 'exact' : ''}" data-val="${nom}">
          ${isExact ? `Uang Pas (${formatRp(nom)})` : formatRp(nom)}
        </button>
      `;
    }).join('');

    quickCashPills.querySelectorAll('.quick-cash-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = Number(btn.getAttribute('data-val'));
        cashGivenInput.value = val;
        calculateCashChange();
      });
    });

    calculateCashChange();
    cashPaymentModal.classList.add('active');
    setTimeout(() => cashGivenInput.focus(), 100);
  }

  function calculateCashChange() {
    if (!activeCashOrder) return;
    const bill = activeCashOrder.grandTotal;
    const given = Number(cashGivenInput.value) || 0;
    const diff = given - bill;

    if (given <= 0) {
      cashChangeBox.className = 'cash-change-box';
      cashChangeAmount.textContent = 'Rp 0';
      cashChangeStatusMsg.textContent = 'Masukkan jumlah uang tunai yang diterima';
      btnSubmitCashPayment.disabled = true;
    } else if (diff < 0) {
      cashChangeBox.className = 'cash-change-box insufficient';
      cashChangeAmount.textContent = formatRp(diff);
      cashChangeStatusMsg.textContent = `Uang kurang ${formatRp(Math.abs(diff))}`;
      btnSubmitCashPayment.disabled = true;
    } else {
      cashChangeBox.className = 'cash-change-box';
      cashChangeAmount.textContent = formatRp(diff);
      cashChangeStatusMsg.textContent = diff === 0 ? 'Uang pas (tanpa kembalian)' : `Kembalian sebesar ${formatRp(diff)}`;
      btnSubmitCashPayment.disabled = false;
    }
  }

  cashGivenInput.addEventListener('input', calculateCashChange);

  const closeCashModal = () => {
    cashPaymentModal.classList.remove('active');
    activeCashOrder = null;
  };
  closeCashPaymentModal.addEventListener('click', closeCashModal);
  btnCancelCashPayment.addEventListener('click', closeCashModal);
  cashPaymentModal.addEventListener('click', (e) => {
    if (e.target === cashPaymentModal) closeCashModal();
  });

  btnSubmitCashPayment.addEventListener('click', () => {
    if (!activeCashOrder) return;
    const given = Number(cashGivenInput.value) || 0;
    const bill = activeCashOrder.grandTotal;
    if (given < bill) return;

    const change = given - bill;
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.orderId === activeCashOrder.orderId);

    if (orderIndex !== -1) {
      orders[orderIndex].status = 'LUNAS';
      orders[orderIndex].cashPaid = given;
      orders[orderIndex].cashChange = change;
      orders[orderIndex].paymentMethod = 'Cash (Lunas di Kasir)';
      saveOrders(orders);
      playSuccessChime();
      renderDashboard();
      closeCashModal();

      // Sync to Supabase Cloud Database
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.updateOrderStatus(activeCashOrder.orderId, 'LUNAS', given, change, 'Cash (Lunas di Kasir)');
      }

      // Open Receipt for immediate printing
      openReceiptModal(orders[orderIndex]);
    }
  });

  function handleOrderAction(action, orderId) {
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) return;

    const order = orders[orderIndex];

    if (action === 'confirm-pay') {
      openCashPaymentModal(order);
    } else if (action === 'checkin-rsv') {
      checkInReservation(orderId);
    } else if (action === 'settle-rsv') {
      openReservationSettleModal(orderId);
    } else if (action === 'disabled-mark-done') {
      alert('Pesanan belum bisa diambil karena dapur belum selesai memasak!\nMohon tunggu chef dapur menyelesaikan masakan di Portal Dapur.');
    } else if (action === 'mark-done') {
      if (!isKitchenFinished(order)) {
        alert('Pesanan belum bisa diambil karena dapur belum selesai memasak!\nMohon tunggu chef dapur menyelesaikan masakan di Portal Dapur.');
        return;
      }
      orders[orderIndex].status = 'SELESAI';
      orders[orderIndex].takenAt = new Date().toISOString();
      saveOrders(orders);
      renderDashboard();

      // Sync to Supabase Cloud Database
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.updateOrderStatus(orderId, 'SELESAI');
      }
    } else if (action === 'print-receipt') {
      if (order.status === 'MENUNGGU_BAYAR') {
        openCashPaymentModal(order);
      } else {
        openReceiptModal(order);
      }
    }
  }

  // ==========================================================================
  // LIVE TABLE MAP (DENAH MEJA) MODULE
  // ==========================================================================
  function renderLiveTableMap() {
    if (!kasirLiveTablesGrid) return;
    const orders = getOrders();
    kasirLiveTablesGrid.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
      const tableNo = `Meja ${String(i).padStart(2, '0')}`;
      
      // Find active walk-in or checked-in order on this table
      const activeOrder = orders.find(o => {
        const isTableMatch = o.tableInfo && (o.tableInfo.includes(tableNo) || (Array.isArray(o.tableNumbers) && o.tableNumbers.includes(tableNo)));
        const isActiveStatus = ['MENUNGGU_BAYAR', 'SEDANG_DIMASAK', 'DIPROSES', 'LUNAS'].includes(o.status);
        return isTableMatch && isActiveStatus;
      });

      // Find upcoming reservation for this table
      const upcomingRsv = orders.find(o => {
        const isRsv = o.diningType === 'RESERVASI' && o.status === 'DP_LUNAS';
        const isTableMatch = o.tableInfo && (o.tableInfo.includes(tableNo) || (Array.isArray(o.tableNumbers) && o.tableNumbers.includes(tableNo)));
        return isRsv && isTableMatch;
      });

      let statusType = 'available';
      let statusLabel = 'Kosong';
      let pillClass = 'green';

      if (activeOrder) {
        statusType = 'occupied';
        statusLabel = 'Terisi (Makan)';
        pillClass = 'red';
      } else if (upcomingRsv) {
        statusType = 'reserved';
        statusLabel = 'Ada Reservasi';
        pillClass = 'yellow';
      }

      const tableCard = document.createElement('div');
      tableCard.className = `live-table-card status-${statusType}`;
      tableCard.innerHTML = `
        <div class="table-card-top">
          <div>
            <div class="table-card-number">${tableNo}</div>
            <span class="table-card-cap">Kapasitas Maks. 5 Kursi</span>
          </div>
          <span class="table-status-pill ${pillClass}">${statusLabel}</span>
        </div>

        ${activeOrder ? `
          <div class="table-occupant-info">
            <div class="occupant-row">
              <span>Tamu:</span>
              <strong>${activeOrder.customerName} (#${activeOrder.queueNumber})</strong>
            </div>
            <div class="occupant-row">
              <span>Tagihan:</span>
              <strong style="color: #0066ff;">${formatRp(activeOrder.grandTotal)}</strong>
            </div>
            <div class="occupant-row">
              <span>Status Bayar:</span>
              <strong style="color: ${activeOrder.status === 'LUNAS' ? '#16a34a' : '#ea580c'};">${activeOrder.status}</strong>
            </div>
          </div>
          <div class="table-actions-row">
            <button type="button" class="btn-table-action danger" data-action="free-table" data-id="${activeOrder.orderId}">
              <span>Kosongkan Meja</span>
            </button>
            <button type="button" class="btn-table-action" data-action="print-receipt" data-id="${activeOrder.orderId}">
              <span>Struk</span>
            </button>
          </div>
        ` : upcomingRsv ? `
          <div class="table-occupant-info" style="background: #fffdf0; border-color: #fde68a;">
            <div class="occupant-row">
              <span>Acara:</span>
              <strong>${upcomingRsv.customerName}</strong>
            </div>
            <div class="occupant-row">
              <span>Jadwal:</span>
              <strong style="color: #b45309;">${upcomingRsv.eventDate || ''} ${upcomingRsv.eventTime || ''}</strong>
            </div>
            <div class="occupant-row">
              <span>Status DP:</span>
              <strong style="color: #16a34a;">LUNAS (${upcomingRsv.dpOption || '50%'})</strong>
            </div>
          </div>
          <div class="table-actions-row">
            <button type="button" class="btn-table-action primary" data-action="checkin-rsv" data-id="${upcomingRsv.orderId || upcomingRsv.reservationId}">
              <span>Tamu Datang (Check-In)</span>
            </button>
          </div>
        ` : `
          <div class="table-occupant-info" style="color: #64748b; text-align: center; padding: 16px 0;">
            <span>Siap digunakan untuk pelanggan walk-in atau reservasi.</span>
          </div>
          <div class="table-actions-row">
            <button type="button" class="btn-table-action primary" data-action="new-order-table" data-table="${tableNo}">
              <span>+ Pesan Meja Ini</span>
            </button>
          </div>
        `}
      `;

      tableCard.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action');
          const orderId = btn.getAttribute('data-id');
          const tNo = btn.getAttribute('data-table');

          if (action === 'free-table' && orderId) {
            handleOrderAction('mark-done', orderId);
            renderLiveTableMap();
          } else if (action === 'print-receipt' && orderId) {
            handleOrderAction('print-receipt', orderId);
          } else if (action === 'checkin-rsv' && orderId) {
            checkInReservation(orderId);
          } else if (action === 'new-order-table') {
            setActiveKasirView('orders');
          }
        });
      });

      kasirLiveTablesGrid.appendChild(tableCard);
    }
  }

  // ==========================================================================
  // RESERVATIONS MANAGEMENT MODULE
  // ==========================================================================
  function renderKasirReservations() {
    if (!kasirReservationsList) return;
    const orders = getOrders();
    const rsvList = orders.filter(o => o.diningType === 'RESERVASI');

    let filtered = rsvList;
    if (rsvFilter === 'UPCOMING') {
      filtered = rsvList.filter(r => r.status === 'DP_LUNAS');
    } else if (rsvFilter === 'SETTLED') {
      filtered = rsvList.filter(r => r.status === 'LUNAS' || r.status === 'SELESAI');
    }

    if (filtered.length === 0) {
      kasirReservationsList.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #ffffff; border-radius: 12px; border: 1.5px dashed #e2e8f0;">
          <h4 style="font-size: 16px; font-weight: 700; color: #1e293b;">Belum Ada Data Reservasi</h4>
          <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Reservasi dari pelanggan atau yang diinput di kasir akan muncul di sini.</p>
        </div>
      `;
      return;
    }

    kasirReservationsList.innerHTML = filtered.map(rsv => {
      const remaining = Math.max(0, (rsv.grandTotal || 0) - (rsv.dpPaid || 0));
      const isSettled = rsv.status === 'LUNAS' || rsv.status === 'SELESAI' || remaining === 0;
      const isCheckedIn = rsv.checkedIn === true || rsv.status === 'CHECK-IN' || rsv.status === 'DIPROSES';

      return `
        <article class="kasir-rsv-card">
          <div class="rsv-card-head">
            <div>
              <span class="rsv-card-id">${rsv.reservationId || rsv.orderId}</span>
              <h3 class="rsv-card-title">${rsv.customerName}</h3>
              <span class="rsv-card-phone">WA: ${rsv.phone || '-'}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <span class="table-status-pill ${isSettled ? 'green' : 'yellow'}">
                ${isSettled ? 'LUNAS' : `DP TERBAYAR (${formatRp(rsv.dpPaid || 0)})`}
              </span>
              ${isCheckedIn ? `
                <span class="table-status-pill green" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:11px;">
                  SUDAH CHECK-IN
                </span>
              ` : `
                <span class="table-status-pill yellow" style="background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; font-size:11px;">
                  BELUM CHECK-IN
                </span>
              `}
            </div>
          </div>

          <div class="rsv-details-grid">
            <div class="rsv-detail-item">
              <span>Jadwal Kedatangan:</span>
              <strong>${rsv.eventDate || '-'} ${rsv.eventTime ? `(${rsv.eventTime} WIB)` : ''}</strong>
            </div>
            <div class="rsv-detail-item">
              <span>Meja & Kursi:</span>
              <strong style="color: #0066ff;">${Array.isArray(rsv.tableNumbers) ? rsv.tableNumbers.join(', ') : (rsv.tableInfo || '-')} (${rsv.seats || '-'} Kursi)</strong>
            </div>
          </div>

          <div class="rsv-financial-summary">
            <div class="rsv-fin-row">
              <span>Total Nilai Pesanan (+Pajak 10%):</span>
              <strong>${formatRp(rsv.grandTotal)}</strong>
            </div>
            <div class="rsv-fin-row" style="color: #16a34a;">
              <span>DP Terbayar (${rsv.dpOption || '50%'}):</span>
              <strong>${formatRp(rsv.dpPaid || 0)} ${isSettled ? '(LUNAS)' : ''}</strong>
            </div>
            <div class="rsv-fin-row" style="color: ${remaining > 0 ? '#dc2626' : '#16a34a'}; font-weight: 700; border-top: 1px dashed #bfdbfe; padding-top: 4px; margin-top: 4px;">
              <span>Sisa Tagihan Pelunasan:</span>
              <strong>${formatRp(remaining)} ${remaining === 0 ? '(LUNAS)' : ''}</strong>
            </div>
          </div>

          <div class="rsv-card-actions">
            ${!isCheckedIn && rsv.status !== 'SELESAI' && rsv.status !== 'BATAL' ? `
              <button type="button" class="btn-rsv-checkin" data-action="checkin" data-id="${rsv.reservationId || rsv.orderId}">
                <span>Konfirmasi Tamu Check-In</span>
              </button>
            ` : ''}

            ${remaining > 0 ? `
              <button type="button" class="btn-rsv-settle" data-action="settle" data-id="${rsv.reservationId || rsv.orderId}">
                <span>Konfirmasi Lunas (${formatRp(remaining)})</span>
              </button>
            ` : ''}

            <button type="button" class="btn-rsv-print" data-action="print-rsv" data-id="${rsv.reservationId || rsv.orderId}">
              <span>Cetak Struk Reservasi</span>
            </button>
          </div>
        </article>
      `;
    }).join('');

    kasirReservationsList.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (action === 'checkin') checkInReservation(id);
        else if (action === 'settle') openReservationSettleModal(id);
        else if (action === 'print-rsv') printReservationReceipt(id);
      });
    });
  }

  // Filter Pills for Reservations
  document.querySelectorAll('.rsv-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.rsv-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      rsvFilter = pill.getAttribute('data-rsv-filter');
      renderKasirReservations();
    });
  });

  // Check-In Reservation (Pushes to Kitchen & Marks Table Occupied)
  function checkInReservation(id) {
    const orders = getOrders();
    const rsv = orders.find(o => (o.reservationId === id || o.orderId === id));
    if (!rsv) return;

    const remaining = Math.max(0, (rsv.grandTotal || 0) - (rsv.dpPaid || 0));
    const confirmMsg = `Konfirmasi kedatangan tamu: ${rsv.customerName} (${rsv.tableInfo})?\n` +
      (remaining > 0 ? `Catatan: Masih ada sisa tagihan pelunasan sebesar ${formatRp(remaining)}.\n` : '') +
      `Pesanan menu akan langsung diteruskan ke Layar Dapur.`;

    if (confirm(confirmMsg)) {
      rsv.checkedIn = true;
      rsv.checkInTime = new Date().toISOString();
      if (rsv.status !== 'SEDANG_DIMASAK' && rsv.status !== 'SIAP_SAJI' && rsv.status !== 'SELESAI') {
        rsv.status = 'CHECK-IN';
      }
      saveOrders(orders);
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.updateOrderStatus(rsv.orderId || id, rsv.status);
      }
      playNewOrderNotification();
      renderKasirReservations();
      renderLiveTableMap();
      renderDashboard();
      alert(`Tamu ${rsv.customerName} berhasil Check-In! Pesanan dikirim ke Dapur.`);
    }
  }

  // Settle Modal (Pelunasan Sisa)
  const modalReservationSettle = document.getElementById('modalReservationSettle');
  const closeRsvSettleModal = document.getElementById('closeRsvSettleModal');
  const btnCancelRsvSettle = document.getElementById('btnCancelRsvSettle');
  const settleRsvId = document.getElementById('settleRsvId');
  const settleCustomerName = document.getElementById('settleCustomerName');
  const settleTablesText = document.getElementById('settleTablesText');
  const settleGrandTotal = document.getElementById('settleGrandTotal');
  const settleDpPaid = document.getElementById('settleDpPaid');
  const settleRemainingBalance = document.getElementById('settleRemainingBalance');
  const settleCashGiven = document.getElementById('settleCashGiven');
  const settleQuickCashPills = document.getElementById('settleQuickCashPills');
  const settleChangeAmount = document.getElementById('settleChangeAmount');
  const settleChangeStatusMsg = document.getElementById('settleChangeStatusMsg');
  const btnConfirmRsvSettle = document.getElementById('btnConfirmRsvSettle');
  const settleCashInputGroup = document.getElementById('settleCashInputGroup');
  const settleChangeBox = document.getElementById('settleChangeBox');

  let activeSettleRsv = null;

  function openReservationSettleModal(id) {
    const orders = getOrders();
    activeSettleRsv = orders.find(o => (o.reservationId === id || o.orderId === id));
    if (!activeSettleRsv) return;

    const remaining = Math.max(0, activeSettleRsv.grandTotal - (activeSettleRsv.dpPaid || 0));

    settleRsvId.textContent = activeSettleRsv.reservationId || activeSettleRsv.orderId;
    settleCustomerName.textContent = activeSettleRsv.customerName;
    settleTablesText.textContent = Array.isArray(activeSettleRsv.tableNumbers) ? activeSettleRsv.tableNumbers.join(', ') : (activeSettleRsv.tableInfo || '-');
    settleGrandTotal.textContent = formatRp(activeSettleRsv.grandTotal);
    settleDpPaid.textContent = formatRp(activeSettleRsv.dpPaid || 0);
    settleRemainingBalance.textContent = formatRp(remaining);
    settleCashGiven.value = '';

    // Generate Quick Cash Pills
    const nominals = [remaining];
    [10000, 20000, 50000, 100000].forEach(nom => {
      if (nom > remaining && !nominals.includes(nom)) nominals.push(nom);
    });

    settleQuickCashPills.innerHTML = nominals.map(nom => `
      <button type="button" class="quick-cash-btn ${nom === remaining ? 'exact' : ''}" data-val="${nom}">
        ${nom === remaining ? 'Uang Pas' : formatRp(nom)}
      </button>
    `).join('');

    settleQuickCashPills.querySelectorAll('.quick-cash-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settleCashGiven.value = btn.getAttribute('data-val');
        updateSettleCashCalculations();
      });
    });

    updateSettleCashCalculations();
    modalReservationSettle.classList.add('active');
  }

  function updateSettleCashCalculations() {
    if (!activeSettleRsv) return;
    const remaining = Math.max(0, activeSettleRsv.grandTotal - (activeSettleRsv.dpPaid || 0));
    const isCash = document.querySelector('input[name="settleMethod"]:checked')?.value === 'Cash';

    if (!isCash) {
      if (settleCashInputGroup) settleCashInputGroup.style.display = 'none';
      if (settleChangeBox) settleChangeBox.style.display = 'none';
      btnConfirmRsvSettle.disabled = false;
      return;
    }

    if (settleCashInputGroup) settleCashInputGroup.style.display = 'block';
    if (settleChangeBox) settleChangeBox.style.display = 'flex';

    const given = parseFloat(settleCashGiven.value) || 0;
    const change = given - remaining;

    if (given >= remaining) {
      settleChangeAmount.textContent = formatRp(change);
      settleChangeStatusMsg.className = 'change-status-msg valid';
      settleChangeStatusMsg.textContent = change === 0 ? 'Uang pas, siap diproses!' : `Kembalian pelanggan: ${formatRp(change)}`;
      btnConfirmRsvSettle.disabled = false;
    } else {
      settleChangeAmount.textContent = 'Rp 0';
      settleChangeStatusMsg.className = 'change-status-msg';
      settleChangeStatusMsg.textContent = `Kurang ${formatRp(remaining - given)}`;
      btnConfirmRsvSettle.disabled = true;
    }
  }

  if (settleCashGiven) settleCashGiven.addEventListener('input', updateSettleCashCalculations);
  document.querySelectorAll('input[name="settleMethod"]').forEach(r => r.addEventListener('change', updateSettleCashCalculations));

  if (btnConfirmRsvSettle) {
    btnConfirmRsvSettle.addEventListener('click', () => {
      if (!activeSettleRsv) return;
      const orders = getOrders();
      const rsv = orders.find(o => (o.reservationId === activeSettleRsv.reservationId || o.orderId === activeSettleRsv.orderId));
      if (!rsv) return;

      const remaining = Math.max(0, rsv.grandTotal - (rsv.dpPaid || 0));
      const isCash = document.querySelector('input[name="settleMethod"]:checked')?.value === 'Cash';
      const given = isCash ? (parseFloat(settleCashGiven.value) || remaining) : remaining;
      const change = Math.max(0, given - remaining);

      // If already checked-in, preserve checked-in status so button doesn't reappear
      const wasCheckedIn = rsv.checkedIn === true || rsv.status === 'CHECK-IN' || rsv.status === 'DIPROSES' || rsv.status === 'SEDANG_DIMASAK' || rsv.status === 'SIAP_SAJI';
      if (wasCheckedIn) {
        rsv.checkedIn = true;
        if (rsv.status !== 'SEDANG_DIMASAK' && rsv.status !== 'SIAP_SAJI' && rsv.status !== 'SELESAI') {
          rsv.status = 'CHECK-IN';
        }
      } else {
        rsv.status = 'LUNAS';
      }

      rsv.dpPaid = rsv.grandTotal;
      rsv.remainingBalance = 0;
      rsv.paymentMethod = `${rsv.paymentMethod || 'Cashless'} + ${isCash ? 'Cash' : 'QRIS'} (Pelunasan)`;
      rsv.cashPaid = given;
      rsv.cashChange = change;

      saveOrders(orders);
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.settleReservation(rsv.reservationId || rsv.orderId, remaining, isCash ? 'Cash' : 'QRIS', rsv.status);
      }

      modalReservationSettle.classList.remove('active');
      renderKasirReservations();
      renderLiveTableMap();
      renderDashboard();
      printReservationReceipt(rsv.reservationId || rsv.orderId);
      alert(`Pelunasan reservasi #${rsv.queueNumber || rsv.orderId} (${rsv.customerName}) berhasil dikonfirmasi LUNAS!`);
    });
  }

  if (closeRsvSettleModal) closeRsvSettleModal.addEventListener('click', () => modalReservationSettle.classList.remove('active'));
  if (btnCancelRsvSettle) btnCancelRsvSettle.addEventListener('click', () => modalReservationSettle.classList.remove('active'));

  // Print Reservation Receipt
  function printReservationReceipt(id) {
    const orders = getOrders();
    const rsv = orders.find(o => (o.reservationId === id || o.orderId === id));
    if (!rsv) return;

    receiptContent.innerHTML = `
      <div class="receipt-row">
        <span>No. Reservasi:</span>
        <strong style="color: #0066ff;">${rsv.reservationId || rsv.orderId}</strong>
      </div>
      <div class="receipt-row">
        <span>Nama Acara / Pemesan:</span>
        <strong>${rsv.customerName}</strong>
      </div>
      <div class="receipt-row">
        <span>WhatsApp:</span>
        <span>${rsv.phone || '-'}</span>
      </div>
      <div class="receipt-row">
        <span>Jadwal Kedatangan:</span>
        <span>${rsv.eventDate || '-'} pukul ${rsv.eventTime || '-'}</span>
      </div>
      <div class="receipt-row">
        <span>Meja / Kursi:</span>
        <span>${Array.isArray(rsv.tableNumbers) ? rsv.tableNumbers.join(', ') : (rsv.tableInfo || '-')} (${rsv.seats || '-'} Kursi)</span>
      </div>
      <div class="receipt-row">
        <span>Metode Pembayaran:</span>
        <span>${rsv.paymentMethod || 'Cashless'}</span>
      </div>
      <div class="receipt-divider"></div>
      <div>
        ${(rsv.items || []).map(item => `
          <div class="receipt-row">
            <span>${item.qty}x ${item.title}</span>
            <span>${formatRp(item.price * item.qty || item.total)}</span>
          </div>
        `).join('')}
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-row">
        <span>Subtotal Menu:</span>
        <span>${formatRp(rsv.subtotal)}</span>
      </div>
      <div class="receipt-row">
        <span>PB1 (Pajak 10%):</span>
        <span>${formatRp(rsv.tax)}</span>
      </div>
      <div class="receipt-row" style="font-size: 14px; font-weight: 800; margin-top: 4px;">
        <span>TOTAL TAGIHAN:</span>
        <span>${formatRp(rsv.grandTotal)}</span>
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-row" style="color: #16a34a; font-weight: 700;">
        <span>DP 50% (Awal):</span>
        <span>${formatRp(rsv.dpOption === '100%' ? rsv.grandTotal : Math.round(rsv.grandTotal * 0.5))} (LUNAS)</span>
      </div>
      <div class="receipt-row" style="font-weight: 700;">
        <span>Status Pelunasan:</span>
        <span style="color: ${rsv.status === 'LUNAS' || rsv.status === 'SELESAI' ? '#16a34a' : '#dc2626'};">${rsv.status === 'LUNAS' || rsv.status === 'SELESAI' ? 'LUNAS (100%)' : 'BELUM DILUNASI'}</span>
      </div>
      ${rsv.cashPaid ? `
        <div class="receipt-row">
          <span>Uang Diterima:</span>
          <span>${formatRp(rsv.cashPaid)}</span>
        </div>
        <div class="receipt-row">
          <span>Kembalian:</span>
          <span>${formatRp(rsv.cashChange || 0)}</span>
        </div>
      ` : ''}
      <div class="receipt-divider"></div>
      <p style="text-align: center; font-size: 11px; margin-top: 8px;">Simpan struk ini sebagai bukti reservasi resmi Mie Gacoan.</p>
    `;
    receiptModal.classList.add('active');
  }

  // ==========================================================================
  // CASHIER NEW RESERVATION FORM MODAL MODULE
  // ==========================================================================
  const modalKasirNewReservation = document.getElementById('modalKasirNewReservation');
  const btnKasirNewRsv = document.getElementById('btnKasirNewRsv');
  const closeKasirNewRsv = document.getElementById('closeKasirNewRsv');
  const kasirRsvForm = document.getElementById('kasirRsvForm');

  const kRsvCustomerName = document.getElementById('kRsvCustomerName');
  const kRsvPhone = document.getElementById('kRsvPhone');
  const kRsvDate = document.getElementById('kRsvDate');
  const kRsvTime = document.getElementById('kRsvTime');
  const kRsvTablesGrid = document.getElementById('kRsvTablesGrid');
  const kRsvSelectedTablesText = document.getElementById('kRsvSelectedTablesText');
  const kRsvMaxCapacityText = document.getElementById('kRsvMaxCapacityText');
  const kRsvSeatsCount = document.getElementById('kRsvSeatsCount');
  const kBtnSeatMinus = document.getElementById('kBtnSeatMinus');
  const kBtnSeatPlus = document.getElementById('kBtnSeatPlus');
  const kRsvSeatMultiplier = document.getElementById('kRsvSeatMultiplier');
  const kRsvMinSpendAmount = document.getElementById('kRsvMinSpendAmount');
  const kRsvCurrentMenuTotal = document.getElementById('kRsvCurrentMenuTotal');
  const kSpendAlertMsg = document.getElementById('kSpendAlertMsg');
  const kRsvMenuList = document.getElementById('kRsvMenuList');

  const kDpOption50Label = document.getElementById('kDpOption50Label');
  const kDpOption100Label = document.getElementById('kDpOption100Label');
  const kRsvDp50Amount = document.getElementById('kRsvDp50Amount');
  const kRsvDp50Remain = document.getElementById('kRsvDp50Remain');
  const kRsvDp100Amount = document.getElementById('kRsvDp100Amount');
  const kRsvPayableNow = document.getElementById('kRsvPayableNow');

  let kSelectedTables = ['Meja 01'];
  let kMenuSelections = {};

  function getKasirBookedTablesForDate(selectedDate) {
    const booked = new Set();
    if (!selectedDate) return booked;
    const allOrders = getAllOrders();
    allOrders.forEach(o => {
      const isRsv = o.diningType === 'RESERVASI' || (o.orderId && o.orderId.startsWith('RSV-')) || (o.reservationId && String(o.reservationId).startsWith('RSV-'));
      const isNotCancelled = o.status !== 'BATAL' && o.status !== 'CANCELLED';
      const orderDate = (o.eventDate || '').trim();

      if (isRsv && isNotCancelled && orderDate === selectedDate.trim()) {
        if (Array.isArray(o.tableNumbers)) {
          o.tableNumbers.forEach(t => booked.add(String(t).trim()));
        } else if (o.tableInfo) {
          o.tableInfo.split(',').forEach(t => booked.add(t.trim()));
        }
      }
    });
    return booked;
  }

  if (kRsvDate) {
    const today = new Date();
    kRsvDate.min = today.toISOString().split('T')[0];
    const tmr = new Date(today);
    tmr.setDate(tmr.getDate() + 1);
    kRsvDate.value = tmr.toISOString().split('T')[0];

    kRsvDate.addEventListener('change', () => {
      renderKasirTableSelection();
      updateKasirRsvCalculations();
    });
  }
  if (kRsvTime) kRsvTime.value = '18:00';

  if (btnKasirNewRsv) {
    btnKasirNewRsv.addEventListener('click', () => {
      kSelectedTables = ['Meja 01'];
      kMenuSelections = {};
      renderKasirTableSelection();
      renderKasirMenuList();
      updateKasirRsvCalculations();
      modalKasirNewReservation.classList.add('active');
    });
  }

  if (closeKasirNewRsv) closeKasirNewRsv.addEventListener('click', () => modalKasirNewReservation.classList.remove('active'));

  function renderKasirTableSelection() {
    if (!kRsvTablesGrid) return;
    kRsvTablesGrid.innerHTML = '';

    const selectedDate = kRsvDate ? kRsvDate.value : '';
    const bookedTables = getKasirBookedTablesForDate(selectedDate);

    kSelectedTables = kSelectedTables.filter(t => !bookedTables.has(t));
    if (kSelectedTables.length === 0) {
      for (let i = 1; i <= 12; i++) {
        const tNo = `Meja ${String(i).padStart(2, '0')}`;
        if (!bookedTables.has(tNo)) {
          kSelectedTables = [tNo];
          break;
        }
      }
    }

    for (let i = 1; i <= 12; i++) {
      const tableNo = `Meja ${String(i).padStart(2, '0')}`;
      const isBooked = bookedTables.has(tableNo);
      const isSelected = !isBooked && kSelectedTables.includes(tableNo);

      const el = document.createElement('div');
      el.className = `rsv-table-card ${isBooked ? 'booked disabled' : ''} ${isSelected ? 'selected' : ''}`;
      
      if (isBooked) {
        el.title = `${tableNo} sudah direservasi pada ${selectedDate}`;
        el.innerHTML = `<span class="table-no-label">${tableNo}</span><span class="table-cap-label">Direservasi</span>`;
      } else {
        el.innerHTML = `<span class="table-no-label">${tableNo}</span><span class="table-cap-label">Maks 5 Kursi</span>`;

        el.addEventListener('click', () => {
          if (kSelectedTables.includes(tableNo)) {
            if (kSelectedTables.length > 1) kSelectedTables = kSelectedTables.filter(t => t !== tableNo);
          } else {
            kSelectedTables.push(tableNo);
          }
          renderKasirTableSelection();
          updateKasirRsvCalculations();
        });
      }

      kRsvTablesGrid.appendChild(el);
    }
    if (kRsvSelectedTablesText) kRsvSelectedTablesText.textContent = kSelectedTables.length > 0 ? kSelectedTables.join(', ') : 'Belum dipilih / penuh';
    if (kRsvMaxCapacityText) kRsvMaxCapacityText.textContent = `(Kapasitas Maks: ${kSelectedTables.length * 5} Kursi)`;
  }

  if (kBtnSeatMinus && kRsvSeatsCount) {
    kBtnSeatMinus.addEventListener('click', () => {
      let val = parseInt(kRsvSeatsCount.value) || 1;
      if (val > 1) {
        kRsvSeatsCount.value = val - 1;
        updateKasirRsvCalculations();
      }
    });
  }

  if (kBtnSeatPlus && kRsvSeatsCount) {
    kBtnSeatPlus.addEventListener('click', () => {
      let val = parseInt(kRsvSeatsCount.value) || 1;
      if (val < kSelectedTables.length * 5) {
        kRsvSeatsCount.value = val + 1;
        updateKasirRsvCalculations();
      }
    });
  }

  if (kRsvSeatsCount) kRsvSeatsCount.addEventListener('input', updateKasirRsvCalculations);

  function renderKasirMenuList() {
    if (!kRsvMenuList) return;
    const prods = getProducts();
    kRsvMenuList.innerHTML = '';
    prods.forEach(p => {
      const qty = kMenuSelections[p.id] || 0;
      const el = document.createElement('div');
      el.className = 'rsv-menu-item';
      el.innerHTML = `
        <img src="${p.img || 'Menu/mie gacoan.webp'}" alt="${p.title}" class="rsv-menu-thumb" />
        <div class="rsv-menu-details">
          <div class="rsv-menu-name">${p.title}</div>
          <div class="rsv-menu-price">${formatRp(p.price)}</div>
        </div>
        <div class="rsv-menu-qty-ctrl">
          <button type="button" class="btn-rsv-qty minus-btn" ${qty === 0 ? 'disabled' : ''}>&minus;</button>
          <span class="rsv-qty-val">${qty}</span>
          <button type="button" class="btn-rsv-qty plus-btn">&plus;</button>
        </div>
      `;

      el.querySelector('.minus-btn').addEventListener('click', () => {
        if (kMenuSelections[p.id] > 0) {
          kMenuSelections[p.id]--;
          if (kMenuSelections[p.id] === 0) delete kMenuSelections[p.id];
          renderKasirMenuList();
          updateKasirRsvCalculations();
        }
      });

      el.querySelector('.plus-btn').addEventListener('click', () => {
        kMenuSelections[p.id] = (kMenuSelections[p.id] || 0) + 1;
        renderKasirMenuList();
        updateKasirRsvCalculations();
      });

      kRsvMenuList.appendChild(el);
    });
  }

  if (kDpOption50Label && kDpOption100Label) {
    kDpOption50Label.addEventListener('click', () => {
      kDpOption50Label.classList.add('active');
      kDpOption100Label.classList.remove('active');
      updateKasirRsvCalculations();
    });
    kDpOption100Label.addEventListener('click', () => {
      kDpOption100Label.classList.add('active');
      kDpOption50Label.classList.remove('active');
      updateKasirRsvCalculations();
    });
  }

  function updateKasirRsvCalculations() {
    const seats = Math.max(1, parseInt(kRsvSeatsCount.value) || 1);
    const minSpend = seats * 15000;
    if (kRsvSeatMultiplier) kRsvSeatMultiplier.textContent = seats;
    if (kRsvMinSpendAmount) kRsvMinSpendAmount.textContent = formatRp(minSpend);

    const prods = getProducts();
    let subtotal = 0;
    Object.keys(kMenuSelections).forEach(id => {
      const p = prods.find(pr => pr.id === id);
      if (p) subtotal += p.price * kMenuSelections[id];
    });

    if (kRsvCurrentMenuTotal) kRsvCurrentMenuTotal.textContent = formatRp(subtotal);

    if (kSpendAlertMsg) {
      if (subtotal >= minSpend) {
        kSpendAlertMsg.className = 'spend-alert-msg met';
        kSpendAlertMsg.innerHTML = `Minimal belanja <strong>${formatRp(minSpend)}</strong> terpenuhi!`;
      } else {
        kSpendAlertMsg.className = 'spend-alert-msg';
        kSpendAlertMsg.innerHTML = `Kurang <strong>${formatRp(minSpend - subtotal)}</strong> lagi`;
      }
    }

    const tax = Math.round(subtotal * 0.1);
    const grandTotal = subtotal + tax;
    const dp50 = Math.round(grandTotal * 0.5);

    if (kRsvDp50Amount) kRsvDp50Amount.textContent = formatRp(dp50);
    if (kRsvDp50Remain) kRsvDp50Remain.textContent = formatRp(grandTotal - dp50);
    if (kRsvDp100Amount) kRsvDp100Amount.textContent = formatRp(grandTotal);

    const isDp50 = document.querySelector('input[name="kRsvDpOption"]:checked')?.value === '50';
    const payable = isDp50 ? dp50 : grandTotal;
    if (kRsvPayableNow) kRsvPayableNow.textContent = formatRp(payable);
  }

  if (kasirRsvForm) {
    kasirRsvForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const customerName = kRsvCustomerName.value.trim();
      const phone = kRsvPhone.value.trim();
      const eventDate = kRsvDate.value;
      const eventTime = kRsvTime.value;
      const seats = parseInt(kRsvSeatsCount.value) || 1;
      if (kSelectedTables.length === 0) {
        alert('Silakan pilih minimal 1 meja!');
        return;
      }
      const bookedOnDate = getKasirBookedTablesForDate(eventDate);
      const conflictTables = kSelectedTables.filter(t => bookedOnDate.has(t));
      if (conflictTables.length > 0) {
        alert(`Meja ${conflictTables.join(', ')} sudah direservasi pada tanggal ${eventDate}. Silakan pilih meja lain.`);
        renderKasirTableSelection();
        return;
      }

      const minSpend = seats * 15000;

      const prods = getProducts();
      let subtotal = 0;
      const items = [];
      Object.keys(kMenuSelections).forEach(id => {
        const p = prods.find(pr => pr.id === id);
        if (p && kMenuSelections[id] > 0) {
          const t = p.price * kMenuSelections[id];
          subtotal += t;
          items.push({ id: p.id, title: p.title, price: p.price, qty: kMenuSelections[id], total: t });
        }
      });

      if (subtotal < minSpend) {
        alert(`Minimal belanja belum terpenuhi (${formatRp(minSpend)}). Silakan tambah menu.`);
        return;
      }

      const tax = Math.round(subtotal * 0.1);
      const grandTotal = subtotal + tax;
      const isDp50 = document.querySelector('input[name="kRsvDpOption"]:checked')?.value === '50';
      const dpAmount = isDp50 ? Math.round(grandTotal * 0.5) : grandTotal;
      const payMethod = document.querySelector('input[name="kRsvPayMethod"]:checked')?.value || 'Cash (Kasir)';
      const rsvId = 'RSV-' + Date.now();

      const newRsv = {
        reservationId: rsvId,
        orderId: rsvId,
        queueNumber: 'RSV-' + rsvId.slice(-4),
        customerName: customerName,
        phone: phone,
        eventDate: eventDate,
        eventTime: eventTime,
        tableNumbers: kSelectedTables,
        tableInfo: kSelectedTables.join(', '),
        seats: seats,
        diningType: 'RESERVASI',
        paymentMethod: payMethod,
        items: items,
        subtotal: subtotal,
        tax: tax,
        grandTotal: grandTotal,
        dpPaid: dpAmount,
        dpOption: isDp50 ? '50%' : '100%',
        remainingBalance: isDp50 ? (grandTotal - dpAmount) : 0,
        status: isDp50 ? 'DP_LUNAS' : 'LUNAS',
        createdAt: new Date().toISOString()
      };

      const orders = getOrders();
      orders.push(newRsv);
      saveOrders(orders);

      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.insertReservation(newRsv);
      }

      modalKasirNewReservation.classList.remove('active');
      renderKasirReservations();
      renderLiveTableMap();
      renderDashboard();
      printReservationReceipt(rsvId);
    });
  }

  // ----------------------------------------------------------------------
  // DATA & LAPORAN PENJUALAN (Harian, Bulanan, Tahunan)
  // ----------------------------------------------------------------------
  let salesPeriodMode = 'DAILY'; // 'DAILY' | 'MONTHLY' | 'YEARLY'
  let salesSearchQuery = '';

  const btnPeriodDaily = document.getElementById('btnPeriodDaily');
  const btnPeriodMonthly = document.getElementById('btnPeriodMonthly');
  const btnPeriodYearly = document.getElementById('btnPeriodYearly');
  const salesInputDaily = document.getElementById('salesInputDaily');
  const salesInputMonthly = document.getElementById('salesInputMonthly');
  const salesSelectYearly = document.getElementById('salesSelectYearly');
  const btnResetSalesPeriod = document.getElementById('btnResetSalesPeriod');
  const btnExportSalesCSV = document.getElementById('btnExportSalesCSV');

  const salesPeriodBadgeLabel = document.getElementById('salesPeriodBadgeLabel');
  const salesTotalRevenue = document.getElementById('salesTotalRevenue');
  const salesPeriodDateText = document.getElementById('salesPeriodDateText');
  const salesTotalOrdersCount = document.getElementById('salesTotalOrdersCount');
  const salesAvgPerOrder = document.getElementById('salesAvgPerOrder');
  const salesTotalItemsSold = document.getElementById('salesTotalItemsSold');
  const salesTopSellersList = document.getElementById('salesTopSellersList');
  const salesHistorySearch = document.getElementById('salesHistorySearch');
  const salesTransactionsTableBody = document.getElementById('salesTransactionsTableBody');

  function initSalesControls() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    if (salesInputDaily) salesInputDaily.value = `${yyyy}-${mm}-${dd}`;
    if (salesInputMonthly) salesInputMonthly.value = `${yyyy}-${mm}`;

    if (salesSelectYearly) {
      salesSelectYearly.innerHTML = '';
      for (let y = yyyy; y >= yyyy - 5; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = `Tahun ${y}`;
        salesSelectYearly.appendChild(opt);
      }
      salesSelectYearly.value = String(yyyy);
    }
  }

  function setSalesPeriodMode(mode) {
    salesPeriodMode = mode;
    [btnPeriodDaily, btnPeriodMonthly, btnPeriodYearly].forEach(btn => btn && btn.classList.remove('active'));
    if (salesInputDaily) salesInputDaily.style.display = 'none';
    if (salesInputMonthly) salesInputMonthly.style.display = 'none';
    if (salesSelectYearly) salesSelectYearly.style.display = 'none';

    if (mode === 'DAILY') {
      if (btnPeriodDaily) btnPeriodDaily.classList.add('active');
      if (salesInputDaily) salesInputDaily.style.display = 'block';
      if (salesPeriodBadgeLabel) salesPeriodBadgeLabel.textContent = 'Harian';
    } else if (mode === 'MONTHLY') {
      if (btnPeriodMonthly) btnPeriodMonthly.classList.add('active');
      if (salesInputMonthly) salesInputMonthly.style.display = 'block';
      if (salesPeriodBadgeLabel) salesPeriodBadgeLabel.textContent = 'Bulanan';
    } else if (mode === 'YEARLY') {
      if (btnPeriodYearly) btnPeriodYearly.classList.add('active');
      if (salesSelectYearly) salesSelectYearly.style.display = 'block';
      if (salesPeriodBadgeLabel) salesPeriodBadgeLabel.textContent = 'Tahunan';
    }
    renderSalesReport();
  }

  function renderSalesReport() {
    const allOrders = getOrders();

    let targetDate = new Date();
    let periodText = '';

    if (salesPeriodMode === 'DAILY') {
      if (salesInputDaily && salesInputDaily.value) {
        const [y, m, d] = salesInputDaily.value.split('-').map(Number);
        targetDate = new Date(y, m - 1, d);
      }
      const isToday = isSameDay(targetDate, new Date());
      periodText = (isToday ? 'Hari Ini (' : 'Tanggal ') + targetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + (isToday ? ')' : '');
    } else if (salesPeriodMode === 'MONTHLY') {
      if (salesInputMonthly && salesInputMonthly.value) {
        const [y, m] = salesInputMonthly.value.split('-').map(Number);
        targetDate = new Date(y, m - 1, 1);
      }
      periodText = 'Bulan ' + targetDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } else if (salesPeriodMode === 'YEARLY') {
      if (salesSelectYearly && salesSelectYearly.value) {
        targetDate = new Date(Number(salesSelectYearly.value), 0, 1);
      }
      periodText = 'Tahun ' + targetDate.getFullYear();
    }

    if (salesPeriodDateText) salesPeriodDateText.textContent = periodText;

    // Filter orders by active period
    const periodOrders = allOrders.filter(order => {
      const orderDate = parseOrderDate(order);
      if (salesPeriodMode === 'DAILY') return isSameDay(orderDate, targetDate);
      if (salesPeriodMode === 'MONTHLY') return isSameMonth(orderDate, targetDate);
      if (salesPeriodMode === 'YEARLY') return isSameYear(orderDate, targetDate);
      return true;
    });

    const paidOrders = periodOrders.filter(o => 
      o.status === 'LUNAS' || o.status === 'SEDANG_DIMASAK' || o.status === 'SELESAI' || o.status === 'DP_LUNAS'
    );

    const totalRev = paidOrders.reduce((sum, o) => {
      if (o.status === 'DP_LUNAS' && o.dpPaid) return sum + Number(o.dpPaid || 0);
      return sum + Number(o.grandTotal || 0);
    }, 0);

    const totalOrdersCount = paidOrders.length;
    const avgOrderVal = totalOrdersCount > 0 ? Math.round(totalRev / totalOrdersCount) : 0;

    let totalItemsCount = 0;
    const menuStatsMap = {};

    paidOrders.forEach(order => {
      const itemsList = getOrderItemsList(order);
      itemsList.forEach(item => {
        const qty = Number(item.qty || 1);
        totalItemsCount += qty;
        const key = item.id || item.title || 'Item Lain';
        const title = item.title || item.name || 'Menu Gacoan';
        const price = Number(item.unitPrice || item.price || 0);
        const lineTotal = Number(item.total || (price * qty));

        if (!menuStatsMap[key]) {
          menuStatsMap[key] = {
            id: key,
            title: title,
            qty: 0,
            revenue: 0
          };
        }
        menuStatsMap[key].qty += qty;
        menuStatsMap[key].revenue += lineTotal;
      });
    });

    if (salesTotalRevenue) salesTotalRevenue.textContent = formatRp(totalRev);
    if (salesTotalOrdersCount) salesTotalOrdersCount.textContent = `${totalOrdersCount} Transaksi`;
    if (salesAvgPerOrder) salesAvgPerOrder.textContent = formatRp(avgOrderVal);
    if (salesTotalItemsSold) salesTotalItemsSold.textContent = `${totalItemsCount} Porsi`;

    // Render Best Sellers
    const sortedBestSellers = Object.values(menuStatsMap).sort((a, b) => b.qty - a.qty);
    if (salesTopSellersList) {
      if (sortedBestSellers.length === 0) {
        salesTopSellersList.innerHTML = `
          <div style="text-align: center; padding: 24px 10px; color: #94a3b8; font-size: 13px;">
            Belum ada data penjualan pada periode ini.
          </div>
        `;
      } else {
        salesTopSellersList.innerHTML = sortedBestSellers.slice(0, 8).map((item, idx) => {
          let rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : ''));
          return `
            <div class="top-seller-item">
              <div class="top-seller-left">
                <span class="seller-rank-badge ${rankClass}">#${idx + 1}</span>
                <div class="seller-item-info">
                  <span class="seller-item-title">${item.title}</span>
                  <span class="seller-item-meta">${item.qty} porsi terjual</span>
                </div>
              </div>
              <div class="top-seller-right">
                <div class="seller-item-qty">${formatRp(item.revenue)}</div>
                <div class="seller-item-rev">Omset</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Transactions Table
    renderSalesTransactionsTable(paidOrders, allOrders);
  }

  function renderSalesTransactionsTable(paidOrders, allOrders) {
    if (!salesTransactionsTableBody) return;

    let filtered = [...paidOrders].reverse();
    if (salesSearchQuery) {
      const q = salesSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(o => {
        const qNo = (o.queueNumber || '').toLowerCase();
        const oId = (o.orderId || '').toLowerCase();
        const cName = (o.customerName || '').toLowerCase();
        const tInfo = (o.tableInfo || '').toLowerCase();
        const pMethod = (o.paymentMethod || '').toLowerCase();
        return qNo.includes(q) || oId.includes(q) || cName.includes(q) || tInfo.includes(q) || pMethod.includes(q);
      });
    }

    if (filtered.length === 0) {
      salesTransactionsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px 16px; color: #94a3b8; font-size: 13px;">
            Tidak ada transaksi lunas yang ditemukan pada periode ini.
          </td>
        </tr>
      `;
      return;
    }

    salesTransactionsTableBody.innerHTML = filtered.map(order => {
      const itemsList = getOrderItemsList(order);
      const itemsSummary = itemsList.map(i => `${i.qty}x ${i.title || i.name}`).join(', ');
      const orderDate = parseOrderDate(order);
      const timeStr = orderDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      const dateStr = orderDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const revVal = (order.status === 'DP_LUNAS' && order.dpPaid) ? order.dpPaid : (order.grandTotal || 0);

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #1e293b;">${timeStr}</div>
            <div style="font-size: 11px; color: #94a3b8;">${dateStr}</div>
          </td>
          <td>
            <strong style="color: #0066ff;">#${order.queueNumber || order.orderId}</strong>
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${order.customerName || 'Pelanggan'}</div>
            <div style="font-size: 11.5px; color: #64748b;">${order.tableInfo || 'Dine In'}</div>
          </td>
          <td>
            <span style="font-size: 11.5px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 3px 8px; border-radius: 4px;">
              ${order.paymentMethod || 'Cash'}
            </span>
          </td>
          <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsSummary}">
            ${itemsSummary}
          </td>
          <td>
            <strong style="color: #16a34a; font-size: 13.5px;">${formatRp(revVal)}</strong>
          </td>
          <td style="text-align: center;">
            <button type="button" class="sales-btn-receipt" data-order-id="${order.orderId || order.queueNumber}" title="Cetak / Lihat Struk">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Struk</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    salesTransactionsTableBody.querySelectorAll('.sales-btn-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-order-id');
        const found = allOrders.find(o => o.orderId === id || o.queueNumber === id);
        if (found) openReceiptModal(found);
      });
    });
  }

  function exportSalesToCSV() {
    const allOrders = getOrders();
    let targetDate = new Date();

    if (salesPeriodMode === 'DAILY') {
      if (salesInputDaily && salesInputDaily.value) {
        const [y, m, d] = salesInputDaily.value.split('-').map(Number);
        targetDate = new Date(y, m - 1, d);
      }
    } else if (salesPeriodMode === 'MONTHLY') {
      if (salesInputMonthly && salesInputMonthly.value) {
        const [y, m] = salesInputMonthly.value.split('-').map(Number);
        targetDate = new Date(y, m - 1, 1);
      }
    } else if (salesSelectYearly && salesSelectYearly.value) {
      targetDate = new Date(Number(salesSelectYearly.value), 0, 1);
    }

    const periodOrders = allOrders.filter(order => {
      const orderDate = parseOrderDate(order);
      if (salesPeriodMode === 'DAILY') return isSameDay(orderDate, targetDate);
      if (salesPeriodMode === 'MONTHLY') return isSameMonth(orderDate, targetDate);
      if (salesPeriodMode === 'YEARLY') return isSameYear(orderDate, targetDate);
      return true;
    }).filter(o => o.status === 'LUNAS' || o.status === 'SEDANG_DIMASAK' || o.status === 'SELESAI' || o.status === 'DP_LUNAS');

    if (periodOrders.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor pada periode ini.');
      return;
    }

    let csv = 'No Antrian,Order ID,Waktu,Pelanggan,Meja/Tipe,Metode Bayar,Total Omset,Status\n';
    periodOrders.forEach(o => {
      const d = parseOrderDate(o);
      const timeStr = `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID')}`;
      const rev = (o.status === 'DP_LUNAS' && o.dpPaid) ? o.dpPaid : (o.grandTotal || 0);
      csv += `"${o.queueNumber || ''}","${o.orderId || ''}","${timeStr}","${(o.customerName || '').replace(/"/g, '""')}","${(o.tableInfo || '').replace(/"/g, '""')}","${o.paymentMethod || ''}","${rev}","${o.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan_penjualan_gacoan_${salesPeriodMode.toLowerCase()}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Attach Sales Controls Listeners
  if (btnPeriodDaily) btnPeriodDaily.addEventListener('click', () => setSalesPeriodMode('DAILY'));
  if (btnPeriodMonthly) btnPeriodMonthly.addEventListener('click', () => setSalesPeriodMode('MONTHLY'));
  if (btnPeriodYearly) btnPeriodYearly.addEventListener('click', () => setSalesPeriodMode('YEARLY'));
  if (salesInputDaily) salesInputDaily.addEventListener('change', () => renderSalesReport());
  if (salesInputMonthly) salesInputMonthly.addEventListener('change', () => renderSalesReport());
  if (salesSelectYearly) salesSelectYearly.addEventListener('change', () => renderSalesReport());
  if (btnResetSalesPeriod) {
    btnResetSalesPeriod.addEventListener('click', () => {
      initSalesControls();
      renderSalesReport();
    });
  }
  if (btnExportSalesCSV) btnExportSalesCSV.addEventListener('click', () => exportSalesToCSV());
  if (salesHistorySearch) {
    salesHistorySearch.addEventListener('input', (e) => {
      salesSearchQuery = e.target.value;
      renderSalesReport();
    });
  }

  function openReceiptModal(order) {
    receiptContent.innerHTML = `
      <div class="receipt-row">
        <span>No. Antrian:</span>
        <strong>#${order.queueNumber}</strong>
      </div>
      <div class="receipt-row">
        <span>Order ID:</span>
        <span>${order.orderId}</span>
      </div>
      <div class="receipt-row">
        <span>Waktu:</span>
        <span>${order.createdAt}</span>
      </div>
      <div class="receipt-row">
        <span>Pelanggan:</span>
        <span>${order.customerName}</span>
      </div>
      <div class="receipt-row">
        <span>Tipe:</span>
        <span>${order.tableInfo || 'Dine In'}</span>
      </div>
      <div class="receipt-row">
        <span>Metode Bayar:</span>
        <span>${order.paymentMethod || 'Cash'}</span>
      </div>
      <div class="receipt-row">
        <span>Status Bayar:</span>
        <strong style="color: #16a34a;">${order.status === 'LUNAS' || order.status === 'SELESAI' ? 'LUNAS' : 'BELUM DIBAYAR'}</strong>
      </div>
      <div class="receipt-divider"></div>
      <div>
        ${getOrderItemsList(order).map(item => `
          <div class="receipt-row">
            <span>${item.qty || 1}x ${item.title || 'Item'} ${item.level ? `(${item.level})` : ''}</span>
            <span>${formatRp(item.total || ((item.unitPrice || item.price || 0) * (item.qty || 1)))}</span>
          </div>
          ${item.notes ? `<div style="font-size: 10px; color: #555;">* ${item.notes}</div>` : ''}
        `).join('')}
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-row">
        <span>Subtotal:</span>
        <span>${formatRp(order.subtotal)}</span>
      </div>
      <div class="receipt-row">
        <span>PB1 (Pajak 10%):</span>
        <span>${formatRp(order.tax)}</span>
      </div>
      <div class="receipt-row" style="font-size: 14px; font-weight: 800; margin-top: 4px;">
        <span>TOTAL:</span>
        <span>${formatRp(order.grandTotal)}</span>
      </div>
      ${order.cashPaid ? `
        <div class="receipt-divider"></div>
        <div class="receipt-row">
          <span>Tunai Diterima:</span>
          <span>${formatRp(order.cashPaid)}</span>
        </div>
        <div class="receipt-row" style="font-weight: 700;">
          <span>Kembalian:</span>
          <span style="color: #16a34a;">${formatRp(order.cashChange || 0)}</span>
        </div>
      ` : ''}
      <div class="receipt-divider"></div>
      <p style="text-align: center; font-size: 11px; margin-top: 8px;">Terima Kasih Telah Berkunjung ke Mie Gacoan!</p>
    `;
    receiptModal.classList.add('active');
  }

  if (btnCloseReceipt) {
    btnCloseReceipt.addEventListener('click', () => {
      receiptModal.classList.remove('active');
    });
  }

  if (receiptModal) {
    receiptModal.addEventListener('click', (e) => {
      if (e.target === receiptModal) receiptModal.classList.remove('active');
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderDashboard();
    });
  });

  queueSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderDashboard();
  });

  btnClearSearch.addEventListener('click', () => {
    queueSearchInput.value = '';
    searchQuery = '';
    renderDashboard();
    queueSearchInput.focus();
  });

  btnRefreshFeed.addEventListener('click', () => {
    renderDashboard();
  });

  if (btnClearOrdersDB) {
    btnClearOrdersDB.addEventListener('click', () => {
      if (confirm('Yakin ingin mereset seluruh data pesanan demo?')) {
        localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(DEFAULT_DEMO_ORDERS));
        localStorage.removeItem('gacoan_active_order_id');
        saveOrders(DEFAULT_DEMO_ORDERS);
        renderDashboard();
        if (typeof renderTableGridLive === 'function') renderTableGridLive();
        if (typeof renderReservationsFeed === 'function') renderReservationsFeed();
      }
    });
  }

  btnScanQrCode.addEventListener('click', () => {
    manualQrInput.value = '';
    qrScannerModal.classList.add('active');
    manualQrInput.focus();
  });

  closeScannerModal.addEventListener('click', () => {
    qrScannerModal.classList.remove('active');
  });

  qrScannerModal.addEventListener('click', (e) => {
    if (e.target === qrScannerModal) qrScannerModal.classList.remove('active');
  });

  btnSubmitManualQr.addEventListener('click', () => {
    const rawVal = manualQrInput.value.trim();
    if (!rawVal) return;

    let lookupTerm = rawVal;
    if (rawVal.includes('QUEUE:')) {
      const match = rawVal.match(/QUEUE:([^|]+)/);
      if (match) lookupTerm = match[1];
    } else if (rawVal.includes('GACOAN-ORDER:')) {
      const match = rawVal.match(/GACOAN-ORDER:([^|]+)/);
      if (match) lookupTerm = match[1];
    }

    queueSearchInput.value = lookupTerm;
    searchQuery = lookupTerm;
    qrScannerModal.classList.remove('active');
    renderDashboard();

    setTimeout(() => {
      const firstCard = ordersGrid.querySelector('.order-card');
      if (firstCard) {
        firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstCard.style.outline = '3px solid #0066ff';
        setTimeout(() => firstCard.style.outline = 'none', 1500);
      }
    }, 200);
  });

  let lastOrderCount = getOrders().length;

  const handleIncomingOrder = () => {
    const currentOrders = getOrders();
    if (currentOrders.length > lastOrderCount) {
      playNewOrderNotification();
    }
    lastOrderCount = currentOrders.length;
    renderDashboard();
  };

  if (posChannel) {
    posChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'ORDER_UPDATED') {
        handleIncomingOrder();
      }
      if (event.data && event.data.type === 'PRODUCTS_UPDATED') {
        renderCatalogCategoryFilters();
        renderCatalog();
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === DB_ORDERS_KEY) {
      handleIncomingOrder();
    }
    if (e.key === DB_PRODUCTS_KEY || e.key === DB_CATEGORIES_KEY) {
      renderCatalogCategoryFilters();
      renderCatalog();
    }
  });

  checkKasirAuth();
  initSalesControls();

  // Supabase Realtime Sync for Cashier POS
  if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
    window.GacoanSupabase.getOrders().then(remoteOrders => {
      if (remoteOrders && remoteOrders.length > 0) {
        saveOrders(remoteOrders);
        renderDashboard();
      } else {
        // Seed default demo orders to Supabase if remote is empty
        const initialDemo = getOrders();
        initialDemo.forEach(ord => window.GacoanSupabase.insertOrder(ord));
      }
    });

    window.GacoanSupabase.subscribeOrders(() => {
      window.GacoanSupabase.getOrders().then(remoteOrders => {
        if (remoteOrders && remoteOrders.length > 0) {
          saveOrders(remoteOrders);
          handleIncomingOrder();
        }
      });
    });
  }
});
