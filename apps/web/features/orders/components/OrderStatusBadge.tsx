import React from "react";
import type { OrderStatus } from "../types/order.types";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  PREPARING: { label: "Preparing Food", variant: "amber" },
  READY_FOR_PICKUP: { label: "Ready for Pickup", variant: "info" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export const OrderStatusBadge = ({ status, size = "md" }: OrderStatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, variant: "default" };

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};
