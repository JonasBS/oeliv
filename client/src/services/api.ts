import axios from 'axios';
import type {
  Room,
  RoomImage,
  RoomUnit,
  AvailabilityItem,
  AvailableRoom,
  Booking,
  ChannelConfig,
  ChannelRule,
  ChannelAutomationSummary,
  CrmGuest,
  CrmGuestDetail,
  GuestInteraction,
  CrmCampaign,
  CrmFeedbackEntry,
  CrmFeedbackSummary,
  FeedbackFormData,
  FeedbackSubmitPayload,
} from '../types';

type NotificationChannelResult = {
  enabled?: boolean;
  sent?: boolean;
  error?: string;
};

type BookingStatusResponse = {
  success: boolean;
  changes: number;
  notifications?: {
    email?: NotificationChannelResult;
    sms?: NotificationChannelResult;
    error?: string;
  } | null;
};

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

  update: async (id: number, roomData: Partial<Room>): Promise<{ success: boolean; changes: number }> => {
    const response = await apiClient.patch<{ success: boolean; changes: number }>(`/rooms/${id}`, roomData);
    return response.data;
  },
};

export const roomUnitsApi = {
  list: async (roomId: number): Promise<RoomUnit[]> => {
    const response = await apiClient.get<RoomUnit[]>(`/rooms/${roomId}/units`);
    return response.data;
  },
  create: async (
    roomId: number,
    payload: { label: string; ttlock_lock_id?: string | null; active?: boolean }
  ): Promise<RoomUnit> => {
    const response = await apiClient.post<RoomUnit>(`/rooms/${roomId}/units`, payload);
    return response.data;
  },
  update: async (
    unitId: number,
    payload: { label?: string; ttlock_lock_id?: string | null; active?: boolean }
  ): Promise<RoomUnit> => {
    const response = await apiClient.patch<RoomUnit>(`/rooms/units/${unitId}`, payload);
    return response.data;
  },
  delete: async (unitId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(`/rooms/units/${unitId}`);
    return response.data;
  },
};

// Room Images API
const getRoomImagesBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
    return (window as any).API_BASE_URL;
  }
  return '';
};

