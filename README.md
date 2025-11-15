# ØLIV Booking System

Modern booking system built with React, TypeScript, and Node.js.

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Terminal 1 - Start backend
cd server && npm run dev

# Terminal 2 - Start frontend  
cd client && npm run dev

# Initialize test data (optional)
./scripts/init-availability.sh
```

**Open:** http://localhost:5173

## 📚 Documentation

- **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** - Step-by-step setup instructions
- **[README-REACT.md](./README-REACT.md)** - Complete technical documentation
- **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** - Migrating from vanilla JS
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture diagrams
- **[PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md)** - Project overview

## ✨ Features

### For Users
- 📅 Interactive calendar with availability
- 🏨 Real-time room selection
- 💳 Price calculation
- 📱 Mobile responsive
- ♿ Accessible

### For Developers
- ⚛️ React + TypeScript
- 🔥 Hot reload development
- 🎯 Type-safe API
- 📦 Modular architecture
- 🧪 Easy to test

## 📁 Project Structure

```
oeliv/
├── client/          # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
├── server/          # Node.js backend (Express + SQLite)
│   ├── src/
│   │   ├── database/
│   │   └── routes/
│   └── package.json
│
└── scripts/         # Helper scripts
```

## 🎯 Tech Stack

**Frontend:** React 18, TypeScript, Vite, date-fns, Axios  
**Backend:** Node.js, Express, SQLite, date-fns  
**Dev Tools:** Nodemon, ESLint, Hot Reload

## 📡 API Endpoints

```
GET    /api/rooms                    # List rooms
GET    /api/availability             # Get availability
POST   /api/check-availability       # Check dates
POST   /api/bookings                 # Create booking
GET    /api/bookings/:id             # Get booking
PATCH  /api/bookings/:id             # Update booking
POST   /api/admin/availability       # Set availability
```

## 🗄️ Database

**Type:** SQLite  
**File:** `bookings.db` (auto-created)

**Tables:**
- `rooms` - Room information
- `bookings` - Booking records
- `availability` - Date-based availability
- `channel_sync` - Channel manager log

## 🔧 Configuration

### Environment Variables

**Client (`.env`):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Server (`.env`):**
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## 🧪 Testing the System

1. **Start both servers** (see Quick Start)
2. **Initialize availability:**
   ```bash
   ./scripts/init-availability.sh
   ```
3. **Open http://localhost:5173**
4. **Click "Book nu"**
5. **Complete a test booking:**
   - Select dates in calendar
   - Choose guests (2, 3, or 4)
   - Select a room
   - Fill in guest information
   - Submit

## 🚢 Deployment

### Build for Production

```bash
# Build frontend
cd client && npm run build

# Output: client/dist/
```

### Deploy Options

1. **Vercel (Frontend) + Railway (Backend)**
2. **Traditional VPS with Nginx**
3. **Combined deployment (Express serves static)**

See [README-REACT.md](./README-REACT.md) for detailed deployment instructions.

## 🔜 Future Features

- [ ] Stripe payment integration
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Admin dashboard
- [ ] Channel manager integrations (Booking.com, Airbnb)
- [ ] Multi-language support
- [ ] Analytics dashboard

## 🆘 Troubleshooting

### Frontend won't start
```bash
cd client
rm -rf node_modules package-lock.json
npm install && npm run dev
```

### Backend won't start
```bash
cd server
rm -rf node_modules package-lock.json
npm install && npm run dev
```

### Calendar shows no dates
```bash
# Initialize availability
./scripts/init-availability.sh
```

### Port in use
```bash
# Kill processes
kill -9 $(lsof -t -i:5173)  # Frontend
kill -9 $(lsof -t -i:3000)  # Backend
```

## 📞 Support

1. Check [SETUP-GUIDE.md](./SETUP-GUIDE.md)
2. Check [README-REACT.md](./README-REACT.md)
3. Review console logs
4. Check browser DevTools (F12)

## 📄 License

Proprietary - ØLIV © 2024

---

**Need detailed setup instructions?** → [SETUP-GUIDE.md](./SETUP-GUIDE.md)  
**Want to understand the architecture?** → [ARCHITECTURE.md](./ARCHITECTURE.md)  
**Migrating from old system?** → [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)

