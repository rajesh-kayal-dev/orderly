export class PaymentNotFoundError extends Error {
  constructor() {
    super("Payment not found");
    this.name = "PaymentNotFoundError";
  }
}

export class PaymentForbiddenError extends Error {
  constructor() {
    super("Not authorized to access this payment");
    this.name = "PaymentForbiddenError";
  }
}

export class PaymentStateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentStateConflictError";
  }
}

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export class PaymentProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentProviderError";
  }
}

export class PaymentVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentVerificationError";
  }
}