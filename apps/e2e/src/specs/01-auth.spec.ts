import { test, expect } from "../fixtures/auth.fixture.js";
import { CustomerAuthPage } from "../page-objects/customer/CustomerAuthPage.js";
import {
  generateTestCustomer,
  generateTestRestaurant,
  generateTestDriver,
  ADMIN_USER,
} from "../utils/test-users.js";

test.describe("Phase 2: Authentication, Registration & Role Isolation", () => {
  test("Customer can register, redirect, logout, and login again", async ({ customerPage }) => {
    const auth = new CustomerAuthPage(customerPage);
    const testCustomer = generateTestCustomer();

    // 1. Register
    await auth.registerCustomer(testCustomer);
    await expect(customerPage).toHaveURL(/\/customer/);

    // 2. Logout
    await auth.logout();
    await expect(customerPage).toHaveURL(/(\/|\/login|\/register)/);

    // 3. Login again
    await auth.login(testCustomer.email, testCustomer.password);
    await expect(customerPage).toHaveURL(/\/customer/);
  });

  test("Restaurant owner can register and access restaurant portal", async ({ restaurantPage, restaurantPOM }) => {
    const testRest = generateTestRestaurant();
    await restaurantPOM.registerRestaurant(testRest);
    await expect(restaurantPage).toHaveURL(/\/restaurant/);
  });

  test("Delivery Partner can register through partner onboarding", async ({ driverPage, driverPOM }) => {
    const testDriver = generateTestDriver();
    await driverPOM.registerDriver(testDriver);
  });

  test("Admin can login to management portal", async ({ adminPage, adminPOM }) => {
    await adminPOM.login(ADMIN_USER.email, ADMIN_USER.password);
    await expect(adminPage).toHaveURL(/\/admin/);
  });

  test("Protected routes reject unauthorized roles", async ({ customerPage }) => {
    const auth = new CustomerAuthPage(customerPage);
    const testCustomer = generateTestCustomer();
    await auth.registerCustomer(testCustomer);

    // Attempt to access /admin
    await customerPage.goto("/admin");
    // Customer should not stay on /admin and should be bounced to their dashboard or login
    await expect(customerPage).toHaveURL(/(\/customer|\/admin\/login)/, { timeout: 10_000 });
  });
});
