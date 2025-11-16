import axios from 'axios';
import type { Room, AvailabilityItem, AvailableRoom, Booking } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const roomsApi = {
  getAll: async (): Promise<Room[]> => {
    const response = await apiClient.get<Room[]>('/rooms');
    return response.data;
  },
};

export const bookingsApi = {
  getAll: async (): Promise<any[]> => {
    const response = await apiClient.get('/bookings');
    return response.data;
  },

  create: async (booking: Booking): Promise<{ booking_id: number; total_price: number; status: string }> => {
    const response = await apiClient.post<{ booking_id: number; total_price: number; status: string }>(
      '/bookings',
      booking
    );
    return response.data;
  },

  getById: async (id: number): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  update: async (
    id: number,
    updates: { status?: string; payment_status?: string; payment_intent_id?: string }
  ): Promise<{ success: boolean; changes: number }> => {
    const response = await apiClient.patch<{ success: boolean; changes: number }>(`/bookings/${id}`, updates);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<{ success: boolean; changes: number }> => {
    const response = await apiClient.patch<{ success: boolean; changes: number }>(`/bookings/${id}`, { status });
    return response.data;
  },
};

export const availabilityApi = {
  getRange: async (startDate: string, endDate: string, roomId?: number): Promise<AvailabilityItem[]> => {
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
    };
    if (roomId) {
      params.room_id = roomId.toString();
    }
    const response = await apiClient.get<AvailabilityItem[]>('/availability', { params });
    return response.data;
  },

  checkAvailability: async (
    checkIn: string,
    checkOut: string,
    guests: number,
    roomId?: number
  ): Promise<{ available: AvailableRoom[] }> => {
    const response = await apiClient.post<{ available: AvailableRoom[] }>('/check-availability', {
      check_in: checkIn,
      check_out: checkOut,
      guests,
      room_id: roomId,
    });
    return response.data;
  },

  checkRange: async (roomId: number, startDate: string, endDate: string): Promise<any[]> => {
    const response = await apiClient.get('/availability', {
      params: {
        room_id: roomId,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },

  setAvailability: async (roomId: number, date: string, available: boolean): Promise<void> => {
    await apiClient.post('/availability', {
      room_id: roomId,
      date,
      available,
    });
  },
};

export default apiClient;

