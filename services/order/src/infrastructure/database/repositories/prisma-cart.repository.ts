import type { Prisma, PrismaClient } from "../../../generated/prisma/client.js";
import type { CartRepository, CartItemWithOwner } from "../../../domain/order/cart.repository.js";
import type { Cart, CartItem } from "../../../domain/order/cart.types.js";

const safeCartSelect = {
  id: true,
  customerId: true,
  restaurantId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CartSelect;

const safeCartItemSelect = {
  id: true,
  cartId: true,
  menuItemId: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CartItemSelect;

export class PrismaCartRepository implements CartRepository {
  constructor(private readonly db: PrismaClient) {}

  async findCartByCustomer(customerId: string): Promise<Cart | null> {
    const cart = await this.db.cart.findUnique({
      where: { customerId },
      select: {
        ...safeCartSelect,
        items: {
          select: safeCartItemSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      return null;
    }

    return {
      id: cart.id,
      customerId: cart.customerId,
      restaurantId: cart.restaurantId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.items,
    };
  }

  async findCartById(cartId: string): Promise<Cart | null> {
    const cart = await this.db.cart.findUnique({
      where: { id: cartId },
      select: {
        ...safeCartSelect,
        items: {
          select: safeCartItemSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      return null;
    }

    return {
      id: cart.id,
      customerId: cart.customerId,
      restaurantId: cart.restaurantId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.items,
    };
  }

  async createCart(customerId: string, restaurantId: string | null): Promise<Cart> {
    const cart = await this.db.cart.create({
      data: { customerId, restaurantId },
      select: safeCartSelect,
    });

    return { ...cart, items: [] };
  }

  async updateCartRestaurant(cartId: string, restaurantId: string | null): Promise<void> {
    await this.db.cart.update({
      where: { id: cartId },
      data: { restaurantId },
    });
  }

  async findCartItem(cartId: string, menuItemId: string): Promise<CartItem | null> {
    return this.db.cartItem.findUnique({
      where: { cartId_menuItemId: { cartId, menuItemId } },
      select: safeCartItemSelect,
    });
  }

  async createCartItem(cartId: string, menuItemId: string, quantity: number): Promise<CartItem> {
    return this.db.cartItem.create({
      data: { cartId, menuItemId, quantity },
      select: safeCartItemSelect,
    });
  }

  async setCartItemQuantity(itemId: string, quantity: number): Promise<void> {
    await this.db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async deleteCartItem(itemId: string): Promise<void> {
    await this.db.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCartItems(cartId: string): Promise<void> {
    await this.db.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async findCartItemWithOwner(itemId: string): Promise<CartItemWithOwner | null> {
    const item = await this.db.cartItem.findUnique({
      where: { id: itemId },
      select: {
        ...safeCartItemSelect,
        cart: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      cartId: item.cartId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      cart: item.cart,
    };
  }
}