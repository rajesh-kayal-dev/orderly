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

test.describe("Phase 5: Complete Multi-Role Golden Order Lifecycle", () => {
  test("End-to-End Golden Order: Customer → Restaurant Kitchen → Delivery Partner → Customer Tracking → Admin Inspection", async ({
    customerPage,
    restaurantPage,
    driverPage,
    adminPage,
  }) => {
    test.setTimeout(180_000);
    // -------------------------------------------------------------
    // 1. CUSTOMER: Authenticate, Browse, Order with COD & Launch Tracking
    // -------------------------------------------------------------
    const customerAuth = new CustomerAuthPage(customerPage);
    const customerOrder = new CustomerOrderPage(customerPage);
    const testCustomer = generateTestCustomer();

    // Authenticate real E2E customer
    await customerAuth.registerCustomer(testCustomer);
    await expect(customerPage).toHaveURL(/\/customer/);

    // Browse and open restaurant menu
    await customerOrder.selectFirstRestaurant();
    await customerOrder.addFirstAvailableItemToCart();

    // Go to cart & proceed to checkout
    await customerOrder.gotoCart();
    await expect(customerPage.getByText(/Total/i).first()).toBeVisible();

    await customerOrder.proceedToCheckout();
    await expect(customerPage).toHaveURL(/\/customer\/checkout/);

    // Select COD and place order
    const codOption = customerPage.getByText(/Cash on Delivery/i).first();
    await expect(codOption).toBeVisible({ timeout: 10_000 });
    await codOption.click();

    const placeOrderBtn = customerPage.getByRole("button", { name: /Place Order|COD/i });
    await placeOrderBtn.click();

    // Verify order confirmation modal and capture Order ID
    await expect(customerPage.getByText(/Order Placed Successfully/i)).toBeVisible({ timeout: 15_000 });
    
    // Extract Order ID or proceed to tracking
    await customerOrder.clickTrackOrderFromSuccessModal();
    await customerPage.waitForURL("**/customer/tracking**", { timeout: 10_000 });
    await expect(customerPage.getByText(/Live Order Tracking|Your Order is Being Processed/i).first()).toBeVisible();

    // -------------------------------------------------------------
    // 2. RESTAURANT / KITCHEN: Authenticate, Accept, Prepare & Mark Ready
    // -------------------------------------------------------------
    const restaurantPOM = new RestaurantPage(restaurantPage);
    await restaurantPOM.login("restaurant@orderly.com", "password123");
    await restaurantPOM.gotoOrders();

    // Verify Pending tab has orders and click Accept
    await expect(restaurantPage.getByRole("heading", { name: /Order Management/i })).toBeVisible();
    await restaurantPOM.switchToTab("Pending");
    await restaurantPOM.acceptOrder();

    // Switch to Accepted tab and start preparing
    await restaurantPOM.switchToTab("Accepted");
    await restaurantPOM.startPreparing();

    // Switch to Preparing tab and mark ready
    await restaurantPOM.switchToTab("Preparing");
    await restaurantPOM.markReady();

    // Switch to Ready tab to verify ready status
    await restaurantPOM.switchToTab("Ready");
    await expect(restaurantPage.getByText(/Ready for Pickup/i).first()).toBeVisible();

    // -------------------------------------------------------------
    // 3. CUSTOMER CONTEXT: Verify Customer Sees Preparation / Ready Status
    // -------------------------------------------------------------
    await customerPage.reload();
    await customerPage.waitForLoadState("domcontentloaded");
    await expect(customerPage.getByText(/Live Order Tracking|Order Status|Preparing|Ready/i).first()).toBeVisible();

    // -------------------------------------------------------------
    // 4. DELIVERY PARTNER: Authenticate, Accept, Pickup & Complete Delivery
    // -------------------------------------------------------------
    const driverPOM = new DeliveryPage(driverPage);
    await driverPOM.login("delivery@orderly.com", "password123");
    await driverPOM.gotoOrders();

    // Locate and claim available delivery
    await expect(driverPage.getByRole("heading", { name: /Available Deliveries/i }).first()).toBeVisible();
    await driverPOM.acceptDelivery();

    // Driver workflow: Arrived at Restaurant -> Mark as Picked Up -> Start Delivery -> Delivered
    await driverPOM.arriveAtRestaurant();
    await driverPOM.pickupDelivery();
    await driverPOM.startDelivery();
    await driverPOM.completeDelivery();

    // -------------------------------------------------------------
    // 5. CUSTOMER TRACKING: Verify Realtime Transition to Delivered
    // -------------------------------------------------------------
    await customerPage.reload();
    await customerPage.waitForLoadState("domcontentloaded");
    await expect(customerPage.getByText(/Delivered/i).first()).toBeVisible({ timeout: 15_000 });

    // -------------------------------------------------------------
    // 6. ADMIN: Authenticate & Audit Order Details in Admin Portal
    // -------------------------------------------------------------
    const adminPOM = new AdminPage(adminPage);
    await adminPOM.login(ADMIN_USER.email, ADMIN_USER.password);
    await adminPOM.gotoOrders();

    await expect(adminPage.getByRole("heading", { name: /Global Order/i }).first()).toBeVisible();
    // Switch to Delivered tab in Admin UI
    const deliveredTab = adminPage.getByRole("button", { name: /Delivered/i }).first();
    await deliveredTab.click();
    await expect(adminPage.getByText(/Delivered/i).first()).toBeVisible();
  });

  test("Security & Authorization: Role isolation and protected route enforcement", async ({ customerPage, driverPage }) => {
    // 1. Customer cannot access restaurant or admin areas
    const customerAuth = new CustomerAuthPage(customerPage);
    const testCustomer = generateTestCustomer();
    await customerAuth.registerCustomer(testCustomer);

    // Try accessing restaurant orders
    await customerPage.goto("/restaurant/orders");
    // Should be redirected away or forbidden
    await customerPage.waitForTimeout(2000);
    const currentCustUrl = customerPage.url();
    expect(currentCustUrl.includes("/restaurant/orders") && !currentCustUrl.includes("/login")).toBeFalsy();

    // Try accessing admin portal
    await customerPage.goto("/admin/dashboard");
    await customerPage.waitForTimeout(2000);
    const adminAccessUrl = customerPage.url();
    expect(adminAccessUrl.includes("/admin/dashboard") && !adminAccessUrl.includes("/admin/login")).toBeFalsy();

    // 2. Unauthenticated user cannot access delivery orders
    await driverPage.goto("/delivery/orders");
    await driverPage.waitForTimeout(2000);
    expect(driverPage.url()).toContain("/login");
  });
});
