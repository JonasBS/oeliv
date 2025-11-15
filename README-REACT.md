# ØLIV Booking System - React & Node.js

Modern booking system built with React (TypeScript), Node.js, and SQLite.

## 🏗️ Project Structure

```
oeliv/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── BookingCalendar.tsx
│   │   │   ├── BookingModal.tsx
│   │   │   ├── RoomSelector.tsx
│   │   │   └── Toast.tsx
│   │   ├── services/      # API service layer
│   │   │   └── api.ts
│   │   ├── types/         # TypeScript interfaces
│   │   │   └── index.ts
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── server/                # Node.js backend
    ├── src/
    │   ├── database/      # Database setup
    │   │   └── db.js
    │   ├── routes/        # API routes
    │   │   ├── rooms.js
    │   │   ├── availability.js
    │   │   ├── bookings.js
    │   │   └── channel.js
    │   └── index.js       # Server entry point
    └── package.json
```

## ✨ Features

### Frontend (React + TypeScript)
- ✅ **Interactive Calendar** - Visual date picker with availability
- ✅ **Multi-step Booking Form** - Guided booking experience
- ✅ **Room Selection** - Dynamic room cards with pricing
- ✅ **Real-time Validation** - Form validation at each step
- ✅ **Toast Notifications** - User feedback for actions
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **TypeScript** - Type-safe code
- ✅ **Modern UI** - Clean, accessible design

### Backend (Node.js + Express)
- ✅ **RESTful API** - Well-structured endpoints
- ✅ **SQLite Database** - Lightweight, serverless database
- ✅ **Availability Management** - Date-based room availability
- ✅ **Booking Management** - Create and manage bookings
- ✅ **Channel Manager Structure** - Ready for external integrations
- ✅ **Error Handling** - Comprehensive error management
- ✅ **CORS Support** - Secure cross-origin requests

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone and navigate to project:**
```bash
cd /Users/jonasbaggersorensen/Documents/ØLIV/oeliv
```

2. **Install client dependencies:**
```bash
cd client
npm install
cp .env.example .env
```

3. **Install server dependencies:**
```bash
cd ../server
npm install
cp .env.example .env
```

### Development

Run both frontend and backend in development mode:

**Terminal 1 - Frontend (React):**
```bash
cd client
npm run dev
```
Frontend runs on: http://localhost:5173

**Terminal 2 - Backend (Node.js):**
```bash
cd server
npm run dev
```
Backend runs on: http://localhost:3000

### Production Build

**Build frontend:**
```bash
cd client
npm run build
```

**Start backend:**
```bash
cd server
npm start
```

## 📡 API Endpoints

### Rooms
- `GET /api/rooms` - Get all active rooms

### Availability
- `GET /api/availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get availability
- `POST /api/check-availability` - Check room availability for dates
- `POST /api/admin/availability` - Set availability (admin)

### Bookings
- `GET /api/bookings` - Get all bookings (admin)
- `GET /api/bookings/:id` - Get specific booking
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/:id` - Update booking status

### Channel Manager
- `POST /api/channel/sync` - Sync with channel manager
- `POST /api/channel/booking` - Receive external booking

## 🗄️ Database Schema

### Tables
- **rooms** - Room information (name, type, capacity, price)
- **bookings** - Booking records with guest information
- **availability** - Date-based availability and pricing
- **channel_sync** - Channel manager sync log

### Initial Data
The server automatically creates 5 default rooms:
- Kystværelse (2 guests, 1200 DKK)
- Havsuite (2 guests, 1500 DKK)
- Stor havsuite (4 guests, 2000 DKK)
- Ferielejlighed (4 guests, 1800 DKK)
- Gårdsværelser (2 guests, 1300 DKK)

## 📝 Usage Example

### Setting Availability (Required First Step)

Before bookings work, you need to set availability:

```bash
curl -X POST http://localhost:3000/api/admin/availability \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "price": 1200,
    "min_stay": 2,
    "available": 1
  }'
```

Do this for each room to populate the calendar.

### Creating a Booking

The frontend handles this automatically, but the API call is:

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "check_in": "2024-06-15",
    "check_out": "2024-06-18",
    "guests": 2,
    "guest_name": "John Doe",
    "guest_email": "john@example.com",
    "guest_phone": "+45 12345678",
    "notes": "Special request"
  }'
```

## 🎨 Component Architecture

### BookingCalendar
- Interactive date range picker
- Shows availability status
- Handles date selection logic
- Communicates with parent via callbacks

### BookingModal
- Multi-step form wizard
- Manages booking state
- Validates each step
- Handles form submission

### RoomSelector
- Displays available rooms
- Shows pricing for selected dates
- Handles room selection

### Toast
- Shows success/error messages
- Auto-dismisses after 5 seconds
- Positioned bottom-right

## 🔧 Configuration

### Environment Variables

**Client (.env):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Server (.env):**
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## 🚢 Deployment

### Option 1: Traditional Hosting

1. Build frontend: `cd client && npm run build`
2. Serve `client/dist` with nginx/apache
3. Deploy backend to VPS/cloud server
4. Set production environment variables

### Option 2: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
```bash
cd client
vercel
```

**Backend (Railway):**
```bash
cd server
railway login
railway init
railway up
```

### Option 3: Docker

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  frontend:
    build: ./client
    ports:
      - "5173:5173"
  backend:
    build: ./server
    ports:
      - "3000:3000"
    volumes:
      - ./bookings.db:/app/bookings.db
```

## 🔜 Future Enhancements

### Payment Integration
- Stripe checkout flow
- Payment confirmation emails
- Deposit handling

### Email Notifications
- Booking confirmations
- Reminder emails
- Admin notifications

### Channel Manager
- Booking.com integration
- Airbnb API sync
- Automatic inventory updates

### Admin Panel
- Booking management interface
- Bulk availability updates
- Revenue reporting
- Guest management

## 📚 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- date-fns
- Axios
- CSS (Custom design system)

**Backend:**
- Node.js
- Express
- SQLite3
- date-fns
- ES Modules

## 🤝 Contributing

This is a private project for ØLIV. For questions or issues, contact the development team.

## 📄 License

Proprietary - ØLIV © 2024

