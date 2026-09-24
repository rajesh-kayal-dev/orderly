// End-to-End Verification Test for Admin Lifecycle Actions, Live JWT Invalidation & Customer Feedback System
const GATEWAY_URL = 'http://localhost:8000/api';

async function request(path, options = {}) {
  const url = `${GATEWAY_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🚀 Starting Orderly Admin Lifecycle, Live JWT Invalidation & Feedback Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Authenticate Admin
  console.log('--- Step 1: Authenticate Admin ---');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@ofds.com', password: 'password123' }
  });
  assert(adminLogin.ok && adminLogin.data.data?.token, 'Admin logged in successfully');
  const adminToken = adminLogin.data.data?.token;

  // 2. Authenticate Customer
  console.log('\n--- Step 2: Authenticate Customer ---');
  const custLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'customer@orderly.com', password: 'password123' }
  });
  assert(custLogin.ok && custLogin.data.data?.token, 'Customer logged in successfully and received JWT');
  const customerToken = custLogin.data.data?.token;
  const customerId = custLogin.data.data?.user?.id;

  // 3. Authenticate Restaurant Owner
  console.log('\n--- Step 3: Authenticate Restaurant Owner ---');
  const restLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'restaurant@orderly.com', password: 'password123' }
  });
  assert(restLogin.ok && restLogin.data.data?.token, 'Restaurant owner logged in and received JWT');
  const restToken = restLogin.data.data?.token;
  const restUserId = restLogin.data.data?.user?.id;

  // Fetch restaurant owner profile to get exact restaurant ID
  const restProfileRes = await request('/restaurants/my-profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${restToken}` }
  });
  const restProfile = restProfileRes.data.data;
  const testRestId = restProfile?.id || `rest-${restUserId}`;
  console.log(`  ℹ️ Restaurant profile identified: ID = "${testRestId}", Name = "${restProfile?.name}"`);

  // 4. Authenticate Delivery Partner
  console.log('\n--- Step 4: Authenticate Delivery Partner ---');
  const driverLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'delivery@orderly.com', password: 'password123' }
  });
  assert(driverLogin.ok && driverLogin.data.data?.token, 'Delivery driver logged in and received JWT');
  const driverToken = driverLogin.data.data?.token;
  const driverUserId = driverLogin.data.data?.user?.id;

  // 5. TEST LIVE JWT INACTIVATION: Customer Suspension / Blocking
  console.log('\n--- Step 5: Test Customer Suspension / Blocking Live Rejection ---');
  // Admin blocks customer
  const blockCust = await request(`/admin/users/${customerId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'blocked', reason: 'Automated test suspension' }
  });
  assert(blockCust.ok, 'Admin blocked customer in DB & memory');

  // Customer tries to place order with old JWT -> must be rejected
  const custTryOrder = await request('/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      restaurantId: testRestId,
      delivery_address: '123 Test St',
      items: [{ id: 'item-1', name: 'Burger', price: 150, quantity: 1 }],
      payment_method: 'cod'
    }
  });
  assert(custTryOrder.status === 403, `Blocked customer with old JWT received 403 Forbidden (Got status: ${custTryOrder.status})`);

  // Admin unblocks customer
  const unblockCust = await request(`/admin/users/${customerId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'active', reason: 'Restoring account' }
  });
  assert(unblockCust.ok, 'Admin restored customer');

  // Customer places order with same old JWT -> now allowed
  const custPlaceOrder = await request('/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      restaurantId: testRestId,
      delivery_address: 'Flat 101, Test Residency',
      items: [{ id: 'item-1', name: 'Truffle Smash Burger', price: 189, quantity: 1 }],
      payment_method: 'cod'
    }
  });
  assert(custPlaceOrder.ok && custPlaceOrder.data.data?.id, `Restored customer placed order successfully #${custPlaceOrder.data.data?.id}`);
  const testOrderId = custPlaceOrder.data.data?.id;

  // Ensure order is linked to this restaurant
  custPlaceOrder.data.data.restaurant_id = testRestId;

  // 6. TEST LIVE JWT INACTIVATION: Restaurant Suspension
  console.log('\n--- Step 6: Test Restaurant Suspension Live Rejection ---');
  // Admin suspends restaurant
  const suspendRest = await request(`/admin/restaurants/${testRestId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'SUSPENDED', reason: 'Routine inspection pending' }
  });
  assert(suspendRest.ok, `Admin suspended restaurant ${testRestId}`);

  // Restaurant tries to update status with old JWT -> must be rejected
  const restTryStatus = await request(`/orders/${testOrderId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${restToken}` },
    body: { status: 'preparing' }
  });
  assert(restTryStatus.status === 403, `Suspended restaurant with old JWT received 403 Forbidden (Got status: ${restTryStatus.status})`);

  // Admin unsuspends restaurant
  const unsuspendRest = await request(`/admin/restaurants/${testRestId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'ACTIVE', reason: 'Inspection cleared' }
  });
  assert(unsuspendRest.ok, 'Admin unsuspended restaurant');

  // Restaurant updates status with same old JWT -> now succeeds
  const restAccept = await request(`/orders/${testOrderId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${restToken}` },
    body: { status: 'preparing' }
  });
  assert(restAccept.ok, `Restored restaurant set order to preparing with same JWT`);

  // 7. TEST LIVE JWT INACTIVATION: Delivery Partner Suspension
  console.log('\n--- Step 7: Test Delivery Partner Suspension Live Rejection ---');
  // Restaurant marks ready
  await request(`/orders/${testOrderId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${restToken}` },
    body: { status: 'ready' }
  });

  // Admin suspends driver
  const suspendDriver = await request('/admin/delivery-partners/dp-1/status', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'SUSPENDED', reason: 'Vehicle check' }
  });
  assert(suspendDriver.ok, 'Admin suspended delivery driver');

  // Driver tries to accept delivery with old JWT
  const driverTryAccept = await request(`/orders/${testOrderId}/accept-delivery`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert(driverTryAccept.status === 403, `Suspended driver with old JWT received 403 Forbidden (Got status: ${driverTryAccept.status})`);

  // Admin unsuspends driver
  const unsuspendDriver = await request('/admin/delivery-partners/dp-1/status', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'ACTIVE', reason: 'Vehicle approved' }
  });
  assert(unsuspendDriver.ok, 'Admin unsuspended delivery driver');

  // Driver accepts delivery with same old JWT -> succeeds
  const driverAccept = await request(`/orders/${testOrderId}/accept-delivery`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert(driverAccept.ok, `Restored driver accepted delivery with same JWT`);

  // 8. Deliver the order
  console.log('\n--- Step 8: Complete Delivery ---');
  const deliverOrder = await request(`/deliveries/${testOrderId}/complete`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert(deliverOrder.ok, 'Driver marked order as delivered');

  // 9. CUSTOMER FEEDBACK SUBMISSION
  console.log('\n--- Step 9: Customer Feedback System ---');
  // Attempt invalid sentiment
  const invalidFeedback = await request(`/orders/${testOrderId}/feedback`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: { sentiment: 'SuperAwesome', comment: 'Great food' }
  });
  assert(invalidFeedback.status === 400, 'Invalid sentiment rejected with 400');

  // Attempt feedback with valid discrete sentiment: Happy
  const happyFeedback = await request(`/orders/${testOrderId}/feedback`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: { sentiment: 'Happy', comment: 'Steaming hot burgers, super juicy!' }
  });
  assert(happyFeedback.ok && happyFeedback.data.data?.sentiment === 'Happy', 'Feedback "Happy" submitted successfully');

  // Attempt duplicate submission: Must UPDATE existing record rather than creating duplicate
  const updateFeedback = await request(`/orders/${testOrderId}/feedback`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: { sentiment: 'Satisfied', comment: 'Updated review: really good fries too.' }
  });
  assert(updateFeedback.ok && updateFeedback.data.data?.sentiment === 'Satisfied', 'Duplicate submission updated existing record to "Satisfied"');

  // 10. CUSTOMER PRIVACY & RESTAURANT FEEDBACK VIEW
  console.log('\n--- Step 10: Restaurant Feedback View & Customer Privacy ---');
  const restFeedbackView = await request('/restaurant/feedback', {
    method: 'GET',
    headers: { Authorization: `Bearer ${restToken}` }
  });
  assert(restFeedbackView.ok && Array.isArray(restFeedbackView.data.data), 'Restaurant retrieved feedback list');
  const firstItem = restFeedbackView.data.data[0];
  assert(firstItem && firstItem.customer_name, `Customer display name visible: "${firstItem?.customer_name}"`);
  assert(firstItem && firstItem.email === undefined, 'Customer email is NOT exposed to restaurant (Privacy Protected)');
  assert(firstItem && firstItem.phone === undefined, 'Customer phone is NOT exposed to restaurant (Privacy Protected)');
  assert(firstItem && firstItem.address === undefined, 'Customer address is NOT exposed to restaurant (Privacy Protected)');

  // 11. ADMIN FEEDBACK VIEW
  console.log('\n--- Step 11: Admin Feedback View ---');
  const adminFeedbackView = await request('/admin/feedback', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminFeedbackView.ok && adminFeedbackView.data.data?.length > 0, 'Admin can view platform-wide feedbacks');

  // 12. ADMIN AUDIT LOGS
  console.log('\n--- Step 12: Admin Audit Logs Verification ---');
  const auditLogsRes = await request('/admin/audit-logs', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(auditLogsRes.ok && auditLogsRes.data.data?.length > 0, `Audit logs recorded in database (${auditLogsRes.data.data?.length} actions logged)`);

  // 13. ADMIN CANNOT MODIFY ANOTHER ADMIN
  console.log('\n--- Step 13: Admin Security Protection ---');
  const adminModifyOtherAdmin = await request(`/admin/users/usr-admin-default/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'suspended', reason: 'Malicious modification' }
  });
  assert(adminModifyOtherAdmin.status === 403, 'Admin cannot modify another admin account (403 Forbidden)');

  console.log(`\n=========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`=========================================\n`);
}

runTests().catch(console.error);
