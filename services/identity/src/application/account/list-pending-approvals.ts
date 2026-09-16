import type { UserRepository } from "../../domain/user/user.repository.js";
import type { User } from "../../domain/user/user.types.js";
import { isApprovalRequiredRole } from "./account-rules.js";

export const listPendingApprovals =
  (users: UserRepository) =>
  async (): Promise<User[]> => {
    const { users: pending } = await users.listUsers({
      status: "PENDING_APPROVAL",
    });

    return pending.filter((user) => isApprovalRequiredRole(user.role));
  };