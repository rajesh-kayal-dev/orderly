import type { UserRepository } from "../../domain/user/user.repository.js";
import type { User } from "../../domain/user/user.types.js";
import { isPendingApproval } from "./account-rules.js";
import { InvalidStatusTransitionError, UserNotFoundError } from "./errors.js";

export const approveUser =
  (users: UserRepository) =>
  async (userId: string, actorId?: string): Promise<User> => {
    const user = await users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!isPendingApproval(user)) {
      throw new InvalidStatusTransitionError(user.status, "ACTIVE");
    }

    const updated = await users.updateStatus(userId, "ACTIVE", actorId);

    if (!updated) {
      throw new UserNotFoundError();
    }

    return updated;
  };