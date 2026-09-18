import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { RestaurantOwnershipClient } from "../../domain/restaurant-ownership/restaurant-ownership.client.js";
import type { Order, OrderStatus } from "../../domain/order/order.types.js";
import { canTransitionOrderStatus } from "../../domain/order/order.types.js";
import {
  OrderForbiddenError,
  OrderNotFoundError,
  OrderStatusTransitionError,
  RestaurantOwnershipError,
} from "./errors.js";
import type { OrderEventPublisher } from "./order-event.publisher.js";

export interface UpdateRestaurantOrderStatusDeps {
  restaurantOwnershipClient: RestaurantOwnershipClient;
  orderRepository: OrderRepository;
  eventPublisher: OrderEventPublisher;
}

const makeRestaurantStatusUpdater =
  (deps: UpdateRestaurantOrderStatusDeps, target: OrderStatus, cancelPayment: boolean) =>
  async (ownerId: string, accessToken: string, orderId: string): Promise<Order> => {
    const { restaurantOwnershipClient, orderRepository, eventPublisher } = deps;

    const restaurant = await restaurantOwnershipClient.getRestaurantByOwner(ownerId, accessToken);

    if (!restaurant) {
      throw new RestaurantOwnershipError();
    }

    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.restaurantId !== restaurant.id) {
      throw new OrderForbiddenError();
    }

    if (!canTransitionOrderStatus(order.status, target)) {
      throw new OrderStatusTransitionError(order.status, target);
    }

    const updated = await orderRepository.updateOrderStatus(orderId, target);

    if (!updated) {
      throw new OrderNotFoundError();
    }

    if (cancelPayment) {
      await orderRepository.updateOrderPaymentStatus(orderId, "cancelled");
    }

    const refreshed = await orderRepository.findOrderById(orderId);
    const result = refreshed ?? updated;
    await eventPublisher.publishOrderStatusChanged(result, order.status);
    return result;
  };

export const acceptOrder = (deps: UpdateRestaurantOrderStatusDeps) =>
  makeRestaurantStatusUpdater(deps, "accepted", false);

export const rejectOrder = (deps: UpdateRestaurantOrderStatusDeps) =>
  makeRestaurantStatusUpdater(deps, "cancelled", true);

export const startPreparing = (deps: UpdateRestaurantOrderStatusDeps) =>
  makeRestaurantStatusUpdater(deps, "preparing", false);

export const markReady = (deps: UpdateRestaurantOrderStatusDeps) =>
  makeRestaurantStatusUpdater(deps, "ready", false);
