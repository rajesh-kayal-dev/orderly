import { Router, type Router as ExpressRouter } from "express";
import { getCart } from "../../application/cart/get-cart.js";
import { addCartItem } from "../../application/cart/add-cart-item.js";
import { updateCartItemQuantity } from "../../application/cart/update-cart-item-quantity.js";
import { removeCartItem } from "../../application/cart/remove-cart-item.js";
import { clearCart } from "../../application/cart/clear-cart.js";
import type { CartRepository } from "../../domain/order/cart.repository.js";
import type { MenuCatalogClient } from "../../domain/menu-catalog/menu-catalog.client.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireActor, type AuthenticatedActorRequest } from "./middleware/auth.middleware.js";
import {
  addCartItemSchema,
  cartItemIdParamsSchema,
  updateCartItemQuantitySchema,
} from "./cart.schemas.js";

export interface CartRouterDeps {
  cartRepository: CartRepository;
  menuCatalogClient: MenuCatalogClient;
  tokenVerifier: TokenVerifier;
}

export const createCartRouter = ({
  cartRepository,
  menuCatalogClient,
  tokenVerifier,
}: CartRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const getCartUseCase = getCart(cartRepository);
  const addCartItemUseCase = addCartItem(cartRepository, menuCatalogClient);
  const updateCartItemQuantityUseCase = updateCartItemQuantity(cartRepository);
  const removeCartItemUseCase = removeCartItem(cartRepository);
  const clearCartUseCase = clearCart(cartRepository);
  const requireActorMiddleware = requireActor({ verifyAccessToken: tokenVerifier.verify });

  router.get("/", requireActorMiddleware, async (req, res) => {
    try {
      const actorReq = req as AuthenticatedActorRequest;
      const cart = await getCartUseCase({
        customerId: actorReq.userId,
        guestSessionId: actorReq.guestSessionId,
      });
      return void res.status(200).json({ success: true, data: cart });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/items", requireActorMiddleware, async (req, res) => {
    try {
      const input = addCartItemSchema.parse(req.body);
      const actorReq = req as AuthenticatedActorRequest;
      const cart = await addCartItemUseCase(
        {
          customerId: actorReq.userId,
          guestSessionId: actorReq.guestSessionId,
        },
        input
      );
      return void res.status(200).json({ success: true, data: cart });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/items/:itemId", requireActorMiddleware, async (req, res) => {
    try {
      const { itemId } = cartItemIdParamsSchema.parse(req.params);
      const { quantity } = updateCartItemQuantitySchema.parse(req.body);
      const actorReq = req as AuthenticatedActorRequest;
      const cart = await updateCartItemQuantityUseCase(
        {
          customerId: actorReq.userId,
          guestSessionId: actorReq.guestSessionId,
        },
        itemId,
        quantity
      );
      return void res.status(200).json({ success: true, data: cart });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.delete("/items/:itemId", requireActorMiddleware, async (req, res) => {
    try {
      const { itemId } = cartItemIdParamsSchema.parse(req.params);
      const actorReq = req as AuthenticatedActorRequest;
      const cart = await removeCartItemUseCase(
        {
          customerId: actorReq.userId,
          guestSessionId: actorReq.guestSessionId,
        },
        itemId
      );
      return void res.status(200).json({ success: true, data: cart });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.delete("/", requireActorMiddleware, async (req, res) => {
    try {
      const actorReq = req as AuthenticatedActorRequest;
      const cart = await clearCartUseCase({
        customerId: actorReq.userId,
        guestSessionId: actorReq.guestSessionId,
      });
      return void res.status(200).json({ success: true, data: cart });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  return router;
};
