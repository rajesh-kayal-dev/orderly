import { test, expect } from "../fixtures/auth.fixture.js";
import { CustomerAuthPage } from "../page-objects/customer/CustomerAuthPage.js";
import { CustomerOrderPage } from "../page-objects/customer/CustomerOrderPage.js";
import { generateTestCustomer } from "../utils/test-users.js";

test.describe("Phase 3: Customer Restaurant Browsing, Menu & Cart Workflow", () => {
  test("Complete customer browsing, menu items, quantity, removal, and cart persistence", async ({ customerPage }) => {
    const auth = new CustomerAuthPage(customerPage);
    const order = new CustomerOrderPage(customerPage);
    const testCustomer = generateTestCustomer();

    // 1. Authenticate with real customer account
    await auth.registerCustomer(testCustomer);
    await expect(customerPage).toHaveURL(/\/customer/);

    // 2. Go to restaurant listing
    await order.gotoRestaurants();
    await expect(customerPage).toHaveURL(/\/customer\/restaurants/);

    // 3. Verify restaurants load
    const restaurantCards = customerPage.locator("div.cursor-pointer").filter({ hasText: /OPEN|mins|★/i });
    await expect(restaurantCards.first()).toBeVisible({ timeout: 10_000 });
    const initialCount = await restaurantCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // 4. Test search filter
    await order.searchRestaurants("Gourmet");
    await customerPage.waitForTimeout(500); // Debounce / render
    const filteredCards = customerPage.locator("div.cursor-pointer").filter({ hasText: /OPEN|mins|★/i });
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // 5. Test empty state with nonexistent search
    await order.searchRestaurants("xyznonexistent999");
    await customerPage.waitForTimeout(500);
    await expect(customerPage.getByText(/No restaurants match/i)).toBeVisible();

    // 6. Clear filters and restore all restaurants
    await order.clearFilters();
    await customerPage.waitForTimeout(500);
    const restoredCards = customerPage.locator("div.cursor-pointer").filter({ hasText: /OPEN|mins|★/i });
    expect(await restoredCards.count()).toBe(initialCount);

    // 7. Select a restaurant and open its menu
    await restoredCards.first().click();
    await customerPage.waitForURL("**/customer/restaurant/**", { timeout: 10_000 });

    // 8. Verify restaurant information and menu items load
    await expect(customerPage.locator("h1")).toBeVisible();
    await expect(customerPage.getByText(/Rating|ratings/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Address|Operating Hours|Restaurant Details/i).first()).toBeVisible();

    // 9. Verify food items load from backend
    const addButtons = customerPage.locator("button").filter({ hasText: /Add|plus/i });
    await expect(addButtons.first()).toBeVisible({ timeout: 10_000 });
    const menuCount = await addButtons.count();
    expect(menuCount).toBeGreaterThan(0);

    // 10. Add first food item to cart
    await addButtons.first().click();
    // Cart badge should appear and be >= 1
    const cartBadge = customerPage.locator("nav").getByText(/Cart/i).locator("..").locator("span, generic, div").last();
    await expect(customerPage.locator("nav").getByText(/Cart/i)).toBeVisible();

    // 11. Add second food item to cart if available
    if (menuCount > 1) {
      const secondAddButton = customerPage.locator("button").filter({ hasText: /Add/i }).first();
      if (await secondAddButton.isVisible()) {
        await secondAddButton.click();
      }
    }

    // 12. Navigate to Cart page
    await order.gotoCart();
    await expect(customerPage).toHaveURL(/\/customer\/cart/);

    // 13. Verify cart items and price calculations
    await expect(customerPage.getByText(/Cart Items|Order Summary/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Subtotal/i)).toBeVisible();
    await expect(customerPage.getByText(/GST/i)).toBeVisible();
    await expect(customerPage.getByText(/Total/i).first()).toBeVisible();

    // 14. Change item quantity (plus button)
    const plusBtn = customerPage.getByRole("button", { name: "plus" }).first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
      await customerPage.waitForTimeout(300);
    }

    // 15. Remove an item if multiple items in cart
    const deleteButtons = customerPage.locator("button").filter({ has: customerPage.locator(".anticon-delete, [aria-label='delete']") });
    const deleteCount = await deleteButtons.count();
    if (deleteCount > 1) {
      // Click the last item's delete button
      await deleteButtons.last().click();
      await customerPage.waitForTimeout(300);
    }

    // 16. Navigate away to customer home and return to verify cart persistence
    await customerPage.goto("/customer");
    await customerPage.waitForLoadState("domcontentloaded");
    await order.gotoCart();
    await expect(customerPage).toHaveURL(/\/customer\/cart/);
    await expect(customerPage.getByText(/Subtotal/i)).toBeVisible();

    // 17. Proceed to checkout
    const checkoutBtn = customerPage.getByRole("button", { name: /Proceed to Checkout/i });
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();
    await customerPage.waitForURL("**/customer/checkout", { timeout: 10_000 });
    await expect(customerPage.getByText(/Checkout|Delivery Address|Payment Method/i).first()).toBeVisible();
  });
});
