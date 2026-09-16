import type { UserRepository } from "../../domain/user/user.repository.js";
import { isPendingApproval } from "./account-rules.js";
import { InvalidStatusTransitionError, RejectionNotSupportedError, UserNotFoundError } from "./errors.js";

export const rejectUser =
  (users: UserRepository) =>
  async (userId: string): Promise<never> => {
    const user = await users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!isPendingApproval(user)) {
      throw new InvalidStatusTransitionError(user.status, "REJECTED");
    }

    throw new RejectionNotSupportedError();
  };