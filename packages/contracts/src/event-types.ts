export const EventCategory = {
  Order: "order",
  Payment: "payment",
  Delivery: "delivery",
  Notification: "notification",
} as const;

export type EventCategoryName = (typeof EventCategory)[keyof typeof EventCategory];

export const EventTypes = {
  OrderPlaced: "order.placed",
  OrderAccepted: "order.accepted",
  OrderPreparing: "order.preparing",
  OrderReady: "order.ready",
  OrderAssigned: "order.assigned",
  OrderPickedUp: "order.picked_up",
  OrderDelivered: "order.delivered",
  OrderCancelled: "order.cancelled",
  OrderRefunded: "order.refunded",

  PaymentCreated: "payment.created",
  PaymentSucceeded: "payment.succeeded",
  PaymentFailed: "payment.failed",
  PaymentCancelled: "payment.cancelled",
  PaymentRefunded: "payment.refunded",

  DeliveryAssigned: "delivery.assigned",
  DeliveryPickedUp: "delivery.picked_up",
  DeliveryInTransit: "delivery.in_transit",
  DeliveryDelivered: "delivery.delivered",
  DeliveryFailed: "delivery.failed",

  NotificationSent: "notification.sent",
  NotificationFailed: "notification.failed",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export const EVENT_TYPES: readonly EventType[] = [
  EventTypes.OrderPlaced,
  EventTypes.OrderAccepted,
  EventTypes.OrderPreparing,
  EventTypes.OrderReady,
  EventTypes.OrderAssigned,
  EventTypes.OrderPickedUp,
  EventTypes.OrderDelivered,
  EventTypes.OrderCancelled,
  EventTypes.OrderRefunded,

  EventTypes.PaymentCreated,
  EventTypes.PaymentSucceeded,
  EventTypes.PaymentFailed,
  EventTypes.PaymentCancelled,
  EventTypes.PaymentRefunded,

  EventTypes.DeliveryAssigned,
  EventTypes.DeliveryPickedUp,
  EventTypes.DeliveryInTransit,
  EventTypes.DeliveryDelivered,
  EventTypes.DeliveryFailed,

  EventTypes.NotificationSent,
  EventTypes.NotificationFailed,
];

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}

export function categoryOf(event: EventType): EventCategoryName {
  const dot = event.indexOf(".");
  const prefix = dot === -1 ? event : event.slice(0, dot);
  const categories = Object.values(EventCategory) as readonly string[];
  if (!categories.includes(prefix)) {
    throw new Error(`Event type "${event}" has no known category prefix`);
  }
  return prefix as EventCategoryName;
}