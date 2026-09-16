import type { Response } from "express";
import { ZodError } from "zod";

const ERROR_STATUS_BY_NAME: Record<string, number> = {
  RestaurantNotFoundError: 404,
  RestaurantProfileNotFoundError: 404,
  RestaurantAlreadyExistsError: 409,
  MenuItemNotFoundError: 404,
  MenuCategoryNotFoundError: 404,
};

export function mapErrorToResponse(res: Response, error: unknown): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
    return;
  }

  if (error instanceof Error) {
    const status = ERROR_STATUS_BY_NAME[error.name];

    if (status) {
      res.status(status).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}