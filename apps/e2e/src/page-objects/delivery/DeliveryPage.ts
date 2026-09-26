import { type Page, expect } from "@playwright/test";
import type { TestUserData } from "../../utils/test-users.js";

export class DeliveryPage {
  constructor(private page: Page) {}

  async registerDriver(user: TestUserData) {
    await this.page.goto("/register");
    await this.page.waitForLoadState("domcontentloaded");

    // Select Delivery Partner role card
    await this.page.getByRole("heading", { name: "Delivery Partner", exact: true }).click();

    // Fill form fields
    await this.page.locator("input[name='full_name']").fill(user.fullName);
    await this.page.locator("input[name='phone_number']").fill(user.phoneNumber);
    await this.page.locator("input[name='email']").fill(user.email);
    await this.page.locator("input[name='password']").fill(user.password);
    await this.page.locator("input[name='confirm_password']").fill(user.password);
    await this.page.locator("input[name='id_card']").fill(user.idCard || "DL-999999999");
    await this.page.locator("input[name='vehicle_license']").fill(user.vehicleLicense || "MP-09-AB-9999");

    // Submit
    await this.page.getByRole("button", { name: /Complete Registration/i }).click();

    // Verify confirmation message or redirect
    await this.page.waitForTimeout(2000);
  }

  async login(email: string, password = "Password@123") {
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.getByRole("textbox", { name: "Email Address" }).fill(email);
    await this.page.getByRole("textbox", { name: "Password" }).fill(password);
    await this.page.getByRole("button", { name: /Sign In/i }).click();
    await this.page.waitForURL("**/delivery**", { timeout: 15_000 });
  }

  async gotoOrders() {
    await this.page.goto("/delivery/orders");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async acceptDelivery() {
    const acceptBtn = this.page.getByRole("button", { name: /Accept Order/i }).first();
    await acceptBtn.waitFor({ state: "visible", timeout: 15_000 });
    await acceptBtn.click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  private async clearToasts() {
    try {
      const closeButtons = this.page.locator(".ant-notification-notice-close, .ant-notification-notice button[aria-label='Close']");
      const count = await closeButtons.count();
      for (let i = 0; i < count; i++) {
        await closeButtons.nth(i).click({ force: true }).catch(() => {});
      }
    } catch (_) {}
  }

  async arriveAtRestaurant() {
    await this.clearToasts();
    const arriveBtn = this.page.locator("button:has-text('Arrived at Restaurant')").first();
    await arriveBtn.waitFor({ state: "visible", timeout: 15_000 });
    await this.page.waitForTimeout(500);
    await arriveBtn.dispatchEvent("click");
    await this.page.locator("button:has-text('Mark as Picked Up')").first().waitFor({ state: "visible", timeout: 15_000 });
  }

  async pickupDelivery() {
    await this.clearToasts();
    const pickupBtn = this.page.locator("button:has-text('Mark as Picked Up')").first();
    await pickupBtn.waitFor({ state: "visible", timeout: 15_000 });
    await this.page.waitForTimeout(500);
    await pickupBtn.dispatchEvent("click");
    await this.page.locator("button:has-text('Start Delivery')").first().waitFor({ state: "visible", timeout: 15_000 });
  }

  async startDelivery() {
    await this.clearToasts();
    const startBtn = this.page.locator("button:has-text('Start Delivery')").first();
    await startBtn.waitFor({ state: "visible", timeout: 15_000 });
    await this.page.waitForTimeout(500);
    await startBtn.dispatchEvent("click");
    await this.page.locator("button:has-text('Mark as Delivered')").first().waitFor({ state: "visible", timeout: 15_000 });
  }

  async completeDelivery() {
    await this.clearToasts();
    const completeBtn = this.page.locator("button:has-text('Mark as Delivered')").first();
    await completeBtn.waitFor({ state: "visible", timeout: 15_000 });
    await this.page.waitForTimeout(500);
    await completeBtn.dispatchEvent("click");
    await this.page.waitForTimeout(1500);
  }

  async completeFullDeliveryLifecycle() {
    await this.arriveAtRestaurant();
    await this.pickupDelivery();
    await this.startDelivery();
    await this.completeDelivery();
  }
}
