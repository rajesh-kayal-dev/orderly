export class DeliveryPartnerProfileNotFoundError extends Error {
  constructor() {
    super("Delivery partner profile not found");
    this.name = "DeliveryPartnerProfileNotFoundError";
  }
}

export class DeliveryPartnerNotFoundError extends Error {
  constructor() {
    super("Delivery partner not found");
    this.name = "DeliveryPartnerNotFoundError";
  }
}