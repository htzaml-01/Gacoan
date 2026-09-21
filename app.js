document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------------------------
  // Audio Synthesizer for Checkout Success Sound (Web Audio API)
  // ----------------------------------------------------------------------
  const playCheckoutChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);

        gain.gain.setValueAtTime(0, now + index * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, now + index * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.5);
      });
    } catch (e) {
      console.warn('Audio playback not allowed:', e);
    }
  };

  // ----------------------------------------------------------------------
  // LocalStorage Database Keys & Real-Time Sync Channel
  // ----------------------------------------------------------------------
  const DB_USERS_KEY = 'gacoan_users_database';
  const DB_SESSION_KEY = 'gacoan_auth_session';
  const DB_ORDERS_KEY = 'gacoan_orders_database';
  const DB_PRODUCTS_KEY = 'gacoan_products_database';
  const DB_CATEGORIES_KEY = 'gacoan_categories_database';
  const DB_ACTIVE_ORDER_ID_KEY = 'gacoan_active_order_id';
  const KASIR_SESSION_KEY = 'gacoan_kasir_session';

  let posChannel = null;
  try {
    posChannel = new BroadcastChannel('gacoan_pos_channel');
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }

  // Seed default demo users (Customer, Cashier, Kitchen, Admin)
  const initUsersDB = () => {
    const existing = localStorage.getItem(DB_USERS_KEY);
    if (!existing) {
      const initialUsers = [
        {
          email: 'gacoan@gmail.com',
          username: 'GacoanLover',
          password: 'gacoan123',
          role: 'customer',
          ordersCount: 2
        },
        {
          email: 'kasir@gacoan.id',
          username: 'Kasir Gacoan',
          password: 'kasir123',
          role: 'kasir',
          ordersCount: 0
        },
        {
          email: 'dapur@gacoan.id',
          username: 'Tim Dapur Gacoan',
          password: 'dapur123',
          role: 'dapur',
          ordersCount: 0
        },
        {
          email: 'admin@gacoan.id',
          username: 'Super Admin Gacoan',
          password: 'admin123',
          role: 'admin',
          ordersCount: 0
        }
      ];
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(initialUsers));
    } else {
      try {
        const users = JSON.parse(existing) || [];
        const kasirUser = users.find(u => u.email && u.email.toLowerCase() === 'kasir@gacoan.id');
        if (kasirUser) kasirUser.role = 'kasir';
        const dapurUser = users.find(u => u.email && u.email.toLowerCase() === 'dapur@gacoan.id');
        if (dapurUser) dapurUser.role = 'dapur';
        const adminUser = users.find(u => u.email && (u.email.toLowerCase() === 'admin@gacoan.id' || u.email.toLowerCase() === 'admin@gacaon.id'));
        if (adminUser) adminUser.role = 'admin';

        if (!users.some(u => u.email && u.email.toLowerCase() === 'kasir@gacoan.id')) {
          users.push({
            email: 'kasir@gacoan.id',
            username: 'Kasir Gacoan',
            password: 'kasir123',
            role: 'kasir',
            ordersCount: 0
          });
        }
        if (!users.some(u => u.email && u.email.toLowerCase() === 'dapur@gacoan.id')) {
          users.push({
            email: 'dapur@gacoan.id',
            username: 'Tim Dapur Gacoan',
            password: 'dapur123',
            role: 'dapur',
            ordersCount: 0
          });
        }
        if (!users.some(u => u.email && u.email.toLowerCase() === 'admin@gacoan.id')) {
          users.push({
            email: 'admin@gacoan.id',
            username: 'Super Admin Gacoan',
            password: 'admin123',
            role: 'admin',
            ordersCount: 0
          });
        }
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      } catch (e) {}
    }
  };

  initUsersDB();

  const getUsersFromDB = () => {
    try {
      return JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  };

  const saveUsersToDB = (users) => {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
  };

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem(DB_SESSION_KEY));
    } catch (e) {
      return null;
    }
  };

  const setCurrentUser = (user) => {
    if (user) {
      localStorage.setItem(DB_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_SESSION_KEY);
    }
    checkAuthGate();
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

  const getAllOrders = () => {
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
  // Forced Login Gate & UI Blur Handler
  // ----------------------------------------------------------------------
  const authGateOverlay = document.getElementById('authGateOverlay');
  const mainAppWrapper = document.getElementById('mainAppWrapper');
  const headerUserName = document.getElementById('headerUserName');
  const tabGateLogin = document.getElementById('tabGateLogin');
  const tabGateRegister = document.getElementById('tabGateRegister');
  const gateLoginForm = document.getElementById('gateLoginForm');
  const gateRegisterForm = document.getElementById('gateRegisterForm');
  const gateLoginEmail = document.getElementById('gateLoginEmail');
  const gateLoginPassword = document.getElementById('gateLoginPassword');
  const gateLoginMsg = document.getElementById('gateLoginMsg');
  const gateRegEmail = document.getElementById('gateRegEmail');
  const gateRegUsername = document.getElementById('gateRegUsername');
  const gateRegPassword = document.getElementById('gateRegPassword');
  const gateRegMsg = document.getElementById('gateRegMsg');

  // Profile Modal DOM
  const profileHeaderBtn = document.getElementById('profileHeaderBtn');
  const userProfileModal = document.getElementById('userProfileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileUsername = document.getElementById('profileUsername');
  const profileEmail = document.getElementById('profileEmail');
  const cardViewReservationTicket = document.getElementById('cardViewReservationTicket');
  const profileReservationTicketStatus = document.getElementById('profileReservationTicketStatus');
  const logoutBtn = document.getElementById('logoutBtn');

  function checkAuthGate() {
    const user = getCurrentUser();
    const staffPortalBtn = document.getElementById('staffPortalShortcutBtn');
    if (user) {
      const email = (user.email || '').toLowerCase().trim();
      const role = (user.role || '').toLowerCase().trim();

      // If active session is staff, auto-route to respective portal immediately
      if (role === 'kasir' || email === 'kasir@gacoan.id' || email === 'kasir@gacoan.com' || email === 'kasir') {
        window.location.replace('kasir.html');
        return;
      }
      if (role === 'dapur' || email === 'dapur@gacoan.id' || email === 'dapur@gacoan.com' || email === 'dapur') {
        window.location.replace('dapur.html');
        return;
      }
      if (role === 'admin' || email === 'admin@gacoan.id' || email === 'admin@gacoan.com' || email === 'admin@gacaon.id' || email === 'admin') {
        window.location.replace('admin.html');
        return;
      }

      authGateOverlay.classList.add('hidden');
      mainAppWrapper.classList.remove('app-blurred');
      headerUserName.textContent = user.username || user.email.split('@')[0];
      if (staffPortalBtn) staffPortalBtn.style.display = 'none';
      checkActiveTicketBanner();
    } else {
      authGateOverlay.classList.remove('hidden');
      mainAppWrapper.classList.add('app-blurred');
      headerUserName.textContent = 'Masuk';
      if (staffPortalBtn) staffPortalBtn.style.display = 'none';
      hideActiveTicketBanner();
    }
  }

  function switchGateTab(mode) {
    gateLoginMsg.className = 'auth-msg';
    gateLoginMsg.textContent = '';
    gateRegMsg.className = 'auth-msg';
    gateRegMsg.textContent = '';

    if (mode === 'login') {
      tabGateLogin.classList.add('active');
      tabGateRegister.classList.remove('active');
      gateLoginForm.style.display = 'flex';
      gateRegisterForm.style.display = 'none';
    } else {
      tabGateRegister.classList.add('active');
      tabGateLogin.classList.remove('active');
      gateRegisterForm.style.display = 'flex';
      gateLoginForm.style.display = 'none';
    }
  }

  tabGateLogin.addEventListener('click', () => switchGateTab('login'));
  tabGateRegister.addEventListener('click', () => switchGateTab('register'));

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

  // Handle Login Submit
  gateLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailVal = gateLoginEmail.value.trim().toLowerCase();
    const passVal = gateLoginPassword.value.trim();

    // 1. Direct Kasir Login
    if ((emailVal === 'kasir@gacoan.id' || emailVal === 'kasir@gacoan.com' || emailVal === 'kasir') && passVal === 'kasir123') {
      const staffKasir = { email: 'kasir@gacoan.id', username: 'Kasir Gacoan', role: 'kasir', ordersCount: 0 };
      localStorage.setItem(DB_SESSION_KEY, JSON.stringify(staffKasir));
      localStorage.setItem(KASIR_SESSION_KEY, 'Kasir Gacoan');
      gateLoginMsg.className = 'auth-msg success';
      gateLoginMsg.textContent = 'Login Kasir berhasil! Membuka Portal Kasir...';
      window.location.replace('kasir.html');
      return;
    }

    // 2. Direct Dapur Login
    if ((emailVal === 'dapur@gacoan.id' || emailVal === 'dapur@gacoan.com' || emailVal === 'dapur') && passVal === 'dapur123') {
      const staffDapur = { email: 'dapur@gacoan.id', username: 'Tim Dapur Gacoan', role: 'dapur', ordersCount: 0 };
      localStorage.setItem(DB_SESSION_KEY, JSON.stringify(staffDapur));
      localStorage.setItem('gacoan_dapur_session', 'Tim Dapur Gacoan');
      gateLoginMsg.className = 'auth-msg success';
      gateLoginMsg.textContent = 'Login Dapur berhasil! Membuka Portal Dapur KDS...';
      window.location.replace('dapur.html');
      return;
    }

    // 3. Direct Admin Login
    if ((emailVal === 'admin@gacoan.id' || emailVal === 'admin@gacoan.com' || emailVal === 'admin@gacaon.id' || emailVal === 'admin') && passVal === 'admin123') {
      const staffAdmin = { email: 'admin@gacoan.id', username: 'Super Admin Gacoan', role: 'admin', ordersCount: 0 };
      localStorage.setItem(DB_SESSION_KEY, JSON.stringify(staffAdmin));
      localStorage.setItem('gacoan_admin_session', 'Super Admin Gacoan');
      gateLoginMsg.className = 'auth-msg success';
      gateLoginMsg.textContent = 'Login Admin berhasil! Membuka Panel Admin...';
      window.location.replace('admin.html');
      return;
    }

    // 4. Regular Customer Database Check
    const users = getUsersFromDB();
    let foundUser = users.find(u => u.email.toLowerCase() === emailVal && u.password === passVal);

    if (foundUser) {
      if (foundUser.role === 'kasir') {
        localStorage.setItem(DB_SESSION_KEY, JSON.stringify(foundUser));
        localStorage.setItem(KASIR_SESSION_KEY, foundUser.username || 'Kasir Gacoan');
        window.location.replace('kasir.html');
        return;
      }
      if (foundUser.role === 'dapur') {
        localStorage.setItem(DB_SESSION_KEY, JSON.stringify(foundUser));
        localStorage.setItem('gacoan_dapur_session', foundUser.username || 'Tim Dapur Gacoan');
        window.location.replace('dapur.html');
        return;
      }
      if (foundUser.role === 'admin') {
        localStorage.setItem(DB_SESSION_KEY, JSON.stringify(foundUser));
        localStorage.setItem('gacoan_admin_session', foundUser.username || 'Super Admin Gacoan');
        window.location.replace('admin.html');
        return;
      }

      gateLoginMsg.className = 'auth-msg success';
      gateLoginMsg.textContent = `Login berhasil! Selamat datang ${foundUser.username || foundUser.email}...`;
      setTimeout(() => {
        setCurrentUser(foundUser);
        gateLoginEmail.value = '';
        gateLoginPassword.value = '';
        gateLoginMsg.textContent = '';
      }, 300);
    } else {
      // Check Supabase Cloud fallback for login
      if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
        window.GacoanSupabase.loginUser(emailVal, passVal).then(remoteUser => {
          if (remoteUser) {
            users.push(remoteUser);
            saveUsersToDB(users);
            if (remoteUser.role === 'kasir') {
              localStorage.setItem(DB_SESSION_KEY, JSON.stringify(remoteUser));
              localStorage.setItem(KASIR_SESSION_KEY, remoteUser.username || 'Kasir Gacoan');
              window.location.replace('kasir.html');
              return;
            }
            if (remoteUser.role === 'dapur') {
              localStorage.setItem(DB_SESSION_KEY, JSON.stringify(remoteUser));
              localStorage.setItem('gacoan_dapur_session', remoteUser.username || 'Tim Dapur Gacoan');
              window.location.replace('dapur.html');
              return;
            }
            if (remoteUser.role === 'admin') {
              localStorage.setItem(DB_SESSION_KEY, JSON.stringify(remoteUser));
              localStorage.setItem('gacoan_admin_session', remoteUser.username || 'Super Admin Gacoan');
              window.location.replace('admin.html');
              return;
            }

            gateLoginMsg.className = 'auth-msg success';
            gateLoginMsg.textContent = `Login berhasil! Selamat datang ${remoteUser.username || remoteUser.email}...`;
            setTimeout(() => {
              setCurrentUser(remoteUser);
              gateLoginEmail.value = '';
              gateLoginPassword.value = '';
              gateLoginMsg.textContent = '';
            }, 300);
          } else {
            gateLoginMsg.className = 'auth-msg error';
            gateLoginMsg.textContent = 'Email atau password salah. Cek kembali!';
          }
        });
      } else {
        gateLoginMsg.className = 'auth-msg error';
        gateLoginMsg.textContent = 'Email atau password salah. Cek kembali!';
      }
    }
  });

  // Handle Register Submit
  gateRegisterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailVal = gateRegEmail.value.trim().toLowerCase();
    const usernameVal = gateRegUsername.value.trim();
    const passVal = gateRegPassword.value;

    const users = getUsersFromDB();
    const isEmailTaken = users.some(u => u.email.toLowerCase() === emailVal);

    if (isEmailTaken) {
      gateRegMsg.className = 'auth-msg error';
      gateRegMsg.textContent = 'Email sudah terdaftar. Silakan gunakan tab Masuk.';
      return;
    }

    const newUser = {
      email: emailVal,
      username: usernameVal,
      password: passVal,
      role: 'customer',
      ordersCount: 0
    };

    users.push(newUser);
    saveUsersToDB(users);

    // Sync new user to Supabase Cloud Database
    if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
      window.GacoanSupabase.registerUser(newUser);
    }

    gateRegMsg.className = 'auth-msg success';
    gateRegMsg.textContent = 'Akun berhasil dibuat! Otomatis masuk...';
    setTimeout(() => {
      setCurrentUser(newUser);
      gateRegEmail.value = '';
      gateRegUsername.value = '';
      gateRegPassword.value = '';
      gateRegMsg.textContent = '';
    }, 400);
  });

  // Profile Modal & History DOM Elements
  const profileRoleBadge = document.getElementById('profileRoleBadge');
  const profileMemberLevel = document.getElementById('profileMemberLevel');
  const btnHistOrders = document.getElementById('btnHistOrders');
  const btnHistReservations = document.getElementById('btnHistReservations');
  const profileOrdersList = document.getElementById('profileOrdersList');
  const profileReservationsList = document.getElementById('profileReservationsList');

  // Switch between Orders and Reservations in Profile Modal
  if (btnHistOrders && btnHistReservations) {
    btnHistOrders.addEventListener('click', () => {
      btnHistOrders.classList.add('active');
      btnHistReservations.classList.remove('active');
      if (profileOrdersList) profileOrdersList.style.display = 'flex';
      if (profileReservationsList) profileReservationsList.style.display = 'none';
    });

    btnHistReservations.addEventListener('click', () => {
      btnHistReservations.classList.add('active');
      btnHistOrders.classList.remove('active');
      if (profileReservationsList) profileReservationsList.style.display = 'flex';
      if (profileOrdersList) profileOrdersList.style.display = 'none';
    });
  }

  function renderProfileHistory() {
    const user = getCurrentUser();
    if (!user) return;

    const allOrders = getAllOrders();
    const userEmail = (user.email || '').toLowerCase();

    // Filter user's regular orders & reservations
    const userOrders = allOrders.filter(o => {
      const matchEmail = o.userEmail && o.userEmail.toLowerCase() === userEmail;
      return (matchEmail || o.customerName === user.username) && o.diningType !== 'RESERVASI';
    });

    const userReservations = allOrders.filter(o => {
      const matchEmail = o.userEmail && o.userEmail.toLowerCase() === userEmail;
      return (matchEmail || o.customerName === user.username) && o.diningType === 'RESERVASI';
    });

    // Render Regular Orders List
    if (profileOrdersList) {
      if (userOrders.length === 0) {
        profileOrdersList.innerHTML = `
          <div style="text-align: center; padding: 24px; color: #64748b; font-size: 13px;">
            Belum ada riwayat pesanan menu.
          </div>
        `;
      } else {
        profileOrdersList.innerHTML = userOrders.map(o => {
          let statusColor = '#f59e0b';
          let statusText = 'Menunggu Pembayaran';
          if (o.status === 'LUNAS') { statusColor = '#16a34a'; statusText = 'Lunas (Antrian Dapur)'; }
          else if (o.status === 'SEDANG_DIMASAK') { statusColor = '#0066ff'; statusText = 'Sedang Dimasak'; }
          else if (o.status === 'SIAP_SAJI') { statusColor = '#16a34a'; statusText = 'Siap Diambil'; }
          else if (o.status === 'SELESAI') { statusColor = '#64748b'; statusText = 'Selesai'; }

          const itemsList = Array.isArray(o.items) ? o.items : (o.items?.products || []);

          return `
            <div class="profile-history-card">
              <div class="hist-card-head">
                <div>
                  <span class="hist-order-id">#${o.queueNumber || o.orderId} &bull; ${o.orderId}</span>
                  <span class="hist-date-time">${o.createdAt || 'Baru saja'} &bull; ${o.diningType || 'Dine In'} (${o.tableInfo || '-'})</span>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: ${statusColor}; background: #f1f5f9; padding: 3px 8px; border-radius: 12px;">
                  ${statusText}
                </span>
              </div>

              <div class="hist-items-summary">
                ${itemsList.map(it => `
                  <div>
                    <div class="hist-item-row">
                      <span class="hist-item-title">${it.qty}x ${it.title}</span>
                      <span>Rp${(it.unitPrice * it.qty || it.total || 0).toLocaleString('id-ID')}</span>
                    </div>
                    ${it.level ? `<div class="hist-item-desc">&bull; Level: ${it.level}</div>` : ''}
                    ${it.notes ? `<div class="hist-item-desc">&bull; Catatan: "${it.notes}"</div>` : ''}
                  </div>
                `).join('')}
              </div>

              <div class="hist-card-foot">
                <div>
                  <span style="font-size: 11px; color: #64748b; display: block;">Total Tagihan (${o.paymentMethod || 'Cashless'}):</span>
                  <span class="hist-total-amount">Rp${(o.grandTotal || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');

        profileOrdersList.querySelectorAll('.btn-view-hist-ticket').forEach(btn => {
          btn.addEventListener('click', () => {
            const ordId = btn.getAttribute('data-order-id');
            const ord = allOrders.find(x => x.orderId === ordId);
            if (ord) {
              if (userProfileModal) userProfileModal.classList.remove('active');
              showTicketModal(ord);
            }
          });
        });
      }
    }

    // Render Reservations List
    if (profileReservationsList) {
      if (userReservations.length === 0) {
        profileReservationsList.innerHTML = `
          <div style="text-align: center; padding: 24px; color: #64748b; font-size: 13px;">
            Belum ada riwayat reservasi acara.
          </div>
        `;
      } else {
        profileReservationsList.innerHTML = userReservations.map(rsv => {
          const remaining = Math.max(0, (rsv.grandTotal || 0) - (rsv.dpPaid || 0));
          const isLunas = rsv.status === 'LUNAS' || rsv.status === 'SELESAI' || remaining === 0;

          const itemsList = Array.isArray(rsv.items) ? rsv.items : (rsv.items?.products || []);

          return `
            <div class="profile-history-card">
              <div class="hist-card-head">
                <div>
                  <span class="hist-order-id">${rsv.reservationId || rsv.orderId}</span>
                  <span class="hist-date-time">Jadwal: <strong>${rsv.eventDate || '-'} pukul ${rsv.eventTime || '-'} WIB</strong></span>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: ${isLunas ? '#16a34a' : '#ea580c'}; background: #f1f5f9; padding: 3px 8px; border-radius: 12px;">
                  ${isLunas ? 'LUNAS (100%)' : `DP ${rsv.dpOption || '50%'} TERBAYAR`}
                </span>
              </div>

              <div class="hist-items-summary">
                <div style="font-weight: 700; color: #0066ff; margin-bottom: 2px;">
                  Meja: ${Array.isArray(rsv.tableNumbers) ? rsv.tableNumbers.join(', ') : (rsv.tableInfo || '-')} (${rsv.seats || '-'} Kursi)
                </div>
                ${itemsList.map(it => `
                  <div class="hist-item-row">
                    <span class="hist-item-title">${it.qty}x ${it.title}</span>
                    <span>Rp${(it.price * it.qty || it.total || 0).toLocaleString('id-ID')}</span>
                  </div>
                `).join('')}
              </div>

              <div class="hist-card-foot">
                <div>
                  <div style="font-size: 11px; color: #16a34a;">DP Terbayar: <strong>Rp${(rsv.dpPaid || 0).toLocaleString('id-ID')}</strong></div>
                  <div style="font-size: 11px; color: ${remaining > 0 ? '#dc2626' : '#16a34a'};">Sisa di Kasir: <strong>Rp${remaining.toLocaleString('id-ID')}</strong></div>
                </div>
                <button type="button" class="btn-view-hist-ticket" data-rsv-id="${rsv.reservationId || rsv.orderId}">Lihat Tiket Reservasi</button>
              </div>
            </div>
          `;
        }).join('');

        profileReservationsList.querySelectorAll('.btn-view-hist-ticket').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rId = btn.getAttribute('data-rsv-id');
            const rsv = allOrders.find(x => 
              (x.reservationId && String(x.reservationId).trim() === String(rId).trim()) || 
              (x.orderId && String(x.orderId).trim() === String(rId).trim())
            );
            if (rsv) {
              if (userProfileModal) userProfileModal.classList.remove('active');
              showReservationTicket(rsv);
            }
          });
        });
      }
    }
  }

  profileHeaderBtn.addEventListener('click', () => {
    const user = getCurrentUser();
    if (!user) {
      checkAuthGate();
      return;
    }
    profileAvatar.textContent = (user.username || user.email)[0].toUpperCase();
    profileUsername.textContent = user.username || 'User Gacoan';
    profileEmail.textContent = user.email;

    if (profileRoleBadge) {
      profileRoleBadge.textContent = user.role || 'customer';
    }

    renderProfileHistory();
    userProfileModal.classList.add('active');
  });

  closeProfileModal.addEventListener('click', () => {
    userProfileModal.classList.remove('active');
  });

  userProfileModal.addEventListener('click', (e) => {
    if (e.target === userProfileModal) userProfileModal.classList.remove('active');
  });

  logoutBtn.addEventListener('click', () => {
    userProfileModal.classList.remove('active');
    localStorage.removeItem(KASIR_SESSION_KEY);
    localStorage.removeItem('gacoan_dapur_session');
    localStorage.removeItem('gacoan_admin_session');
    setCurrentUser(null);
  });

  // ----------------------------------------------------------------------
  // State
  // ----------------------------------------------------------------------
  let cart = [];
  let currentProduct = null;
  let currentQty = 1;
  let selectedLevelExtra = 0;
  let selectedLevelName = 'LEVEL 0';
  let pendingCheckoutOrder = null; // Store pending order data before PG completion
  let pgTimerInterval = null;

  const formatRp = (num) => {
    return 'Rp' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // DOM Elements
  const tabs = document.querySelectorAll('.cat-tab');
  const sections = document.querySelectorAll('.menu-category-section');
  const menuCards = document.querySelectorAll('.menu-card');

  // Product Modal DOM
  const productModal = document.getElementById('productModal');
  const closeProductModal = document.getElementById('closeProductModal');
  const modalProductImg = document.getElementById('modalProductImg');
  const modalProductTitle = document.getElementById('modalProductTitle');
  const modalProductPrice = document.getElementById('modalProductPrice');
  const modalProductDesc = document.getElementById('modalProductDesc');
  const modalProductNotes = document.getElementById('modalProductNotes');
  const levelPedasSection = document.getElementById('levelPedasSection');
  const qtyDisplay = document.getElementById('qtyDisplay');
  const qtyMinusBtn = document.getElementById('qtyMinusBtn');
  const qtyPlusBtn = document.getElementById('qtyPlusBtn');
  const modalBtnTotalPrice = document.getElementById('modalBtnTotalPrice');
  const modalAddOrdersBtn = document.getElementById('modalAddOrdersBtn');
  const radioLevels = document.querySelectorAll('input[name="pedas_level"]');

  // Cart DOM & Dining Type Controls
  const cartHeaderBtn = document.getElementById('cartHeaderBtn');
  const cartHeaderBadge = document.getElementById('cartHeaderBadge');
  const floatingCartBar = document.getElementById('floatingCartBar');
  const floatingCartCount = document.getElementById('floatingCartCount');
  const floatingCartTotal = document.getElementById('floatingCartTotal');
  const openCartDrawerBtn = document.getElementById('openCartDrawerBtn');
  const cartDrawerModal = document.getElementById('cartDrawerModal');
  const closeCartDrawer = document.getElementById('closeCartDrawer');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartItemsCount = document.getElementById('cartItemsCount');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTax = document.getElementById('cartTax');
  const cartGrandTotal = document.getElementById('cartGrandTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const diningRadios = document.querySelectorAll('input[name="orderDiningType"]');
  const tableNoBlock = document.getElementById('tableNoBlock');
  const orderTableNo = document.getElementById('orderTableNo');
  const tableNoErrorMsg = document.getElementById('tableNoErrorMsg');

  // Payment Gateway DOM
  const paymentGatewayModal = document.getElementById('paymentGatewayModal');
  const closePgModal = document.getElementById('closePgModal');
  const btnCancelPg = document.getElementById('btnCancelPg');
  const pgTotalAmount = document.getElementById('pgTotalAmount');
  const pgQrisView = document.getElementById('pgQrisView');
  const pgDebitView = document.getElementById('pgDebitView');
  const pgDynamicQrImage = document.getElementById('pgDynamicQrImage');
  const pgCountdownTimer = document.getElementById('pgCountdownTimer');
  const btnPgSimulateQrisPay = document.getElementById('btnPgSimulateQrisPay');
  const btnPgSimulateDebitPay = document.getElementById('btnPgSimulateDebitPay');
  const pgBankRadios = document.querySelectorAll('input[name="pg_bank"]');
  const pgVaNumber = document.getElementById('pgVaNumber');
  const btnCopyVa = document.getElementById('btnCopyVa');

  // Ticket Modal DOM
  const queueTicketModal = document.getElementById('queueTicketModal');
  const closeTicketModal = document.getElementById('closeTicketModal');
  const ticketDismissBtn = document.getElementById('ticketDismissBtn');
  const ticketOrderTime = document.getElementById('ticketOrderTime');
  const ticketQueueNumber = document.getElementById('ticketQueueNumber');
  const ticketPaymentBadge = document.getElementById('ticketPaymentBadge');
  const ticketQrImage = document.getElementById('ticketQrImage');
  const ticketCustomerName = document.getElementById('ticketCustomerName');
  const ticketDiningType = document.getElementById('ticketDiningType');
  const ticketPaymentMethod = document.getElementById('ticketPaymentMethod');
  const ticketItemsSummary = document.getElementById('ticketItemsSummary');
  const ticketGrandTotal = document.getElementById('ticketGrandTotal');

  // Active Ticket Top Banner DOM
  const activeTicketBanner = document.getElementById('activeTicketBanner');
  const bannerQueueNo = document.getElementById('bannerQueueNo');
  const bannerOrderStatus = document.getElementById('bannerOrderStatus');
  const btnOpenCurrentTicket = document.getElementById('btnOpenCurrentTicket');

  // Info Modal DOM
  const infoBtn = document.getElementById('infoBtn');
  const infoModal = document.getElementById('infoModal');
  const closeInfoModal = document.getElementById('closeInfoModal');

  // Search DOM
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const searchBox = document.getElementById('searchBox');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // ----------------------------------------------------------------------
  // Dining Type Toggle (Dine In = Required Table No, Take Away = Hidden)
  // ----------------------------------------------------------------------
  diningRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'Dine In') {
        tableNoBlock.style.display = 'flex';
        orderTableNo.setAttribute('required', 'true');
        tableNoErrorMsg.style.display = 'none';
      } else {
        tableNoBlock.style.display = 'none';
        orderTableNo.removeAttribute('required');
        tableNoErrorMsg.style.display = 'none';
        orderTableNo.value = '';
      }
    });
  });

  if (orderTableNo) {
    orderTableNo.addEventListener('change', () => {
      if (orderTableNo.value) {
        tableNoErrorMsg.style.display = 'none';
      }
    });
  }

  // ----------------------------------------------------------------------
  // Master Catalog Data (Categories, Products, Custom Levels)
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

    // Dynamically auto-discover all categories present in products
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
  // Dynamic Customer Menu Rendering
  // ----------------------------------------------------------------------
  const categoryTabsContainer = document.getElementById('categoryTabs');
  const menuContentContainer = document.getElementById('menuContent');

  function renderCustomerMenu() {
    const categories = getCategories();
    const products = getProducts();

    if (!categoryTabsContainer || !menuContentContainer) return;

    // Render Navigation Category Tabs
    categoryTabsContainer.innerHTML = categories.map((cat, idx) => `
      <a href="#category-${cat.toLowerCase().replace(/\s+/g, '-')}" class="cat-tab ${idx === 0 ? 'active' : ''}" data-category="${cat}">${cat}</a>
    `).join('');

    // Render Category Sections & Product Cards
    menuContentContainer.innerHTML = categories.map(cat => {
      const catProducts = products.filter(p => String(p.category || '').trim().toUpperCase() === String(cat || '').trim().toUpperCase());
      if (catProducts.length === 0) return '';

      const sectionId = `category-${cat.toLowerCase().replace(/\s+/g, '-')}`;

      return `
        <section class="menu-category-section" id="${sectionId}">
          <h2 class="category-title">${cat}</h2>
          <div class="menu-grid">
            ${catProducts.map(p => {
              const isAvailable = p.status === 'Tersedia';
              return `
                <article class="menu-card ${!isAvailable ? 'out-of-stock' : ''}" data-id="${p.id}" data-category="${p.category.toLowerCase()}" data-title="${p.title.toLowerCase()}" data-price="${p.price}" data-img="${p.img}" data-desc="${p.desc || ''}" data-has-level="${p.hasLevel}" data-status="${p.status}">
                  <div class="card-info">
                    <h3 class="card-title">${p.title}</h3>
                    <p class="card-desc">${p.desc || ''}</p>
                    <p class="card-price">${formatRp(p.price)}</p>
                  </div>
                  <div class="card-img-wrapper">
                    <img src="${p.img}" alt="${p.title}" class="card-img" loading="lazy" />
                    ${!isAvailable ? '<span class="card-habis-badge">HABIS</span>' : '<span class="card-add-badge" title="Pilih Menu">+</span>'}
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </section>
      `;
    }).join('');

    attachMenuCardEvents();
    attachCategoryTabEvents();
  }

  function attachCategoryTabEvents() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  function attachMenuCardEvents() {
    const menuCards = document.querySelectorAll('.menu-card');
    menuCards.forEach(card => {
      card.addEventListener('click', () => {
        const status = card.getAttribute('data-status');
        const title = card.querySelector('.card-title').textContent;

        if (status === 'Habis') {
          alert(`Mohon maaf, menu "${title}" saat ini sedang habis (Out of Stock). Silakan pilih menu lezat lainnya!`);
          return;
        }

        const id = card.getAttribute('data-id');
        const price = parseInt(card.getAttribute('data-price'), 10) || 10000;
        const img = card.getAttribute('data-img');
        const desc = card.getAttribute('data-desc');
        const hasLevel = card.getAttribute('data-has-level') === 'true';

        // Retrieve full product data from DB (for custom levels)
        const allProds = getProducts();
        const found = allProds.find(p => p.id === id);

        openProductModal(found || { id, title, price, img, desc, hasLevel, levels: [] });
      });
    });
  }

  // ----------------------------------------------------------------------
  // Search Functionality
  // ----------------------------------------------------------------------
  if (searchToggleBtn && searchBox) {
    searchToggleBtn.addEventListener('click', () => {
      const isHidden = searchBox.style.display === 'none';
      searchBox.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        searchInput.focus();
      } else {
        searchInput.value = '';
        filterMenu('');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterMenu(e.target.value.toLowerCase().trim());
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        filterMenu('');
        searchInput.focus();
      }
    });
  }

  function filterMenu(query) {
    const menuCards = document.querySelectorAll('.menu-card');
    const sections = document.querySelectorAll('.menu-category-section');

    menuCards.forEach(card => {
      const title = card.getAttribute('data-title') || '';
      if (!query || title.includes(query)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    sections.forEach(sec => {
      const allCards = sec.querySelectorAll('.menu-card');
      const hiddenCards = sec.querySelectorAll('.menu-card[style="display: none;"]');
      if (query && hiddenCards.length === allCards.length) {
        sec.style.display = 'none';
      } else {
        sec.style.display = 'block';
      }
    });
  }

  // ----------------------------------------------------------------------
  // Product Detail Modal & Custom Level Selector
  // ----------------------------------------------------------------------
  function openProductModal(product) {
    currentProduct = product;
    currentQty = 1;
    selectedLevelExtra = 0;
    selectedLevelName = 'LEVEL 0';

    modalProductImg.src = product.img;
    modalProductImg.alt = product.title;
    modalProductTitle.textContent = product.title.toUpperCase();
    modalProductPrice.textContent = formatRp(product.price);
    modalProductDesc.textContent = product.desc || '';
    modalProductNotes.value = '';
    qtyDisplay.textContent = currentQty;

    const levelOptionsList = document.querySelector('.level-options-list');

    if (product.hasLevel && product.levels && product.levels.length > 0) {
      levelPedasSection.style.display = 'block';

      // Dynamically render custom level rows
      levelOptionsList.innerHTML = product.levels.map((lvl, idx) => `
        <label class="level-option-row">
          <span class="level-name">
            ${lvl.name} ${lvl.extraPrice > 0 ? `<span class="extra-cost">(+ ${formatRp(lvl.extraPrice)})</span>` : ''}
          </span>
          <input type="radio" name="pedas_level" value="${lvl.name}" data-extra-price="${lvl.extraPrice || 0}" ${idx === 0 ? 'checked' : ''} />
          <span class="custom-radio"></span>
        </label>
      `).join('');

      // Set initial level
      selectedLevelName = product.levels[0].name;
      selectedLevelExtra = product.levels[0].extraPrice || 0;

      // Attach dynamic level radio listener
      levelOptionsList.querySelectorAll('input[name="pedas_level"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (e.target.checked) {
            selectedLevelName = e.target.value;
            selectedLevelExtra = parseInt(e.target.getAttribute('data-extra-price'), 10) || 0;
            updateModalPrice();
          }
        });
      });
    } else {
      levelPedasSection.style.display = 'none';
    }

    updateModalPrice();
    productModal.classList.add('active');
  }

  function updateModalPrice() {
    if (!currentProduct) return;
    const unitPrice = currentProduct.price + selectedLevelExtra;
    const totalPrice = unitPrice * currentQty;
    modalBtnTotalPrice.textContent = formatRp(totalPrice);
  }

  radioLevels.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedLevelName = e.target.value;
        selectedLevelExtra = parseInt(e.target.getAttribute('data-extra-price'), 10) || 0;
        updateModalPrice();
      }
    });
  });

  qtyMinusBtn.addEventListener('click', () => {
    if (currentQty > 1) {
      currentQty--;
      qtyDisplay.textContent = currentQty;
      updateModalPrice();
    }
  });

  qtyPlusBtn.addEventListener('click', () => {
    currentQty++;
    qtyDisplay.textContent = currentQty;
    updateModalPrice();
  });

  if (closeProductModal) {
    closeProductModal.addEventListener('click', () => {
      productModal.classList.remove('active');
    });
  }

  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
      productModal.classList.remove('active');
    }
  });

  // Add To Cart from Modal
  modalAddOrdersBtn.addEventListener('click', () => {
    if (!currentProduct) return;

    const unitPrice = currentProduct.price + selectedLevelExtra;
    const notes = modalProductNotes.value.trim();
    const itemLevel = currentProduct.hasLevel ? selectedLevelName : null;

    const existingIndex = cart.findIndex(item => 
      item.id === currentProduct.id && 
      item.level === itemLevel && 
      item.notes === notes
    );

    if (existingIndex > -1) {
      cart[existingIndex].qty += currentQty;
    } else {
      cart.push({
        id: currentProduct.id,
        title: currentProduct.title,
        unitPrice: unitPrice,
        level: itemLevel,
        notes: notes,
        img: currentProduct.img,
        qty: currentQty
      });
    }

    productModal.classList.remove('active');
    renderCart();
  });

  // ----------------------------------------------------------------------
  // Cart Management & Drawer
  // ----------------------------------------------------------------------
  function renderCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const tax = Math.round(subtotal * 0.1);
    const grandTotal = subtotal + tax;

    cartHeaderBadge.textContent = totalItems;

    if (totalItems > 0) {
      floatingCartBar.classList.add('active');
      floatingCartCount.textContent = `${totalItems} Menu`;
      floatingCartTotal.textContent = formatRp(grandTotal);
    } else {
      floatingCartBar.classList.remove('active');
    }

    cartItemsCount.textContent = `${totalItems} Items`;
    cartSubtotal.textContent = formatRp(subtotal);
    cartTax.textContent = formatRp(tax);
    cartGrandTotal.textContent = formatRp(grandTotal);

    const cartCheckoutOptions = document.getElementById('cartCheckoutOptions');

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="cart-empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <p style="font-weight: 600; font-size: 15px; color: #374151;">Keranjang Anda masih kosong</p>
          <p style="font-size: 13px; color: #9ca3af; margin-top: 4px;">Pilih menu lezat Mie Gacoan favoritmu!</p>
        </div>
      `;
      if (cartCheckoutOptions) cartCheckoutOptions.style.display = 'none';
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.5';
      checkoutBtn.style.cursor = 'not-allowed';
    } else {
      if (cartCheckoutOptions) cartCheckoutOptions.style.display = 'flex';
      checkoutBtn.disabled = false;
      checkoutBtn.style.opacity = '1';
      checkoutBtn.style.cursor = 'pointer';

      cartItemsList.innerHTML = cart.map((item, index) => `
        <div class="cart-item-card">
          <img src="${item.img}" alt="${item.title}" class="cart-item-img" />
          <div class="cart-item-info">
            <div>
              <h4 class="cart-item-name">${item.title}</h4>
              ${item.level ? `<div class="cart-item-meta">Level: <strong>${item.level}</strong></div>` : ''}
              ${item.notes ? `<div class="cart-item-meta">Catatan: "${item.notes}"</div>` : ''}
            </div>
            <div class="cart-item-bottom">
              <span class="cart-item-price">${formatRp(item.unitPrice * item.qty)}</span>
              <div class="cart-item-qty-actions">
                <button type="button" class="btn-item-qty" data-action="minus" data-index="${index}">&minus;</button>
                <span style="font-weight: 700; font-size: 13.5px; min-width: 16px; text-align: center;">${item.qty}</span>
                <button type="button" class="btn-item-qty" data-action="plus" data-index="${index}">&plus;</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      cartItemsList.querySelectorAll('.btn-item-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = btn.getAttribute('data-action');
          const index = parseInt(btn.getAttribute('data-index'), 10);

          if (action === 'plus') {
            cart[index].qty++;
          } else if (action === 'minus') {
            cart[index].qty--;
            if (cart[index].qty <= 0) {
              cart.splice(index, 1);
            }
          }
          renderCart();
        });
      });
    }
  }

  // Open & Close Cart Drawer
  const openCart = () => cartDrawerModal.classList.add('active');
  const closeCart = () => cartDrawerModal.classList.remove('active');

  cartHeaderBtn.addEventListener('click', openCart);
  openCartDrawerBtn.addEventListener('click', openCart);
  closeCartDrawer.addEventListener('click', closeCart);
  cartDrawerModal.addEventListener('click', (e) => {
    if (e.target === cartDrawerModal) closeCart();
  });

  // ----------------------------------------------------------------------
  // Checkout Validation & Payment Gateway Logic
  // ----------------------------------------------------------------------
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;

    const currentUser = getCurrentUser();
    const userEmail = currentUser ? currentUser.email : 'guest@gacoan.com';
    const userName = currentUser ? (currentUser.username || currentUser.email.split('@')[0]) : 'Pelanggan';

    // Dining type validation
    const selectedDiningRadio = document.querySelector('input[name="orderDiningType"]:checked');
    const diningType = selectedDiningRadio ? selectedDiningRadio.value : 'Dine In';
    const tableVal = orderTableNo.value.trim();

    // If Dine In, Table Number is MANDATORY!
    if (diningType === 'Dine In' && !tableVal) {
      tableNoErrorMsg.style.display = 'block';
      orderTableNo.focus();
      return;
    } else {
      tableNoErrorMsg.style.display = 'none';
    }

    const tableInfo = diningType === 'Dine In' ? `Dine In (No. Meja: ${tableVal})` : 'Take Away (Bungkus)';

    // Get selected payment method (Cashless or Cash)
    const selectedPayRadio = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethod = selectedPayRadio ? selectedPayRadio.value : 'Cashless';

    // Calculate queue number
    const allOrders = getAllOrders();
    const todayOrdersCount = allOrders.length + 1;
    const queueNumber = `A-${String(todayOrdersCount).padStart(3, '0')}`;
    const orderId = 'ORD-' + Date.now();

    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const tax = Math.round(subtotal * 0.1);
    const grandTotal = subtotal + tax;

    const now = new Date();
    const formattedTime = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Prepare order object
    pendingCheckoutOrder = {
      orderId: orderId,
      queueNumber: queueNumber,
      orderNumber: todayOrdersCount,
      userEmail: userEmail,
      customerName: userName,
      tableInfo: tableInfo,
      diningType: diningType,
      tableNo: tableVal,
      paymentMethod: paymentMethod === 'Cashless' ? 'Cashless (Midtrans)' : 'Cash (Bayar di Kasir)',
      items: [...cart],
      subtotal: subtotal,
      tax: tax,
      grandTotal: grandTotal,
      status: 'MENUNGGU_BAYAR',
      createdAt: formattedTime,
      timestamp: Date.now()
    };

    // If payment method is Cashless -> Open Midtrans Snap Payment Gateway!
    if (paymentMethod === 'Cashless') {
      closeCart();
      openPaymentGateway(pendingCheckoutOrder);
    } else {
      // Cash (Bayar di Kasir) -> Direct checkout (Pending at Cashier)
      finalizeOrder(pendingCheckoutOrder, 'MENUNGGU_BAYAR');
    }
  });

  // ----------------------------------------------------------------------
  // Midtrans Snap Payment Gateway & Modal Fallback
  // ----------------------------------------------------------------------
  async function requestMidtransSnapToken(payload) {
    const endpoints = [];
    const host = window.location.hostname;

    // 1. Same origin if running on port 3000
    if (window.location.port === '3000') {
      endpoints.push(`${window.location.origin}/api/create-midtrans-token`);
    }

    // 2. Machine IP / LAN hostname on port 3000 (Crucial for mobile devices accessing via WiFi LAN like 192.168.x.x:5500)
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      endpoints.push(`http://${host}:3000/api/create-midtrans-token`);
    }

    // 3. Fallbacks
    endpoints.push('http://localhost:3000/api/create-midtrans-token');
    endpoints.push('http://127.0.0.1:3000/api/create-midtrans-token');
    endpoints.push(`${window.location.origin}/api/create-midtrans-token`);

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for HTTPS Midtrans API
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (data && data.token) return data.token;
        }
      } catch (err) {
        // continue to next endpoint
      }
    }
    return null;
  }

  async function openPaymentGateway(order) {
    pendingCheckoutOrder = order;

    // 1. Try real Midtrans Snap via Backend Server
    if (typeof window.snap !== 'undefined' && window.snap.pay) {
      try {
        const token = await requestMidtransSnapToken({
          orderId: order.orderId,
          grossAmount: order.grandTotal,
          customerName: order.customerName,
          customerEmail: order.userEmail || (currentUser ? currentUser.email : `${(order.customerName || 'customer').toLowerCase().replace(/\s+/g, '')}@gacoan.customer`),
          customerPhone: '08123456789',
          items: order.items
        });

        if (token) {
          console.log(' Midtrans Snap Token diterima:', token);
          window.snap.pay(token, {
            onSuccess: function(result) {
              const payType = result.payment_type ? result.payment_type.toUpperCase() : 'CASHLESS';
              order.paymentMethod = `${payType} (Lunas via Midtrans Snap)`;
              finalizeOrder(order, 'LUNAS');
            },
            onPending: function(result) {
              const payType = result.payment_type ? result.payment_type.toUpperCase() : 'CASHLESS';
              order.paymentMethod = `${payType} (Lunas via Midtrans Sandbox)`;
              finalizeOrder(order, 'LUNAS');
            },
            onError: function(result) {
              order.paymentMethod = 'Cashless (Lunas via Midtrans Sandbox)';
              finalizeOrder(order, 'LUNAS');
            },
            onClose: function() {
              order.paymentMethod = 'Cashless (Lunas via Midtrans Sandbox)';
              finalizeOrder(order, 'LUNAS');
            }
          });
          return;
        }
      } catch (err) {
        console.warn('Backend Midtrans offline, mengalihkan ke Payment Simulator...', err);
      }
    }

    // 2. Fallback: Simulator Modal (When server is not started)
    pgTotalAmount.textContent = formatRp(order.grandTotal);

    if (order.paymentMethod === 'QRIS' || !order.paymentMethod) {
      pgQrisView.style.display = 'block';
      pgDebitView.style.display = 'none';

      const qrisData = encodeURIComponent(`QRIS.MIDTRANS.GACOAN|ID:${order.orderId}|NOMINAL:${order.grandTotal}`);
      pgDynamicQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrisData}&margin=2`;

      startPgCountdown(300);
    } else {
      pgQrisView.style.display = 'none';
      pgDebitView.style.display = 'block';
      updateVaNumber('BCA');
    }

    paymentGatewayModal.classList.add('active');
  }

  function startPgCountdown(durationSec) {
    if (pgTimerInterval) clearInterval(pgTimerInterval);
    let timeLeft = durationSec;

    const updateTimerText = () => {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      pgCountdownTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (timeLeft <= 0) {
        clearInterval(pgTimerInterval);
        pgCountdownTimer.textContent = '00:00 (Kadaluarsa)';
      }
      timeLeft--;
    };

    updateTimerText();
    pgTimerInterval = setInterval(updateTimerText, 1000);
  }

  function updateVaNumber(bank) {
    const bankPrefixes = {
      'BCA': '8910',
      'Mandiri': '8890',
      'BRI': '1280'
    };
    const prefix = bankPrefixes[bank] || '8910';
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    pgVaNumber.textContent = `${prefix} ${String(randomSuffix).slice(0, 4)} ${String(randomSuffix).slice(4, 8)} ${String(randomSuffix).slice(8)}`;
  }

  pgBankRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateVaNumber(e.target.value);
    });
  });

  btnCopyVa.addEventListener('click', () => {
    navigator.clipboard.writeText(pgVaNumber.textContent.replace(/\s+/g, '')).then(() => {
      btnCopyVa.textContent = 'Tersalin!';
      setTimeout(() => btnCopyVa.textContent = 'Salin', 1500);
    });
  });

  // Simulate Successful QRIS Payment
  btnPgSimulateQrisPay.addEventListener('click', () => {
    if (!pendingCheckoutOrder) return;
    if (pgTimerInterval) clearInterval(pgTimerInterval);
    paymentGatewayModal.classList.remove('active');

    if (pendingCheckoutOrder.isReservation && typeof pendingCheckoutOrder.finishCallback === 'function') {
      pendingCheckoutOrder.finishCallback('QRIS (Lunas via Payment Gateway)');
      pendingCheckoutOrder = null;
      return;
    }

    // Mark as PAID / LUNAS via Payment Gateway!
    pendingCheckoutOrder.paymentMethod = 'QRIS (Lunas via Payment Gateway)';
    finalizeOrder(pendingCheckoutOrder, 'LUNAS');
  });

  // Simulate Successful Debit/VA Payment
  btnPgSimulateDebitPay.addEventListener('click', () => {
    if (!pendingCheckoutOrder) return;
    if (pgTimerInterval) clearInterval(pgTimerInterval);
    paymentGatewayModal.classList.remove('active');

    const selectedBank = document.querySelector('input[name="pg_bank"]:checked')?.value || 'BCA';
    if (pendingCheckoutOrder.isReservation && typeof pendingCheckoutOrder.finishCallback === 'function') {
      pendingCheckoutOrder.finishCallback(`VA ${selectedBank} (Lunas via Gateway)`);
      pendingCheckoutOrder = null;
      return;
    }

    pendingCheckoutOrder.paymentMethod = `VA ${selectedBank} (Lunas via Gateway)`;
    finalizeOrder(pendingCheckoutOrder, 'LUNAS');
  });

  // Cancel Payment Gateway
  const cancelPg = () => {
    if (pgTimerInterval) clearInterval(pgTimerInterval);
    paymentGatewayModal.classList.remove('active');
    if (pendingCheckoutOrder && !pendingCheckoutOrder.isReservation) {
      openCart();
    }
  };
  closePgModal.addEventListener('click', cancelPg);
  btnCancelPg.addEventListener('click', cancelPg);

  // ----------------------------------------------------------------------
  // Finalize Order (Save to DB, clear cart, show ticket)
  // ----------------------------------------------------------------------
  function finalizeOrder(order, initialStatus) {
    order.status = initialStatus; // 'LUNAS' or 'MENUNGGU_BAYAR'

    const allOrders = getAllOrders();
    allOrders.push(order);
    saveOrders(allOrders);
    localStorage.setItem(DB_ACTIVE_ORDER_ID_KEY, order.orderId);

    // Sync to Supabase Cloud Database
    if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
      window.GacoanSupabase.insertOrder(order);
    }

    // Update user stats
    const currentUser = getCurrentUser();
    if (currentUser) {
      const users = getUsersFromDB();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
      if (userIndex > -1) {
        users[userIndex].ordersCount = (users[userIndex].ordersCount || 0) + 1;
        saveUsersToDB(users);
        currentUser.ordersCount = users[userIndex].ordersCount;
        setCurrentUser(currentUser);
      }
    }

    // Play victory sound
    playCheckoutChime();

    // Close cart and clear
    closeCart();
    cart = [];
    renderCart();

    // Open Digital Queue Ticket
    displayQueueTicket(order);
    checkActiveTicketBanner();
  }

  function displayQueueTicket(order) {
    ticketOrderTime.textContent = order.createdAt;
    ticketQueueNumber.textContent = `#${order.queueNumber}`;
    ticketCustomerName.textContent = order.customerName;
    ticketDiningType.textContent = order.tableInfo;
    ticketPaymentMethod.textContent = order.paymentMethod;
    ticketGrandTotal.textContent = formatRp(order.grandTotal);

    if (order.status === 'SELESAI') {
      ticketPaymentBadge.className = 'payment-status-badge paid';
      ticketPaymentBadge.textContent = 'Pesanan Selesai (Telah Diambil)';
    } else if (order.status === 'SIAP_SAJI') {
      ticketPaymentBadge.className = 'payment-status-badge paid';
      ticketPaymentBadge.textContent = 'Pesanan Selesai Dimasak (Siap Diambil di Counter / Kasir)';
    } else if (order.status === 'SEDANG_DIMASAK') {
      ticketPaymentBadge.className = 'payment-status-badge paid';
      ticketPaymentBadge.textContent = 'Sedang Dimasak di Dapur';
    } else if (order.status === 'LUNAS') {
      ticketPaymentBadge.className = 'payment-status-badge paid';
      ticketPaymentBadge.textContent = 'Pembayaran LUNAS (Masuk Antrian Dapur)';
    } else {
      ticketPaymentBadge.className = 'payment-status-badge pending';
      ticketPaymentBadge.textContent = 'Menunggu Konfirmasi Kasir';
    }

    const qrData = encodeURIComponent(`GACOAN-ORDER:${order.orderId}|QUEUE:${order.queueNumber}|TOTAL:${order.grandTotal}`);
    ticketQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&margin=2`;

    ticketItemsSummary.innerHTML = getOrderItemsList(order).map(item => `
      <div class="ticket-item-row">
        <span>${item.qty || 1}x ${item.title || 'Item'} ${item.level ? `(${item.level})` : ''}</span>
        <strong>${formatRp(item.total || ((item.unitPrice || item.price || 0) * (item.qty || 1)))}</strong>
      </div>
    `).join('');

    queueTicketModal.classList.add('active');
  }

  function checkActiveTicketBanner() {
    const activeOrderId = localStorage.getItem(DB_ACTIVE_ORDER_ID_KEY);
    if (!activeOrderId) {
      hideActiveTicketBanner();
      return;
    }

    const allOrders = getAllOrders();
    const activeOrder = allOrders.find(o => o.orderId === activeOrderId);

    if (activeOrder && activeOrder.status !== 'SELESAI') {
      activeTicketBanner.style.display = 'flex';
      bannerQueueNo.textContent = `#${activeOrder.queueNumber}`;
      if (activeOrder.status === 'SIAP_SAJI') {
        bannerOrderStatus.textContent = 'Siap Diambil di Kasir!';
        bannerOrderStatus.style.color = '#16a34a';
      } else if (activeOrder.status === 'SEDANG_DIMASAK') {
        bannerOrderStatus.textContent = 'Sedang Dimasak di Dapur';
        bannerOrderStatus.style.color = '#0284c7';
      } else if (activeOrder.status === 'LUNAS') {
        bannerOrderStatus.textContent = 'Lunas (Menunggu Antrian Dapur)';
        bannerOrderStatus.style.color = '#16a34a';
      } else {
        bannerOrderStatus.textContent = 'Menunggu Pembayaran';
        bannerOrderStatus.style.color = '#b45309';
      }
    } else {
      hideActiveTicketBanner();
    }
  }

  function hideActiveTicketBanner() {
    activeTicketBanner.style.display = 'none';
  }

  if (btnOpenCurrentTicket) {
    btnOpenCurrentTicket.addEventListener('click', () => {
      const activeOrderId = localStorage.getItem(DB_ACTIVE_ORDER_ID_KEY);
      if (!activeOrderId) return;
      const allOrders = getAllOrders();
      const activeOrder = allOrders.find(o => o.orderId === activeOrderId);
      if (activeOrder) {
        displayQueueTicket(activeOrder);
      }
    });
  }

  const closeTicket = () => queueTicketModal.classList.remove('active');
  if (closeTicketModal) closeTicketModal.addEventListener('click', closeTicket);
  if (ticketDismissBtn) ticketDismissBtn.addEventListener('click', closeTicket);
  queueTicketModal.addEventListener('click', (e) => {
    if (e.target === queueTicketModal) closeTicket();
  });

  // ----------------------------------------------------------------------
  // Real-Time Listener from Kasir (BroadcastChannel & Storage Event)
  // ----------------------------------------------------------------------
  const handleOrderUpdate = () => {
    checkActiveTicketBanner();
    const activeOrderId = localStorage.getItem(DB_ACTIVE_ORDER_ID_KEY);
    if (activeOrderId && queueTicketModal.classList.contains('active')) {
      const allOrders = getAllOrders();
      const current = allOrders.find(o => o.orderId === activeOrderId);
      if (current) displayQueueTicket(current);
    }
  };

  if (posChannel) {
    posChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'ORDER_UPDATED') {
        handleOrderUpdate();
      }
      if (event.data && event.data.type === 'PRODUCTS_UPDATED') {
        renderCustomerMenu();
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === DB_ORDERS_KEY) {
      handleOrderUpdate();
    }
    if (e.key === DB_PRODUCTS_KEY || e.key === DB_CATEGORIES_KEY) {
      renderCustomerMenu();
    }
  });

  // ----------------------------------------------------------------------
  // Information Modal
  // ----------------------------------------------------------------------
  if (infoBtn && infoModal) {
    infoBtn.addEventListener('click', () => infoModal.classList.add('active'));
  }
  if (closeInfoModal && infoModal) {
    closeInfoModal.addEventListener('click', () => infoModal.classList.remove('active'));
  }
  if (infoModal) {
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) infoModal.classList.remove('active');
    });
  }

  // ==========================================================================
  // RESERVATION & EVENT BOOKING MODULE
  // ==========================================================================
  const btnHeaderReservation = document.getElementById('btnHeaderReservation');
  const btnOpenReservationModal = document.getElementById('btnOpenReservationModal');
  const btnOpenReservationBanner = document.getElementById('btnOpenReservationBanner');
  const modalReservation = document.getElementById('modalReservation');
  const closeReservationModal = document.getElementById('closeReservationModal');
  const reservationForm = document.getElementById('reservationForm');

  const rsvCustomerName = document.getElementById('rsvCustomerName');
  const rsvPhone = document.getElementById('rsvPhone');
  const rsvDate = document.getElementById('rsvDate');
  const rsvTime = document.getElementById('rsvTime');
  const rsvTablesGrid = document.getElementById('rsvTablesGrid');
  const rsvSelectedTablesText = document.getElementById('rsvSelectedTablesText');
  const rsvMaxCapacityText = document.getElementById('rsvMaxCapacityText');
  const rsvSeatsCount = document.getElementById('rsvSeatsCount');
  const btnSeatMinus = document.getElementById('btnSeatMinus');
  const btnSeatPlus = document.getElementById('btnSeatPlus');
  const rsvSeatErrorMsg = document.getElementById('rsvSeatErrorMsg');
  const rsvSeatMultiplier = document.getElementById('rsvSeatMultiplier');
  const rsvMinSpendAmount = document.getElementById('rsvMinSpendAmount');
  const rsvCurrentMenuTotal = document.getElementById('rsvCurrentMenuTotal');
  const spendProgressFill = document.getElementById('spendProgressFill');
  const spendAlertMsg = document.getElementById('spendAlertMsg');
  const rsvMenuList = document.getElementById('rsvMenuList');

  const dpOption50Label = document.getElementById('dpOption50Label');
  const dpOption100Label = document.getElementById('dpOption100Label');
  const rsvDp50Amount = document.getElementById('rsvDp50Amount');
  const rsvDp50Remain = document.getElementById('rsvDp50Remain');
  const rsvDp100Amount = document.getElementById('rsvDp100Amount');
  const rsvPayableNow = document.getElementById('rsvPayableNow');

  const modalReservationTicket = document.getElementById('modalReservationTicket');
  const closeRsvTicketModal = document.getElementById('closeRsvTicketModal');
  const rsvTicketBody = document.getElementById('rsvTicketBody');

  let rsvSelectedTables = ['Meja 01'];
  let rsvMenuSelections = {}; // productId: qty
  const RSV_MIN_SPEND_PER_SEAT = 15000;
  const TOTAL_RSV_TABLES = 12;

  // Get set of booked tables for a specific date
  function getBookedTablesForDate(selectedDate) {
    const booked = new Set();
    if (!selectedDate) return booked;

    const allOrders = getAllOrders();
    allOrders.forEach(o => {
      const isRsv = o.diningType === 'RESERVASI' || (o.orderId && o.orderId.startsWith('RSV-')) || o.reservationId;
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

  // Set default reservation date to tomorrow and min date to today
  if (rsvDate) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    rsvDate.min = todayStr;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    rsvDate.value = tomorrow.toISOString().split('T')[0];

    rsvDate.addEventListener('change', () => {
      renderRsvTables();
      updateRsvCalculations();
    });
  }
  if (rsvTime) {
    rsvTime.value = '18:00';
  }

  function openReservationModal() {
    const currentUser = getCurrentUser();
    if (currentUser) {
      if (rsvCustomerName && !rsvCustomerName.value) rsvCustomerName.value = currentUser.username || '';
    }
    renderRsvTables();
    renderRsvMenuList();
    updateRsvCalculations();
    if (modalReservation) modalReservation.classList.add('active');
  }

  if (btnHeaderReservation) btnHeaderReservation.addEventListener('click', openReservationModal);
  if (btnOpenReservationModal) btnOpenReservationModal.addEventListener('click', (e) => {
    e.stopPropagation();
    openReservationModal();
  });
  if (btnOpenReservationBanner) btnOpenReservationBanner.addEventListener('click', openReservationModal);
  if (closeReservationModal) closeReservationModal.addEventListener('click', () => {
    if (modalReservation) modalReservation.classList.remove('active');
  });

  // Render Table Grid (12 Tables)
  function renderRsvTables() {
    if (!rsvTablesGrid) return;
    rsvTablesGrid.innerHTML = '';

    const selectedDate = rsvDate ? rsvDate.value : '';
    const bookedTables = getBookedTablesForDate(selectedDate);

    // Remove any currently selected tables that are booked on this date
    rsvSelectedTables = rsvSelectedTables.filter(t => !bookedTables.has(t));

    // If no table selected, auto-select first available unbooked table
    if (rsvSelectedTables.length === 0) {
      for (let i = 1; i <= TOTAL_RSV_TABLES; i++) {
        const tNo = `Meja ${String(i).padStart(2, '0')}`;
        if (!bookedTables.has(tNo)) {
          rsvSelectedTables = [tNo];
          break;
        }
      }
    }

    for (let i = 1; i <= TOTAL_RSV_TABLES; i++) {
      const tableNo = `Meja ${String(i).padStart(2, '0')}`;
      const isBooked = bookedTables.has(tableNo);
      const isSelected = !isBooked && rsvSelectedTables.includes(tableNo);

      const tableEl = document.createElement('div');
      tableEl.className = `rsv-table-card ${isBooked ? 'booked disabled' : ''} ${isSelected ? 'selected' : ''}`;
      
      if (isBooked) {
        tableEl.title = `${tableNo} sudah direservasi pada ${selectedDate}`;
        tableEl.innerHTML = `
          <span class="table-no-label">${tableNo}</span>
          <span class="table-cap-label">Direservasi</span>
        `;
      } else {
        tableEl.innerHTML = `
          <span class="table-no-label">${tableNo}</span>
          <span class="table-cap-label">Maks 5 Kursi</span>
        `;

        tableEl.addEventListener('click', () => {
          if (rsvSelectedTables.includes(tableNo)) {
            if (rsvSelectedTables.length > 1) {
              rsvSelectedTables = rsvSelectedTables.filter(t => t !== tableNo);
            }
          } else {
            rsvSelectedTables.push(tableNo);
          }
          renderRsvTables();
          updateRsvCalculations();
        });
      }

      rsvTablesGrid.appendChild(tableEl);
    }

    if (rsvSelectedTablesText) {
      rsvSelectedTablesText.textContent = rsvSelectedTables.length > 0 ? rsvSelectedTables.join(', ') : 'Semua meja penuh / Belum ada';
    }
    if (rsvMaxCapacityText) {
      const maxCap = rsvSelectedTables.length * 5;
      rsvMaxCapacityText.textContent = `(Kapasitas Maks: ${maxCap} Kursi)`;
    }
  }

  // Seat Stepper Controls
  if (btnSeatMinus && rsvSeatsCount) {
    btnSeatMinus.addEventListener('click', () => {
      let val = parseInt(rsvSeatsCount.value) || 1;
      if (val > 1) {
        rsvSeatsCount.value = val - 1;
        updateRsvCalculations();
      }
    });
  }

  if (btnSeatPlus && rsvSeatsCount) {
    btnSeatPlus.addEventListener('click', () => {
      let val = parseInt(rsvSeatsCount.value) || 1;
      const maxCap = rsvSelectedTables.length * 5;
      if (val < maxCap) {
        rsvSeatsCount.value = val + 1;
        updateRsvCalculations();
      } else {
        // Auto add another unbooked table if available
        const selectedDate = rsvDate ? rsvDate.value : '';
        const bookedTables = getBookedTablesForDate(selectedDate);
        for (let i = 1; i <= TOTAL_RSV_TABLES; i++) {
          const tableNo = `Meja ${String(i).padStart(2, '0')}`;
          if (!rsvSelectedTables.includes(tableNo) && !bookedTables.has(tableNo)) {
            rsvSelectedTables.push(tableNo);
            renderRsvTables();
            rsvSeatsCount.value = val + 1;
            updateRsvCalculations();
            break;
          }
        }
      }
    });
  }

  if (rsvSeatsCount) {
    rsvSeatsCount.addEventListener('input', updateRsvCalculations);
  }

  // Render Menu List in Reservation Form
  function renderRsvMenuList() {
    if (!rsvMenuList) return;
    const products = getProducts();
    rsvMenuList.innerHTML = '';

    products.forEach(p => {
      const isAvailable = p.status !== 'Habis';
      const qty = rsvMenuSelections[p.id] || 0;

      const itemEl = document.createElement('div');
      itemEl.className = 'rsv-menu-item';
      itemEl.innerHTML = `
        <img src="${p.img || 'Menu/mie gacoan.webp'}" alt="${p.title}" class="rsv-menu-thumb" />
        <div class="rsv-menu-details">
          <div class="rsv-menu-name">${p.title}</div>
          <div class="rsv-menu-price">Rp${p.price.toLocaleString('id-ID')}</div>
        </div>
        <div class="rsv-menu-qty-ctrl">
          <button type="button" class="btn-rsv-qty minus-btn" data-id="${p.id}" ${qty === 0 ? 'disabled' : ''}>&minus;</button>
          <span class="rsv-qty-val">${qty}</span>
          <button type="button" class="btn-rsv-qty plus-btn" data-id="${p.id}" ${!isAvailable ? 'disabled' : ''}>&plus;</button>
        </div>
      `;

      itemEl.querySelector('.minus-btn').addEventListener('click', () => {
        if (rsvMenuSelections[p.id] > 0) {
          rsvMenuSelections[p.id]--;
          if (rsvMenuSelections[p.id] === 0) delete rsvMenuSelections[p.id];
          renderRsvMenuList();
          updateRsvCalculations();
        }
      });

      itemEl.querySelector('.plus-btn').addEventListener('click', () => {
        rsvMenuSelections[p.id] = (rsvMenuSelections[p.id] || 0) + 1;
        renderRsvMenuList();
        updateRsvCalculations();
      });

      rsvMenuList.appendChild(itemEl);
    });
  }

  // DP Toggle Handlers
  if (dpOption50Label && dpOption100Label) {
    dpOption50Label.addEventListener('click', () => {
      dpOption50Label.classList.add('active');
      dpOption100Label.classList.remove('active');
      updateRsvCalculations();
    });
    dpOption100Label.addEventListener('click', () => {
      dpOption100Label.classList.add('active');
      dpOption50Label.classList.remove('active');
      updateRsvCalculations();
    });
  }

  // Dynamic Calculations (Seats, Min Spend, Selected Menu Total, DP, Progress)
  function updateRsvCalculations() {
    const seats = Math.max(1, parseInt(rsvSeatsCount.value) || 1);
    const maxCapacity = rsvSelectedTables.length * 5;

    // Validate seat capacity vs tables
    if (rsvSeatErrorMsg) {
      if (seats > maxCapacity) {
        rsvSeatErrorMsg.style.display = 'block';
        rsvSeatErrorMsg.textContent = `Kapasitas ${rsvSelectedTables.length} meja hanya cukup untuk ${maxCapacity} kursi. Tambah meja lagi ya!`;
      } else {
        rsvSeatErrorMsg.style.display = 'none';
      }
    }

    const minSpend = seats * RSV_MIN_SPEND_PER_SEAT;
    if (rsvSeatMultiplier) rsvSeatMultiplier.textContent = seats;
    if (rsvMinSpendAmount) rsvMinSpendAmount.textContent = `Rp${minSpend.toLocaleString('id-ID')}`;

    // Calculate subtotal of chosen menu items
    const products = getProducts();
    let menuSubtotal = 0;
    Object.keys(rsvMenuSelections).forEach(id => {
      const qty = rsvMenuSelections[id];
      const prod = products.find(p => p.id === id);
      if (prod && qty > 0) {
        menuSubtotal += prod.price * qty;
      }
    });

    if (rsvCurrentMenuTotal) rsvCurrentMenuTotal.textContent = `Rp${menuSubtotal.toLocaleString('id-ID')}`;

    // Progress bar & Alert
    const percent = Math.min(100, Math.round((menuSubtotal / (minSpend || 1)) * 100));
    if (spendProgressFill) {
      spendProgressFill.style.width = `${percent}%`;
      spendProgressFill.style.background = menuSubtotal >= minSpend ? '#22c55e' : '#f59e0b';
    }

    if (spendAlertMsg) {
      if (menuSubtotal >= minSpend) {
        spendAlertMsg.className = 'spend-alert-msg met';
        spendAlertMsg.innerHTML = `Syarat minimal belanja <strong>Rp${minSpend.toLocaleString('id-ID')}</strong> sudah terpenuhi!`;
      } else {
        const diff = minSpend - menuSubtotal;
        spendAlertMsg.className = 'spend-alert-msg';
        spendAlertMsg.innerHTML = `Kurang <strong>Rp${diff.toLocaleString('id-ID')}</strong> lagi untuk memenuhi minimal belanja reservasi.`;
      }
    }

    // Totals + Tax (10%)
    const tax = Math.round(menuSubtotal * 0.1);
    const grandTotal = menuSubtotal + tax;
    const dp50 = Math.round(grandTotal * 0.5);
    const remain50 = grandTotal - dp50;

    if (rsvDp50Amount) rsvDp50Amount.textContent = `Rp${dp50.toLocaleString('id-ID')}`;
    if (rsvDp50Remain) rsvDp50Remain.textContent = `Rp${remain50.toLocaleString('id-ID')}`;
    if (rsvDp100Amount) rsvDp100Amount.textContent = `Rp${grandTotal.toLocaleString('id-ID')}`;

    const isDp50 = document.querySelector('input[name="rsvDpOption"]:checked')?.value === '50';
    const payableNow = isDp50 ? dp50 : grandTotal;
    if (rsvPayableNow) rsvPayableNow.textContent = `Rp${payableNow.toLocaleString('id-ID')}`;
  }

  // Handle Reservation Form Submit
  if (reservationForm) {
    reservationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const customerName = rsvCustomerName.value.trim();
      const phone = rsvPhone.value.trim();
      const eventDate = rsvDate.value;
      const eventTime = rsvTime.value;
      const seats = parseInt(rsvSeatsCount.value) || 1;
      const maxCapacity = rsvSelectedTables.length * 5;

      if (!customerName || !phone || !eventDate || !eventTime) {
        alert('Mohon lengkapi seluruh data nama, nomor WA, tanggal, dan jam reservasi!');
        return;
      }

      if (rsvSelectedTables.length === 0) {
        alert('Silakan pilih minimal 1 nomor meja untuk reservasi!');
        return;
      }

      const bookedOnDate = getBookedTablesForDate(eventDate);
      const conflictTables = rsvSelectedTables.filter(t => bookedOnDate.has(t));
      if (conflictTables.length > 0) {
        alert(`Meja ${conflictTables.join(', ')} sudah direservasi pada tanggal ${eventDate}. Silakan pilih meja lain.`);
        renderRsvTables();
        return;
      }

      if (seats > maxCapacity) {
        alert(`Jumlah ${seats} kursi melebihi kapasitas meja (${maxCapacity} kursi). Silakan tambah meja!`);
        return;
      }

      // Check min spend
      const minSpend = seats * RSV_MIN_SPEND_PER_SEAT;
      const products = getProducts();
      const orderItems = [];
      let menuSubtotal = 0;

      Object.keys(rsvMenuSelections).forEach(id => {
        const qty = rsvMenuSelections[id];
        const prod = products.find(p => p.id === id);
        if (prod && qty > 0) {
          const itemTotal = prod.price * qty;
          menuSubtotal += itemTotal;
          orderItems.push({
            id: prod.id,
            title: prod.title,
            price: prod.price,
            img: prod.img,
            qty: qty,
            level: null,
            notes: 'Menu Reservasi Acara',
            total: itemTotal
          });
        }
      });

      if (menuSubtotal < minSpend) {
        alert(`Total pilihan menu Anda (Rp${menuSubtotal.toLocaleString('id-ID')}) belum memenuhi syarat minimal belanja (Rp${minSpend.toLocaleString('id-ID')}). Silakan tambah menu.`);
        return;
      }

      const tax = Math.round(menuSubtotal * 0.1);
      const grandTotal = menuSubtotal + tax;
      const isDp50 = document.querySelector('input[name="rsvDpOption"]:checked')?.value === '50';
      const dpAmount = isDp50 ? Math.round(grandTotal * 0.5) : grandTotal;
      const reservationId = 'RSV-' + Date.now();
      const currentUser = getCurrentUser();

      const submitBtn = document.getElementById('btnSubmitReservation');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses Pembayaran DP...';
      }

      const finishReservation = (paymentType = 'Cashless (Midtrans)') => {
        const newReservation = {
          reservationId: reservationId,
          orderId: reservationId,
          queueNumber: 'RSV-' + reservationId.slice(-4),
          customerName: customerName,
          userEmail: currentUser ? currentUser.email : null,
          phone: phone,
          eventDate: eventDate,
          eventTime: eventTime,
          tableNumbers: rsvSelectedTables,
          tableInfo: rsvSelectedTables.join(', '),
          seats: seats,
          diningType: 'RESERVASI',
          paymentMethod: paymentType,
          items: orderItems,
          subtotal: menuSubtotal,
          tax: tax,
          grandTotal: grandTotal,
          dpPaid: dpAmount,
          dpOption: isDp50 ? '50%' : '100%',
          remainingBalance: isDp50 ? (grandTotal - dpAmount) : 0,
          status: isDp50 ? 'DP_LUNAS' : 'LUNAS',
          createdAt: new Date().toISOString()
        };

        // Save local
        const allOrders = getAllOrders();
        allOrders.push(newReservation);
        saveOrders(allOrders);

        // Save to Supabase Cloud
        if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
          window.GacoanSupabase.insertReservation(newReservation);
        }

        // Close form modal, refresh banners & tables
        if (modalReservation) modalReservation.classList.remove('active');
        playCheckoutChime();
        checkActiveTicketBanner();
        renderRsvTables();

        // Reset state
        rsvMenuSelections = {};
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Bayar DP & Konfirmasi Reservasi';
        }

        // Show Confirmation Ticket
        showReservationTicket(newReservation);
      };

      // 1. Try real Midtrans Snap via Backend Server (check localhost:3000 / current server)
      let snapTriggered = false;
      if (typeof window.snap !== 'undefined' && window.snap.pay) {
        try {
          const token = await requestMidtransSnapToken({
            orderId: reservationId,
            grossAmount: dpAmount,
            customerName: customerName,
            customerEmail: currentUser ? currentUser.email : `${customerName.toLowerCase().replace(/\s+/g, '')}@gacoan.customer`,
            customerPhone: phone,
            items: [{ id: 'DP-RSV', title: `DP Reservasi Meja (${isDp50 ? '50%' : '100%'})`, price: dpAmount, qty: 1 }]
          });

          if (token) {
            snapTriggered = true;
            console.log(' Midtrans Snap Token Reservasi diterima:', token);
            if (modalReservation) modalReservation.classList.remove('active');

            window.snap.pay(token, {
              onSuccess: function(result) {
                const payType = result.payment_type ? result.payment_type.toUpperCase() : 'MIDTRANS';
                finishReservation(`${payType} (Lunas via Midtrans Snap)`);
              },
              onPending: function(result) {
                const payType = result.payment_type ? result.payment_type.toUpperCase() : 'MIDTRANS';
                finishReservation(`${payType} (Lunas via Midtrans Sandbox)`);
              },
              onError: function(result) {
                console.warn('Midtrans DP Error:', result);
                finishReservation('Cashless (Midtrans Sandbox)');
              },
              onClose: function() {
                console.log('Popup Midtrans ditutup -> Selesaikan DP Lunas');
                finishReservation('Cashless (Midtrans Sandbox)');
              }
            });
            return;
          }
        } catch (err) {
          console.warn('Midtrans Snap request failed, falling back to simulator...', err);
        }
      }

      if (!snapTriggered) {
        // 2. Fallback: Simulator Modal for Reservation DP
        if (modalReservation) modalReservation.classList.remove('active');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Bayar DP & Konfirmasi Reservasi';
        }

        pendingCheckoutOrder = {
          isReservation: true,
          finishCallback: finishReservation,
          orderId: reservationId,
          grandTotal: dpAmount,
          customerName: customerName,
          userEmail: currentUser ? currentUser.email : null,
          paymentMethod: 'QRIS'
        };

        pgTotalAmount.textContent = formatRp(dpAmount);
        pgQrisView.style.display = 'block';
        pgDebitView.style.display = 'none';

        const qrisData = encodeURIComponent(`QRIS.MIDTRANS.DP|ID:${reservationId}|NOMINAL:${dpAmount}`);
        pgDynamicQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrisData}&margin=2`;

        startPgCountdown(300);
        paymentGatewayModal.classList.add('active');
      }
    });
  }

  // Display Reservation Ticket
  function showReservationTicket(rsv) {
    if (!rsv) return;
    const modalRsvTicket = document.getElementById('modalReservationTicket');
    const ticketBody = document.getElementById('rsvTicketBody');
    if (!ticketBody || !modalRsvTicket) return;

    const rsvId = rsv.reservationId || rsv.orderId || '-';
    const custName = rsv.customerName || rsv.name || 'Pelanggan Gacoan';
    const eventDate = rsv.eventDate || '-';
    const eventTime = rsv.eventTime || '-';
    const tableInfo = Array.isArray(rsv.tableNumbers) ? rsv.tableNumbers.join(', ') : (rsv.tableInfo || rsv.tableNumbers || '-');
    const seatsInfo = rsv.seats ? `${rsv.seats} Kursi` : '-';
    const grandTotal = Number(rsv.grandTotal) || 0;
    const dpPaid = Number(rsv.dpPaid) || 0;
    const dpOption = rsv.dpOption || '50%';
    const remaining = Math.max(0, grandTotal - dpPaid);
    const itemsList = Array.isArray(rsv.items) ? rsv.items : (rsv.items?.products || []);

    ticketBody.innerHTML = `
      <div class="ticket-container" style="text-align: center; padding: 6px 0;">
        <h4 style="font-size: 18px; color: #111827; font-weight: 800; margin-bottom: 4px;">Reservasi Meja Berhasil!</h4>
        <p style="font-size: 13px; color: #4b5563; margin-bottom: 16px;">Tunjukkan tiket ini kepada kasir saat tiba di outlet Mie Gacoan.</p>

        <div style="background: #eff6ff; border: 1.5px dashed #3b82f6; border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: left;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #6b7280;">Kode Reservasi:</span>
            <strong style="font-size: 14px; color: #0066ff; font-family: monospace;">${rsvId}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #6b7280;">Nama Acara / Pemesan:</span>
            <strong style="font-size: 13px; color: #111827;">${custName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #6b7280;">Jadwal Kedatangan:</span>
            <strong style="font-size: 13px; color: #111827;">${eventDate} pukul ${eventTime} WIB</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #6b7280;">Nomor Meja Dipesan:</span>
            <strong style="font-size: 13px; color: #0066ff;">${tableInfo} (${seatsInfo})</strong>
          </div>

          ${itemsList.length > 0 ? `
            <div style="border-top: 1px dashed #bfdbfe; margin: 10px 0; padding-top: 8px;">
              <span style="font-size: 11.5px; color: #6b7280; font-weight: 700; display: block; margin-bottom: 4px;">Menu Dipesan:</span>
              ${itemsList.map(it => `
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
                  <span>${it.qty}x ${it.title}</span>
                  <span style="font-weight: 600;">Rp${((it.price || it.unitPrice || 0) * it.qty || it.total || 0).toLocaleString('id-ID')}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <hr style="border: none; border-top: 1px dashed #bfdbfe; margin: 10px 0;" />
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #6b7280;">Total Tagihan Menu (+Pajak 10%):</span>
            <strong style="font-size: 13px; color: #111827;">Rp${grandTotal.toLocaleString('id-ID')}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #16a34a; font-weight: 700;">DP Terbayar (${dpOption}):</span>
            <strong style="font-size: 13px; color: #16a34a;">Rp${dpPaid.toLocaleString('id-ID')} (LUNAS)</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 12px; color: #dc2626; font-weight: 700;">Sisa Tagihan di Kasir:</span>
            <strong style="font-size: 14px; color: #dc2626;">Rp${remaining.toLocaleString('id-ID')}</strong>
          </div>
        </div>

        <button type="button" class="btn-primary-blue" id="btnCloseRsvTicket" style="width: 100%; padding: 12px;">Tutup & Simpan Tiket</button>
      </div>
    `;

    modalRsvTicket.classList.add('active');

    document.getElementById('btnCloseRsvTicket')?.addEventListener('click', () => {
      modalRsvTicket.classList.remove('active');
    });
  }

  if (modalReservation) {
    modalReservation.addEventListener('click', (e) => {
      if (e.target === modalReservation) modalReservation.classList.remove('active');
    });
  }

  if (modalReservationTicket) {
    modalReservationTicket.addEventListener('click', (e) => {
      if (e.target === modalReservationTicket) modalReservationTicket.classList.remove('active');
    });
  }

  if (closeRsvTicketModal) {
    closeRsvTicketModal.addEventListener('click', () => {
      if (modalReservationTicket) modalReservationTicket.classList.remove('active');
    });
  }

  // Initial Auth Gate & UI Setup
  renderCustomerMenu();
  checkAuthGate();
  renderCart();

  // Supabase Cloud Realtime Sync & Product Seeding
  if (window.GacoanSupabase && window.GacoanSupabase.isAvailable()) {
    window.GacoanSupabase.getProducts().then(remoteProducts => {
      if (remoteProducts && remoteProducts.length > 0) {
        localStorage.setItem(DB_PRODUCTS_KEY, JSON.stringify(remoteProducts));
        renderCustomerMenu();
      } else {
        window.GacoanSupabase.seedInitialProducts(INITIAL_PRODUCTS);
      }
    });

    window.GacoanSupabase.subscribeProducts(() => {
      window.GacoanSupabase.getProducts().then(prods => {
        if (prods && prods.length > 0) {
          localStorage.setItem(DB_PRODUCTS_KEY, JSON.stringify(prods));
          renderCustomerMenu();
        }
      });
    });

    window.GacoanSupabase.getUsers().then(remoteUsers => {
      if (remoteUsers && remoteUsers.length > 0) {
        saveUsersToDB(remoteUsers);
      } else {
        window.GacoanSupabase.seedInitialUsers(getUsersFromDB());
      }
    });

    window.GacoanSupabase.subscribeOrders(() => {
      window.GacoanSupabase.getOrders().then(orders => {
        if (orders && orders.length > 0) {
          saveOrders(orders);
          handleOrderUpdate();
        }
      });
    });
  }
});
