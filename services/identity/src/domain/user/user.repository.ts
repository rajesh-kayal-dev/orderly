import type { User } from "./user.types.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}
