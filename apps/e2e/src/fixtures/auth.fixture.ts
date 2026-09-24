import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { CustomerAuthPage } from "../page-objects/customer/CustomerAuthPage.js";
import { CustomerOrderPage } from "../page-objects/customer/CustomerOrderPage.js";
import { RestaurantPage } from "../page-objects/restaurant/RestaurantPage.js";
import { DeliveryPage } from "../page-objects/delivery/DeliveryPage.js";
import { AdminPage } from "../page-objects/admin/AdminPage.js";
import {
  generateTestCustomer,
  generateTestRestaurant,
  generateTestDriver,
  ADMIN_USER,
} from "../utils/test-users.js";

type MultiRoleFixtures = {
  customerContext: BrowserContext;
  restaurantContext: BrowserContext;
  driverContext: BrowserContext;
  adminContext: BrowserContext;

  customerPage: Page;
  restaurantPage: Page;
  driverPage: Page;
  adminPage: Page;

  customerPOM: CustomerOrderPage;
  restaurantPOM: RestaurantPage;
  driverPOM: DeliveryPage;
  adminPOM: AdminPage;
};

export const test = base.extend<MultiRoleFixtures>({
  customerContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  restaurantContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  driverContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  customerPage: async ({ customerContext }, use) => {
    const page = await customerContext.newPage();
    await use(page);
  },

  restaurantPage: async ({ restaurantContext }, use) => {
    const page = await restaurantContext.newPage();
    await use(page);
  },

  driverPage: async ({ driverContext }, use) => {
    const page = await driverContext.newPage();
    await use(page);
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
  },

  customerPOM: async ({ customerPage }, use) => {
    await use(new CustomerOrderPage(customerPage));
  },

  restaurantPOM: async ({ restaurantPage }, use) => {
    await use(new RestaurantPage(restaurantPage));
  },

  driverPOM: async ({ driverPage }, use) => {
    await use(new DeliveryPage(driverPage));
  },

  adminPOM: async ({ adminPage }, use) => {
    await use(new AdminPage(adminPage));
  },
});

export { expect } from "@playwright/test";
