import type { UpdateProfileData, UserRepository } from "../../domain/user/user.repository.js";
import type { User } from "../../domain/user/user.types.js";
import { UserNotFoundError } from "./errors.js";

export const updateProfile =
  (users: UserRepository) =>
  async (userId: string, data: UpdateProfileData): Promise<User> => {
    const user = await users.updateProfile(userId, data);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  };