import type { DeliveryStatus } from "../../domain/delivery/delivery.types.js";

export class DeliveryNotFoundError extends Error {
  constructor() {
    super("Delivery not found");
    this.name = "DeliveryNotFoundError";
  }
}

export class DeliveryForOrderNotFoundError extends Error {
  constructor() {
    super("Delivery for order not found");
    this.name = "DeliveryForOrderNotFoundError";
  }
}

export class DeliveryForOrderAlreadyExistsError extends Error {
  constructor() {
    super("A delivery for this order already exists");
    this.name = "DeliveryForOrderAlreadyExistsError";
  }
}

export class DeliveryNotAvailableError extends Error {
  constructor() {
    super("Delivery is no longer available");
    this.name = "DeliveryNotAvailableError";
  }
}

export class DeliveryPartnerUnavailableError extends Error {
  constructor() {
    super("Delivery partner is currently unavailable");
    this.name = "DeliveryPartnerUnavailableError";
  }
}

export class DeliveryNotAssignedToPartnerError extends Error {
  constructor() {
    super("Delivery is not assigned to you");
    this.name = "DeliveryNotAssignedToPartnerError";
  }
}

export class DeliveryStatusTransitionError extends Error {
  constructor(current: DeliveryStatus, target: DeliveryStatus) {
    super(`Cannot change delivery status from ${current} to ${target}`);
    this.name = "DeliveryStatusTransitionError";
  }
}