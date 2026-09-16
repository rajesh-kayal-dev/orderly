import type { UserRepository } from "../../domain/user/user.repository.js";
import type { AccountStatus, User } from "../../domain/user/user.types.js";
import { canTransition } from "./account-rules.js";
import {
  InvalidStatusTransitionError,
  SelfStatusChangeError,
  UserNotFoundError,
} from "./errors.js";

export const updateUserStatus =
  (users: UserRepository) =>
  async (
    userId: string,
    targetStatus: AccountStatus,
    actorId?: string,
  ): Promise<User> => {
    const user = await users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (actorId && actorId === userId) {
      throw new SelfStatusChangeError();
    }

    if (!canTransition(user.status, targetStatus)) {
      throw new InvalidStatusTransitionError(user.status, targetStatus);
    }

    const updated = await users.updateStatus(userId, targetStatus, actorId);

    if (!updated) {
      throw new UserNotFoundError();
    }

    return updated;
  };