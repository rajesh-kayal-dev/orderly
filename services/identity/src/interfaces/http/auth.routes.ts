import { Router, type Router as ExpressRouter } from "express";
import { ZodError } from "zod";
import {
  EmailAlreadyExistsError,
  RegisterUser,
} from "../../application/auth/register-user.js";
import {
  InvalidCredentialsError,
  LoginUser,
  SuspendedAccountError,
} from "../../application/auth/login-user.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository.js";
import { getJwtService } from "../../infrastructure/security/jwt.js";
import { loginUserSchema, registerUserSchema } from "./auth.schemas.js";

const router: ExpressRouter = Router();

const userRepository = new PrismaUserRepository(prisma);
const registerUser = new RegisterUser(userRepository);
const loginUser = new LoginUser(userRepository, getJwtService().issueAccessToken);

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

router.post("/login", async (req, res) => {
  try {
    const input = loginUserSchema.parse(req.body);

    const result = await loginUser.execute(input);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof SuspendedAccountError) {
      return res.status(403).json({
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
