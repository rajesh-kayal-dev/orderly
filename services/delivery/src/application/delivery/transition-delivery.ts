import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import type { DeliveryEventPublisher } from "./delivery-event.publisher.js";
import {
  canTransitionDeliveryStatus,
  sourcesOfDeliveryTransition,
  type Delivery,
  type DeliveryStatus,
} from "../../domain/delivery/delivery.types.js";
import { DeliveryPartnerProfileNotFoundError } from "../delivery-partner/errors.js";
import {
  DeliveryNotAssignedToPartnerError,
  DeliveryNotFoundError,
  DeliveryStatusTransitionError,
} from "./errors.js";

export const makeDeliveryTransitioner =
  (
    deliveries: DeliveryRepository,
    partners: DeliveryPartnerRepository,
    target: DeliveryStatus,
    eventPublisher?: DeliveryEventPublisher | null,
  ) =>
  async (userId: string, id: string): Promise<Delivery> => {
    const profile = await partners.findProfileByUserId(userId);

    if (!profile) {
      throw new DeliveryPartnerProfileNotFoundError();
    }

    const delivery = await deliveries.findById(id);

    if (!delivery) {
      throw new DeliveryNotFoundError();
    }

    if (delivery.partnerId !== profile.id) {
      throw new DeliveryNotAssignedToPartnerError();
    }

    if (!canTransitionDeliveryStatus(delivery.status, target)) {
      throw new DeliveryStatusTransitionError(delivery.status, target);
    }

    const updated = await deliveries.transition(id, profile.id, {
      fromStatuses: sourcesOfDeliveryTransition(target),
      target,
    });

    if (!updated) {
      throw new DeliveryStatusTransitionError(delivery.status, target);
    }

    if (eventPublisher) {
      switch (target) {
        case "picked_up":
          await eventPublisher.publishDeliveryPickedUp(updated);
          break;
        case "in_transit":
          await eventPublisher.publishDeliveryInTransit(updated);
          break;
        case "delivered":
          await eventPublisher.publishDeliveryDelivered(updated);
          break;
        case "failed":
          await eventPublisher.publishDeliveryFailed(updated);
          break;
      }
    }

    return updated;
  };

export const pickupDelivery = (
  deliveries: DeliveryRepository,
  partners: DeliveryPartnerRepository,
  eventPublisher?: DeliveryEventPublisher | null,
) => makeDeliveryTransitioner(deliveries, partners, "picked_up", eventPublisher);

export const startTransitDelivery = (
  deliveries: DeliveryRepository,
  partners: DeliveryPartnerRepository,
  eventPublisher?: DeliveryEventPublisher | null,
) => makeDeliveryTransitioner(deliveries, partners, "in_transit", eventPublisher);

export const completeDelivery = (
  deliveries: DeliveryRepository,
  partners: DeliveryPartnerRepository,
  eventPublisher?: DeliveryEventPublisher | null,
) => makeDeliveryTransitioner(deliveries, partners, "delivered", eventPublisher);

export const failDelivery = (
  deliveries: DeliveryRepository,
  partners: DeliveryPartnerRepository,
  eventPublisher?: DeliveryEventPublisher | null,
) => makeDeliveryTransitioner(deliveries, partners, "failed", eventPublisher);