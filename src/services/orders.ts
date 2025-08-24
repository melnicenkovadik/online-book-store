import type { CreateOrderInput, CreateOrderResponse } from "@/types/services";
import { apiFetch } from "./http";

export const OrdersService = {
  async createOrder(payload: CreateOrderInput): Promise<CreateOrderResponse> {
    return apiFetch<CreateOrderResponse>({
      path: "/api/orders",
      method: "POST",
      body: payload,
    });
  },
};
