import type { UserRepository } from "../../domain/user/user.repository.js";
import type { User } from "../../domain/user/user.types.js";
import { UserNotFoundError } from "./errors.js";

export const getCurrentUser =
  (users: UserRepository) =>
  async (userId: string): Promise<User> => {
    const user = await users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  };