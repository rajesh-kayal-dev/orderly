import bcrypt from "bcryptjs";
import type { UserRepository } from "../../domain/user/user.repository.js";
import type { UserCredentials, UserRole } from "../../domain/user/user.types.js";

export interface LoginUserInput {
  email: string;
  password: string;
}

export type AccessTokenIssuer = (subject: string, role: UserRole) => string;

export type LoginUserResult = {
  accessToken: string;
  user: Omit<UserCredentials, "passwordHash">;
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class SuspendedAccountError extends Error {
  constructor() {
    super("Account is suspended");
    this.name = "SuspendedAccountError";
  }
}

export class PendingApprovalAccountError extends Error {
  constructor() {
    super("Account is pending admin approval");
    this.name = "PendingApprovalAccountError";
  }
}

export const loginUser =
  (users: UserRepository, issueAccessToken: AccessTokenIssuer) =>
  async (input: LoginUserInput): Promise<LoginUserResult> => {
    const email = input.email.trim().toLowerCase();

    const credentials = await users.findCredentialsByEmail(email);

    if (!credentials || !credentials.passwordHash) {
      throw new InvalidCredentialsError();
    }

    let passwordMatches = false;

    try {
      passwordMatches = await bcrypt.compare(input.password, credentials.passwordHash);
    } catch {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (credentials.status === "SUSPENDED") {
      throw new SuspendedAccountError();
    }

    if (credentials.status === "PENDING_APPROVAL") {
      throw new PendingApprovalAccountError();
    }

    const accessToken = issueAccessToken(credentials.id, credentials.role);

    const { passwordHash: _passwordHash, ...user } = credentials;

    return {
      accessToken,
      user,
    };
  };
