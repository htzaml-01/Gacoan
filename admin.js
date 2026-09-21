document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------------------------
  // LocalStorage Database Keys & Real-Time Sync Channel
  // ----------------------------------------------------------------------
  const DB_PRODUCTS_KEY = 'gacoan_products_database';
  const DB_CATEGORIES_KEY = 'gacoan_categories_database';
  const DB_ORDERS_KEY = 'gacoan_orders_database';
  const ADMIN_SESSION_KEY = 'gacoan_admin_session';

  let posChannel = null;
  try {
    posChannel = new BroadcastChannel('gacoan_pos_channel');
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }

  const formatRp = (num) => {
    return 'Rp ' + Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // ----------------------------------------------------------------------
  // Initial Master Database Seeding
  // ----------------------------------------------------------------------
  const INITIAL_CATEGORIES = ['MIE', 'DIMSUM', 'BEVERAGE'];

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
    }
  ];

  const getCategories = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(DB_CATEGORIES_KEY));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    localStorage.setItem(DB_CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  };

  const saveCategories = (cats) => {
    localStorage.setItem(DB_CATEGORIES_KEY, JSON.stringify(cats));
    if (posChannel) posChannel.postMessage({ type: 'PRODUCTS_UPDATED' });
  };

  const getProducts = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(DB_PRODUCTS_KEY));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    localStorage.setItem(DB_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  };

  const saveProducts = (prods) => {
    localStorage.setItem(DB_PRODUCTS_KEY, JSON.stringify(prods));
    if (posChannel) posChannel.postMessage({ type: 'PRODUCTS_UPDATED' });
  };

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

  const getOrders = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(DB_ORDERS_KEY));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(DEFAULT_DEMO_ORDERS));
    return DEFAULT_DEMO_ORDERS;
  };

  const saveOrders = (orders) => {
    try {
      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(DEFAULT_DEMO_ORDERS));
      } else {
        localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
      }
      if (posChannel) posChannel.postMessage({ type: 'ORDER_UPDATED' });
    } catch (e) {
      console.warn('Failed to save orders to localStorage:', e);
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
  // Admin Authentication & Session
  // ----------------------------------------------------------------------
  const adminLoginOverlay = document.getElementById('adminLoginOverlay');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminEmail = document.getElementById('adminEmail');
  const adminPassword = document.getElementById('adminPassword');
  const adminLoginMsg = document.getElementById('adminLoginMsg');
  const adminActiveName = document.getElementById('adminActiveName');
  const btnAdminLogout = document.getElementById('btnAdminLogout');

  const getAdminSession = () => localStorage.getItem(ADMIN_SESSION_KEY);
  const setAdminSession = (val) => {
    if (val) localStorage.setItem(ADMIN_SESSION_KEY, val);
    else localStorage.removeItem(ADMIN_SESSION_KEY);
    checkAdminAuth();
  };

  function checkAdminAuth() {
    let session = getAdminSession();
    if (!session) {
      session = 'Super Admin Gacoan';
      localStorage.setItem(ADMIN_SESSION_KEY, session);
    }
    if (adminLoginOverlay) {
      adminLoginOverlay.classList.add('hidden');
      adminLoginOverlay.style.display = 'none';
    }
    if (adminActiveName) adminActiveName.textContent = `Admin: ${session}`;
    refreshAllViews();
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

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailVal = adminEmail.value.trim().toLowerCase();
      const passVal = adminPassword.value;

      // Accepted: admin@gacoan.id, admin@gacoan.com, admin@gacaon.id or admin with password admin123
      if ((emailVal === 'admin@gacoan.id' || emailVal === 'admin@gacoan.com' || emailVal === 'admin@gacaon.id' || emailVal === 'admin') && passVal === 'admin123') {
        adminLoginMsg.className = 'admin-msg success';
        adminLoginMsg.textContent = 'Login Admin berhasil! Membuka Dashboard...';
        setTimeout(() => {
          setAdminSession('Super Admin Gacoan');
          adminEmail.value = '';
          adminPassword.value = '';
          adminLoginMsg.textContent = '';
        }, 500);
      } else {
        adminLoginMsg.className = 'admin-msg error';
        adminLoginMsg.textContent = 'Email atau Password Admin salah! (admin@gacoan.com / admin123)';
      }
    });
  }

  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', () => {
      if (confirm('Apakah Anda ingin keluar dari Portal Admin?')) {
        setAdminSession(null);
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
  // Main Navigation Tabs
  // ----------------------------------------------------------------------
  const tabAdminProducts = document.getElementById('tabAdminProducts');
  const tabAdminCategories = document.getElementById('tabAdminCategories');
  const tabAdminReservations = document.getElementById('tabAdminReservations');
  const tabAdminSales = document.getElementById('tabAdminSales');
  const panelAdminProducts = document.getElementById('panelAdminProducts');
  const panelAdminCategories = document.getElementById('panelAdminCategories');
  const panelAdminReservations = document.getElementById('panelAdminReservations');
  const panelAdminSales = document.getElementById('panelAdminSales');

  const switchAdminTab = (activeTab, activePanel) => {
    [tabAdminProducts, tabAdminCategories, tabAdminReservations, tabAdminSales].forEach(t => { if (t) t.classList.remove('active'); });
    [panelAdminProducts, panelAdminCategories, panelAdminReservations, panelAdminSales].forEach(p => { if (p) p.style.display = 'none'; });

    if (activeTab) activeTab.classList.add('active');
    if (activePanel) activePanel.style.display = 'flex';
  };

  if (tabAdminProducts) tabAdminProducts.addEventListener('click', () => switchAdminTab(tabAdminProducts, panelAdminProducts));
  if (tabAdminCategories) tabAdminCategories.addEventListener('click', () => switchAdminTab(tabAdminCategories, panelAdminCategories));
  if (tabAdminReservations) tabAdminReservations.addEventListener('click', () => switchAdminTab(tabAdminReservations, panelAdminReservations));
  if (tabAdminSales) tabAdminSales.addEventListener('click', () => switchAdminTab(tabAdminSales, panelAdminSales));

  // ----------------------------------------------------------------------
  // KPI Calculation
  // ----------------------------------------------------------------------
  const kpiTotalRevenue = document.getElementById('kpiTotalRevenue');
  const kpiTotalPaidOrders = document.getElementById('kpiTotalPaidOrders');
  const kpiPendingOrdersSub = document.getElementById('kpiPendingOrdersSub');
  const kpiTotalItemsSold = document.getElementById('kpiTotalItemsSold');
  const kpiTotalProducts = document.getElementById('kpiTotalProducts');
  const kpiTotalCategoriesSub = document.getElementById('kpiTotalCategoriesSub');

  function updateKPIs() {
    const orders = getOrders();
    const products = getProducts();
    const categories = getCategories();

    const paidOrders = orders.filter(o => o.status === 'LUNAS' || o.status === 'SEDANG_DIMASAK' || o.status === 'SIAP_SAJI' || o.status === 'SELESAI');
    const pendingOrders = orders.filter(o => o.status === 'MENUNGGU_BAYAR');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
    const totalItemsCount = paidOrders.reduce((sum, o) => {
      const itemsList = getOrderItemsList(o);
      return sum + itemsList.reduce((iSum, i) => iSum + (Number(i.qty) || 1), 0);
    }, 0);

    if (kpiTotalRevenue) kpiTotalRevenue.textContent = formatRp(totalRevenue);
    if (kpiTotalPaidOrders) kpiTotalPaidOrders.textContent = paidOrders.length;
    if (kpiPendingOrdersSub) kpiPendingOrdersSub.textContent = `${pendingOrders.length} pesanan pending`;
    if (kpiTotalItemsSold) kpiTotalItemsSold.textContent = `${totalItemsCount} porsi`;
    if (kpiTotalProducts) kpiTotalProducts.textContent = `${products.length} menu`;
    if (kpiTotalCategoriesSub) kpiTotalCategoriesSub.textContent = `${categories.length} Kategori`;
  }

  // ----------------------------------------------------------------------
  // SECTION 1: MANAJEMEN PRODUK & STOK
  // ----------------------------------------------------------------------
  const adminProductsGrid = document.getElementById('adminProductsGrid');
  const productSearchInput = document.getElementById('productSearchInput');
  const productCatFilterGroup = document.getElementById('productCatFilterGroup');
  let currentProductCatFilter = 'ALL';
  let productSearchQuery = '';

  function renderCategoryFilterPills() {
    const cats = getCategories();
    productCatFilterGroup.innerHTML = `
      <button type="button" class="admin-cat-pill ${currentProductCatFilter === 'ALL' ? 'active' : ''}" data-cat="ALL">Semua</button>
      ${cats.map(c => `
        <button type="button" class="admin-cat-pill ${currentProductCatFilter === c ? 'active' : ''}" data-cat="${c}">${c}</button>
      `).join('')}
    `;

    productCatFilterGroup.querySelectorAll('.admin-cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        currentProductCatFilter = btn.getAttribute('data-cat');
        renderCategoryFilterPills();
        renderProductsGrid();
      });
    });
  }

  productSearchInput.addEventListener('input', (e) => {
    productSearchQuery = e.target.value.toLowerCase().trim();
    renderProductsGrid();
  });

  function renderProductsGrid() {
    const products = getProducts();

    let filtered = products.filter(p => {
      const catMatch = currentProductCatFilter === 'ALL' || p.category === currentProductCatFilter;
      const searchMatch = !productSearchQuery || 
        p.title.toLowerCase().includes(productSearchQuery) || 
        p.desc.toLowerCase().includes(productSearchQuery) || 
        p.category.toLowerCase().includes(productSearchQuery);
      return catMatch && searchMatch;
    });

    if (filtered.length === 0) {
      adminProductsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
          <p style="font-weight: 700; font-size: 15px;">Tidak ada produk yang cocok.</p>
        </div>
      `;
      return;
    }

    adminProductsGrid.innerHTML = filtered.map(item => {
      const isAvailable = item.status === 'Tersedia';

      return `
        <article class="admin-product-card ${!isAvailable ? 'out-of-stock' : ''}" id="admin-prod-${item.id}">
          <div class="admin-card-img-wrap">
            <img src="${item.img}" alt="${item.title}" class="admin-card-img" />
            <span class="admin-card-cat-badge">${item.category}</span>
          </div>

          <div class="admin-card-body">
            <div class="admin-card-header-row">
              <h4 class="admin-card-title">${item.title}</h4>
              <span class="admin-card-price">${formatRp(item.price)}</span>
            </div>

            <p class="admin-card-desc">${item.desc || '-'}</p>

            <!-- Custom Levels List Display -->
            ${item.hasLevel && item.levels && item.levels.length > 0 ? `
              <div class="admin-levels-tag-list">
                ${item.levels.map(lvl => `
                  <span class="level-tag ${lvl.extraPrice > 0 ? 'extra' : ''}">
                    ${lvl.name} ${lvl.extraPrice > 0 ? `(+${formatRp(lvl.extraPrice)})` : ''}
                  </span>
                `).join('')}
              </div>
            ` : '<div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 10px;">Tanpa varian level pedas</div>'}

            <div class="admin-card-footer">
              <!-- Stock Toggle Control -->
              <label class="stock-toggle-control" title="Klik untuk mengubah stok">
                <span class="switch-toggle" style="transform: scale(0.85);">
                  <input type="checkbox" class="stock-toggle-input" data-id="${item.id}" ${isAvailable ? 'checked' : ''} />
                  <span class="slider"></span>
                </span>
                <span class="stock-status-text ${isAvailable ? 'available' : 'out-of-stock'}">
                  ${isAvailable ? 'Tersedia' : 'Habis'}
                </span>
              </label>

              <!-- Edit & Delete Buttons -->
              <div class="card-actions-group">
                <button type="button" class="btn-card-action btn-edit-product" data-id="${item.id}">
                  Edit
                </button>
                <button type="button" class="btn-card-action delete btn-delete-product" data-id="${item.id}">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Stock Toggle Checkbox Listener
    adminProductsGrid.querySelectorAll('.stock-toggle-input').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const prodId = e.target.getAttribute('data-id');
        const isChecked = e.target.checked;
        toggleProductStock(prodId, isChecked ? 'Tersedia' : 'Habis');
      });
    });

    // Edit Product Button Listener
    adminProductsGrid.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        openEditProductModal(prodId);
      });
    });

    // Delete Product Button Listener
    adminProductsGrid.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        deleteProduct(prodId);
      });
    });
  }

  function toggleProductStock(prodId, newStatus) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === prodId);
    if (idx > -1) {
      products[idx].status = newStatus;
      saveProducts(products);
      renderProductsGrid();

      // Sync to Supabase Cloud Database
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.updateProductStock(prodId, newStatus);
      }
    }
  }

  function deleteProduct(prodId) {
    if (confirm('Yakin ingin menghapus menu ini dari daftar penjualan?')) {
      let products = getProducts();
      products = products.filter(p => p.id !== prodId);
      saveProducts(products);
      refreshAllViews();

      // Sync to Supabase Cloud Database
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.deleteProduct(prodId);
      }
    }
  }

  // ----------------------------------------------------------------------
  // MODAL 1: ADD / EDIT PRODUCT WITH CUSTOM LEVEL BUILDER
  // ----------------------------------------------------------------------
  const productFormModal = document.getElementById('productFormModal');
  const closeProductFormModal = document.getElementById('closeProductFormModal');
  const btnCancelProductForm = document.getElementById('btnCancelProductForm');
  const btnOpenAddProductModal = document.getElementById('btnOpenAddProductModal');
  const productForm = document.getElementById('productForm');
  const productModalTitle = document.getElementById('productModalTitle');
  const formProductId = document.getElementById('formProductId');
  const formProductTitle = document.getElementById('formProductTitle');
  const formProductCategory = document.getElementById('formProductCategory');
  const formProductPrice = document.getElementById('formProductPrice');
  const formProductStatus = document.getElementById('formProductStatus');
  const formProductImg = document.getElementById('formProductImg');
  const formProductDesc = document.getElementById('formProductDesc');
  const formHasLevelToggle = document.getElementById('formHasLevelToggle');
  const levelBuilderContent = document.getElementById('levelBuilderContent');
  const levelsInputsList = document.getElementById('levelsInputsList');
  const btnAddLevelRow = document.getElementById('btnAddLevelRow');

  function populateCategoryDropdown(selectedCat = '') {
    const cats = getCategories();
    formProductCategory.innerHTML = cats.map(c => `
      <option value="${c}" ${c === selectedCat ? 'selected' : ''}>${c}</option>
    `).join('');
  }

  function addLevelRow(levelName = '', extraPrice = 0) {
    const row = document.createElement('div');
    row.className = 'level-input-row';
    row.innerHTML = `
      <input type="text" class="admin-input flex-1 level-name-input" placeholder="Nama Level (misal: LEVEL 1 / PEDAS BANGET)" value="${levelName}" required />
      <input type="number" class="admin-input level-price-input" style="width: 140px;" placeholder="+ Tambahan Rp" value="${extraPrice}" min="0" step="500" required />
      <button type="button" class="btn-remove-level">&times;</button>
    `;

    row.querySelector('.btn-remove-level').addEventListener('click', () => {
      row.remove();
    });

    levelsInputsList.appendChild(row);
  }

  formHasLevelToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      levelBuilderContent.style.display = 'block';
      if (levelsInputsList.children.length === 0) {
        addLevelRow('LEVEL 0', 0);
        addLevelRow('LEVEL 1', 0);
        addLevelRow('LEVEL 2', 0);
        addLevelRow('LEVEL 3', 0);
        addLevelRow('LEVEL 4', 0);
        addLevelRow('LEVEL 6', 1000);
        addLevelRow('LEVEL 8', 1000);
      }
    } else {
      levelBuilderContent.style.display = 'none';
    }
  });

  btnAddLevelRow.addEventListener('click', () => {
    addLevelRow('', 0);
  });

  // ----------------------------------------------------------------------
  // AVAILABLE MENU FOLDER ASSETS & PHOTO PICKER
  // ----------------------------------------------------------------------
  const MENU_FOLDER_IMAGES = [
    { name: 'Mie Gacoan', path: 'Menu/mie gacoan.webp' },
    { name: 'Mie Hompimpa', path: 'Menu/miehompimpa.webp' },
    { name: 'Mie Suit', path: 'Menu/miesuit.webp' },
    { name: 'Siomay', path: 'Menu/siomay.webp' },
    { name: 'Udang Keju', path: 'Menu/udangkeju.webp' },
    { name: 'Udang Rambutan', path: 'Menu/udahngrambutan.webp' },
    { name: 'Lumpia Udang', path: 'Menu/lumpiaudang.webp' },
    { name: 'Pangsit Goreng', path: 'Menu/pangsitgoreng.webp' },
    { name: 'Es Gobak Sodor', path: 'Menu/esgobaksodor.webp' },
    { name: 'Thai Tea', path: 'Menu/thaitea.webp' },
    { name: 'Thai Green Tea', path: 'Menu/thaigreentea.webp' },
    { name: 'Lemon Tea', path: 'Menu/lemontea.webp' },
    { name: 'Orange', path: 'Menu/orange.webp' },
    { name: 'Es Tea', path: 'Menu/Tea.webp' },
    { name: 'Air Mineral', path: 'Menu/airmineral.webp' }
  ];

  const formProductFileInput = document.getElementById('formProductFileInput');
  const btnTriggerFileInput = document.getElementById('btnTriggerFileInput');
  const imgPreviewTag = document.getElementById('imgPreviewTag');
  const previewImgName = document.getElementById('previewImgName');
  const folderGalleryGrid = document.getElementById('folderGalleryGrid');

  function setSelectedPhoto(imgPath, label = '') {
    if (!imgPath) return;
    formProductImg.value = imgPath;
    if (imgPreviewTag) imgPreviewTag.src = imgPath;
    if (previewImgName) {
      previewImgName.textContent = label || (imgPath.startsWith('data:') ? 'Foto dari Folder' : imgPath.split('/').pop());
    }

    // Highlight gallery thumbnail if matches
    if (folderGalleryGrid) {
      folderGalleryGrid.querySelectorAll('.gallery-thumb-item').forEach(item => {
        if (item.getAttribute('data-path') === imgPath) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }

  function renderFolderGallery(selectedPath = '') {
    if (!folderGalleryGrid) return;

    folderGalleryGrid.innerHTML = MENU_FOLDER_IMAGES.map(img => {
      const isSelected = img.path === selectedPath;
      return `
        <div class="gallery-thumb-item ${isSelected ? 'selected' : ''}" data-path="${img.path}" title="${img.name}">
          <img src="${img.path}" alt="${img.name}" loading="lazy" />
          <span class="thumb-check">&#10003;</span>
        </div>
      `;
    }).join('');

    folderGalleryGrid.querySelectorAll('.gallery-thumb-item').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const path = thumb.getAttribute('data-path');
        const found = MENU_FOLDER_IMAGES.find(m => m.path === path);
        setSelectedPhoto(path, found ? found.name : '');
      });
    });
  }

  // Handle local folder file picker
  if (btnTriggerFileInput && formProductFileInput) {
    btnTriggerFileInput.addEventListener('click', () => {
      formProductFileInput.click();
    });

    formProductFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Silakan pilih file gambar (JPG, PNG, WEBP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = uploadEvent.target.result;
        setSelectedPhoto(base64Data, file.name);
      };
      reader.readAsDataURL(file);
    });
  }

  btnOpenAddProductModal.addEventListener('click', () => {
    productModalTitle.textContent = 'Tambah Produk Baru';
    formProductId.value = '';
    formProductTitle.value = '';
    formProductPrice.value = '';
    formProductStatus.value = 'Tersedia';
    formProductDesc.value = '';
    formHasLevelToggle.checked = false;
    levelBuilderContent.style.display = 'none';
    levelsInputsList.innerHTML = '';
    populateCategoryDropdown();
    
    // Set default image and render gallery
    setSelectedPhoto('Menu/mie gacoan.webp', 'Mie Gacoan');
    renderFolderGallery('Menu/mie gacoan.webp');

    productFormModal.classList.add('active');
  });

  function openEditProductModal(prodId) {
    const products = getProducts();
    const item = products.find(p => p.id === prodId);
    if (!item) return;

    productModalTitle.textContent = `Edit Menu: ${item.title}`;
    formProductId.value = item.id;
    formProductTitle.value = item.title;
    formProductPrice.value = item.price;
    formProductStatus.value = item.status || 'Tersedia';
    formProductDesc.value = item.desc || '';

    populateCategoryDropdown(item.category);

    // Set product photo and render gallery
    const currentImg = item.img || 'Menu/mie gacoan.webp';
    setSelectedPhoto(currentImg, item.title);
    renderFolderGallery(currentImg);

    formHasLevelToggle.checked = !!item.hasLevel;
    levelsInputsList.innerHTML = '';

    if (item.hasLevel && item.levels && item.levels.length > 0) {
      levelBuilderContent.style.display = 'block';
      item.levels.forEach(lvl => addLevelRow(lvl.name, lvl.extraPrice || 0));
    } else {
      levelBuilderContent.style.display = 'none';
    }

    productFormModal.classList.add('active');
  }

  const closeProductModal = () => productFormModal.classList.remove('active');
  closeProductFormModal.addEventListener('click', closeProductModal);
  btnCancelProductForm.addEventListener('click', closeProductModal);

  productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = formProductTitle.value.trim();
    const category = formProductCategory.value;
    const price = parseInt(formProductPrice.value, 10) || 0;
    const status = formProductStatus.value;
    const img = formProductImg.value.trim();
    const desc = formProductDesc.value.trim();
    const hasLevel = formHasLevelToggle.checked;

    const levels = [];
    if (hasLevel) {
      levelsInputsList.querySelectorAll('.level-input-row').forEach(row => {
        const name = row.querySelector('.level-name-input').value.trim();
        const extraPrice = parseInt(row.querySelector('.level-price-input').value, 10) || 0;
        if (name) levels.push({ name, extraPrice });
      });
    }

    const products = getProducts();
    const existingId = formProductId.value;

    let savedProduct = null;
    if (existingId) {
      // Edit mode
      const idx = products.findIndex(p => p.id === existingId);
      if (idx > -1) {
        savedProduct = {
          ...products[idx],
          title,
          category,
          price,
          status,
          img,
          desc,
          hasLevel,
          levels
        };
        products[idx] = savedProduct;
      }
    } else {
      // Add new product
      const newId = 'prod-' + Date.now();
      savedProduct = {
        id: newId,
        title,
        category,
        price,
        status,
        img,
        desc,
        hasLevel,
        levels
      };
      products.push(savedProduct);
    }

    saveProducts(products);

    // Sync to Supabase Cloud Database
    if (savedProduct && window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
      window.GacoanSupabase.saveProduct(savedProduct);
    }

    closeProductModal();
    refreshAllViews();
  });

  // ----------------------------------------------------------------------
  // SECTION 2: MANAJEMEN KATEGORI
  // ----------------------------------------------------------------------
  const categoriesListGrid = document.getElementById('categoriesListGrid');
  const btnOpenAddCategoryModal = document.getElementById('btnOpenAddCategoryModal');
  const categoryFormModal = document.getElementById('categoryFormModal');
  const closeCategoryFormModal = document.getElementById('closeCategoryFormModal');
  const btnCancelCategoryForm = document.getElementById('btnCancelCategoryForm');
  const categoryForm = document.getElementById('categoryForm');
  const formCategoryName = document.getElementById('formCategoryName');

  function renderCategoriesList() {
    const cats = getCategories();
    const products = getProducts();

    categoriesListGrid.innerHTML = cats.map(cat => {
      const itemsCount = products.filter(p => p.category === cat).length;

      return `
        <div class="category-card">
          <div>
            <h4 class="category-card-name">${cat}</h4>
            <span class="category-items-count">${itemsCount} Menu Produk</span>
          </div>
          <button type="button" class="btn-card-action delete btn-delete-cat" data-cat="${cat}">
            Hapus
          </button>
        </div>
      `;
    }).join('');

    categoriesListGrid.querySelectorAll('.btn-delete-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const catToDelete = btn.getAttribute('data-cat');
        deleteCategory(catToDelete);
      });
    });
  }

  function deleteCategory(catName) {
    const products = getProducts();
    const inUse = products.some(p => p.category === catName);

    if (inUse) {
      alert(`Kategori "${catName}" masih digunakan oleh beberapa produk menu. Ubah kategori produk terlebih dahulu sebelum menghapus.`);
      return;
    }

    if (confirm(`Yakin ingin menghapus kategori "${catName}"?`)) {
      let cats = getCategories();
      cats = cats.filter(c => c !== catName);
      saveCategories(cats);
      refreshAllViews();
    }
  }

  btnOpenAddCategoryModal.addEventListener('click', () => {
    formCategoryName.value = '';
    categoryFormModal.classList.add('active');
    formCategoryName.focus();
  });

  const closeCategoryModal = () => categoryFormModal.classList.remove('active');
  closeCategoryFormModal.addEventListener('click', closeCategoryModal);
  btnCancelCategoryForm.addEventListener('click', closeCategoryModal);

  categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newCat = formCategoryName.value.trim().toUpperCase();
    if (!newCat) return;

    const cats = getCategories();
    if (cats.includes(newCat)) {
      alert('Kategori tersebut sudah ada!');
      return;
    }

    cats.push(newCat);
    saveCategories(cats);
    closeCategoryModal();
    refreshAllViews();
  });

  // Date Helpers for Sales Analytics
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

  // ----------------------------------------------------------------------
  // SECTION 3: LAPORAN PENJUALAN & TRANSAKSI (Harian, Bulanan, Tahunan)
  // ----------------------------------------------------------------------
  let adminSalesPeriodMode = 'DAILY'; // 'DAILY' | 'MONTHLY' | 'YEARLY'
  let adminSalesSearchQuery = '';
  let cachedPeriodOrders = [];

  const adminPeriodDaily = document.getElementById('adminPeriodDaily');
  const adminPeriodMonthly = document.getElementById('adminPeriodMonthly');
  const adminPeriodYearly = document.getElementById('adminPeriodYearly');
  const adminSalesInputDaily = document.getElementById('adminSalesInputDaily');
  const adminSalesInputMonthly = document.getElementById('adminSalesInputMonthly');
  const adminSalesSelectYearly = document.getElementById('adminSalesSelectYearly');
  const btnAdminResetSalesPeriod = document.getElementById('btnAdminResetSalesPeriod');
  const btnExportSalesCsv = document.getElementById('btnExportSalesCsv');
  const btnRefreshSales = document.getElementById('btnRefreshSales');

  const adminSalesPeriodBadgeLabel = document.getElementById('adminSalesPeriodBadgeLabel');
  const adminSalesPeriodDateText = document.getElementById('adminSalesPeriodDateText');
  const adminSalesTotalRevenue = document.getElementById('adminSalesTotalRevenue');
  const adminSalesTotalOrdersCount = document.getElementById('adminSalesTotalOrdersCount');
  const adminSalesAvgPerOrder = document.getElementById('adminSalesAvgPerOrder');
  const adminSalesTotalItemsSold = document.getElementById('adminSalesTotalItemsSold');
  const topSellingGrid = document.getElementById('topSellingGrid');
  const adminTopSellingSub = document.getElementById('adminTopSellingSub');
  const adminSalesSearchInput = document.getElementById('adminSalesSearchInput');
  const salesTransactionsBody = document.getElementById('salesTransactionsBody');

  function initAdminSalesControls() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    if (adminSalesInputDaily) adminSalesInputDaily.value = `${yyyy}-${mm}-${dd}`;
    if (adminSalesInputMonthly) adminSalesInputMonthly.value = `${yyyy}-${mm}`;

    if (adminSalesSelectYearly) {
      adminSalesSelectYearly.innerHTML = '';
      for (let y = yyyy; y >= yyyy - 5; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = `Tahun ${y}`;
        adminSalesSelectYearly.appendChild(opt);
      }
      adminSalesSelectYearly.value = String(yyyy);
    }

    if (adminPeriodDaily) adminPeriodDaily.addEventListener('click', () => setAdminSalesPeriodMode('DAILY'));
    if (adminPeriodMonthly) adminPeriodMonthly.addEventListener('click', () => setAdminSalesPeriodMode('MONTHLY'));
    if (adminPeriodYearly) adminPeriodYearly.addEventListener('click', () => setAdminSalesPeriodMode('YEARLY'));

    if (adminSalesInputDaily) {
      adminSalesInputDaily.addEventListener('change', renderSalesAnalytics);
    }
    if (adminSalesInputMonthly) {
      adminSalesInputMonthly.addEventListener('change', renderSalesAnalytics);
    }
    if (adminSalesSelectYearly) {
      adminSalesSelectYearly.addEventListener('change', renderSalesAnalytics);
    }

    if (btnAdminResetSalesPeriod) {
      btnAdminResetSalesPeriod.addEventListener('click', () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        if (adminSalesInputDaily) adminSalesInputDaily.value = `${y}-${m}-${day}`;
        if (adminSalesInputMonthly) adminSalesInputMonthly.value = `${y}-${m}`;
        if (adminSalesSelectYearly) adminSalesSelectYearly.value = String(y);
        renderSalesAnalytics();
      });
    }

    if (adminSalesSearchInput) {
      adminSalesSearchInput.addEventListener('input', (e) => {
        adminSalesSearchQuery = e.target.value.trim().toLowerCase();
        renderSalesTransactionsOnly();
      });
    }

    if (btnRefreshSales) {
      btnRefreshSales.addEventListener('click', renderSalesAnalytics);
    }

    if (btnExportSalesCsv) {
      btnExportSalesCsv.addEventListener('click', exportFilteredSalesCsv);
    }
  }

  function setAdminSalesPeriodMode(mode) {
    adminSalesPeriodMode = mode;
    [adminPeriodDaily, adminPeriodMonthly, adminPeriodYearly].forEach(btn => btn && btn.classList.remove('active'));
    if (adminSalesInputDaily) adminSalesInputDaily.style.display = 'none';
    if (adminSalesInputMonthly) adminSalesInputMonthly.style.display = 'none';
    if (adminSalesSelectYearly) adminSalesSelectYearly.style.display = 'none';

    if (mode === 'DAILY') {
      if (adminPeriodDaily) adminPeriodDaily.classList.add('active');
      if (adminSalesInputDaily) adminSalesInputDaily.style.display = 'block';
      if (adminSalesPeriodBadgeLabel) adminSalesPeriodBadgeLabel.textContent = 'Harian';
    } else if (mode === 'MONTHLY') {
      if (adminPeriodMonthly) adminPeriodMonthly.classList.add('active');
      if (adminSalesInputMonthly) adminSalesInputMonthly.style.display = 'block';
      if (adminSalesPeriodBadgeLabel) adminSalesPeriodBadgeLabel.textContent = 'Bulanan';
    } else if (mode === 'YEARLY') {
      if (adminPeriodYearly) adminPeriodYearly.classList.add('active');
      if (adminSalesSelectYearly) adminSalesSelectYearly.style.display = 'block';
      if (adminSalesPeriodBadgeLabel) adminSalesPeriodBadgeLabel.textContent = 'Tahunan';
    }
    renderSalesAnalytics();
  }

  function renderSalesAnalytics() {
    const allOrders = getOrders();
    let targetDate = new Date();
    let periodText = '';

    if (adminSalesPeriodMode === 'DAILY') {
      if (adminSalesInputDaily && adminSalesInputDaily.value) {
        const [y, m, d] = adminSalesInputDaily.value.split('-').map(Number);
        targetDate = new Date(y, m - 1, d);
      }
      const isToday = isSameDay(targetDate, new Date());
      periodText = (isToday ? 'Hari Ini (' : 'Tanggal ') + targetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + (isToday ? ')' : '');
    } else if (adminSalesPeriodMode === 'MONTHLY') {
      if (adminSalesInputMonthly && adminSalesInputMonthly.value) {
        const [y, m] = adminSalesInputMonthly.value.split('-').map(Number);
        targetDate = new Date(y, m - 1, 1);
      }
      periodText = 'Bulan ' + targetDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } else if (adminSalesPeriodMode === 'YEARLY') {
      if (adminSalesSelectYearly && adminSalesSelectYearly.value) {
        targetDate = new Date(Number(adminSalesSelectYearly.value), 0, 1);
      }
      periodText = 'Tahun ' + targetDate.getFullYear();
    }

    if (adminSalesPeriodDateText) adminSalesPeriodDateText.textContent = periodText;
    if (adminTopSellingSub) adminTopSellingSub.textContent = `Berdasarkan penjualan periode ${periodText}`;

    // Filter orders by active period
    const periodOrders = allOrders.filter(order => {
      const orderDate = parseOrderDate(order);
      if (adminSalesPeriodMode === 'DAILY') return isSameDay(orderDate, targetDate);
      if (adminSalesPeriodMode === 'MONTHLY') return isSameMonth(orderDate, targetDate);
      if (adminSalesPeriodMode === 'YEARLY') return isSameYear(orderDate, targetDate);
      return true;
    });

    cachedPeriodOrders = periodOrders;

    const paidOrders = periodOrders.filter(o => 
      o.status === 'LUNAS' || o.status === 'SEDANG_DIMASAK' || o.status === 'SIAP_SAJI' || o.status === 'SELESAI' || o.status === 'DP_LUNAS'
    );

    const totalRev = paidOrders.reduce((sum, o) => {
      if (o.status === 'DP_LUNAS' && o.dpPaid) return sum + Number(o.dpPaid || 0);
      return sum + Number(o.grandTotal || 0);
    }, 0);

    const totalOrdersCount = paidOrders.length;
    const avgOrderVal = totalOrdersCount > 0 ? Math.round(totalRev / totalOrdersCount) : 0;

    let totalItemsCount = 0;
    const itemMap = {};

    paidOrders.forEach(o => {
      const items = getOrderItemsList(o);
      items.forEach(i => {
        if (i && (i.title || i.name)) {
          const name = i.title || i.name;
          const qty = Number(i.qty) || 1;
          totalItemsCount += qty;
          itemMap[name] = (itemMap[name] || 0) + qty;
        }
      });
    });

    if (adminSalesTotalRevenue) adminSalesTotalRevenue.textContent = formatRp(totalRev);
    if (adminSalesTotalOrdersCount) adminSalesTotalOrdersCount.textContent = `${totalOrdersCount} Transaksi`;
    if (adminSalesAvgPerOrder) adminSalesAvgPerOrder.textContent = formatRp(avgOrderVal);
    if (adminSalesTotalItemsSold) adminSalesTotalItemsSold.textContent = `${totalItemsCount} Porsi`;

    // Render Top Selling Items for this period
    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (topSellingGrid) {
      if (topItems.length === 0) {
        topSellingGrid.innerHTML = `
          <div style="grid-column: 1 / -1; color: #94a3b8; font-size: 13px; text-align: center; padding: 16px;">
            Belum ada menu yang lunas terjual pada periode ini.
          </div>
        `;
      } else {
        topSellingGrid.innerHTML = topItems.map(([name, count], idx) => `
          <div class="top-selling-pill">
            <span class="top-selling-name">#${idx + 1} ${name}</span>
            <span class="top-selling-qty">${count}x Terjual</span>
          </div>
        `).join('');
      }
    }

    // Render Transactions Table for this period
    renderSalesTransactionsOnly();
  }

  function renderSalesTransactionsOnly() {
    if (!salesTransactionsBody) return;

    let list = [...cachedPeriodOrders].reverse();

    if (adminSalesSearchQuery) {
      const q = adminSalesSearchQuery;
      list = list.filter(o => {
        const qNo = String(o.queueNumber || '').toLowerCase();
        const oId = String(o.orderId || '').toLowerCase();
        const cName = String(o.customerName || '').toLowerCase();
        const tInfo = String(o.tableInfo || '').toLowerCase();
        const pMethod = String(o.paymentMethod || '').toLowerCase();
        return qNo.includes(q) || oId.includes(q) || cName.includes(q) || tInfo.includes(q) || pMethod.includes(q);
      });
    }

    if (list.length === 0) {
      salesTransactionsBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: #94a3b8; padding: 30px;">
            Tidak ada transaksi pada periode ini.
          </td>
        </tr>
      `;
      return;
    }

    salesTransactionsBody.innerHTML = list.map(o => {
      let statusBadge = `<span class="status-badge-table pending">Menunggu Bayar</span>`;
      if (o.status === 'LUNAS') statusBadge = `<span class="status-badge-table paid">LUNAS</span>`;
      else if (o.status === 'SEDANG_DIMASAK') statusBadge = `<span class="status-badge-table cooking">Dimasak di Dapur</span>`;
      else if (o.status === 'SIAP_SAJI') statusBadge = `<span class="status-badge-table ready" style="background:#dcfce7; color:#16a34a;">Siap Saji</span>`;
      else if (o.status === 'SELESAI') statusBadge = `<span class="status-badge-table paid">SELESAI</span>`;
      else if (o.status === 'DP_LUNAS') statusBadge = `<span class="status-badge-table paid" style="background:#fef3c7; color:#b45309;">DP LUNAS</span>`;

      const items = getOrderItemsList(o);
      const itemsSummary = items.length > 0 ? items.map(i => `${i.qty || 1}x ${i.title || i.name || 'Item'}${i.level ? ` (${i.level})` : ''}`).join(', ') : '-';

      const orderDate = parseOrderDate(o);
      const dateFormatted = orderDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeFormatted = orderDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #1e293b;">${timeFormatted} WIB</div>
            <small style="color: #94a3b8;">${dateFormatted}</small>
          </td>
          <td><strong>#${o.queueNumber || o.orderId || '-'}</strong></td>
          <td><strong>${o.customerName || '-'}</strong></td>
          <td>${o.tableInfo || 'Dine In'}</td>
          <td><small>${o.paymentMethod || 'QRIS'}</small></td>
          <td style="max-width: 250px; font-size: 12px;">${itemsSummary}</td>
          <td><strong style="color: var(--primary-color);">${formatRp(o.grandTotal || 0)}</strong></td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  function exportFilteredSalesCsv() {
    const ordersToExport = cachedPeriodOrders && cachedPeriodOrders.length > 0 ? cachedPeriodOrders : getOrders();
    if (ordersToExport.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor pada periode ini.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No Antrian,Waktu,Pemesan,Tipe Pesanan,Metode Bayar,Total,Status\n';

    ordersToExport.forEach(o => {
      const orderDate = parseOrderDate(o);
      const timeStr = orderDate.toLocaleDateString('id-ID') + ' ' + orderDate.toLocaleTimeString('id-ID');
      csvContent += `"${o.queueNumber || o.orderId || '-'}","${timeStr}","${o.customerName || '-'}","${o.tableInfo || 'Dine In'}","${o.paymentMethod || '-'}","${o.grandTotal || 0}","${o.status || '-'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_penjualan_admin_${adminSalesPeriodMode.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================================================
  // SECTION 4: MANAJEMEN & JADWAL RESERVASI MEJA
  // ==========================================================================
  const adminRsvFilterPills = document.getElementById('adminRsvFilterPills');
  const adminRsvDateFilter = document.getElementById('adminRsvDateFilter');
  const btnRefreshRsv = document.getElementById('btnRefreshRsv');
  const adminReservationsTableBody = document.getElementById('adminReservationsTableBody');
  const rsvKpiTotal = document.getElementById('rsvKpiTotal');
  const rsvKpiToday = document.getElementById('rsvKpiToday');
  const rsvKpiTotalDp = document.getElementById('rsvKpiTotalDp');
  const rsvKpiTotalRemain = document.getElementById('rsvKpiTotalRemain');

  let currentRsvFilter = 'ALL'; // 'ALL', 'TODAY', 'TOMORROW', 'UPCOMING', 'COMPLETED'

  if (adminRsvFilterPills) {
    adminRsvFilterPills.querySelectorAll('.rsv-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        adminRsvFilterPills.querySelectorAll('.rsv-filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRsvFilter = btn.getAttribute('data-rsv-filter');
        if (adminRsvDateFilter) adminRsvDateFilter.value = '';
        renderReservationsPanel();
      });
    });
  }

  if (adminRsvDateFilter) {
    adminRsvDateFilter.addEventListener('change', () => {
      if (adminRsvDateFilter.value) {
        if (adminRsvFilterPills) {
          adminRsvFilterPills.querySelectorAll('.rsv-filter-pill').forEach(b => b.classList.remove('active'));
        }
      }
      renderReservationsPanel();
    });
  }

  if (btnRefreshRsv) {
    btnRefreshRsv.addEventListener('click', renderReservationsPanel);
  }

  function renderReservationsPanel() {
    if (!adminReservationsTableBody) return;
    const allOrders = getOrders();

    // Filter only reservation orders
    const reservations = allOrders.filter(o => {
      return o.diningType === 'RESERVASI' || (o.reservationId && String(o.reservationId).startsWith('RSV-')) || (o.orderId && String(o.orderId).startsWith('RSV-')) || (o.tableInfo && o.tableInfo.toLowerCase().includes('reservasi'));
    });

    // Dates for today and tomorrow
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Filter by quick pill or custom date picker
    const customDate = adminRsvDateFilter ? adminRsvDateFilter.value : '';

    let filtered = reservations.filter(r => {
      const rDate = r.eventDate || (r.date ? r.date.split('T')[0] : '');

      if (customDate) {
        return rDate === customDate;
      }

      if (currentRsvFilter === 'TODAY') {
        return rDate === todayStr;
      } else if (currentRsvFilter === 'TOMORROW') {
        return rDate === tomorrowStr;
      } else if (currentRsvFilter === 'UPCOMING') {
        return rDate >= todayStr && r.status !== 'SELESAI' && r.status !== 'BATAL';
      } else if (currentRsvFilter === 'COMPLETED') {
        return r.status === 'SELESAI' || r.status === 'CHECK-IN';
      }
      return true; // ALL
    });

    // Calculate Reservation KPIs
    const totalRsv = reservations.length;
    const todayRsv = reservations.filter(r => (r.eventDate || r.date) === todayStr).length;
    const totalDp = reservations.reduce((sum, r) => sum + (r.dpPaid || 0), 0);
    const totalRemain = reservations.reduce((sum, r) => {
      const remain = (r.grandTotal || 0) - (r.dpPaid || 0);
      return sum + (remain > 0 && r.status !== 'SELESAI' && r.status !== 'BATAL' ? remain : 0);
    }, 0);

    if (rsvKpiTotal) rsvKpiTotal.textContent = totalRsv;
    if (rsvKpiToday) rsvKpiToday.textContent = todayRsv;
    if (rsvKpiTotalDp) rsvKpiTotalDp.textContent = formatRp(totalDp);
    if (rsvKpiTotalRemain) rsvKpiTotalRemain.textContent = formatRp(totalRemain);

    if (filtered.length === 0) {
      adminReservationsTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 36px; color: #64748b;">
            <p style="font-weight: 700; font-size: 14px;">Tidak ada jadwal reservasi untuk filter ini.</p>
          </td>
        </tr>
      `;
      return;
    }

    adminReservationsTableBody.innerHTML = filtered.map(r => {
      const itemsList = Array.isArray(r.items) ? r.items : (r.items?.products || []);
      const itemsHtml = itemsList.length > 0
        ? itemsList.map(it => `<span class="rsv-menu-tag">${it.qty}x ${it.title} ${it.level ? `(${it.level})` : ''}</span>`).join('')
        : '<span style="font-size: 11px; color: #94a3b8;">Hanya pesan meja (Menu di tempat)</span>';

      const dpPaid = r.dpPaid || (r.grandTotal ? Math.round(r.grandTotal * 0.5) : 0);
      const remaining = Math.max(0, (r.grandTotal || 0) - dpPaid);

      let statusBadge = '<span class="status-badge-table pending">DP Menunggu</span>';
      if (r.status === 'LUNAS' || r.status === 'DP_LUNAS') {
        statusBadge = '<span class="status-badge-table paid" style="background: #dcfce7; color: #15803d;">DP LUNAS 50%</span>';
      } else if (r.status === 'CHECK-IN' || r.status === 'DIPROSES') {
        statusBadge = '<span class="status-badge-table processing" style="background: #e0e7ff; color: #4338ca;">Tamu Check-In</span>';
      } else if (r.status === 'SELESAI') {
        statusBadge = '<span class="status-badge-table ready" style="background: #f1f5f9; color: #475569;">Selesai</span>';
      } else if (r.status === 'BATAL' || r.status === 'DIBATALKAN') {
        statusBadge = '<span class="status-badge-table cancel" style="background: #fee2e2; color: #dc2626;">Dibatalkan</span>';
      }

      const isToday = (r.eventDate || r.date) === todayStr;
      const dateDisplay = r.eventDate || r.date || 'Hari Ini';
      const timeDisplay = r.eventTime || r.time || '18:00';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: ${isToday ? '#0066ff' : '#0f172a'};">
              ${dateDisplay}
            </div>
            <small style="color: #64748b;">Jam: <strong>${timeDisplay} WIB</strong></small>
          </td>
          <td>
            <strong style="color: #0f172a;">#${r.queueNumber || r.orderId}</strong>
            <div style="font-size: 11px; color: #64748b;">${r.orderId}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${r.customerName || 'Pelanggan'}</div>
            <small style="color: #64748b;">${r.customerPhone || r.userEmail || '-'}</small>
          </td>
          <td>
            <span class="rsv-table-tag">${r.tableNo || r.tableInfo || 'Meja 01'}</span>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${r.seats || 5} Kursi</div>
          </td>
          <td style="max-width: 200px;">
            ${itemsHtml}
          </td>
          <td>
            <div style="font-size: 12px;">Total: <strong>${formatRp(r.grandTotal || 0)}</strong></div>
            <div style="font-size: 11px; color: #16a34a;">DP: <strong>${formatRp(dpPaid)}</strong></div>
            <div style="font-size: 11px; color: ${remaining > 0 ? '#d97706' : '#16a34a'};">Sisa: <strong>${formatRp(remaining)}</strong></div>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${r.status !== 'SELESAI' && r.status !== 'BATAL' ? `
              <button type="button" class="rsv-action-btn checkin btn-rsv-checkin" data-id="${r.orderId}">
                Check-In
              </button>
              <button type="button" class="rsv-action-btn finish btn-rsv-finish" data-id="${r.orderId}">
                Selesai
              </button>
              <button type="button" class="rsv-action-btn cancel btn-rsv-cancel" data-id="${r.orderId}">
                Batal
              </button>
            ` : `
              <span style="font-size: 11px; color: #94a3b8;">-</span>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Event listeners for reservation actions
    adminReservationsTableBody.querySelectorAll('.btn-rsv-checkin').forEach(btn => {
      btn.addEventListener('click', () => {
        const ordId = btn.getAttribute('data-id');
        updateReservationStatus(ordId, 'CHECK-IN');
      });
    });

    adminReservationsTableBody.querySelectorAll('.btn-rsv-finish').forEach(btn => {
      btn.addEventListener('click', () => {
        const ordId = btn.getAttribute('data-id');
        updateReservationStatus(ordId, 'SELESAI');
      });
    });

    adminReservationsTableBody.querySelectorAll('.btn-rsv-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        const ordId = btn.getAttribute('data-id');
        if (confirm('Apakah Anda yakin ingin membatalkan jadwal reservasi ini?')) {
          updateReservationStatus(ordId, 'BATAL');
        }
      });
    });
  }

  function updateReservationStatus(orderId, newStatus) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.orderId === orderId);
    if (idx > -1) {
      orders[idx].status = newStatus;
      saveOrders(orders);
      refreshAllViews();

      // Sync to Supabase
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.updateOrderStatus(orderId, newStatus);
      }
    }
  }

  // ----------------------------------------------------------------------
  // Refresh Views & Listeners
  // ----------------------------------------------------------------------
  function refreshAllViews() {
    try { updateKPIs(); } catch (e) { console.warn('updateKPIs error:', e); }
    try { renderCategoryFilterPills(); } catch (e) { console.warn('renderCategoryFilterPills error:', e); }
    try { renderProductsGrid(); } catch (e) { console.warn('renderProductsGrid error:', e); }
    try { renderCategoriesList(); } catch (e) { console.warn('renderCategoriesList error:', e); }
    try { renderSalesAnalytics(); } catch (e) { console.warn('renderSalesAnalytics error:', e); }
    try { renderReservationsPanel(); } catch (e) { console.warn('renderReservationsPanel error:', e); }
  }

  if (posChannel) {
    posChannel.onmessage = (e) => {
      if (e.data && (e.data.type === 'ORDER_UPDATED' || e.data.type === 'PRODUCTS_UPDATED')) {
        refreshAllViews();
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === DB_ORDERS_KEY || e.key === DB_PRODUCTS_KEY || e.key === DB_CATEGORIES_KEY) {
      refreshAllViews();
    }
  });

  checkAdminAuth();
  initAdminSalesControls();

  // Supabase Realtime Sync for Admin Dashboard
  if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
    window.GacoanSupabase.getOrders().then(orders => {
      if (orders && orders.length > 0) {
        saveOrders(orders);
        refreshAllViews();
      }
    }).catch(err => console.warn('Supabase fetch orders:', err));

    window.GacoanSupabase.getProducts().then(prods => {
      if (prods && prods.length > 0) {
        saveProducts(prods);
        refreshAllViews();
      }
    }).catch(err => console.warn('Supabase fetch products:', err));

    window.GacoanSupabase.subscribeOrders(() => {
      window.GacoanSupabase.getOrders().then(orders => {
        if (orders && orders.length > 0) {
          saveOrders(orders);
          refreshAllViews();
        }
      }).catch(() => {});
    });

    window.GacoanSupabase.subscribeProducts(() => {
      window.GacoanSupabase.getProducts().then(prods => {
        if (prods && prods.length > 0) {
          saveProducts(prods);
          refreshAllViews();
        }
      }).catch(() => {});
    });
  }
});
