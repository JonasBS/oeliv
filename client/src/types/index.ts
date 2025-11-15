export interface Room {
  id: number;
  name: string;
  type: string;
  max_guests: number;
  base_price: number;
  active: number;
}

export interface AvailabilityItem {
  date: string;
  room_id: number;
  available: number;
  price: number | null;
  min_stay: number;
  room_name: string;
  room_type: string;
  max_guests: number;
}

export interface AvailableRoom {
  room_id: number;
  name: string;
  type: string;
  max_guests: number;
  is_available: number;
  total_price: number;
  min_stay: number;
}

export interface Booking {
  id?: number;
  room_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  notes?: string;
  total_price?: number;
  status?: string;
  payment_status?: string;
  source?: string;
}

export interface BookingFormData {
  date: string;
  nights: number;
  guests: number;
  room: number | null;
  name: string;
  email: string;
  phone: string;
  note: string;
}

export interface DateSelection {
  start: Date | null;
  end: Date | null;
}

