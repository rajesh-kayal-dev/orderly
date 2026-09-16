import type { PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateUserData,
  UserRepository,
} from "../../../domain/user/user.repository.js";
import type { User, UserCredentials } from "../../../domain/user/user.types.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data,
    });
  }
}
