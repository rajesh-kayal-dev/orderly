import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createGatewayApp, persistOrderToDb, persistNotificationToDb, markNotificationReadInDb, dbPool, } from "../src/app.js";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "orderly-super-secret-jwt-dev-key-2026";
describe("Order & Notification Persistence Flow", () => {
    let server;
    let baseUrl;
    let testCustToken;
    before(async () => {
        testCustToken = jwt.sign({ id: "usr-cust-1", email: "customer@orderly.com", role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });
        await dbPool.query(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        order_id VARCHAR(64),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS order_id VARCHAR(64);
      ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
    `);
        const app = createGatewayApp();
        await new Promise((resolve) => {
            server = app.listen(0, () => {
                const addr = server.address();
                if (addr && typeof addr === "object") {
                    baseUrl = `http://localhost:${addr.port}`;
                }
                resolve();
            });
        });
    });
    after(async () => {
        await new Promise((resolve) => {
            if (server) {
                server.closeAllConnections?.();
                server.close(() => resolve());
                server.unref?.();
            }
            else {
                resolve();
            }
        });
    });
    it("successfully persists an order unit via persistOrderToDb with authoritative total_amount", async () => {
        const testOrderId = `test-unit-${Date.now()}`;
        const testOrder = {
            id: testOrderId,
            customer_id: "usr-cust-1",
            guest_session_id: null,
            contact_info: {
                fullName: "Test Customer",
                phoneNumber: "+91 9876543210",
                email: "test@orderly.com",
            },
            idempotency_key: `idemp-unit-${Date.now()}`,
            restaurant_id: "1",
            delivery_partner_id: "usr-driver-1",
            status: "placed",
            delivery_address: "123 Test Street, Indore",
            notes: "Test order for total_amount persistence",
            items: [
                { id: "item-1", name: "Truffle Smash Burger", quantity: 2, price: 189 },
            ],
            subtotal: 378.0,
            discount_amount: 0.0,
            coupon_code: null,
            delivery_fee: 30.0,
            platform_fee: 5.0,
            tax: 18.9,
            total: 431.9,
            total_amount: 431.9,
            payment_status: "cod_pending",
            payment_method: "cod",
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        await persistOrderToDb(testOrder);
        const res = await dbPool.query(`SELECT id, subtotal, discount_amount, delivery_fee, platform_fee, tax, total, total_amount, status FROM "Order" WHERE id = $1;`, [testOrderId]);
        assert.strictEqual(res.rows.length, 1, "Order should be persisted in DB");
        const dbRow = res.rows[0];
        assert.strictEqual(dbRow.id, testOrderId);
        assert.ok(dbRow.total_amount !== null && dbRow.total_amount !== undefined, "total_amount must NOT be null");
        assert.strictEqual(Number(dbRow.total_amount), 431.9, "total_amount in DB must match calculated final total");
        assert.strictEqual(Number(dbRow.total), 431.9, "total in DB must match calculated final total");
        await dbPool.query(`DELETE FROM "Order" WHERE id = $1;`, [testOrderId]);
    });
    it("successfully persists a notification WITH an order_id reference", async () => {
        const notifId = `test-notif-order-${Date.now()}`;
        const orderId = `test-ord-ref-${Date.now()}`;
        const notif = {
            id: notifId,
            userId: "usr-cust-1",
            orderId: orderId,
            title: "Order Placed",
            message: `Your order #${orderId} has been confirmed.`,
            read: false,
        };
        await persistNotificationToDb(notif);
        const res = await dbPool.query(`SELECT id, user_id, order_id, title, message, read FROM "Notification" WHERE id = $1;`, [notifId]);
        assert.strictEqual(res.rows.length, 1, "Notification should be persisted");
        const row = res.rows[0];
        assert.strictEqual(row.id, notifId);
        assert.ok(row.user_id, "user_id should be populated");
        assert.strictEqual(row.order_id, orderId);
        assert.strictEqual(row.title, "Order Placed");
        assert.strictEqual(row.read, false);
        // Test mark read
        await markNotificationReadInDb(notifId);
        const readRes = await dbPool.query(`SELECT read FROM "Notification" WHERE id = $1;`, [notifId]);
        assert.strictEqual(readRes.rows[0]?.read, true);
        await dbPool.query(`DELETE FROM "Notification" WHERE id = $1;`, [notifId]);
    });
    it("successfully persists a notification WITHOUT an order_id reference", async () => {
        const notifId = `test-notif-system-${Date.now()}`;
        const notif = {
            id: notifId,
            userId: "all",
            title: "Platform Maintenance",
            message: "Scheduled updates completed successfully.",
            read: false,
        };
        await persistNotificationToDb(notif);
        const res = await dbPool.query(`SELECT id, user_id, order_id, title, message, read FROM "Notification" WHERE id = $1;`, [notifId]);
        assert.strictEqual(res.rows.length, 1, "Notification should be persisted");
        const row = res.rows[0];
        assert.strictEqual(row.id, notifId);
        assert.ok(row.user_id, "user_id should be populated");
        assert.strictEqual(row.order_id, null);
        assert.strictEqual(row.title, "Platform Maintenance");
        await dbPool.query(`DELETE FROM "Notification" WHERE id = $1;`, [notifId]);
    });
    it("POST /orders creates order and persists order + notifications with order_id in PostgreSQL", async () => {
        const idempotencyKey = `idemp-api-${Date.now()}`;
        const orderPayload = {
            delivery_address: "456 Gateway Lane, Indore",
            contact_info: {
                fullName: "Aarav Sharma",
                phoneNumber: "+91 9823456789",
                email: "customer@orderly.com",
            },
            payment_method: "cod",
            notes: "Please call on arrival",
            idempotency_key: idempotencyKey,
            items: [
                { menuItemId: "item-1", quantity: 2, price: 189, name: "Truffle Smash Burger" },
            ],
        };
        const res = await fetch(`${baseUrl}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${testCustToken}`,
                "x-idempotency-key": idempotencyKey,
            },
            body: JSON.stringify(orderPayload),
        });
        assert.strictEqual(res.status, 201);
        const body = (await res.json());
        assert.strictEqual(body.success, true);
        assert.ok(body.data?.id);
        const createdOrderId = body.data.id;
        assert.strictEqual(body.data.subtotal, 378.0);
        assert.strictEqual(body.data.delivery_fee, 30.0);
        assert.strictEqual(body.data.platform_fee, 5.0);
        assert.strictEqual(body.data.tax, 18.9);
        assert.strictEqual(body.data.total, 431.9);
        assert.strictEqual(body.data.total_amount, 431.9);
        await new Promise((r) => setTimeout(r, 600));
        // Verify Order row in DB
        const dbOrderRes = await dbPool.query(`SELECT id, subtotal, discount_amount, delivery_fee, platform_fee, tax, total, total_amount, status, payment_status FROM "Order" WHERE id = $1;`, [createdOrderId]);
        assert.strictEqual(dbOrderRes.rows.length, 1, "Order should be persisted in DB");
        const orderRow = dbOrderRes.rows[0];
        assert.strictEqual(orderRow.id, createdOrderId);
        assert.ok(orderRow.total_amount !== null && orderRow.total_amount !== undefined);
        assert.strictEqual(Number(orderRow.total_amount), 431.9);
        assert.strictEqual(Number(orderRow.total), 431.9);
        // Verify Notification rows in DB for this order
        const dbNotifRes = await dbPool.query(`SELECT id, user_id, order_id, title, message FROM "Notification" WHERE order_id = $1;`, [createdOrderId]);
        assert.ok(dbNotifRes.rows.length >= 1, "At least 1 notification should be persisted for the order");
        for (const notifRow of dbNotifRes.rows) {
            assert.strictEqual(notifRow.order_id, createdOrderId);
        }
        // Clean up
        await dbPool.query(`DELETE FROM "Notification" WHERE order_id = $1;`, [createdOrderId]);
        await dbPool.query(`DELETE FROM "Order" WHERE id = $1;`, [createdOrderId]);
    });
});
//# sourceMappingURL=order-persist.test.js.map