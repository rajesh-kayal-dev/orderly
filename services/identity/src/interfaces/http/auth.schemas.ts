import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(100),
});
