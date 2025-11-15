# ØLIV Booking System - Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                     http://localhost:5173                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    React Frontend                            │
│                  (Vite + TypeScript)                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │              Components Layer                      │      │
│  ├───────────────────────────────────────────────────┤      │
│  │  • BookingModal    (Main booking interface)       │      │
│  │  • BookingCalendar (Date selection)              │      │
│  │  • RoomSelector    (Room selection)              │      │
│  │  • Toast           (Notifications)                │      │
│  └───────────────────────────────────────────────────┘      │
│                       │                                       │
│  ┌───────────────────▼───────────────────────────────┐      │
│  │              Services Layer                        │      │
│  ├───────────────────────────────────────────────────┤      │
│  │  • roomsApi        (GET /rooms)                   │      │
│  │  • availabilityApi (GET/POST /availability)       │      │
│  │  • bookingsApi     (GET/POST/PATCH /bookings)     │      │
│  └───────────────────────────────────────────────────┘      │
│                       │                                       │
│  ┌───────────────────▼───────────────────────────────┐      │
│  │               Types Layer                          │      │
│  ├───────────────────────────────────────────────────┤      │
│  │  • Room, Booking, Availability interfaces         │      │
│  │  • TypeScript type safety                         │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Axios HTTP Requests
                        │ /api/*
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                    Node.js Backend                            │
│                  (Express + SQLite)                           │
│                 http://localhost:3000                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │              Routes Layer                          │      │
│  ├───────────────────────────────────────────────────┤      │
│  │  GET    /api/rooms                                │      │
│  │  GET    /api/availability                         │      │
│  │  POST   /api/check-availability                   │      │
│  │  GET    /api/bookings                             │      │
│  │  GET    /api/bookings/:id                         │      │
│  │  POST   /api/bookings                             │      │
│  │  PATCH  /api/bookings/:id                         │      │
│  │  POST   /api/admin/availability                   │      │
│  │  POST   /api/channel/sync                         │      │
│  │  POST   /api/channel/booking                      │      │
│  └───────────────────────────────────────────────────┘      │
│                       │                                       │
│  ┌───────────────────▼───────────────────────────────┐      │
│  │           Database Layer                           │      │
│  ├───────────────────────────────────────────────────┤      │
│  │  • dbRun()  - Execute SQL                         │      │
│  │  • dbGet()  - Get single row                      │      │
│  │  • dbAll()  - Get multiple rows                   │      │
│  └───────────────────────────────────────────────────┘      │
│                       │                                       │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ SQL Queries
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                     SQLite Database                           │
│                       bookings.db                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐      │
│  │     rooms      │  │  bookings   │  │ availability │      │
│  ├────────────────┤  ├─────────────┤  ├──────────────┤      │
│  │ id             │  │ id          │  │ id           │      │
│  │ name           │  │ room_id     │  │ room_id      │      │
│  │ type           │  │ check_in    │  │ date         │      │
│  │ max_guests     │  │ check_out   │  │ available    │      │
│  │ base_price     │  │ guests      │  │ price        │      │
│  │ active         │  │ guest_name  │  │ min_stay     │      │
│  └────────────────┘  │ guest_email │  └──────────────┘      │
│                      │ guest_phone │                         │
│                      │ total_price │  ┌──────────────┐      │
│                      │ status      │  │channel_sync  │      │
│                      │ source      │  ├──────────────┤      │
│                      └─────────────┘  │ id           │      │
│                                       │ channel      │      │
│                                       │ action       │      │
│                                       │ data         │      │
│                                       │ status       │      │
│                                       └──────────────┘      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### Booking Creation Flow

```
User selects dates
       ↓
BookingCalendar component
       ↓
Updates selectedDates state
       ↓
BookingModal validates
       ↓
Calls availabilityApi.checkAvailability()
       ↓
POST /api/check-availability
       ↓
Backend queries availability table
       ↓
Backend queries bookings table
       ↓
Returns available rooms with pricing
       ↓
RoomSelector displays rooms
       ↓
User selects room and fills info
       ↓
BookingModal calls bookingsApi.create()
       ↓
POST /api/bookings
       ↓
Backend validates data
       ↓
Backend checks availability again
       ↓
Backend calculates total price
       ↓
Backend inserts into bookings table
       ↓
Returns booking ID and status
       ↓
Toast shows success message
       ↓
Modal closes
```

### Availability Check Flow

```
Frontend loads calendar
       ↓
BookingCalendar.loadAvailability()
       ↓
GET /api/availability?start_date=X&end_date=Y
       ↓
Backend queries availability table
       ↓
Joins with rooms table
       ↓
Returns array of availability objects
       ↓
Frontend groups by date
       ↓
Calendar renders with colors:
  - Green: available=1
  - Red: available=0
  - Gray: past dates
```

## 🔄 Component Communication

### State Management

```
App (Root)
├── modalOpen: boolean
├── toastMessage: {message, type}
└── handlers: openModal(), closeModal(), showToast()
     │
     ├──> BookingModal
     │    ├── currentStep: number
     │    ├── selectedDates: {start, end}
     │    ├── formData: BookingFormData
     │    ├── rooms: Room[]
     │    ├── availableRooms: AvailableRoom[]
     │    │
     │    ├──> BookingCalendar
     │    │    ├── currentMonth: Date
     │    │    ├── availability: Record<string, AvailabilityItem[]>
     │    │    ├── hoverDate: Date | null
     │    │    └── onSelect() callback → updates parent
     │    │
     │    └──> RoomSelector
     │         ├── selectedRoomId: number | null
     │         └── onSelectRoom() callback → updates parent
     │
     └──> Toast
          ├── message: string
          ├── type: 'success' | 'error'
          └── onClose() callback → clears toast
```

## 🗂️ File Organization

### Frontend Structure

```
client/src/
│
├── main.tsx                  # React entry point
├── App.tsx                   # Root component
├── index.css                 # Global styles
│
├── components/               # UI Components
│   ├── BookingCalendar.tsx   # Calendar with date selection
│   ├── BookingCalendar.css
│   ├── BookingModal.tsx      # Main booking modal
│   ├── BookingModal.css
│   ├── RoomSelector.tsx      # Room selection cards
│   ├── RoomSelector.css
│   ├── Toast.tsx             # Notification system
│   └── Toast.css
│
├── services/                 # API Layer
│   └── api.ts                # API client and endpoints
│
└── types/                    # TypeScript Definitions
    └── index.ts              # All interfaces and types
```

### Backend Structure

```
server/src/
│
├── index.js                  # Express app entry
│
├── database/                 # Database Layer
│   └── db.js                 # SQLite setup and helpers
│
└── routes/                   # API Routes
    ├── rooms.js              # Room endpoints
    ├── availability.js       # Availability endpoints
    ├── bookings.js           # Booking endpoints
    └── channel.js            # Channel manager endpoints
```

## 🔐 Security Architecture

### Input Validation

```
Frontend
   ↓
TypeScript type checking
   ↓
React form validation
   ↓
API Request
   ↓
Backend validation
   ↓
Parameterized SQL queries
   ↓
Database
```

### CORS Flow

```
Browser (localhost:5173)
   ↓
Preflight OPTIONS request
   ↓
Server checks FRONTEND_URL env var
   ↓
Responds with CORS headers
   ↓
Browser allows request
   ↓
Actual API call proceeds
```

## 🚀 Deployment Architecture

### Development

```
┌─────────────┐        ┌─────────────┐
│   Vite Dev  │◄──────►│  Node Dev   │
│   :5173     │  Proxy │   :3000     │
│  (React)    │        │  (Express)  │
└─────────────┘        └──────┬──────┘
                              │
                         ┌────▼─────┐
                         │ SQLite   │
                         │ Database │
                         └──────────┘
```

### Production Option 1: Separated

```
┌──────────────┐        ┌──────────────┐
│   Vercel     │───────►│   Railway    │
│  (Frontend)  │  HTTPS │  (Backend)   │
│   Static     │        │   Node.js    │
└──────────────┘        └──────┬───────┘
                               │
                          ┌────▼─────┐
                          │ SQLite   │
                          │ Volume   │
                          └──────────┘
```

### Production Option 2: Combined

```
┌─────────────────────────┐
│      VPS/Cloud          │
│  ┌──────────────────┐   │
│  │   Nginx          │   │
│  │   (Static Files) │   │
│  └────────┬─────────┘   │
│           │             │
│  ┌────────▼─────────┐   │
│  │   Node.js        │   │
│  │   (Express API)  │   │
│  └────────┬─────────┘   │
│           │             │
│  ┌────────▼─────────┐   │
│  │   SQLite         │   │
│  │   (Database)     │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

## 🔮 Extension Points

### Adding New Features

```
1. Payment Integration
   Frontend: Add Stripe component
   Backend: Add /api/payment/create route
   Database: Add payment_intent_id field (exists)

2. Email Notifications
   Backend: Add nodemailer service
   Backend: Add email templates
   Trigger: On booking creation

3. Channel Manager
   Backend: Add channel-specific adapters
   Backend: Add webhook handlers
   Database: Use channel_sync table (exists)

4. Admin Panel
   Frontend: Create new /admin route
   Backend: Add authentication middleware
   Backend: Add admin-specific endpoints
```

## 📊 Performance Considerations

### Frontend Optimizations
- React lazy loading for components
- Debounced API calls
- Optimized re-renders with memoization
- Code splitting by route

### Backend Optimizations
- Database indexes on frequently queried fields
- Connection pooling (if needed)
- Response caching for static data
- Efficient SQL queries with JOINs

### Database Optimizations
- Indexed date fields
- Indexed room_id fields
- Compound indexes for queries
- UNIQUE constraints for data integrity

## 🎯 Design Patterns Used

### Frontend
- **Component Composition** - Small, reusable components
- **Controlled Components** - React manages form state
- **Hooks Pattern** - useState, useEffect, useCallback
- **Service Layer** - Separated API logic
- **Props Drilling** - Simple data flow (no global state needed)

### Backend
- **MVC Pattern** - Routes, Controllers (implicit), Models (database)
- **Middleware Pattern** - CORS, JSON parsing, error handling
- **Repository Pattern** - Database abstraction
- **RESTful API** - Standard HTTP methods and status codes

## 📈 Scalability

### Current Limitations
- Single SQLite file (good for <1000 bookings/day)
- No caching layer
- No load balancing
- Synchronous processing

### Future Scaling Options
1. **Database:** Migrate to PostgreSQL
2. **Caching:** Add Redis for sessions/availability
3. **Queue:** Add Bull for background jobs
4. **Load Balancer:** Add Nginx/HAProxy
5. **Microservices:** Split into booking/payment/notification services

---

This architecture provides a solid foundation that's easy to understand, maintain, and extend as your needs grow.

