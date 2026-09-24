import { type Page, expect } from "@playwright/test";
import type { TestUserData } from "../../utils/test-users.js";

export class RestaurantPage {
  constructor(private page: Page) {}

  async registerRestaurant(user: TestUserData) {
    await this.page.goto("/register");
    await this.page.waitForLoadState("domcontentloaded");

    // Select Restaurant role card
    await this.page.getByRole("heading", { name: "Restaurant", exact: true }).click();

    // Fill form fields
    await this.page.getByRole("textbox", { name: "Owner Name" }).fill(user.fullName);
    await this.page.getByRole("textbox", { name: "Phone Number" }).fill(user.phoneNumber);
    await this.page.getByRole("textbox", { name: "Email Address" }).fill(user.email);
    await this.page.getByRole("textbox", { name: "Password", exact: true }).fill(user.password);
    await this.page.getByRole("textbox", { name: "Confirm Password" }).fill(user.password);
    await this.page.getByRole("textbox", { name: "Restaurant Name" }).fill(user.restaurantName || "Tasty Bites Hub");
    await this.page.getByRole("textbox", { name: "Business License No." }).fill(user.businessLicense || "BL-12345");
    await this.page.getByRole("textbox", { name: "Full Restaurant Address" }).fill(user.restaurantAddress || "100 Food Street");

    // Submit
    await this.page.getByRole("button", { name: /Complete Registration/i }).click();

    // Verify redirected to restaurant portal
    await this.page.waitForURL("**/restaurant**", { timeout: 15_000 });
  }

  async login(email: string, password = "Password@123") {
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.getByRole("textbox", { name: "Email Address" }).fill(email);
    await this.page.getByRole("textbox", { name: "Password" }).fill(password);
    await this.page.getByRole("button", { name: /Sign In/i }).click();
    await this.page.waitForURL("**/restaurant**", { timeout: 15_000 });
  }

  async gotoOrders() {
    await this.page.goto("/restaurant/orders");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async acceptOrder() {
    const acceptBtn = this.page.getByRole("button", { name: /^Accept$/i }).first();
    await acceptBtn.waitFor({ state: "visible", timeout: 15_000 });
    await acceptBtn.click({ force: true });
  }

  async startPreparing() {
    const prepBtn = this.page.getByRole("button", { name: /Start Preparing/i }).first();
    await prepBtn.waitFor({ state: "visible", timeout: 15_000 });
    await prepBtn.click({ force: true });
  }

  async markReady() {
    const readyBtn = this.page.getByRole("button", { name: /Mark Ready/i }).first();
    await readyBtn.waitFor({ state: "visible", timeout: 15_000 });
    await readyBtn.click({ force: true });
  }

  async switchToTab(tabName: string) {
    const tabBtn = this.page.getByRole("button", { name: new RegExp(tabName, "i") }).first();
    await tabBtn.waitFor({ state: "visible", timeout: 10_000 });
    await tabBtn.click({ force: true });
  }
}
