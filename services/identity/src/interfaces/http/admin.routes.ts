import { Router, type Router as ExpressRouter } from "express";
import { approveUser } from "../../application/account/approve-user.js";
import { listPendingApprovals } from "../../application/account/list-pending-approvals.js";
import { listUsers } from "../../application/account/list-users.js";
import { rejectUser } from "../../application/account/reject-user.js";
import { updateUserStatus } from "../../application/account/update-user-status.js";
import { USER_ROLES } from "../../domain/user/user.types.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/prisma-user.repository.js";
import { getJwtService } from "../../infrastructure/security/jwt.js";
import { approvalParamsSchema, listUsersQuerySchema, statusBodySchema, statusParamsSchema } from "./admin.schemas.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "./middleware/auth.middleware.js";

const router: ExpressRouter = Router();

const userRepository = new PrismaUserRepository(prisma);
const requireAuthMiddleware = requireAuth({
  verifyAccessToken: getJwtService().verifyAccessToken,
  findUserById: userRepository.findById.bind(userRepository),
});
const requireAdmin = requireRole(USER_ROLES.ADMIN);

const listUsersUseCase = listUsers(userRepository);
const listPendingApprovalsUseCase = listPendingApprovals(userRepository);
const updateUserStatusUseCase = updateUserStatus(userRepository);
const approveUserUseCase = approveUser(userRepository);
const rejectUserUseCase = rejectUser(userRepository);

router.use(requireAuthMiddleware, requireAdmin);

router.get("/users", async (req, res) => {
  try {
    const query = listUsersQuerySchema.parse(req.query);

    const result = await listUsersUseCase(query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return void mapErrorToResponse(res, error);
  }
});

router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = statusParamsSchema.parse(req.params);
    const { status } = statusBodySchema.parse(req.body);
    const actorId = (req as AuthenticatedRequest).user.id;

    const user = await updateUserStatusUseCase(id, status, actorId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return void mapErrorToResponse(res, error);
  }
});

router.get("/approvals", async (req, res) => {
  try {
    const approvals = await listPendingApprovalsUseCase();

    return res.status(200).json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    return void mapErrorToResponse(res, error);
  }
});

router.post("/approvals/:id/approve", async (req, res) => {
  try {
    const { id } = approvalParamsSchema.parse(req.params);
    const actorId = (req as AuthenticatedRequest).user.id;

    const user = await approveUserUseCase(id, actorId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return void mapErrorToResponse(res, error);
  }
});

router.post("/approvals/:id/reject", async (req, res) => {
  try {
    const { id } = approvalParamsSchema.parse(req.params);

    await rejectUserUseCase(id);

    return res.status(501).json({
      success: false,
      message: "Rejection persistence is not implemented",
    });
  } catch (error) {
    return void mapErrorToResponse(res, error);
  }
});

export { router as adminRouter };