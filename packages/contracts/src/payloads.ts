import { EventTypes, type EventType } from "./event-types.js";

export interface OrderPlacedPayload {
  orderId: string;
  customerId: string;
  restaurantId: string;
  subtotal: string;
  deliveryFee: string;
  totalAmount: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface OrderAcceptedPayload {
  orderId: string;
  restaurantId: string;
  acceptedAt: string;
}

export interface OrderPreparingPayload {
  orderId: string;
}

export interface OrderReadyPayload {
  orderId: string;
}

export interface OrderAssignedPayload {
  orderId: string;
  deliveryId: string;
  partnerId: string;
}

export interface OrderPickedUpPayload {
  orderId: string;
  deliveryId: string;
}

export interface OrderDeliveredPayload {
  orderId: string;
  deliveryId: string;
  deliveredAt: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  cancelledAt: string;
}

export interface OrderRefundedPayload {
  orderId: string;
  refundAmount: string;
}

export interface PaymentCreatedPayload {
  paymentId: string;
  orderId: string;
  customerId: string;
  amount: string;
  currency: string;
  method: string;
}

export interface PaymentSucceededPayload {
  paymentId: string;
  orderId: string;
  amount: string;
  currency: string;
  provider: string | null;
  paidAt: string;
}

export interface PaymentFailedPayload {
  paymentId: string;
  orderId: string;
  amount: string;
  currency: string;
  failureReason: string | null;
}

export interface PaymentCancelledPayload {
  paymentId: string;
  orderId: string;
}

export interface PaymentRefundedPayload {
  paymentId: string;
  orderId: string;
  refundAmount: string;
}

export interface DeliveryCreatedPayload {
  deliveryId: string;
  orderId: string;
  createdAt: string;
}

export interface DeliveryAssignedPayload {
  deliveryId: string;
  orderId: string;
  partnerId: string;
  assignedAt: string;
}

export interface DeliveryPickedUpPayload {
  deliveryId: string;
  orderId: string;
  partnerId: string;
}

export interface DeliveryInTransitPayload {
  deliveryId: string;
  orderId: string;
}

export interface DeliveryDeliveredPayload {
  deliveryId: string;
  orderId: string;
  deliveredAt: string;
}

export interface DeliveryFailedPayload {
  deliveryId: string;
  orderId: string;
  failureReason: string | null;
}

export interface NotificationSentPayload {
  notificationId: string;
  userId: string;
  channel: string;
  recipient: string | null;
  sentAt: string;
}

export interface NotificationFailedPayload {
  notificationId: string;
  userId: string;
  channel: string;
  failureReason: string;
}

export interface EventPayloadMap {
  [EventTypes.OrderPlaced]: OrderPlacedPayload;
  [EventTypes.OrderAccepted]: OrderAcceptedPayload;
  [EventTypes.OrderPreparing]: OrderPreparingPayload;
  [EventTypes.OrderReady]: OrderReadyPayload;
  [EventTypes.OrderAssigned]: OrderAssignedPayload;
  [EventTypes.OrderPickedUp]: OrderPickedUpPayload;
  [EventTypes.OrderDelivered]: OrderDeliveredPayload;
  [EventTypes.OrderCancelled]: OrderCancelledPayload;
  [EventTypes.OrderRefunded]: OrderRefundedPayload;

  [EventTypes.PaymentCreated]: PaymentCreatedPayload;
  [EventTypes.PaymentSucceeded]: PaymentSucceededPayload;
  [EventTypes.PaymentFailed]: PaymentFailedPayload;
  [EventTypes.PaymentCancelled]: PaymentCancelledPayload;
  [EventTypes.PaymentRefunded]: PaymentRefundedPayload;

  [EventTypes.DeliveryCreated]: DeliveryCreatedPayload;
  [EventTypes.DeliveryAssigned]: DeliveryAssignedPayload;
  [EventTypes.DeliveryPickedUp]: DeliveryPickedUpPayload;
  [EventTypes.DeliveryInTransit]: DeliveryInTransitPayload;
  [EventTypes.DeliveryDelivered]: DeliveryDeliveredPayload;
  [EventTypes.DeliveryFailed]: DeliveryFailedPayload;

  [EventTypes.NotificationSent]: NotificationSentPayload;
  [EventTypes.NotificationFailed]: NotificationFailedPayload;
}

export type PayloadOf<K extends EventType> = EventPayloadMap[K];