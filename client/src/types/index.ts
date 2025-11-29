export interface RoomImage {
  id: number;
  room_id: number;
  image_url: string;
  display_order: number;
  is_primary: number;
  caption?: string;
  created_at: string;
}

export interface RoomUnit {
  id: number;
  room_id: number;
  label: string;
  ttlock_lock_id?: string | null;
  active: number;
}

export interface Room {
  id: number;
  name: string;
  type: string;
  max_guests: number;
  base_price: number;
  active: number;
  unit_count: number;
  image_url?: string;
  description?: string;
  images?: RoomImage[];
  units?: RoomUnit[];
  // Physical Details
  room_size?: number; // m²
  bed_type?: string;
  bathroom_type?: string;
  floor_number?: number;
  view_type?: string;
  // Occupancy
  standard_occupancy?: number;
  // Amenities
  amenities?: string; // JSON array
  // Booking Rules
  min_nights?: number;
  max_nights?: number;
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
  // Additional
  smoking_allowed?: number;
  pets_allowed?: number;
  accessible?: number;
  ttlock_lock_id?: string | null;
  // Channel Manager Fields
  booking_com_id?: string;
  booking_com_room_name?: string;
  booking_com_rate_plan_id?: string;
  airbnb_listing_id?: string;
  airbnb_room_name?: string;
  channel_sync_enabled?: number;
  last_channel_sync?: string;
  channel_sync_notes?: string;
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
  open_units?: number | null;
  capacity_units?: number;
  remaining_units?: number;
  booked_units?: number;
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
  room_unit_id?: number | null;
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
  guest_id?: number;
  created_at?: string;
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

export interface ChannelConfig {
  id: number;
  channel: string;
  display_name: string;
  enabled: number;
  auto_status: string;
  auto_reason?: string | null;
  username?: string | null;
  password?: string | null;
  api_key?: string | null;
  api_secret?: string | null;
  account_id?: string | null;
  property_id?: string | null;
  commission_rate?: number | null;
  markup_percentage?: number | null;
  priority?: number | null;
  notes?: string | null;
  settings?: string | null;
  last_synced?: string | null;
  last_error?: string | null;
  last_auto_update?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChannelRule {
  id: number;
  channel: string;
  rule_type: string;
  threshold?: number | null;
  lead_time_days?: number | null;
  action: string;
  active: number;
  description?: string | null;
  settings?: string | null;
  last_triggered?: string | null;
  last_result?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChannelAutomationStats {
  total_rooms: number;
  window_days: number;
  booked_nights: number;
  occupancy: number;
  soonest_check_in_days: number | null;
}

export interface ChannelAutomationSummary {
  stats: ChannelAutomationStats;
  triggered: Array<{
    channel: string;
    rule_id: number;
    autoStatus: string;
  }>;
}

export interface CrmGuest {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  total_stays: number;
  total_nights: number;
  lifetime_value: number;
  last_check_out?: string | null;
  next_follow_up?: string | null;
  open_tasks?: number;
  upcoming_check_in?: string | null;
  upcoming_check_out?: string | null;
  upcoming_room?: number | null;
}

export interface GuestInteraction {
  id: number;
  guest_id: number;
  type: string;
  subject?: string | null;
  message?: string | null;
  status: string;
  follow_up_date?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface CrmGuestDetail extends CrmGuest {
  tags: string[];
  interactions: GuestInteraction[];
  bookings: Booking[];
  feedback?: CrmFeedbackEntry[];
}

export interface CrmCampaign {
  id: number;
  name: string;
  trigger: string;
  channel: string;
  template_subject?: string;
  template_body?: string;
  delay_days: number;
  target_filter?: string | null;
  active: number;
  last_run_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmFeedbackEntry {
  id: number;
  booking_id: number;
  guest_id: number;
  rating: number;
  positive_note?: string | null;
  improvement_note?: string | null;
  highlight_tags: string[];
  contact_ok: boolean;
  created_at: string;
  check_in: string;
  check_out: string;
  room_name?: string | null;
  guest_name?: string | null;
}

export interface CrmFeedbackSummary {
  responses7d: number;
  pendingRequests: number;
  avgRating30d: number | null;
  completionRate: number;
}

export interface FeedbackFormData {
  request_id: number;
  guest_name: string;
  check_in: string;
  check_out: string;
  room_name?: string | null;
  nights: number;
  status: string;
}

export interface FeedbackSubmitPayload {
  rating: number;
  positive_note?: string;
  improvement_note?: string;
  highlight_tags: string[];
  contact_ok: boolean;
}

