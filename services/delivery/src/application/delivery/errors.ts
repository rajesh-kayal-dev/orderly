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