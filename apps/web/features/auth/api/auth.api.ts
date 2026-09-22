import { apiClient } from "@/lib/api/client";
import type {
  ChangePasswordInput,
  LoginInput,
  LoginResult,
  RegisterInput,
  UpdateProfileInput,
  User,
} from "../types/auth.types";

export const authApi = {
  login: async (input: LoginInput): Promise<LoginResult> => {
    return apiClient.post<LoginResult>("/auth/login", input);
  },

  register: async (input: RegisterInput): Promise<User> => {
    return apiClient.post<User>("/auth/register", input);
  },

  getMe: async (): Promise<User> => {
    return apiClient.get<User>("/auth/me");
  },

  updateProfile: async (input: UpdateProfileInput): Promise<User> => {
    return apiClient.put<User>("/auth/me", input);
  },

  changePassword: async (input: ChangePasswordInput): Promise<void> => {
    return apiClient.post<void>("/auth/change-password", input);
  },
};
