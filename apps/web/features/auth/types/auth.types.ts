export type UserRole = "CUSTOMER" | "RESTAURANT_OWNER" | "DELIVERY_PARTNER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  role: UserRole;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginResult {
  accessToken: string;
  user: User;
}

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
