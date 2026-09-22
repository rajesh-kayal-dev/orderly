import React from "react";
import Link from "next/link";
import { Receipt, Calendar, MapPin, ArrowRight } from "lucide-react";
import type { Order } from "../types/order.types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";

export interface OrderCardProps {
  order: Order;
}

export const OrderCard = ({ order }: OrderCardProps) => {
  const itemCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card hoverEffect className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>
        </div>

        <OrderStatusBadge status={order.status} />
      </CardHeader>

      <CardContent className="space-y-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{order.deliveryAddress}</span>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
          {order.items?.map((item) => `${item.quantity}x ${item.name || "Item"}`).join(", ") ||
            `${itemCount} items ordered`}
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase font-bold text-slate-400">Total Amount</div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
            {formatPrice(order.totalAmount)}
          </div>
        </div>

        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
};