export const roomImagesApi = {
  // Get all images for a room
  getImages: async (roomId: number): Promise<RoomImage[]> => {
    const response = await fetch(`${getRoomImagesBaseUrl()}/api/room-images/${roomId}`);
    if (!response.ok) throw new Error('Failed to get room images');
    return response.json();
  },

  // Add image to room
  addImage: async (roomId: number, imageData: { image_url: string; caption?: string; is_primary?: boolean }) => {
    const response = await fetch(`${getRoomImagesBaseUrl()}/api/room-images/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imageData),
    });
    if (!response.ok) throw new Error('Failed to add image');
    return response.json();
  },

  // Update image
  updateImage: async (imageId: number, updates: { caption?: string; is_primary?: boolean; display_order?: number }) => {
    const response = await fetch(`${getRoomImagesBaseUrl()}/api/room-images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update image');
    return response.json();
  },

  // Delete image
  deleteImage: async (imageId: number) => {
    const response = await fetch(`${getRoomImagesBaseUrl()}/api/room-images/${imageId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete image');
    return response.json();
  },
};

export const bookingsApi = {
  getAll: async (): Promise<any[]> => {
    const response = await apiClient.get('/bookings');
    return response.data;
  },

  getRange: async (startDate: string, endDate: string): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>('/bookings/range/calendar', {
      params: { start_date: startDate, end_date: endDate },
    });
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
  ): Promise<BookingStatusResponse> => {
    const response = await apiClient.patch<BookingStatusResponse>(`/bookings/${id}`, updates);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<BookingStatusResponse> => {
    const response = await apiClient.patch<BookingStatusResponse>(`/bookings/${id}`, { status });
    return response.data;
  },
};

type SetAvailabilityOptions = {
  openUnits?: number | null;
  price?: number | null;
  minStay?: number;
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

  setAvailability: async (roomId: number, date: string, options: SetAvailabilityOptions = {}): Promise<void> => {
    const startDate = date;
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const payload: Record<string, any> = {
      room_id: roomId,
      start_date: startDate,
      end_date: endDate.toISOString().split('T')[0],
      min_stay: options.minStay ?? 1,
    };

    if (options.price !== undefined) {
      payload.price = options.price;
    }

    if (options.openUnits !== undefined) {
      payload.open_units = options.openUnits;
      payload.available = options.openUnits === null
        ? 1
        : options.openUnits > 0
          ? 1
          : 0;
    }

    await apiClient.post('/admin/availability', {
      ...payload,
    });
  },

  setPrice: async (roomId: number, date: string, price: number | null): Promise<void> => {
    await apiClient.post('/admin/availability/price', {
      room_id: roomId,
      date,
      price,
    });
  },
};

// Revenue Management API
// Room Prices API
const getRoomPricesBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
    return (window as any).API_BASE_URL;
  }
  return '';
};

export const roomPricesApi = {
  // Get price for specific date
  getPrice: async (roomId: number, date: string) => {
    const response = await fetch(`${getRoomPricesBaseUrl()}/api/room-prices/${roomId}/${date}`);
    if (!response.ok) throw new Error('Failed to get room price');
    return response.json();
  },

  // Get all prices for a room
  getRoomPrices: async (roomId: number, startDate?: string, endDate?: string) => {
    let url = `${getRoomPricesBaseUrl()}/api/room-prices/${roomId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get room prices');
    return response.json();
  },

  // Set price for specific date
  setPrice: async (roomId: number, date: string, price: number) => {
    const response = await fetch(`${getRoomPricesBaseUrl()}/api/room-prices/${roomId}/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price }),
    });
    if (!response.ok) throw new Error('Failed to set room price');
    return response.json();
  },

  // Bulk set prices
  bulkSetPrices: async (prices: Array<{ roomId: number; date: string; price: number }>) => {
    const response = await fetch(`${getRoomPricesBaseUrl()}/api/room-prices/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prices }),
    });
    if (!response.ok) throw new Error('Failed to bulk set prices');
    return response.json();
  },

  // Delete price for specific date (revert to base price)
  deletePrice: async (roomId: number, date: string) => {
    const response = await fetch(`${getRoomPricesBaseUrl()}/api/room-prices/${roomId}/${date}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete room price');
    return response.json();
  },
};

export const revenueApi = {
  // Competitor prices
  getCompetitorPrices: async (): Promise<any[]> => {
    const response = await apiClient.get('/revenue/competitors/prices');
    return response.data;
  },
  
  // Competitor prices with search dates (for calendar view)
  getCompetitorPricesWithDates: async (): Promise<any[]> => {
    const response = await apiClient.get('/revenue/competitors/prices-with-dates');
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

// Channel Manager API
type RunAutomationResponse = {
  summary: ChannelAutomationSummary;
  configs: ChannelConfig[];
};

export const channelApi = {
  getConfigs: async (): Promise<ChannelConfig[]> => {
    const response = await apiClient.get<ChannelConfig[]>('/channel/config');
    return response.data;
  },

  updateConfig: async (channel: string, updates: Partial<ChannelConfig>): Promise<ChannelConfig> => {
    const response = await apiClient.patch<ChannelConfig>(`/channel/config/${channel}`, updates);
    return response.data;
  },

  getRules: async (): Promise<ChannelRule[]> => {
    const response = await apiClient.get<ChannelRule[]>('/channel/rules');
    return response.data;
  },

  createRule: async (rule: Partial<ChannelRule>): Promise<ChannelRule> => {
    const response = await apiClient.post<ChannelRule>('/channel/rules', rule);
    return response.data;
  },

  updateRule: async (id: number, updates: Partial<ChannelRule>): Promise<ChannelRule> => {
    const response = await apiClient.patch<ChannelRule>(`/channel/rules/${id}`, updates);
    return response.data;
  },

  deleteRule: async (id: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(`/channel/rules/${id}`);
    return response.data;
  },

  runAutomation: async (): Promise<RunAutomationResponse> => {
    const response = await apiClient.post<RunAutomationResponse>('/channel/automation/run', {});
    return response.data;
  }
};

export const crmApi = {
  getGuests: async (params?: { search?: string; tag?: string; limit?: number; upcoming?: boolean }): Promise<CrmGuest[]> => {
    const queryParams: Record<string, string | number> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.tag) queryParams.tag = params.tag;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.upcoming) queryParams.upcoming = '1';
    const response = await apiClient.get<CrmGuest[]>('/crm/guests', { params: queryParams });
    return response.data;
  },

  getGuest: async (id: number): Promise<CrmGuestDetail> => {
    const response = await apiClient.get<CrmGuestDetail>(`/crm/guests/${id}`);
    return response.data;
  },

  addTag: async (guestId: number, tag: string): Promise<void> => {
    await apiClient.post(`/crm/guests/${guestId}/tags`, { tag });
  },

  removeTag: async (guestId: number, tag: string): Promise<void> => {
    await apiClient.delete(`/crm/guests/${guestId}/tags/${encodeURIComponent(tag)}`);
  },

  addInteraction: async (guestId: number, interaction: Partial<GuestInteraction>): Promise<GuestInteraction> => {
    const response = await apiClient.post<GuestInteraction>(`/crm/guests/${guestId}/interactions`, interaction);
    return response.data;
  },

  updateInteraction: async (id: number, updates: Partial<GuestInteraction>): Promise<void> => {
    await apiClient.patch(`/crm/interactions/${id}`, updates);
  },

  getCampaigns: async (): Promise<CrmCampaign[]> => {
    const response = await apiClient.get<CrmCampaign[]>('/crm/campaigns');
    return response.data;
  },

  createCampaign: async (campaign: Partial<CrmCampaign>): Promise<CrmCampaign> => {
    const response = await apiClient.post<CrmCampaign>('/crm/campaigns', campaign);
    return response.data;
  },

  updateCampaign: async (id: number, updates: Partial<CrmCampaign>): Promise<CrmCampaign> => {
    const response = await apiClient.patch<CrmCampaign>(`/crm/campaigns/${id}`, updates);
    return response.data;
  },

  runCampaign: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/crm/campaigns/${id}/run`, {});
    return response.data;
  },

  runAutomation: async (): Promise<void> => {
    await apiClient.post('/crm/automation/run', {});
  },

  getFeedbackSummary: async (): Promise<CrmFeedbackSummary> => {
    const response = await apiClient.get<CrmFeedbackSummary>('/crm/feedback/summary');
    return response.data;
  },

  getRecentFeedback: async (limit = 8): Promise<CrmFeedbackEntry[]> => {
    const response = await apiClient.get<CrmFeedbackEntry[]>('/crm/feedback/recent', {
      params: { limit },
    });
    return response.data;
  },
};

export const feedbackApi = {
  getForm: async (token: string): Promise<FeedbackFormData> => {
    const response = await apiClient.get<FeedbackFormData>(`/feedback/${token}`);
    return response.data;
  },

  submit: async (token: string, payload: FeedbackSubmitPayload): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(`/feedback/${token}`, payload);
    return response.data;
  },
};

export default apiClient;

