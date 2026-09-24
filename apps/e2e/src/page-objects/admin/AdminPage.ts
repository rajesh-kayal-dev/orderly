import { type Page, expect } from "@playwright/test";
import { ADMIN_USER } from "../../utils/test-users.js";

export class AdminPage {
  constructor(private page: Page) {}

  async login(email = ADMIN_USER.email, password = ADMIN_USER.password) {
    await this.page.goto("/admin/login");
    await this.page.waitForLoadState("domcontentloaded");

    // Use fill admin button if available, or direct textbox
    const fillBtn = this.page.getByRole("button", { name: /Fill Admin Credentials/i });
    if (await fillBtn.isVisible()) {
      await fillBtn.click();
    } else {
      await this.page.getByRole("textbox", { name: /admin@/i }).fill(email);
      await this.page.getByRole("textbox", { name: /••••/i }).fill(password);
    }

    await this.page.getByRole("button", { name: /Authenticate Admin Access/i }).click();
    await this.page.waitForURL("**/admin**", { timeout: 15_000 });
  }

  async gotoApprovals() {
    await this.page.goto("/admin/pending-approvals");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async approveFirstPendingRequest() {
    await this.gotoApprovals();
    const approveBtn = this.page.getByRole("button", { name: /^Approve$/i }).first();
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      // Confirm modal
      const modalConfirmBtn = this.page.locator(".ant-modal").getByRole("button", { name: /Approve/i });
      if (await modalConfirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await modalConfirmBtn.click();
      }
    }
  }

  async gotoOrders() {
    await this.page.goto("/admin/orders");
    await this.page.waitForLoadState("domcontentloaded");
  }
}
