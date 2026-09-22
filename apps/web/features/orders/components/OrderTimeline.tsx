import React from "react";
import { CheckCircle2, Clock, ChefHat, Bike, Home, XCircle } from "lucide-react";
import type { OrderStatus } from "../types/order.types";

export interface OrderTimelineProps {
  status: OrderStatus;
}

const steps: Array<{
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { status: "PENDING", label: "Order Placed", icon: Clock },
  { status: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { status: "PREPARING", label: "Cooking", icon: ChefHat },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Bike },
  { status: "DELIVERED", label: "Delivered", icon: Home },
];

const statusOrder: Record<OrderStatus, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  PREPARING: 3,
  READY_FOR_PICKUP: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

export const OrderTimeline = ({ status }: OrderTimelineProps) => {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
          <XCircle className="w-5 h-5" />
          <span>This order was cancelled</span>
        </div>
      </div>
    );
  }

  const currentStepNum = statusOrder[status] || 1;

  return (
    <div className="w-full py-6">
      <div className="relative flex items-center justify-between">
        {/* Connecting Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-amber-500 transition-all duration-500 -z-0"
          style={{
            width: `${((currentStepNum - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = currentStepNum > stepNum;
          const isCurrent = currentStepNum === stepNum;
          const IconComponent = step.icon;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  isCompleted
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isCurrent
                    ? "bg-slate-950 dark:bg-white text-amber-400 dark:text-slate-950 ring-4 ring-amber-500/30 scale-110"
                    : "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-400"
                }`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-semibold mt-2 text-center whitespace-nowrap ${
                  isCurrent
                    ? "text-slate-900 dark:text-white font-bold"
                    : isCompleted
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
