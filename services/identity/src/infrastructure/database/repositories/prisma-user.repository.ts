import type {
  Prisma,
  PrismaClient,
} from "../../../generated/prisma/client.js";
import type {
  CreateUserData,
  ListUsersParams,
  ListUsersResult,
  UpdateProfileData,
  UserRepository,
} from "../../../domain/user/user.repository.js";
import type { AccountStatus, User, UserCredentials } from "../../../domain/user/user.types.js";

const safeUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phoneNumber: true,
  role: true,
  status: true,
  statusChangedAt: true,
  statusChangedBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const credentialsSelect = {
  ...safeUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
      select: safeUserSelect,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.db.user.findUnique({
      where: { email },
      select: credentialsSelect,
    });
  }

  async findCredentialsById(id: string): Promise<UserCredentials | null> {
    return this.db.user.findUnique({
      where: { id },
      select: credentialsSelect,
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data,
      select: safeUserSelect,
    });
  }

  async updateProfile(id: string, data: UpdateProfileData): Promise<User | null> {
    const existing = await this.db.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const existing = await this.db.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.user.update({
      where: { id },
      data: { passwordHash },
      select: safeUserSelect,
    });
  }

  async updateStatus(
    id: string,
    status: AccountStatus,
    actorId?: string,
  ): Promise<User | null> {
    const existing = await this.db.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.user.update({
      where: { id },
      data: {
        status,
        statusChangedAt: new Date(),
        statusChangedBy: actorId ?? null,
      },
      select: safeUserSelect,
    });
  }

  async listUsers(params: ListUsersParams): Promise<ListUsersResult> {
    const where: Prisma.UserWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    const [total, users] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.findMany({
        where,
        select: safeUserSelect,
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
      }),
    ]);

    return { users, total };
  }
}