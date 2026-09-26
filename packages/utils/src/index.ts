export * from "./dev-defaults.js";
export {
  DEV_DEFAULT_PRIVATE_KEY,
  DEV_DEFAULT_PUBLIC_KEY,
  DEV_DEFAULT_DATABASE_URL,
} from "./dev-defaults.js";

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}