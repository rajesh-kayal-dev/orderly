import { Router, type Router as ExpressRouter } from "express";
import { ZodError } from "zod";
import {
  EmailAlreadyExistsError,
  RegisterUser,
} from "../../application/auth/register-user.js";
import {
  InvalidCredentialsError,
  LoginUser,
  PendingApprovalAccountError,
  SuspendedAccountError,
} from "../../application/auth/login-user.js";
import { changePassword } from "../../application/account/change-password.js";
import { getCurrentUser } from "../../application/account/get-current-user.js";
import { updateProfile } from "../../application/account/update-profile.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository.js";
import { getJwtService } from "../../infrastructure/security/jwt.js";
import { changePasswordSchema, loginUserSchema, registerUserSchema, updateProfileSchema } from "./auth.schemas.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";

const router: ExpressRouter = Router();

const userRepository = new PrismaUserRepository(prisma);
const registerUser = new RegisterUser(userRepository);
const loginUser = new LoginUser(userRepository, getJwtService().issueAccessToken);
const requireAuthMiddleware = requireAuth({
  verifyAccessToken: getJwtService().verifyAccessToken,
  findUserById: userRepository.findById.bind(userRepository),
});
const getCurrentUserUseCase = getCurrentUser(userRepository);
const updateProfileUseCase = updateProfile(userRepository);
const changePasswordUseCase = changePassword(userRepository);

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

    if (error instanceof SuspendedAccountError || error instanceof PendingApprovalAccountError) {
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

router.get("/me", requireAuthMiddleware, async (req, res) => {
  try {
    const user = await getCurrentUserUseCase((req as AuthenticatedRequest).user.id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return void mapErrorToResponse(res, error);
  }
});

router.put("/me", requireAuthMiddleware, async (req, res) => {
  try {
    const input = updateProfileSchema.parse(req.body);

    const user = await updateProfileUseCase((req as AuthenticatedRequest).user.id, input);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return void mapErrorToResponse(res, error);
  }
});

router.post("/change-password", requireAuthMiddleware, async (req, res) => {
  try {
    const input = changePasswordSchema.parse(req.body);

    await changePasswordUseCase((req as AuthenticatedRequest).user.id, input);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return void mapErrorToResponse(res, error);
  }
});

export { router as authRouter };