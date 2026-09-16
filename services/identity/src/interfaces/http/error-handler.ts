import type { Response } from "express";
import { ZodError } from "zod";

const ERROR_STATUS_BY_NAME: Record<string, number> = {
  UserNotFoundError: 404,
  InvalidStatusTransitionError: 409,
  SelfStatusChangeError: 409,
  PasswordMismatchError: 400,
  PendingApprovalAccountError: 403,
  SuspendedAccountError: 403,
  RejectionNotSupportedError: 501,
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