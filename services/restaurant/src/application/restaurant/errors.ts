export class RestaurantNotFoundError extends Error {
  constructor() {
    super("Restaurant not found");
    this.name = "RestaurantNotFoundError";
  }
}

export class RestaurantProfileNotFoundError extends Error {
  constructor() {
    super("Restaurant profile not found");
    this.name = "RestaurantProfileNotFoundError";
  }
}

export class RestaurantAlreadyExistsError extends Error {
  constructor() {
    super("Restaurant profile already exists for this user");
    this.name = "RestaurantAlreadyExistsError";
  }
}

export class MenuItemNotFoundError extends Error {
  constructor() {
    super("Menu item not found");
    this.name = "MenuItemNotFoundError";
  }
}

export class MenuCategoryNotFoundError extends Error {
  constructor() {
    super("Category not found");
    this.name = "MenuCategoryNotFoundError";
  }
}