import type { User, UserCredentials } from "./user.types.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  create(data: CreateUserData): Promise<User>;
}
