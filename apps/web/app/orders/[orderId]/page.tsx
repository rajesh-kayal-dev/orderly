"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Receipt, Calendar, AlertCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useOrderDetail } from "@/features/orders/hooks/useOrderDetail";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { order, isLoading, error, refetch, cancelOrder } = useOrderDetail(orderId);

  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderId}`);
    }
  }, [authLoading, isAuthenticated, orderId, router]);

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      setIsCancelling(true);
      setActionError(null);
      await cancelOrder();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingState message="Loading order tracking details..." className="min-h-[50vh]" />;
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <ErrorState
          title="Order not found"
          message={error || "Could not retrieve details for this order ID."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Back Link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Orders
      </Link>

      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <OrderStatusBadge status={order.status} size="md" />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Placed on {formatDate(order.createdAt)}</span>
          </div>
        </div>

        {order.status === "PENDING" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelOrder}
            isLoading={isCancelling}
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            leftIcon={<XCircle className="w-4 h-4" />}
          >
            Cancel Order
          </Button>
        )}
      </div>

      {actionError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Real-Time Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline status={order.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Items in this Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.quantity}x {item.name || `Item #${item.menuItemId.slice(0, 6)}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatPrice(item.unitPrice)} each
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900 dark:text-white font-mono">
                      {formatPrice(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total breakdown */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-base font-extrabold text-slate-900 dark:text-white">
                <span>Total Amount Paid</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono text-lg">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Details */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Destination Address
                </div>
                <div className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {order.deliveryAddress}
                </div>
              </div>

              {order.notes && (
                <div>
                  <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Special Notes
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 italic">
                    &quot;{order.notes}&quot;
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Managed via Orderly Gateway & Dispatch Services
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
