export interface TestUserData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "customer" | "restaurant" | "delivery_partner" | "admin";
  restaurantName?: string;
  restaurantAddress?: string;
  businessLicense?: string;
  vehicleType?: string;
  vehicleLicense?: string;
  idCard?: string;
}

export function generateTestCustomer(suffix = Date.now()): TestUserData {
  return {
    fullName: `Customer Test ${suffix}`,
    email: `customer_${suffix}@e2e.orderly.com`,
    password: "Password@123",
    phoneNumber: "9876543210",
    role: "customer",
  };
}

export function generateTestRestaurant(suffix = Date.now()): TestUserData {
  return {
    fullName: `Chef Owner ${suffix}`,
    email: `restaurant_${suffix}@e2e.orderly.com`,
    password: "Password@123",
    phoneNumber: "9876543211",
    role: "restaurant",
    restaurantName: `E2E Bistro ${suffix}`,
    restaurantAddress: "42 Flavor Avenue, Test City",
    businessLicense: `LIC-${suffix}`,
  };
}

export function generateTestDriver(suffix = Date.now()): TestUserData {
  return {
    fullName: `Driver Express ${suffix}`,
    email: `driver_${suffix}@e2e.orderly.com`,
    password: "Password@123",
    phoneNumber: "9876543212",
    role: "delivery_partner",
    vehicleType: "Motorcycle",
    vehicleLicense: `DL-${suffix}`,
    idCard: `ID-${suffix}`,
  };
}

export const ADMIN_USER = {
  fullName: "System Admin",
  email: "admin@orderly.com",
  password: "password123",
  role: "admin" as const,
};
