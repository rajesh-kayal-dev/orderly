import { formatCurrency as orderlyFormatCurrency } from "@orderly/utils";

export const formatPrice = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";
  try {
    return orderlyFormatCurrency(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
};

export const formatDate = (dateString?: string | Date | null): string => {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};
