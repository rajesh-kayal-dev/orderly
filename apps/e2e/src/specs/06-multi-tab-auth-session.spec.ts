import { test, expect } from "../fixtures/auth.fixture.js";
import { CustomerAuthPage } from "../page-objects/customer/CustomerAuthPage.js";
import {
  generateTestCustomer,
  generateTestRestaurant,
  generateTestDriver,
  ADMIN_USER,
} from "../utils/test-users.js";

test.describe("Orderly Session Persistence, Multi-Tab Sync & Role-Aware Root Routing", () => {
  test("TEST A: Customer logs in -> new tab in same browser navigates to '/' -> routes to /customer", async ({
    customerContext,
  }) => {
    const tab1 = await customerContext.newPage();
    const auth = new CustomerAuthPage(tab1);
    const testCustomer = generateTestCustomer();

    // 1. Register/Login as Customer in Tab 1
    await auth.registerCustomer(testCustomer);
    await expect(tab1).toHaveURL(/\/customer/);

    // 2. Open Tab 2 in the SAME browser context and navigate to root '/'
    const tab2 = await customerContext.newPage();
    await tab2.goto("/");

    // 3. Tab 2 must recognize the authenticated Customer and resolve to /customer
    await expect(tab2).toHaveURL(/\/customer/, { timeout: 10_000 });

    // 4. Verify authenticated Customer state is rendered in Tab 2 (not Guest)
    await expect(tab2.locator("nav")).toContainText(testCustomer.fullName.split(" ")[0], { timeout: 10_000 });

    await tab1.close();
    await tab2.close();
  });

  test("TEST B: Restaurant owner logs in -> new tab in same browser navigates to '/' -> routes to /restaurant", async ({
    restaurantContext,
    restaurantPOM,
  }) => {
    const tab1 = await restaurantContext.newPage();
    const testRest = generateTestRestaurant();

    // Register/login as restaurant in Tab 1
    const pom1 = new (restaurantPOM.constructor as any)(tab1);
    await pom1.registerRestaurant(testRest);
    await expect(tab1).toHaveURL(/\/restaurant/);

    // Open Tab 2 in the SAME browser context and navigate to '/'
    const tab2 = await restaurantContext.newPage();
    await tab2.goto("/");

    // Should resolve to /restaurant
    await expect(tab2).toHaveURL(/\/restaurant/, { timeout: 10_000 });

    await tab1.close();
    await tab2.close();
  });

  test("TEST C: Delivery Partner logs in -> new tab navigates to '/' -> routes to /delivery", async ({
    driverContext,
    driverPOM,
  }) => {
    const tab1 = await driverContext.newPage();
    const testDriver = generateTestDriver();

    const pom1 = new (driverPOM.constructor as any)(tab1);
    await pom1.registerDriver(testDriver);
    await pom1.login(testDriver.email, testDriver.password);
    await expect(tab1).toHaveURL(/\/delivery/);

    const tab2 = await driverContext.newPage();
    await tab2.goto("/");

    await expect(tab2).toHaveURL(/\/delivery/, { timeout: 10_000 });

    await tab1.close();
    await tab2.close();
  });

  test("TEST D: Admin logs in -> new tab navigates to '/' -> routes to /admin", async ({
    adminContext,
    adminPOM,
  }) => {
    const tab1 = await adminContext.newPage();
    const pom1 = new (adminPOM.constructor as any)(tab1);
    await pom1.login(ADMIN_USER.email, ADMIN_USER.password);
    await expect(tab1).toHaveURL(/\/admin/);

    const tab2 = await adminContext.newPage();
    await tab2.goto("/");

    await expect(tab2).toHaveURL(/\/admin/, { timeout: 10_000 });

    await tab1.close();
    await tab2.close();
  });

  test("TEST E: Unauthenticated visitor navigates to '/' -> stays at public home '/' and visiting '/customer' redirects to '/'", async ({
    browser,
  }) => {
    const guestContext = await browser.newContext();
    const page = await guestContext.newPage();

    // 1. Unauthenticated visitor navigates to root '/'
    await page.goto("/");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?$/);

    // Verify page renders public navbar with Sign In / Register without redirecting to login or /customer
    await expect(page.locator("nav")).toContainText("Sign In", { timeout: 10_000 });

    // 2. Unauthenticated visitor visits '/customer' directly -> must redirect to '/'
    await page.goto("/customer");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?$/, { timeout: 10_000 });

    await guestContext.close();
  });

  test("TEST F: Multi-tab session synchronization across multiple tabs in same browser", async ({
    customerContext,
  }) => {
    const tabA = await customerContext.newPage();
    const auth = new CustomerAuthPage(tabA);
    const testCustomer = generateTestCustomer();

    await auth.registerCustomer(testCustomer);
    await expect(tabA).toHaveURL(/\/customer/);

    // Tab B navigates to /customer/restaurants
    const tabB = await customerContext.newPage();
    await tabB.goto("/customer/restaurants");
    await expect(tabB).toHaveURL(/\/customer\/restaurants/);
    await expect(tabB.locator("nav")).toContainText(testCustomer.fullName.split(" ")[0], { timeout: 15_000 });

    // Tab C navigates to root / -> redirects authenticated customer to /customer
    const tabC = await customerContext.newPage();
    await tabC.goto("/");
    await expect(tabC).toHaveURL(/\/customer/);
    await expect(tabC.locator("nav")).toContainText(testCustomer.fullName.split(" ")[0], { timeout: 15_000 });

    await tabA.close();
    await tabB.close();
    await tabC.close();
  });

  test("TEST G: Logout in Tab 1 clears session in Tab 2 and prevents stale auth access", async ({
    customerContext,
  }) => {
    const tab1 = await customerContext.newPage();
    const auth = new CustomerAuthPage(tab1);
    const testCustomer = generateTestCustomer();

    await auth.registerCustomer(testCustomer);
    await expect(tab1).toHaveURL(/\/customer/);

    const tab2 = await customerContext.newPage();
    await tab2.goto("/customer");
    await expect(tab2.locator("nav")).toContainText(testCustomer.fullName.split(" ")[0]);

    // Logout from Tab 1
    await auth.logout();
    await expect(tab1).toHaveURL(/^http:\/\/localhost:3000\/register\/?$/);

    // Check localStorage in context has cleared token
    const token = await tab2.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeNull();

    await tab1.close();
    await tab2.close();
  });

  test("TEST H: Multi-role isolated browser contexts operate concurrently without overwriting", async ({
    customerContext,
    restaurantContext,
    driverContext,
    adminContext,
    restaurantPOM,
    adminPOM,
  }) => {
    const customerPage = await customerContext.newPage();
    const restaurantPage = await restaurantContext.newPage();
    const adminPage = await adminContext.newPage();

    const auth = new CustomerAuthPage(customerPage);
    const testCustomer = generateTestCustomer();
    const testRest = generateTestRestaurant();

    // 1. Customer registers in customerContext
    await auth.registerCustomer(testCustomer);
    await expect(customerPage).toHaveURL(/\/customer/);

    // 2. Restaurant registers in restaurantContext
    const restPOM = new (restaurantPOM.constructor as any)(restaurantPage);
    await restPOM.registerRestaurant(testRest);
    await expect(restaurantPage).toHaveURL(/\/restaurant/);

    // 3. Admin logs in in adminContext
    const admPOM = new (adminPOM.constructor as any)(adminPage);
    await admPOM.login(ADMIN_USER.email, ADMIN_USER.password);
    await expect(adminPage).toHaveURL(/\/admin/);

    // 4. Verify each context maintains its distinct role
    await expect(customerPage).toHaveURL(/\/customer/);
    await expect(restaurantPage).toHaveURL(/\/restaurant/);
    await expect(adminPage).toHaveURL(/\/admin/);

    await customerPage.close();
    await restaurantPage.close();
    await adminPage.close();
  });
});
