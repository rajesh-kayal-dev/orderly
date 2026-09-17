export class NotificationNotFoundError extends Error {
  constructor() {
    super("Notification not found");
    this.name = "NotificationNotFoundError";
  }
}

export class NotificationNotOwnedError extends Error {
  constructor() {
    super("Notification does not belong to this user");
    this.name = "NotificationNotOwnedError";
  }
}

export class NotificationAlreadySentError extends Error {
  constructor() {
    super("Notification has already been delivered");
    this.name = "NotificationAlreadySentError";
  }
}