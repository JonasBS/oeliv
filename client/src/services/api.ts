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

// Revenue Management API
export const revenueApi = {
  // Competitor prices
  getCompetitorPrices: async (): Promise<any[]> => {
    const response = await apiClient.get('/revenue/competitors/prices');
    return response.data;
  },

  getCompetitorHistory: async (days: number = 30): Promise<any[]> => {
    const response = await apiClient.get(`/revenue/competitors/history?days=${days}`);
    return response.data;
  },

  scrapeCompetitors: async (competitors: any[]): Promise<any> => {
    const response = await apiClient.post('/revenue/competitors/scrape', { competitors });
    return response.data;
  },

  getCompetitorConfig: async (): Promise<any[]> => {
    const response = await apiClient.get('/revenue/competitors/config');
    return response.data;
  },

  addCompetitorConfig: async (config: any): Promise<any> => {
    const response = await apiClient.post('/revenue/competitors/config', config);
    return response.data;
  },

  updateCompetitorConfig: async (id: number, config: any): Promise<any> => {
    const response = await apiClient.patch(`/revenue/competitors/config/${id}`, config);
    return response.data;
  },

  deleteCompetitorConfig: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/revenue/competitors/config/${id}`);
    return response.data;
  },

  // Price recommendations
  getPriceRecommendations: async (days: number = 7): Promise<any> => {
    const response = await apiClient.get(`/revenue/pricing/recommendations?days=${days}`);
    return response.data;
  },

  getRoomRecommendation: async (roomId: number, date: string): Promise<any> => {
    const response = await apiClient.get(`/revenue/pricing/recommendations/${roomId}?date=${date}`);
    return response.data;
  },

  applyRecommendedPrice: async (roomId: number, targetDate: string, newPrice: number): Promise<any> => {
    const response = await apiClient.post('/revenue/pricing/apply', {
      room_id: roomId,
      target_date: targetDate,
      new_price: newPrice,
    });
    return response.data;
  },

  // Market insights
  getMarketInsights: async (days: number = 7): Promise<any[]> => {
    const response = await apiClient.get(`/revenue/market/insights?days=${days}`);
    return response.data;
  },

  // Pricing settings
  getPricingSettings: async (): Promise<any> => {
    const response = await apiClient.get('/revenue/pricing/settings');
    return response.data;
  },

  updatePricingSettings: async (settings: any): Promise<any> => {
    const response = await apiClient.patch('/revenue/pricing/settings', settings);
    return response.data;
  },
};

export default apiClient;

