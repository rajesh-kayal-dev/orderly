"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Receipt, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { orders, isLoading, error, refetch } = useOrders();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return <LoadingState message="Checking authentication..." className="min-h-[50vh]" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Receipt className="w-8 h-8 text-amber-500" />
          My Orders
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your current orders, past deliveries, and track real-time delivery status
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading your order history..." className="min-h-[40vh]" />
      ) : error ? (
        <ErrorState
          title="Failed to load orders"
          message={error}
          onRetry={() => refetch()}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-amber-500" />}
          title="No orders yet"
          description="You haven't placed any orders yet. Once you order from a restaurant, you can track its lifecycle here."
          actionLabel="Explore Restaurants"
          onAction={() => router.push("/restaurants")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
