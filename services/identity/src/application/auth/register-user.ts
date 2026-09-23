import bcrypt from "bcryptjs";
import type { UserRepository } from "../../domain/user/user.repository.js";
import type { UserRole } from "../../domain/user/user.types.js";

export interface RegisterUserInput {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string | null;
  role?: UserRole;
}

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("Email is already registered");
    this.name = "EmailAlreadyExistsError";
  }
}

export const registerUser =
  (users: UserRepository) =>
  async (input: RegisterUserInput) => {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();

    const existingUser = await users.findByEmail(email);

    if (existingUser) {
      throw new EmailAlreadyExistsError();
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await users.create({
      email,
      passwordHash,
      fullName,
      phoneNumber: input.phoneNumber || null,
      role: input.role,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  };
