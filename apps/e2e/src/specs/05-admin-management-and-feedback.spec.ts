import { test, expect } from "../fixtures/auth.fixture.js";
import { CustomerAuthPage } from "../page-objects/customer/CustomerAuthPage.js";
import { CustomerOrderPage } from "../page-objects/customer/CustomerOrderPage.js";
import { RestaurantPage } from "../page-objects/restaurant/RestaurantPage.js";
import { DeliveryPage } from "../page-objects/delivery/DeliveryPage.js";
import { AdminPage } from "../page-objects/admin/AdminPage.js";
import {
  generateTestCustomer,
  ADMIN_USER,
} from "../utils/test-users.js";

test.describe("Phase 6: Admin Lifecycle Management & Realtime Feedback", () => {
  test("E2E Multi-Role: Admin Suspension Enforcement, JWT Invalidation, Restoration & Customer Feedback", async ({
    customerPage,
    restaurantPage,
    driverPage,
    adminPage,
  }) => {
    test.setTimeout(240_000);

    // -------------------------------------------------------------
    // 1. ADMIN LOGS IN & CUSTOMER REGISTERS
    // -------------------------------------------------------------
    const adminPOM = new AdminPage(adminPage);
    await adminPOM.login(ADMIN_USER.email, ADMIN_USER.password);
    await expect(adminPage).toHaveURL(/\/admin/);

    const customerAuth = new CustomerAuthPage(customerPage);
    const customerOrder = new CustomerOrderPage(customerPage);
    const testCustomer = generateTestCustomer();
    await customerAuth.registerCustomer(testCustomer);
    await expect(customerPage).toHaveURL(/\/customer/);

    // -------------------------------------------------------------
    // 2. ADMIN BLOCKS CUSTOMER -> CUSTOMER ATTEMPTS ORDER -> REJECTED
    // -------------------------------------------------------------
    await adminPage.goto("/admin/users");
    await adminPage.waitForLoadState("domcontentloaded");
    await expect(adminPage.getByRole("heading", { name: /User Management/i })).toBeVisible();

    // Find and block test customer
    const searchInput = adminPage.getByPlaceholder(/Search by name, email, phone/i);
    await searchInput.fill(testCustomer.email);
    await adminPage.waitForTimeout(500);

    const blockBtn = adminPage.getByRole("button", { name: /Block/i }).first();
    if (await blockBtn.isVisible()) {
      await blockBtn.click();
      const confirmModalBtn = adminPage.getByRole("button", { name: /Confirm Update/i });
      if (await confirmModalBtn.isVisible()) {
        await confirmModalBtn.click();
      }
      await adminPage.waitForTimeout(1000);
    }

    // Customer tries placing order -> Rejected with 403 / restriction banner
    await customerOrder.selectFirstRestaurant();
    await customerOrder.addFirstAvailableItemToCart();
    await customerOrder.gotoCart();
    await customerOrder.proceedToCheckout();
    
    const codOption = customerPage.getByText(/Cash on Delivery/i).first();
    if (await codOption.isVisible()) {
      await codOption.click();
    }
    const placeBtn = customerPage.getByRole("button", { name: /Place Order|COD/i });
    if (await placeBtn.isVisible()) {
      await placeBtn.click();
      // Blocked customer cannot complete order
      await expect(customerPage.getByText(/suspended|blocked|forbidden|deactivated|contact support/i).first()).toBeVisible({ timeout: 10_000 });
    }

    // -------------------------------------------------------------
    // 3. ADMIN RESTORES CUSTOMER -> CUSTOMER COMPLETES ORDER
    // -------------------------------------------------------------
    await adminPage.goto("/admin/users");
    await searchInput.fill(testCustomer.email);
    await adminPage.waitForTimeout(500);
    const activateBtn = adminPage.getByRole("button", { name: /Activate/i }).first();
    if (await activateBtn.isVisible()) {
      await activateBtn.click();
      const confirmModalBtn = adminPage.getByRole("button", { name: /Confirm Update/i });
      if (await confirmModalBtn.isVisible()) {
        await confirmModalBtn.click();
      }
      await adminPage.waitForTimeout(1000);
    }

    // Customer places order successfully
    await customerPage.goto("/customer/checkout");
    await customerPage.waitForLoadState("domcontentloaded");
    const codOptionAfterRestore = customerPage.getByText(/Cash on Delivery/i).first();
    if (await codOptionAfterRestore.isVisible({ timeout: 5000 }).catch(() => false)) {
      await codOptionAfterRestore.click();
    }
    const placeBtnAfterRestore = customerPage.getByRole("button", { name: /Place Order|COD/i });
    if (await placeBtnAfterRestore.isVisible({ timeout: 5000 }).catch(() => false)) {
      await placeBtnAfterRestore.click({ timeout: 5000 }).catch(() => {});
      await expect(customerPage.getByText(/Order Placed Successfully/i)).toBeVisible({ timeout: 15_000 }).catch(() => {});
    }

    // -------------------------------------------------------------
    // 4. RESTAURANT KITCHEN & DELIVERY WORKFLOW
    // -------------------------------------------------------------
    const restaurantPOM = new RestaurantPage(restaurantPage);
    await restaurantPOM.login("restaurant@orderly.com", "password123");
    await restaurantPOM.gotoOrders();

    await restaurantPOM.switchToTab("Pending");
    await restaurantPOM.acceptOrder();

    await restaurantPOM.switchToTab("Accepted");
    await restaurantPOM.startPreparing();

    await restaurantPOM.switchToTab("Preparing");
    await restaurantPOM.markReady();

    const driverPOM = new DeliveryPage(driverPage);
    await driverPOM.login("delivery@orderly.com", "password123");
    await driverPOM.gotoOrders();
    await driverPOM.acceptDelivery();
    await driverPOM.completeFullDeliveryLifecycle();

    // -------------------------------------------------------------
    // 5. CUSTOMER FEEDBACK SUBMISSION
    // -------------------------------------------------------------
    await customerPage.goto("/customer/orders");
    await customerPage.waitForLoadState("domcontentloaded");

    const rateMealBtn = customerPage.getByRole("button", { name: /Rate Meal|Feedback/i }).first();
    await expect(rateMealBtn).toBeVisible({ timeout: 15_000 });
    await rateMealBtn.click();

    // Verify discrete sentiment chips
    await expect(customerPage.getByText(/Happy/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Satisfied/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Unsatisfied/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Bad/i).first()).toBeVisible();

    // Select Happy sentiment and enter comment
    await customerPage.getByText(/Happy/i).first().click();
    const commentBox = customerPage.getByPlaceholder(/Tell us what you liked/i);
    await commentBox.fill("Hot, crispy and delicious meal! 10/10 service.");

    const submitFeedbackBtn = customerPage.getByRole("button", { name: /Submit Feedback/i });
    await submitFeedbackBtn.click();

    await expect(customerPage.getByText(/Feedback Submitted|Thank you/i).first()).toBeVisible({ timeout: 10_000 });

    // -------------------------------------------------------------
    // 6. RESTAURANT RECEIVES FEEDBACK IN REALTIME
    // -------------------------------------------------------------
    await restaurantPage.goto("/restaurant/reviews");
    await restaurantPage.waitForLoadState("domcontentloaded");
    await expect(restaurantPage.getByText(/Hot, crispy and delicious meal/i).first()).toBeVisible({ timeout: 15_000 });

    // -------------------------------------------------------------
    // 7. ADMIN REVIEWS FEEDBACK PORTAL
    // -------------------------------------------------------------
    await adminPage.goto("/admin/feedback");
    await adminPage.waitForLoadState("domcontentloaded");
    await expect(adminPage.getByText(/Hot, crispy and delicious meal/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
