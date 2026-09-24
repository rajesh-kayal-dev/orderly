import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer): SocketIOServer {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join personal user room or role room
    socket.on("join", (roomOrUserId: string) => {
      if (!roomOrUserId) return;
      const room = String(roomOrUserId);
      socket.join(room);
      socket.join(`user_${room}`);
      console.log(`[WebSocket] Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("join_deliveries", () => {
      socket.join("deliveries_pool");
      socket.join("role_delivery");
      console.log(`[WebSocket] Socket ${socket.id} joined deliveries pool`);
    });

    socket.on("join_restaurant", (restaurantId: string) => {
      if (!restaurantId) return;
      socket.join(`restaurant_${restaurantId}`);
      socket.join("role_restaurant");
      console.log(`[WebSocket] Socket ${socket.id} joined restaurant_${restaurantId}`);
    });

    socket.on("join_admin", () => {
      socket.join("role_admin");
      console.log(`[WebSocket] Socket ${socket.id} joined role_admin`);
    });

    // Driver location updates from GPS or driver device
    socket.on("DRIVER_LOCATION_UPDATED", (data: any) => {
      if (!data) return;
      // Broadcast to customer and admin
      if (data.customerId) {
        io.to(data.customerId).to(`user_${data.customerId}`).emit("DRIVER_LOCATION_UPDATED", data);
      }
      if (data.orderId) {
        io.to(`order_${data.orderId}`).emit("DRIVER_LOCATION_UPDATED", data);
      }
      io.emit("DRIVER_LOCATION_UPDATED", data);
    });

    // Driver status changes (online/offline)
    socket.on("DRIVER_STATUS_UPDATED", (data: any) => {
      if (!data) return;
      io.to("role_admin").to("deliveries_pool").emit("DRIVER_STATUS_UPDATED", data);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

// ==========================================
// REALTIME DOMAIN EVENT BROADCASTERS
// ==========================================

export function broadcastNewOrder(order: any) {
  if (!ioInstance) return;
  const payload = {
    orderId: order.id,
    order,
    restaurantId: order.restaurant_id,
    customerId: order.customer_id,
    total: order.total,
    status: order.status,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to restaurant
  ioInstance.to(order.restaurant_id).to(`restaurant_${order.restaurant_id}`).emit("NEW_ORDER", payload);
  // Broadcast to admin
  ioInstance.to("role_admin").emit("NEW_ORDER", payload);
  // Broadcast to customer
  if (order.customer_id) {
    ioInstance.to(order.customer_id).to(`user_${order.customer_id}`).emit("NEW_ORDER", payload);
  }
  // Global broadcast for active listeners
  ioInstance.emit("NEW_ORDER", payload);
  console.log(`[WebSocket] Broadcast NEW_ORDER for #${order.id}`);
}

export function broadcastOrderStatusUpdated(orderId: string, status: string, order?: any) {
  if (!ioInstance) return;
  const payload = {
    orderId,
    status,
    order,
    version: order?.version || Date.now(),
    timestamp: new Date().toISOString(),
  };

  ioInstance.emit("ORDER_STATUS_UPDATED", payload);

  // Also emit specialized events
  if (status === "ready" || status === "ready_for_pickup") {
    ioInstance.to("deliveries_pool").to("role_delivery").emit("AVAILABLE_DELIVERY", {
      orderId,
      order,
      status,
      timestamp: new Date().toISOString(),
    });
    ioInstance.to("deliveries_pool").to("role_delivery").emit("ORDER_READY_FOR_PICKUP", payload);
  } else if (status === "accepted" || status === "confirmed") {
    ioInstance.emit("ORDER_ACCEPTED", payload);
  } else if (status === "assigned") {
    ioInstance.emit("DRIVER_ASSIGNED", payload);
  }

  console.log(`[WebSocket] Broadcast ORDER_STATUS_UPDATED #${orderId} -> ${status}`);
}

export function broadcastAvailableDelivery(deliveryOffer: any) {
  if (!ioInstance) return;
  ioInstance.to("deliveries_pool").to("role_delivery").emit("AVAILABLE_DELIVERY", deliveryOffer);
  ioInstance.emit("AVAILABLE_DELIVERY", deliveryOffer);
  console.log(`[WebSocket] Broadcast AVAILABLE_DELIVERY for #${deliveryOffer.orderId || deliveryOffer.id}`);
}

export function broadcastNewFeedback(feedback: any) {
  if (!ioInstance) return;
  const payload = {
    feedbackId: feedback.id,
    orderId: feedback.order_id,
    restaurantId: feedback.restaurant_id,
    sentiment: feedback.sentiment,
    comment: feedback.comment,
    customerName: feedback.customer_name,
    itemsSummary: feedback.items_summary,
    createdAt: feedback.created_at,
    feedback,
  };
  ioInstance.to(feedback.restaurant_id).to(`restaurant_${feedback.restaurant_id}`).emit("NEW_FEEDBACK", payload);
  ioInstance.to("role_admin").emit("NEW_FEEDBACK", payload);
  ioInstance.emit("NEW_FEEDBACK", payload);
  console.log(`[WebSocket] Broadcast NEW_FEEDBACK for order #${feedback.order_id} sentiment: ${feedback.sentiment}`);
}

