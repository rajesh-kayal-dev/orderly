import { Router, type Router as ExpressRouter } from "express";
import { loginUser } from "../../application/auth/login-user.js";
import { registerUser } from "../../application/auth/register-user.js";
import { changePassword } from "../../application/account/change-password.js";
import { getCurrentUser } from "../../application/account/get-current-user.js";
import { updateProfile } from "../../application/account/update-profile.js";
import type { UserRepository } from "../../domain/user/user.repository.js";
import type { JwtService } from "../../infrastructure/security/jwt.js";
import type { GuestSessionRepository } from "../../domain/guest-session/guest-session.repository.js";
import { CreateGuestSessionUseCase } from "../../application/guest-session/create-guest-session.js";
import { VerifyGuestSessionUseCase } from "../../application/guest-session/verify-guest-session.js";
import { RevokeGuestSessionUseCase } from "../../application/guest-session/revoke-guest-session.js";
import { changePasswordSchema, loginUserSchema, registerUserSchema, updateProfileSchema } from "./auth.schemas.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";

export interface AuthRouterDeps {
  userRepository: UserRepository;
  jwtService: JwtService;
  guestSessionRepository?: GuestSessionRepository;
}

export const createAuthRouter = ({ userRepository, jwtService, guestSessionRepository }: AuthRouterDeps): ExpressRouter => {
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

  const createGuestSessionUseCase = guestSessionRepository ? new CreateGuestSessionUseCase(guestSessionRepository) : null;
  const verifyGuestSessionUseCase = guestSessionRepository ? new VerifyGuestSessionUseCase(guestSessionRepository) : null;
  const revokeGuestSessionUseCase = guestSessionRepository ? new RevokeGuestSessionUseCase(guestSessionRepository) : null;

  router.post("/register", async (req, res) => {
    try {
      const input = registerUserSchema.parse(req.body);

      const user = await registerUserUseCase(input);
      const accessToken = jwtService.issueAccessToken(user.id, user.role);

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
          ...user,
          token: accessToken,
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role.toLowerCase(),
            full_name: user.fullName,
            fullName: user.fullName,
            phone_number: user.phoneNumber,
            phoneNumber: user.phoneNumber,
            status: user.status,
            created_at: user.createdAt,
          },
          profile: { id: `cust-${user.id}` },
          role: user.role.toLowerCase(),
          full_name: user.fullName,
          email: user.email,
          id: user.id,
        },
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
        message: "Login successful",
        data: {
          token: result.accessToken,
          accessToken: result.accessToken,
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role.toLowerCase(),
            full_name: result.user.fullName,
            fullName: result.user.fullName,
            phone_number: result.user.phoneNumber,
            phoneNumber: result.user.phoneNumber,
            status: result.user.status,
          },
          profile: { id: `profile-${result.user.id}` },
          role: result.user.role.toLowerCase(),
          full_name: result.user.fullName,
          email: result.user.email,
          id: result.user.id,
        },
      });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  // ==========================================
  // GUEST SESSION ROUTES
  // ==========================================
  router.post("/guest-session", async (req, res) => {
    try {
      if (!createGuestSessionUseCase) {
        return res.status(500).json({ success: false, message: "Guest session repository not configured" });
      }

      const { ttlHours } = req.body || {};
      const result = await createGuestSessionUseCase.execute({ ttlHours: Number(ttlHours) || 24 });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/guest-session/verify", async (req, res) => {
    try {
      if (!verifyGuestSessionUseCase) {
        return res.status(500).json({ success: false, message: "Guest session repository not configured" });
      }

      const token = req.body?.token || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : "");
      const session = await verifyGuestSessionUseCase.execute(token);

      if (!session) {
        return res.status(401).json({ success: false, message: "Invalid, expired, or revoked guest session" });
      }

      return res.status(200).json({
        success: true,
        data: {
          guestSessionId: session.id,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/guest-session/revoke", async (req, res) => {
    try {
      if (!revokeGuestSessionUseCase || !verifyGuestSessionUseCase) {
        return res.status(500).json({ success: false, message: "Guest session repository not configured" });
      }

      const token = req.body?.token || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : "");
      const session = await verifyGuestSessionUseCase.execute(token);

      if (session) {
        await revokeGuestSessionUseCase.execute(session.id);
      }

      return res.status(200).json({
        success: true,
        message: "Guest session revoked",
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
