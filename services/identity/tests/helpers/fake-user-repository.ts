import type {
  CreateUserData,
  ListUsersParams,
  ListUsersResult,
  UpdateProfileData,
  UserRepository,
} from "../../src/domain/user/user.repository.js";
import type {
  AccountStatus,
  User,
  UserCredentials,
  UserRole,
} from "../../src/domain/user/user.types.js";

export interface FakeUserOptions {
  email?: string;
  fullName?: string;
  phoneNumber?: string | null;
  role?: UserRole;
  status?: AccountStatus;
  statusChangedAt?: Date | null;
  statusChangedBy?: string | null;
  passwordHash?: string | null;
}

export interface FakeUserRecord {
  user: User;
  passwordHash: string | null;
}

let sequence = 0;

export function makeUser(id: string, options: FakeUserOptions = {}): FakeUserRecord {
  const now = new Date();
  const baseId = id ?? `user-${++sequence}`;

  const user: User = {
    id: baseId,
    email: options.email ?? `${baseId}@example.com`,
    fullName: options.fullName ?? "Test User",
    phoneNumber: options.phoneNumber === undefined ? null : options.phoneNumber,
    role: options.role ?? "CUSTOMER",
    status: options.status ?? "ACTIVE",
    statusChangedAt: options.statusChangedAt === undefined ? null : options.statusChangedAt,
    statusChangedBy: options.statusChangedBy === undefined ? null : options.statusChangedBy,
    createdAt: now,
    updatedAt: now,
  };

  return { user, passwordHash: options.passwordHash ?? null };
}

export interface FakeUserRepositoryHandle {
  repo: UserRepository;
  store: (record: FakeUserRecord) => void;
  records: () => FakeUserRecord[];
}

export function createFakeUserRepository(
  initial: FakeUserRecord[] = [],
): FakeUserRepositoryHandle {
  const records: FakeUserRecord[] = [];

  const store = (record: FakeUserRecord): void => {
    const index = records.findIndex((entry) => entry.user.id === record.user.id);
    if (index === -1) {
      records.push(record);
    } else {
      records[index] = record;
    }
  };

  const byEmail = (email: string): FakeUserRecord | undefined => {
    const normalized = email.trim().toLowerCase();
    return records.find((entry) => entry.user.email.toLowerCase() === normalized);
  };

  const toCredentials = (record: FakeUserRecord): UserCredentials => ({
    ...record.user,
    passwordHash: record.passwordHash,
  });

  const repo: UserRepository = {
    async findByEmail(email) {
      return byEmail(email)?.user ?? null;
    },

    async findById(id) {
      return records.find((entry) => entry.user.id === id)?.user ?? null;
    },

    async findCredentialsByEmail(email) {
      const record = byEmail(email);
      return record ? toCredentials(record) : null;
    },

    async findCredentialsById(id) {
      const record = records.find((entry) => entry.user.id === id);
      return record ? toCredentials(record) : null;
    },

    async create(data: CreateUserData) {
      const record = makeUser(`user-${records.length + 1}`, {
        email: data.email,
        fullName: data.fullName,
        passwordHash: data.passwordHash,
      });
      store(record);
      return record.user;
    },

    async updateProfile(id: string, data: UpdateProfileData) {
      const index = records.findIndex((entry) => entry.user.id === id);
      if (index === -1) {
        return null;
      }
      const patch: Partial<User> = {};
      if (data.fullName !== undefined) {
        patch.fullName = data.fullName;
      }
      if (data.phoneNumber !== undefined) {
        patch.phoneNumber = data.phoneNumber;
      }
      const updated: User = { ...records[index].user, ...patch, updatedAt: new Date() };
      records[index] = { ...records[index], user: updated };
      return updated;
    },

    async updatePassword(id: string, passwordHash: string) {
      const index = records.findIndex((entry) => entry.user.id === id);
      if (index === -1) {
        return null;
      }
      const updated: User = { ...records[index].user, updatedAt: new Date() };
      records[index] = { user: updated, passwordHash };
      return updated;
    },

    async updateStatus(id: string, status: AccountStatus, actorId?: string) {
      const index = records.findIndex((entry) => entry.user.id === id);
      if (index === -1) {
        return null;
      }
      const updated: User = {
        ...records[index].user,
        status,
        statusChangedAt: new Date(),
        statusChangedBy: actorId ?? null,
        updatedAt: new Date(),
      };
      records[index] = { ...records[index], user: updated };
      return updated;
    },

    async listUsers(params: ListUsersParams): Promise<ListUsersResult> {
      let list = [...records]
        .map((entry) => entry.user)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (params.status) {
        list = list.filter((user) => user.status === params.status);
      }

      const limit = params.limit ?? 20;
      const offset = params.offset ?? 0;

      return {
        users: list.slice(offset, offset + limit),
        total: list.length,
      };
    },
  };

  initial.forEach(store);

  return { repo, store, records: () => records };
}