import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { persistRestaurantToDb, persistMenuCategoryToDb, persistMenuItemToDb, resolveRestaurantId, dbPool, } from "../src/app.js";
describe("MenuCategory & MenuItem PostgreSQL Foreign Key Persistence", () => {
    let validRestaurantId;
    before(async () => {
        // Ensure test tables exist in DB
        await dbPool.query(`
      CREATE TABLE IF NOT EXISTS "MenuCategory" (
        id VARCHAR(64) PRIMARY KEY,
        restaurant_id VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "MenuItem" (
        id VARCHAR(64) PRIMARY KEY,
        restaurant_id VARCHAR(64) NOT NULL,
        category_id VARCHAR(64),
        category VARCHAR(128),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        image TEXT,
        image_url TEXT,
        is_available BOOLEAN DEFAULT true,
        is_veg BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
        // Fetch an existing restaurant ID
        const restRes = await dbPool.query(`SELECT id FROM "Restaurant" LIMIT 1;`);
        validRestaurantId = restRes.rows[0]?.id || "ac31365d-f83f-47b6-8d23-e024a7a494c5";
    });
    it("1. Persists a MenuCategory when valid restaurant exists", async () => {
        const testCatId = `test-cat-${Date.now()}`;
        const testCat = {
            id: testCatId,
            restaurant_id: validRestaurantId,
            name: "Test Gourmet Appetizers",
            sort_order: 1,
        };
        await persistMenuCategoryToDb(testCat);
        const checkRes = await dbPool.query(`SELECT id, restaurant_id, name FROM "MenuCategory" WHERE id = $1;`, [testCatId]);
        assert.strictEqual(checkRes.rows.length, 1);
        assert.strictEqual(checkRes.rows[0].id, testCatId);
        assert.strictEqual(checkRes.rows[0].restaurant_id, validRestaurantId);
        assert.strictEqual(checkRes.rows[0].name, "Test Gourmet Appetizers");
    });
    it("2. Persists a MenuItem linked to a valid MenuCategory and Restaurant", async () => {
        const testCatId = `test-cat-item-${Date.now()}`;
        await persistMenuCategoryToDb({
            id: testCatId,
            restaurant_id: validRestaurantId,
            name: "Test Mains",
            sort_order: 2,
        });
        const testItemId = `test-item-${Date.now()}`;
        const testItem = {
            id: testItemId,
            restaurant_id: validRestaurantId,
            name: "Signature Gourmet Steak",
            description: "Charcoal grilled ribeye with rosemary butter",
            price: 599,
            category: "Test Mains",
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500",
            is_available: true,
            is_veg: false,
        };
        await persistMenuItemToDb(testItem);
        const checkRes = await dbPool.query(`SELECT * FROM "MenuItem" WHERE id = $1;`, [testItemId]);
        assert.strictEqual(checkRes.rows.length, 1);
        assert.strictEqual(checkRes.rows[0].id, testItemId);
        assert.strictEqual(checkRes.rows[0].restaurant_id, validRestaurantId);
        assert.strictEqual(checkRes.rows[0].category_id, testCatId);
        assert.strictEqual(checkRes.rows[0].name, "Signature Gourmet Steak");
        assert.strictEqual(Number(checkRes.rows[0].price), 599);
    });
    it("3. Synchronization is idempotent and supports repeated syncs without FK errors", async () => {
        const testCatId = `test-idemp-cat-${Date.now()}`;
        const testItemId = `test-idemp-item-${Date.now()}`;
        const cat = { id: testCatId, restaurant_id: validRestaurantId, name: "Desserts & Shakes" };
        const item = {
            id: testItemId,
            restaurant_id: validRestaurantId,
            name: "Belgian Chocolate Lava Cake",
            description: "Warm molten chocolate center with vanilla gelato",
            price: 249,
            category: "Desserts & Shakes",
            image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500",
            is_available: true,
            is_veg: true,
        };
        // First sync
        await persistMenuCategoryToDb(cat);
        await persistMenuItemToDb(item);
        // Second sync (identical data)
        await persistMenuCategoryToDb(cat);
        await persistMenuItemToDb(item);
        // Third sync with update
        await persistMenuCategoryToDb({ ...cat, name: "Updated Desserts" });
        await persistMenuItemToDb({ ...item, price: 279 });
        const checkCat = await dbPool.query(`SELECT name FROM "MenuCategory" WHERE id = $1;`, [testCatId]);
        assert.strictEqual(checkCat.rows[0]?.name, "Updated Desserts");
        const checkItem = await dbPool.query(`SELECT price FROM "MenuItem" WHERE id = $1;`, [testItemId]);
        assert.strictEqual(Number(checkItem.rows[0]?.price), 279);
    });
    it("4. Correctly resolves and maps legacy/alias restaurant IDs ('1', '2', '3') to real PostgreSQL restaurants", async () => {
        const mapped1 = await resolveRestaurantId("1");
        const mapped2 = await resolveRestaurantId("2");
        const mapped3 = await resolveRestaurantId("3");
        assert.ok(mapped1 && mapped1.length > 5, "Restaurant '1' should map to a valid UUID");
        assert.ok(mapped2 && mapped2.length > 5, "Restaurant '2' should map to a valid UUID");
        assert.ok(mapped3 && mapped3.length > 5, "Restaurant '3' should map to a valid UUID");
        // Persisting a category with legacy restaurant_id "1" should resolve and succeed without FK violation
        const legacyCatId = `test-legacy-cat-${Date.now()}`;
        await persistMenuCategoryToDb({
            id: legacyCatId,
            restaurant_id: "1",
            name: "Legacy Burger Category",
        });
        const checkCat = await dbPool.query(`SELECT * FROM "MenuCategory" WHERE id = $1;`, [legacyCatId]);
        assert.strictEqual(checkCat.rows.length, 1);
        assert.strictEqual(checkCat.rows[0].restaurant_id, mapped1);
    });
    it("5. Handles missing/orphan parent gracefully by resolving to fallback restaurant and setting valid category_id", async () => {
        const orphanCatId = `test-orphan-cat-${Date.now()}`;
        await persistMenuCategoryToDb({
            id: orphanCatId,
            restaurant_id: "non-existent-restaurant-id-99999",
            name: "Orphan Category",
        });
        const checkCat = await dbPool.query(`SELECT * FROM "MenuCategory" WHERE id = $1;`, [orphanCatId]);
        assert.strictEqual(checkCat.rows.length, 1);
        assert.ok(checkCat.rows[0].restaurant_id.length > 5);
        const orphanItemId = `test-orphan-item-${Date.now()}`;
        await persistMenuItemToDb({
            id: orphanItemId,
            restaurant_id: "non-existent-restaurant-id-99999",
            name: "Orphan Mystery Burger",
            description: "Delicious burger without existing parent category",
            price: 199,
            category: "Unknown Custom Category Without ID",
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
            is_available: true,
            is_veg: false,
        });
        const checkItem = await dbPool.query(`SELECT * FROM "MenuItem" WHERE id = $1;`, [orphanItemId]);
        assert.strictEqual(checkItem.rows.length, 1);
        assert.strictEqual(checkItem.rows[0].name, "Orphan Mystery Burger");
        // Since category is unknown and not in MenuCategory, category_id should be NULL or a valid MenuCategory ID, avoiding FK violation
        if (checkItem.rows[0].category_id) {
            const catExists = await dbPool.query(`SELECT id FROM "MenuCategory" WHERE id = $1;`, [checkItem.rows[0].category_id]);
            assert.strictEqual(catExists.rows.length, 1);
        }
    });
});
//# sourceMappingURL=menu-persist.test.js.map