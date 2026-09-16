import type { PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateUserData,
  UserRepository,
} from "../../../domain/user/user.repository.js";
import type { User } from "../../../domain/user/user.types.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data,
    });
  }
}
