const http = require('http');
const pg = require('pg');

const BASE_URL = 'http://localhost:3000/api';
const POOL_CONFIG = {
  connectionString: 'postgresql://neondb_owner:npg_qf3OekWXds2K@ep-red-silence-ayebua24-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require',
};

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch {
            resolve({ status: res.statusCode, text: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('--- STARTING DELIVERY PARTNER ONBOARDING & NOTIFICATIONS TEST ---');
  const pool = new pg.Pool(POOL_CONFIG);
  const testId = Date.now().toString().slice(-6);

  try {
    // 1. Admin login
    console.log('1. Logging in as Admin...');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@orderly.com', password: 'password123' },
    });
    if (adminLoginRes.status !== 200 || !adminLoginRes.body?.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes)}`);
    }
    const adminToken = adminLoginRes.body.data.token;
    console.log(' Admin logged in successfully.');

    // 2. Register new Customer
    console.log('2. Registering new Customer...');
    const custEmail = `customer_${testId}@test.com`;
    const custName = `Customer Test ${testId}`;
    const custReg = await request('/auth/register', {
      method: 'POST',
      body: {
        role: 'customer',
        name: custName,
        email: custEmail,
        password: 'password123',
        phone: '+91 9988776655',
      },
    });
    console.log('Customer registration status:', custReg.status);
    if (custReg.status !== 201) throw new Error(`Customer reg failed: ${JSON.stringify(custReg)}`);

    // 3. Register new Restaurant
    console.log('3. Registering new Restaurant...');
    const restEmail = `restaurant_${testId}@test.com`;
    const restName = `Spice Kitchen ${testId}`;
    const restReg = await request('/auth/register', {
      method: 'POST',
      body: {
        role: 'restaurant',
        name: `Chef Owner ${testId}`,
        email: restEmail,
        password: 'password123',
        restaurantName: restName,
        restaurantAddress: '123 Curry Street, Foodville',
        phone: '+91 9988776644',
      },
    });
    console.log('Restaurant registration status:', restReg.status);
    if (restReg.status !== 201) throw new Error(`Restaurant reg failed: ${JSON.stringify(restReg)}`);

    // 4. Register new Delivery Partner
    console.log('4. Registering new Delivery Partner...');
    const driverEmail = `rider_${testId}@test.com`;
    const driverName = `Speedy Rider ${testId}`;
    const driverReg = await request('/auth/register', {
      method: 'POST',
      body: {
        role: 'delivery_partner',
        name: driverName,
        email: driverEmail,
        password: 'password123',
        phone: '+91 9988776633',
        vehicle_type: 'Motorcycle',
        vehicle_license: `MH-12-TEST-${testId}`,
      },
    });
    console.log('Driver registration status:', driverReg.status);
    if (driverReg.status !== 201) throw new Error(`Driver reg failed: ${JSON.stringify(driverReg)}`);
    const driverToken = driverReg.body?.data?.token;
    const driverUserId = driverReg.body?.data?.user?.id;

    // Verify DB record for driver
    const dbDriverRes = await pool.query(
      `SELECT id, email, role, status, is_active FROM "User" WHERE id = $1;`,
      [driverUserId]
    );
    console.log('DB record for driver:', dbDriverRes.rows[0]);
    if (dbDriverRes.rows[0]?.status !== 'PENDING_APPROVAL' || dbDriverRes.rows[0]?.is_active !== false) {
      throw new Error(`Driver not pending in DB: ${JSON.stringify(dbDriverRes.rows[0])}`);
    }
    console.log(' Delivery Partner DB record is PENDING_APPROVAL and is_active: false');

    // 5. Check Admin Notifications
    console.log('5. Checking Admin Notifications list & deep links...');
    const notifsRes = await request('/notifications', {
      token: adminToken,
    });
    console.log('Notifications status:', notifsRes.status);
    const notifs = notifsRes.body?.data || [];
    console.log(`Total notifications for Admin: ${notifs.length}`);
    const driverNotif = notifs.find((n) => n.link === '/admin/drivers' && n.title.includes(driverName));
    const restNotif = notifs.find((n) => n.link === '/admin/restaurants' && n.title.includes(restName));
    const custNotif = notifs.find((n) => n.link === '/admin/users' && n.title.includes(custName));

    console.log('Driver Notification:', driverNotif ? `Found (${driverNotif.link})` : 'NOT FOUND');
    console.log('Restaurant Notification:', restNotif ? `Found (${restNotif.link})` : 'NOT FOUND');
    console.log('Customer Notification:', custNotif ? `Found (${custNotif.link})` : 'NOT FOUND');

    if (!driverNotif || driverNotif.link !== '/admin/drivers') {
      throw new Error('Driver notification missing or wrong link');
    }
    if (!restNotif || restNotif.link !== '/admin/restaurants') {
      throw new Error('Restaurant notification missing or wrong link');
    }
    if (!custNotif || custNotif.link !== '/admin/users') {
      throw new Error('Customer notification missing or wrong link');
    }
    console.log(' All 3 notifications verified with correct deep links.');

    // 6. Check GET /admin/delivery-partners
    console.log('6. Querying GET /admin/delivery-partners...');
    const dpListRes = await request('/admin/delivery-partners', {
      token: adminToken,
    });
    if (dpListRes.status !== 200 || !Array.isArray(dpListRes.body?.data)) {
      throw new Error(`Failed to list delivery partners: ${JSON.stringify(dpListRes)}`);
    }
    const dpList = dpListRes.body.data;
    console.log(`Received ${dpList.length} delivery partners from /admin/delivery-partners`);
    const newestDp = dpList[0];
    console.log('Top (Newest) Delivery Partner in list:', {
      id: newestDp.id,
      name: newestDp.name,
      email: newestDp.email,
      status: newestDp.status,
      is_active: newestDp.is_active,
    });
    if (newestDp.email !== driverEmail) {
      throw new Error(`Expected newest driver to be ${driverEmail}, but got ${newestDp.email}`);
    }
    if (newestDp.status !== 'PENDING_APPROVAL') {
      throw new Error(`Expected newest driver status to be PENDING_APPROVAL, got ${newestDp.status}`);
    }
    console.log(' New delivery partner is at top (newest first) with PENDING_APPROVAL status.');

    // 7. Testing unapproved driver order acceptance rejection
    console.log('7. Testing unapproved driver order acceptance rejection...');
    const unapprovedAcceptRes = await request('/orders/order-placeholder/accept-delivery', {
      method: 'PUT',
      token: driverToken,
    });
    console.log('Order accept response status for unapproved driver:', unapprovedAcceptRes.status, unapprovedAcceptRes.body);
    if (unapprovedAcceptRes.status !== 403) {
      throw new Error(`Expected 403 for unapproved driver, got ${unapprovedAcceptRes.status}`);
    }
    console.log(' Backend correctly blocked unapproved driver with 403 Forbidden.');

    // 8. Admin Approves Delivery Partner
    console.log('8. Admin approving Delivery Partner...');
    const approveRes = await request(`/admin/delivery-partners/${newestDp.id}/status`, {
      method: 'PUT',
      token: adminToken,
      body: {
        status: 'ACTIVE',
        reason: 'Documents verified and approved',
      },
    });
    console.log('Approval response:', approveRes.status, approveRes.body);
    if (approveRes.status !== 200 || !approveRes.body?.success) {
      throw new Error(`Approval failed: ${JSON.stringify(approveRes)}`);
    }

    // Verify DB updated
    const dbActiveRes = await pool.query(
      `SELECT id, email, status, is_active FROM "User" WHERE id = $1;`,
      [driverUserId]
    );
    console.log('DB record after approval:', dbActiveRes.rows[0]);
    if (dbActiveRes.rows[0]?.status !== 'ACTIVE' || dbActiveRes.rows[0]?.is_active !== true) {
      throw new Error(`DB not updated to ACTIVE: ${JSON.stringify(dbActiveRes.rows[0])}`);
    }
    console.log(' DB record successfully updated to ACTIVE / is_active: true');

    // 9. Create a real Order and Verify Approved Driver Can Accept Orders
    console.log('9. Creating order and testing approved driver order acceptance...');
    const custToken = custReg.body?.data?.token;
    const orderCreateRes = await request('/orders', {
      method: 'POST',
      token: custToken,
      body: {
        restaurant_id: 'rest-1',
        items: [
          {
            menu_item_id: 'item-1',
            quantity: 2,
            price: 150,
            name: 'Deluxe Burger',
          },
        ],
        delivery_address: '123 Test Street, Apartment 4B',
        payment_method: 'cash_on_delivery',
      },
    });
    console.log('Order create response:', orderCreateRes.status, orderCreateRes.body?.data?.id);
    const createdOrderId = orderCreateRes.body?.data?.id || orderCreateRes.body?.order?.id;
    if (!createdOrderId) {
      throw new Error(`Failed to create order: ${JSON.stringify(orderCreateRes)}`);
    }

    const acceptApprovedRes = await request(`/orders/${createdOrderId}/accept-delivery`, {
      method: 'PUT',
      token: driverToken,
    });
    console.log('Order accept response for approved driver:', acceptApprovedRes.status, acceptApprovedRes.body);
    if (acceptApprovedRes.status !== 200 || !acceptApprovedRes.body?.success) {
      throw new Error(`Approved driver failed to accept order: ${JSON.stringify(acceptApprovedRes)}`);
    }
    console.log(' Approved delivery partner successfully accepted real order!');

    console.log('\n======================================================');
    console.log(' ALL DELIVERY ONBOARDING & ADMIN NOTIFICATION TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    await pool.end();
  }
}

runTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
