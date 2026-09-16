import bcrypt from "bcryptjs";
import type { UserRepository } from "../../domain/user/user.repository.js";
import { PasswordMismatchError, UserNotFoundError } from "./errors.js";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const changePassword =
  (users: UserRepository) =>
  async (userId: string, input: ChangePasswordInput): Promise<void> => {
    const credentials = await users.findCredentialsById(userId);

    if (!credentials) {
      throw new UserNotFoundError();
    }

    if (!credentials.passwordHash) {
      throw new PasswordMismatchError();
    }

    const passwordMatches = await bcrypt.compare(input.currentPassword, credentials.passwordHash);

    if (!passwordMatches) {
      throw new PasswordMismatchError();
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    const updated = await users.updatePassword(userId, passwordHash);

    if (!updated) {
      throw new UserNotFoundError();
    }
  };