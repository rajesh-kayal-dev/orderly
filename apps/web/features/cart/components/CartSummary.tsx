"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, ShieldCheck, MapPin, FileText, AlertCircle } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { ordersApi } from "@/features/orders/api/orders.api";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";

export const CartSummary = () => {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, refreshCart } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      setError("Please provide a valid delivery address");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const order = await ordersApi.createOrder({
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim() || undefined,
      });

      // Clear/refresh cart state
      await refreshCart();

      // Redirect to order details
      router.push(`/orders/${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          Order Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCheckout} id="checkout-form" className="space-y-3">
          <Input
            label="Delivery Address"
            placeholder="House / Flat No., Street, Landmark, City"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
            required
          />

          <Input
            label="Special Instructions / Notes"
            placeholder="e.g. Please do not ring the bell"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            leftIcon={<FileText className="w-4 h-4" />}
          />
        </form>

        {/* Pricing Breakdown */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Items Subtotal</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatPrice(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Delivery Fee</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatPrice(deliveryFee)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Grand Total</span>
            <span className="text-amber-600 dark:text-amber-400 font-mono text-base">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          form="checkout-form"
          variant="primary"
          className="w-full mt-2"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Confirm & Place Order
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure checkout backed by Orderly Services</span>
        </div>
      </CardContent>
    </Card>
  );
};
