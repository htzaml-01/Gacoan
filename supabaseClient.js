/**
 * Supabase Client & Realtime Sync Helper
 * Mie Gacoan POS & Online Ordering System
 */

const SUPABASE_URL = 'https://nxfgpqyfkhvmpzgtvqku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZmdwcXlma2h2bXB6Z3R2cWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NTQxMzEsImV4cCI6MjEwNTUzMDEzMX0.A205vQgDba5aB95-xAKG2XQtaetq97as7Tt3PeR18pM';

// Initialize Supabase Client
let sbClient = null;
try {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log(' Supabase Client terhubung ke:', SUPABASE_URL);
  }
} catch (e) {
  console.warn('️ Inisialisasi Supabase Client tertunda:', e);
}

// Global Supabase Helper Service
window.GacoanSupabase = {
  client: sbClient,
  isAvailable: () => {
    if (!sbClient && typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
      try {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      } catch (e) {}
    }
    return !!sbClient;
  },

  getClient() {
    if (!sbClient && typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
      try {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      } catch (e) {}
    }
    return sbClient;
  },

  // ==========================================
  // PRODUCTS / MENU
  // ==========================================
  async getProducts() {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data && data.length > 0 ? data.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: Number(p.price),
        img: p.img,
        desc: p.description,
        hasLevel: p.has_level,
        levels: p.levels || [],
        status: p.status
      })) : null;
    } catch (err) {
      console.warn('Supabase getProducts error:', err);
      return null;
    }
  },

  async seedInitialProducts(initialProducts) {
    const client = this.getClient();
    if (!client || !Array.isArray(initialProducts) || initialProducts.length === 0) return;
    try {
      const dbProds = initialProducts.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        img: p.img,
        description: p.desc || '',
        has_level: p.hasLevel || false,
        levels: p.levels || [],
        status: p.status || 'Tersedia'
      }));
      const { error } = await client.from('products').upsert(dbProds, { onConflict: 'id' });
      if (error) console.warn('Supabase seed products error:', error);
      else console.log(' Sinkronisasi Menu ke Supabase Cloud Berhasil!');
    } catch (err) {
      console.warn('Seed exception:', err);
    }
  },

  async updateProductStock(id, status) {
    const client = this.getClient();
    if (!client) return;
    try {
      const { error } = await client.from('products').update({ status }).eq('id', id);
      if (error) console.error('Gagal update stock di Supabase:', error);
      else console.log(` Stok ${id} diubah jadi ${status} di Supabase`);
    } catch (e) {
      console.warn(e);
    }
  },

  async saveProduct(product) {
    const client = this.getClient();
    if (!client) return;
    try {
      const record = {
        id: product.id,
        title: product.title,
        category: product.category,
        price: Number(product.price),
        img: product.img,
        description: product.desc || '',
        has_level: product.hasLevel || false,
        levels: product.levels || [],
        status: product.status || 'Tersedia'
      };
      const { error } = await client.from('products').upsert(record, { onConflict: 'id' });
      if (error) console.error('Gagal simpan produk ke Supabase:', error);
      else console.log(' Produk tersimpan di Supabase Cloud:', product.title);
    } catch (e) {
      console.warn(e);
    }
  },

  async deleteProduct(id) {
    const client = this.getClient();
    if (!client) return;
    try {
      const { error } = await client.from('products').delete().eq('id', id);
      if (error) console.error('Gagal hapus produk di Supabase:', error);
    } catch (e) {
      console.warn(e);
    }
  },

  // ==========================================
  // ORDERS / PESANAN
  // ==========================================
  async getOrders() {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ? data.map(o => {
        const isRsv = o.dining_type === 'RESERVASI' || (o.order_id && o.order_id.startsWith('RSV-'));
        const meta = (o.items && o.items._meta) || {};
        const productsList = (o.items && o.items.products) || (Array.isArray(o.items) ? o.items : []);

        return {
          orderId: o.order_id,
          reservationId: isRsv ? o.order_id : null,
          queueNumber: o.queue_number,
          customerName: o.customer_name,
          userEmail: o.user_email,
          phone: meta.phone || '-',
          eventDate: meta.eventDate || '',
          eventTime: meta.eventTime || '',
          tableNumbers: meta.tables || (o.table_info ? o.table_info.split(',').map(s => s.trim()) : []),
          tableInfo: o.table_info,
          seats: meta.seats || 1,
          diningType: o.dining_type || (isRsv ? 'RESERVASI' : 'Dine In'),
          paymentMethod: o.payment_method,
          items: isRsv ? productsList : (Array.isArray(o.items) ? o.items : []),
          subtotal: Number(o.subtotal),
          tax: Number(o.tax),
          grandTotal: Number(o.grand_total),
          dpPaid: Number(o.cash_paid || 0),
          dpOption: meta.dpOption || '50%',
          remainingBalance: Math.max(0, Number(o.grand_total) - Number(o.cash_paid || 0)),
          cashPaid: Number(o.cash_paid || 0),
          cashChange: Number(o.cash_change || 0),
          status: o.status,
          checkedIn: o.status === 'CHECK-IN' || o.status === 'DIPROSES' || o.status === 'SEDANG_DIMASAK' || o.status === 'SIAP_SAJI' || o.status === 'SELESAI' || Boolean(meta.checkedIn),
          createdAt: new Date(o.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) + ' ' + new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(o.created_at).getTime()
        };
      }) : null;
    } catch (err) {
      console.warn('Supabase getOrders error:', err);
      return null;
    }
  },

  async insertOrder(order) {
    const client = this.getClient();
    if (!client) return;
    try {
      const record = {
        order_id: order.orderId,
        queue_number: order.queueNumber,
        customer_name: order.customerName,
        user_email: order.userEmail || null,
        table_info: order.tableInfo,
        dining_type: order.diningType || 'Dine In',
        payment_method: order.paymentMethod,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        grand_total: order.grandTotal,
        cash_paid: order.cashPaid || 0,
        cash_change: order.cashChange || 0,
        status: order.status || 'MENUNGGU_BAYAR'
      };
      const { error } = await client.from('orders').insert([record]);
      if (error) console.error('Gagal kirim order ke Supabase:', error);
      else console.log(' Order berhasil tersimpan di Supabase Cloud:', order.orderId);
    } catch (e) {
      console.warn('Insert order exception:', e);
    }
  },

  async updateOrderStatus(orderId, status, cashPaid = null, cashChange = null, paymentMethod = null) {
    const client = this.getClient();
    if (!client) return;
    try {
      const updateData = { status };
      if (cashPaid !== null) updateData.cash_paid = cashPaid;
      if (cashChange !== null) updateData.cash_change = cashChange;
      if (paymentMethod !== null) updateData.payment_method = paymentMethod;

      const { error } = await client.from('orders').update(updateData).eq('order_id', orderId);
      if (error) console.error('Gagal update status order di Supabase:', error);
      else console.log(` Status Order ${orderId} diupdate jadi ${status} di Supabase`);
    } catch (e) {
      console.warn('Update order status exception:', e);
    }
  },

  // ==========================================
  // USERS / AUTHENTICATION
  // ==========================================
  async getUsers() {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('users')
        .select('*');
      if (error) throw error;
      return data ? data.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        password: u.password,
        role: u.role || 'customer',
        ordersCount: u.orders_count || 0,
        createdAt: u.created_at
      })) : null;
    } catch (err) {
      console.warn('Supabase getUsers error:', err);
      return null;
    }
  },

  async registerUser(user) {
    const client = this.getClient();
    if (!client) return null;
    try {
      const record = {
        email: user.email.toLowerCase(),
        username: user.username,
        password: user.password,
        role: user.role || 'customer',
        orders_count: user.ordersCount || 0
      };
      const { data, error } = await client.from('users').insert([record]).select();
      if (error) throw error;
      console.log(' User baru tersimpan di Supabase Cloud:', user.email);
      return data && data[0] ? data[0] : record;
    } catch (err) {
      console.error('Supabase registerUser error:', err);
      return null;
    }
  },

  async loginUser(email, password) {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password', password)
        .single();
      if (error) throw error;
      return data ? {
        id: data.id,
        email: data.email,
        username: data.username,
        password: data.password,
        role: data.role || 'customer',
        ordersCount: data.orders_count || 0
      } : null;
    } catch (err) {
      console.warn('Supabase loginUser lookup error:', err);
      return null;
    }
  },

  async seedInitialUsers(initialUsers) {
    const client = this.getClient();
    if (!client || !Array.isArray(initialUsers)) return;
    try {
      const records = initialUsers.map(u => ({
        email: u.email.toLowerCase(),
        username: u.username,
        password: u.password,
        role: u.role || 'customer',
        orders_count: u.ordersCount || 0
      }));
      const { error } = await client.from('users').upsert(records, { onConflict: 'email' });
      if (error) console.warn('Supabase seed users error:', error);
      else console.log(' Akun User Demo tersinkronisasi di Supabase Cloud!');
    } catch (e) {
      console.warn('Seed users exception:', e);
    }
  },

  async incrementUserOrderCount(email) {
    const client = this.getClient();
    if (!client || !email) return;
    try {
      const { data } = await client.from('users').select('orders_count').eq('email', email.toLowerCase()).single();
      const currentCount = (data && data.orders_count) ? data.orders_count : 0;
      await client.from('users').update({ orders_count: currentCount + 1 }).eq('email', email.toLowerCase());
    } catch (e) {
      console.warn('Increment user order count exception:', e);
    }
  },

  // ==========================================
  // RESERVATIONS / BOOKING MEJA
  // ==========================================
  async getReservations() {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('dining_type', 'RESERVASI')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ? data.map(o => ({
        reservationId: o.order_id,
        customerName: o.customer_name,
        userEmail: o.user_email,
        phone: (o.items && o.items._meta && o.items._meta.phone) || '-',
        eventDate: (o.items && o.items._meta && o.items._meta.eventDate) || '',
        eventTime: (o.items && o.items._meta && o.items._meta.eventTime) || '',
        tableNumbers: (o.items && o.items._meta && o.items._meta.tables) || [o.table_info],
        seats: (o.items && o.items._meta && o.items._meta.seats) || 1,
        items: (o.items && o.items.products) || (Array.isArray(o.items) ? o.items : []),
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        grandTotal: Number(o.grand_total),
        dpPaid: Number(o.cash_paid || 0),
        remainingBalance: Math.max(0, Number(o.grand_total) - Number(o.cash_paid || 0)),
        paymentMethod: o.payment_method,
        status: o.status, // DP_LUNAS, LUNAS, SELESAI, BATAL
        createdAt: o.created_at
      })) : null;
    } catch (err) {
      console.warn('Supabase getReservations error:', err);
      return null;
    }
  },

  async insertReservation(res) {
    const client = this.getClient();
    if (!client) return;
    try {
      const record = {
        order_id: res.reservationId,
        queue_number: 'RSV-' + res.reservationId.slice(-4),
        customer_name: res.customerName,
        user_email: res.userEmail || null,
        table_info: Array.isArray(res.tableNumbers) ? res.tableNumbers.join(', ') : res.tableNumbers,
        dining_type: 'RESERVASI',
        payment_method: res.paymentMethod || 'Cashless (Midtrans)',
        items: {
          _meta: {
            phone: res.phone,
            eventDate: res.eventDate,
            eventTime: res.eventTime,
            tables: res.tableNumbers,
            seats: res.seats,
            dpAmount: res.dpPaid,
            dpOption: res.dpOption // '50%' or '100%'
          },
          products: res.items
        },
        subtotal: res.subtotal,
        tax: res.tax,
        grand_total: res.grandTotal,
        cash_paid: res.dpPaid,
        cash_change: 0,
        status: res.status || 'DP_LUNAS'
      };
      const { error } = await client.from('orders').insert([record]);
      if (error) console.error('Gagal kirim reservasi ke Supabase:', error);
      else console.log(' Reservasi berhasil tersimpan di Supabase Cloud:', res.reservationId);
    } catch (e) {
      console.warn('Insert reservation exception:', e);
    }
  },

  async settleReservation(reservationId, remainingPaid, paymentMethod, newStatus = null) {
    const client = this.getClient();
    if (!client) return;
    try {
      const { data: order } = await client.from('orders').select('*').eq('order_id', reservationId).single();
      const currentPaid = Number(order?.cash_paid || 0);
      const totalPaid = currentPaid + Number(remainingPaid);
      const targetStatus = newStatus || (order?.status === 'CHECK-IN' || order?.status === 'DIPROSES' || order?.status === 'SEDANG_DIMASAK' || order?.status === 'SIAP_SAJI' ? order.status : 'LUNAS');

      const { error } = await client.from('orders').update({
        status: targetStatus,
        cash_paid: totalPaid,
        payment_method: `${order?.payment_method || 'Cashless'} + ${paymentMethod}`
      }).eq('order_id', reservationId);

      if (error) console.error('Gagal pelunasan reservasi di Supabase:', error);
      else console.log(` Reservasi ${reservationId} berhasil dilunasi`);
    } catch (e) {
      console.warn('Settle reservation exception:', e);
    }
  },

  // ==========================================
  // REALTIME SUBSCRIPTIONS
  // ==========================================
  subscribeOrders(onOrderEvent) {
    const client = this.getClient();
    if (!client) return null;
    try {
      return client
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          console.log(' Realtime Order Event:', payload);
          if (typeof onOrderEvent === 'function') onOrderEvent(payload);
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
      return null;
    }
  },

  subscribeProducts(onProductEvent) {
    const client = this.getClient();
    if (!client) return null;
    try {
      return client
        .channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          console.log(' Realtime Product Event:', payload);
          if (typeof onProductEvent === 'function') onProductEvent(payload);
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime product subscription error:', e);
      return null;
    }
  }
};
