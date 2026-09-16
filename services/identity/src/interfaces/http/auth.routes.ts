import { Router, type Router as ExpressRouter } from "express";
import { ZodError } from "zod";
import {
  EmailAlreadyExistsError,
  RegisterUser,
} from "../../application/auth/register-user.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository.js";
import { registerUserSchema } from "./auth.schemas.js";

const router: ExpressRouter = Router();

const userRepository = new PrismaUserRepository(prisma);
const registerUser = new RegisterUser(userRepository);

router.post("/register", async (req, res) => {
  try {
    const input = registerUserSchema.parse(req.body);

    const user = await registerUser.execute(input);

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof EmailAlreadyExistsError) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export { router as authRouter };
