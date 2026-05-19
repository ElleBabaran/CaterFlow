import { getErrorMessage, createRetryableOperation } from './errors';
import { validateUid, validateObjectId, validatePayloadSize } from './validation';

const API_BASE = "/api/events";

async function authHeaders() {
  const { auth } = await import("../lib/firebase");
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res: Response, errorMessage: string) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: errorMessage }));
    throw new Error(error.error || errorMessage);
  }
  return res.json();
}

export const mongoService = {
  async fetchEvents(userId: string) {
    const validation = validateUid(userId);
    if (!validation.valid) throw new Error(validation.error);

    return createRetryableOperation(async () => {
      const extraHeaders = await authHeaders();
      const res = await fetch(`${API_BASE}/user/${userId}`, {
        headers: extraHeaders,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      return handleResponse(res, "Failed to fetch event history");
    });
  },

  async saveEvent(data: any) {
    const sizeValidation = validatePayloadSize(data);
    if (!sizeValidation.valid) throw new Error(sizeValidation.error);

    return createRetryableOperation(async () => {
      const extraHeaders = await authHeaders();
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...extraHeaders },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000),
      });
      return handleResponse(res, "Failed to save event");
    });
  },

  async updateEvent(id: string, data: any) {
    const idValidation = validateObjectId(id);
    if (!idValidation.valid) throw new Error(idValidation.error);

    const sizeValidation = validatePayloadSize(data);
    if (!sizeValidation.valid) throw new Error(sizeValidation.error);

    return createRetryableOperation(async () => {
      const extraHeaders = await authHeaders();
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...extraHeaders },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000),
      });
      return handleResponse(res, "Failed to update event");
    });
  },

  async deleteEvent(id: string) {
    const idValidation = validateObjectId(id);
    if (!idValidation.valid) throw new Error(idValidation.error);

    return createRetryableOperation(async () => {
      const extraHeaders = await authHeaders();
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: extraHeaders,
        signal: AbortSignal.timeout(10000),
      });
      return handleResponse(res, "Failed to delete event");
    });
  },

  async fetchUser(uid: string) {
    const validation = validateUid(uid);
    if (!validation.valid) throw new Error(validation.error);
    const res = await fetch(`/api/users/${uid}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user from MongoDB");
    return res.json();
  },

  async saveUser(data: any) {
    const extraHeaders = await authHeaders();
    const res = await fetch(`/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save user to MongoDB");
    return res.json();
  },

  async fetchShops() {
    const res = await fetch(`/api/shops`);
    if (!res.ok) throw new Error("Failed to fetch shops");
    return res.json();
  },

  async saveShop(data: any) {
    const extraHeaders = await authHeaders();
    const res = await fetch(`/api/shops`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save shop");
    return res.json();
  },

  async fetchChat(eventId: string) {
    const extraHeaders = await authHeaders();
    const res = await fetch(`/api/chats/${eventId}`, {
      headers: extraHeaders
    });
    if (!res.ok) throw new Error("Failed to fetch chat");
    return res.json();
  },

  async sendMessage(eventId: string, text: string) {
    const extraHeaders = await authHeaders();
    const res = await fetch(`/api/chats/${eventId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  async linkShop(pin: string, name: string, staffInfo: string) {
    const extraHeaders = await authHeaders();
    const res = await fetch(`/api/users/link-shop`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ pin, name, staffInfo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to link shop" }));
      throw new Error(err.error || "Failed to link shop");
    }
    return res.json();
  },

  async getShopByPin(pin: string) {
    const res = await fetch(`/api/shops/by-pin/${encodeURIComponent(pin)}`);
    if (!res.ok) throw new Error("Invalid PIN");
    return res.json();
  },

  async fetchShopById(shopId: string) {
    const res = await fetch(`/api/shops/${shopId}`);
    if (!res.ok) throw new Error("Failed to fetch shop");
    return res.json();
  }
};
