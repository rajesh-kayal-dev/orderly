import { type Page, expect } from "@playwright/test";

export class CustomerOrderPage {
  constructor(public page: Page) {}

  async gotoRestaurants() {
    await this.page.goto("/customer/restaurants");
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for restaurant cards to load
    await this.page.locator("div.cursor-pointer").first().waitFor({ state: "visible", timeout: 10_000 });
  }

  async searchRestaurants(keyword: string) {
    const searchInput = this.page.getByRole("textbox", { name: /Search restaurants\.\.\./i });
    await searchInput.fill(keyword);
  }

  async clearFilters() {
    const clearBtn = this.page.getByRole("button", { name: /Clear all filters|Clear Filters/i }).first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
  }

  async selectFirstRestaurant() {
    await this.gotoRestaurants();
    const firstRestaurant = this.page.locator("div.cursor-pointer").first();
    await firstRestaurant.click();
    await this.page.waitForURL("**/customer/restaurant/**", { timeout: 10_000 });
  }

  async selectRestaurantByName(name: string) {
    await this.gotoRestaurants();
    const restCard = this.page.locator("div.cursor-pointer").filter({ hasText: name }).first();
    await restCard.waitFor({ state: "visible", timeout: 10_000 });
    await restCard.click();
    await this.page.waitForURL("**/customer/restaurant/**", { timeout: 10_000 });
  }

  async addFirstAvailableItemToCart() {
    const addButton = this.page.locator("button").filter({ hasText: /Add|Add to Cart|\+/i }).first();
    await addButton.waitFor({ state: "visible", timeout: 10_000 });
    await addButton.click();
  }

  async addMenuItemByName(itemName: string) {
    const itemCard = this.page.locator("div").filter({ hasText: itemName }).last();
    const addButton = itemCard.locator("button").filter({ hasText: /Add|plus/i }).first();
    await addButton.waitFor({ state: "visible", timeout: 10_000 });
    await addButton.click();
  }

  async incrementFirstItemQuantity() {
    const plusButton = this.page.getByRole("button", { name: "plus" }).first();
    await plusButton.waitFor({ state: "visible", timeout: 10_000 });
    await plusButton.click();
  }

  async gotoCart() {
    await this.page.goto("/customer/cart");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async removeCartItemByIndex(index = 0) {
    // Delete buttons in cart items
    const deleteButtons = this.page.locator("button").filter({ has: this.page.locator("img[alt='delete']") });
    // First delete button might be "Clear Cart" if it has img delete, let's target row delete
    const rowDeleteButtons = this.page.locator("div.cursor-pointer, div").locator("button").filter({ has: this.page.locator("img[alt='delete']") });
    const count = await rowDeleteButtons.count();
    if (count > index) {
      await rowDeleteButtons.nth(index).click();
    } else {
      await this.page.getByRole("button", { name: "delete" }).nth(index).click();
    }
  }

  async proceedToCheckout() {
    await this.gotoCart();
    const checkoutBtn = this.page.getByRole("button", { name: /Proceed to Checkout|Checkout/i });
    await checkoutBtn.waitFor({ state: "visible", timeout: 10_000 });
    await checkoutBtn.click();
    await this.page.waitForURL("**/customer/checkout", { timeout: 10_000 });
  }

  async placeOrderWithCOD(address = "Flat 101, Sunshine Heights, Food Street, Indore") {
    // Select Cash on Delivery (COD)
    const codOption = this.page.locator("div, button, label").filter({ hasText: /Cash on Delivery|COD/i }).first();
    if (await codOption.isVisible()) {
      await codOption.click();
    }

    // Click Place Order
    const placeOrderBtn = this.page.getByRole("button", { name: /Place Order|Confirm Order/i });
    await placeOrderBtn.waitFor({ state: "visible", timeout: 10_000 });
    await placeOrderBtn.click();

    // Wait for OrderSuccessModal
    await this.page.locator("text=Track Order").waitFor({ state: "visible", timeout: 15_000 });
  }

  async clickTrackOrderFromSuccessModal() {
    const trackOrderBtn = this.page.getByRole("button", { name: /Track Order/i });
    await trackOrderBtn.click();
    await this.page.waitForURL("**/customer/tracking**", { timeout: 10_000 });
  }
}
