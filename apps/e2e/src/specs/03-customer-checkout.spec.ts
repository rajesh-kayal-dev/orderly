import { test, expect } from "../fixtures/auth.fixture.js";
import { CustomerAuthPage } from "../page-objects/customer/CustomerAuthPage.js";
import { CustomerOrderPage } from "../page-objects/customer/CustomerOrderPage.js";
import { generateTestCustomer } from "../utils/test-users.js";

test.describe("Phase 4: Customer Cart → Checkout → Order Creation Workflow", () => {
  test("Complete customer checkout with COD, real backend order creation, and live tracking launch", async ({ customerPage }) => {
    const auth = new CustomerAuthPage(customerPage);
    const order = new CustomerOrderPage(customerPage);
    const testCustomer = generateTestCustomer();

    // 1. Authenticate with real customer account
    await auth.registerCustomer(testCustomer);
    await expect(customerPage).toHaveURL(/\/customer/);

    // 2. Select first restaurant and add an item
    await order.selectFirstRestaurant();
    await order.addFirstAvailableItemToCart();

    // 3. Go to cart and verify items and total
    await order.gotoCart();
    await expect(customerPage).toHaveURL(/\/customer\/cart/);
    await expect(customerPage.getByText(/Subtotal/i)).toBeVisible();
    await expect(customerPage.getByText(/Total/i).first()).toBeVisible();

    // 4. Proceed to checkout
    await order.proceedToCheckout();
    await expect(customerPage).toHaveURL(/\/customer\/checkout/);

    // 5. Verify checkout page elements
    await expect(customerPage.getByText(/Delivery Address/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Contact Details/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Order Summary/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Payment Method/i).first()).toBeVisible();

    // 6. Select Cash on Delivery (COD)
    const codOption = customerPage.getByText(/Cash on Delivery/i).first();
    await expect(codOption).toBeVisible({ timeout: 10_000 });
    await codOption.click();

    // 7. Place Order
    const placeOrderBtn = customerPage.getByRole("button", { name: /Place Order|COD/i });
    await expect(placeOrderBtn).toBeVisible({ timeout: 10_000 });
    await placeOrderBtn.click();

    // 8. Verify OrderSuccessModal opens with order confirmation
    await expect(customerPage.getByText(/Order Placed Successfully/i)).toBeVisible({ timeout: 15_000 });
    await expect(customerPage.getByText(/Estimated Delivery Time/i)).toBeVisible();

    // 9. Click Track Order and verify redirection to tracking page
    const trackOrderBtn = customerPage.getByRole("button", { name: /Track Order/i });
    await expect(trackOrderBtn).toBeVisible();
    await trackOrderBtn.click();

    // 10. Verify tracking page is active and reflects initial Order Placed status
    await customerPage.waitForURL("**/customer/tracking**", { timeout: 10_000 });
    await expect(customerPage.getByText(/Live Order Tracking|Your Order is Being Processed/i).first()).toBeVisible();
    await expect(customerPage.getByText(/Order Placed/i).first()).toBeVisible();
  });
});
