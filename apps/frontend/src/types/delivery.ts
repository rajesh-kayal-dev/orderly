export interface DeliveryItem {
  id: string;
  orderId: string;
  order: any;
  status: string;
  deliveryAddress: string;
  estimatedMinutes?: number;
}

export interface DeliveryPartnerProfile {
  id: string;
  userId: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  is_available: boolean;
  rating: number;
  completed_trips: number;
  earnings_today: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
