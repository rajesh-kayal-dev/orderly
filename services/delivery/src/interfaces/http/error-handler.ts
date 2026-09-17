import type { Response } from "express";
import { ZodError } from "zod";

const ERROR_STATUS_BY_NAME: Record<string, number> = {
  DeliveryPartnerNotFoundError: 404,
  DeliveryPartnerProfileNotFoundError: 404,
  DeliveryNotFoundError: 404,
  DeliveryForOrderNotFoundError: 404,
  DeliveryForOrderAlreadyExistsError: 409,
  DeliveryNotAvailableError: 409,
  DeliveryPartnerUnavailableError: 409,
  DeliveryStatusTransitionError: 409,
  DeliveryNotAssignedToPartnerError: 403,
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