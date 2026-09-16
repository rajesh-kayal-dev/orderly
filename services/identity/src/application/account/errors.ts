export class UserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(currentStatus: string, targetStatus: string) {
    super(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    this.name = "InvalidStatusTransitionError";
  }
}

export class SelfStatusChangeError extends Error {
  constructor() {
    super("Administrators cannot change their own account status");
    this.name = "SelfStatusChangeError";
  }
}

export class PasswordMismatchError extends Error {
  constructor() {
    super("Current password is incorrect");
    this.name = "PasswordMismatchError";
  }
}

export class RejectionNotSupportedError extends Error {
  constructor() {
    super(
      "Rejecting an approval requires a schema decision: the User model has no REJECTED state or soft-delete. Add an explicit rejected state or an approval-decision record before this endpoint can be implemented.",
    );
    this.name = "RejectionNotSupportedError";
  }
}