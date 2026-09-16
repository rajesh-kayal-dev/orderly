import { Decimal } from "decimal.js";
import type {
  MenuCatalogClient,
  MenuCatalogItem,
  MenuCatalogRestaurant,
} from "../../domain/menu-catalog/menu-catalog.client.js";

interface RestaurantCatalogResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    isActive: boolean;
    isOpen: boolean;
  };
}

interface MenuCatalogResponse {
  success: boolean;
  data?: Array<{
    id: string;
    restaurantId: string;
    name: string;
    price: string | number;
    isAvailable: boolean;
  }>;
}

export class HttpMenuCatalogClient implements MenuCatalogClient {
  constructor(private readonly baseUrl: string) {}

  async getRestaurant(restaurantId: string): Promise<MenuCatalogRestaurant | null> {
    const response = await fetch(
      `${this.baseUrl}/restaurants/${encodeURIComponent(restaurantId)}`,
    );

    if (response.status === 404) {
      return null;
    }

    const body = (await response.json()) as RestaurantCatalogResponse;

    if (!response.ok || !body.success || !body.data) {
      throw new Error(`Restaurant catalog request failed with status ${response.status}`);
    }

    return {
      id: body.data.id,
      name: body.data.name,
      isActive: body.data.isActive,
      isOpen: body.data.isOpen,
    };
  }

  async listMenuItems(restaurantId: string): Promise<MenuCatalogItem[]> {
    const response = await fetch(
      `${this.baseUrl}/menu?restaurantId=${encodeURIComponent(restaurantId)}`,
    );

    if (!response.ok) {
      throw new Error(`Menu catalog request failed with status ${response.status}`);
    }

    const body = (await response.json()) as MenuCatalogResponse;

    if (!body.success || !Array.isArray(body.data)) {
      throw new Error("Menu catalog request returned an invalid payload");
    }

    return body.data.map((item) => ({
      id: item.id,
      restaurantId: item.restaurantId,
      name: item.name,
      price: new Decimal(item.price),
      isAvailable: item.isAvailable,
    }));
  }
}