import type { AccountStatus, User, UserRole } from "../../domain/user/user.types.js";

export const APPROVAL_REQUIRED_ROLES: readonly UserRole[] = [
  "RESTAURANT",
  "DELIVERY_PARTNER",
];

export const ALLOWED_STATUS_TRANSITIONS: Record<AccountStatus, readonly AccountStatus[]> = {
  ACTIVE: ["SUSPENDED"],
  SUSPENDED: ["ACTIVE"],
  PENDING_APPROVAL: [],
};

export function isApprovalRequiredRole(role: UserRole): boolean {
  return APPROVAL_REQUIRED_ROLES.includes(role);
}

export function isPendingApproval(user: Pick<User, "role" | "status">): boolean {
  return isApprovalRequiredRole(user.role) && user.status === "PENDING_APPROVAL";
}

export function canTransition(
  currentStatus: AccountStatus,
  targetStatus: AccountStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
}