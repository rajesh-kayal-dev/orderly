import { type Page, expect } from "@playwright/test";
import type { TestUserData } from "../../utils/test-users.js";

export class CustomerAuthPage {
  constructor(private page: Page) {}

  async gotoLogin() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async gotoRegister() {
    await this.page.goto("/register");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async registerCustomer(user: TestUserData) {
    await this.gotoRegister();
    // Select Customer journey
    await this.page.getByRole("heading", { name: "Customer", exact: true }).click();

    // Fill form
    await this.page.getByRole("textbox", { name: "Full Name" }).fill(user.fullName);
    await this.page.getByRole("textbox", { name: "Phone Number" }).fill(user.phoneNumber);
    await this.page.getByRole("textbox", { name: "Email Address" }).fill(user.email);
    await this.page.getByRole("textbox", { name: "Password" }).fill(user.password);

    // Submit
    await this.page.getByRole("button", { name: /Create Account/i }).click();

    // Verify redirected to customer dashboard
    await this.page.waitForURL("**/customer", { timeout: 25_000 });
  }

  async login(email: string, password = "Password@123") {
    await this.gotoLogin();
    await this.page.getByRole("textbox", { name: "Email Address" }).fill(email);
    await this.page.getByRole("textbox", { name: "Password" }).fill(password);
    await this.page.getByRole("button", { name: /Sign In/i }).click();
    await this.page.waitForURL("**/customer", { timeout: 25_000 });
  }

  async logout() {
    // Open user menu
    const userBtn = this.page.locator("div.relative.hidden.sm\\:block > button, nav div.relative > button").first();
    await userBtn.waitFor({ state: "visible", timeout: 10_000 });
    await userBtn.click();
    // Click Logout button in dropdown
    const logoutBtn = this.page.getByRole("button", { name: "Logout" });
    await logoutBtn.waitFor({ state: "visible", timeout: 5_000 });
    await logoutBtn.click();
    await this.page.waitForURL((url) => url.pathname === "/" || url.pathname === "/login" || url.pathname === "/register", { timeout: 10_000 });
  }
}
