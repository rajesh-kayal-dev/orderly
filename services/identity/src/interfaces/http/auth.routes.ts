import { Router, type Router as ExpressRouter } from "express";
import { loginUser } from "../../application/auth/login-user.js";
import { registerUser } from "../../application/auth/register-user.js";
import { changePassword } from "../../application/account/change-password.js";
import { getCurrentUser } from "../../application/account/get-current-user.js";
import { updateProfile } from "../../application/account/update-profile.js";
import type { UserRepository } from "../../domain/user/user.repository.js";
import type { JwtService } from "../../infrastructure/security/jwt.js";
import { changePasswordSchema, loginUserSchema, registerUserSchema, updateProfileSchema } from "./auth.schemas.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";

export interface AuthRouterDeps {
  userRepository: UserRepository;
  jwtService: JwtService;
}

export const createAuthRouter = ({ userRepository, jwtService }: AuthRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const registerUserUseCase = registerUser(userRepository);
  const loginUserUseCase = loginUser(userRepository, jwtService.issueAccessToken);
  const requireAuthMiddleware = requireAuth({
    verifyAccessToken: jwtService.verifyAccessToken,
    findUserById: userRepository.findById.bind(userRepository),
  });
  const getCurrentUserUseCase = getCurrentUser(userRepository);
  const updateProfileUseCase = updateProfile(userRepository);
  const changePasswordUseCase = changePassword(userRepository);

  router.post("/register", async (req, res) => {
    try {
      const input = registerUserSchema.parse(req.body);

      const user = await registerUserUseCase(input);

      return res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const input = loginUserSchema.parse(req.body);

      const result = await loginUserUseCase(input);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return void mapErrorToResponse(res, error);
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

  return router;
};