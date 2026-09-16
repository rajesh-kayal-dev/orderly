import type { RestaurantOwnershipClient } from "../../domain/restaurant-ownership/restaurant-ownership.client.js";

interface RestaurantOwnershipResponse {
  success: boolean;
  data?: {
    id: string;
  };
}

export class HttpRestaurantOwnershipClient implements RestaurantOwnershipClient {
  constructor(private readonly baseUrl: string) {}

  async getRestaurantByOwner(ownerId: string, accessToken: string): Promise<{ id: string } | null> {
    const response = await fetch(`${this.baseUrl}/restaurants/my-profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    const body = (await response.json()) as RestaurantOwnershipResponse;

    if (!response.ok || !body.success || !body.data) {
      return null;
    }

    return { id: body.data.id };
  }
}
