export interface RestaurantOwnershipClient {
  getRestaurantByOwner(ownerId: string, accessToken: string): Promise<{ id: string } | null>;
}
