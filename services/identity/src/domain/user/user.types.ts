export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  RESTAURANT: "RESTAURANT",
  DELIVERY_PARTNER: "DELIVERY_PARTNER",
  ADMIN: "ADMIN",
  CUSTOMER_SUPPORT: "CUSTOMER_SUPPORT",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ACCOUNT_STATUSES = {
  ACTIVE: "ACTIVE",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  SUSPENDED: "SUSPENDED",
} as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[keyof typeof ACCOUNT_STATUSES];

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  status: AccountStatus;
  statusChangedAt: Date | null;
  statusChangedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  status: AccountStatus;
  passwordHash: string | null;
}