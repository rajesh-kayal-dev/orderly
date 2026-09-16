import type { AccountStatus, User, UserCredentials } from "./user.types.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string | null;
}

export interface ListUsersParams {
  status?: AccountStatus;
  limit?: number;
  offset?: number;
}

export interface ListUsersResult {
  users: User[];
  total: number;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  findCredentialsById(id: string): Promise<UserCredentials | null>;
  create(data: CreateUserData): Promise<User>;
  updateProfile(id: string, data: UpdateProfileData): Promise<User | null>;
  updatePassword(id: string, passwordHash: string): Promise<User | null>;
  updateStatus(id: string, status: AccountStatus, actorId?: string): Promise<User | null>;
  listUsers(params: ListUsersParams): Promise<ListUsersResult>;
}