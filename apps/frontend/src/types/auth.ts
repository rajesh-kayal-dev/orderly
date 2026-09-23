export type UserRole = 'customer' | 'restaurant' | 'delivery_partner' | 'admin' | 'customer_support';

export type AccountStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone_number?: string | null;
  status: AccountStatus;
  created_at?: string;
}

export interface UserAddress {
  id: string;
  street: string;
  city: string;
  state?: string;
  postal_code?: string;
  is_default?: boolean;
}

export interface CustomerProfile {
  id: string;
  addresses?: UserAddress[];
  Addresses?: UserAddress[];
}

export interface AuthResponse {
  token: string;
  accessToken: string;
  user: User;
  profile?: any;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  full_name: string;
  role?: UserRole;
  phone_number?: string;
}
