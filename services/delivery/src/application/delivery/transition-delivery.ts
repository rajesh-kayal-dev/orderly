import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
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
  (deliveries: DeliveryRepository, partners: DeliveryPartnerRepository, target: DeliveryStatus) =>
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

    return updated;
  };

export const pickupDelivery = (deliveries: DeliveryRepository, partners: DeliveryPartnerRepository) =>
  makeDeliveryTransitioner(deliveries, partners, "picked_up");

export const startTransitDelivery = (deliveries: DeliveryRepository, partners: DeliveryPartnerRepository) =>
  makeDeliveryTransitioner(deliveries, partners, "in_transit");

export const completeDelivery = (deliveries: DeliveryRepository, partners: DeliveryPartnerRepository) =>
  makeDeliveryTransitioner(deliveries, partners, "delivered");

export const failDelivery = (deliveries: DeliveryRepository, partners: DeliveryPartnerRepository) =>
  makeDeliveryTransitioner(deliveries, partners, "failed");