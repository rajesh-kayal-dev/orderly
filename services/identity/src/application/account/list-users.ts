import type { ListUsersParams, ListUsersResult, UserRepository } from "../../domain/user/user.repository.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const listUsers =
  (users: UserRepository) =>
  async (params: ListUsersParams = {}): Promise<ListUsersResult> => {
    const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Math.max(params.offset ?? 0, 0);

    return users.listUsers({
      ...params,
      limit,
      offset,
    });
  };