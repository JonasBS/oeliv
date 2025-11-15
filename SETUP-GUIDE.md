# ØLIV Booking System - Setup Guide

Complete setup guide for the React + Node.js booking system.

## 📋 Prerequisites

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Terminal/Command line** access
- **Code editor** (VS Code recommended)

## 🏁 Step-by-Step Setup

### 1. Navigate to Project Directory

```bash
cd /Users/jonasbaggersorensen/Documents/ØLIV/oeliv
```

### 2. Setup Backend (Server)

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env if needed (optional)
# Default settings work for local development
```

**Start the backend server:**
```bash
npm run dev
```

You should see:
```
✅ Connected to SQLite database
✅ Default rooms inserted
✅ Database initialized successfully
✅ Booking engine server running on port 3000
📝 Environment: development
🌐 CORS enabled for: http://localhost:5173
```

**Keep this terminal open!** The server must run continuously.

### 3. Setup Frontend (Client)

Open a **new terminal window/tab** and run:

```bash
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# No need to edit .env for local development
```

**Start the frontend development server:**
```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Access the Application

Open your browser and go to: **http://localhost:5173**

You should see the ØLIV booking interface with a "Book nu" button.

## 🎯 Setting Up Test Data

### Important: Initialize Availability

The booking calendar needs availability data to function. Run this command:

```bash
# In a new terminal
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

Run this for all 5 rooms (change `room_id` from 1 to 5 and adjust `price`):
- Room 1: Kystværelse - 1200 DKK
- Room 2: Havsuite - 1500 DKK
- Room 3: Stor havsuite - 2000 DKK
- Room 4: Ferielejlighed - 1800 DKK
- Room 5: Gårdsværelser - 1300 DKK

**Quick script to set all availability:**
```bash
for room_id in {1..5}; do
  price=$((1200 + (room_id - 1) * 200))
  curl -X POST http://localhost:3000/api/admin/availability \
    -H "Content-Type: application/json" \
    -d "{
      \"room_id\": $room_id,
      \"start_date\": \"2024-01-01\",
      \"end_date\": \"2024-12-31\",
      \"price\": $price,
      \"min_stay\": 2,
      \"available\": 1
    }"
  echo ""
done
```

## ✅ Verify Everything Works

### Test the Booking Flow:

1. **Click "Book nu"** button
2. **Select dates** in the calendar (you should see green available dates)
3. **Choose number of guests** (2, 3, or 4)
4. **Click "Næste"** to proceed
5. **Select a room** from available options
6. **Click "Næste"** again
7. **Fill in guest information:**
   - Name: Test User
   - Email: test@example.com
   - Phone: +45 12345678 (optional)
8. **Click "Send forespørgsel"**

You should see a success message: "Booking #X oprettet!"

### Check the Database:

```bash
# View all bookings
curl http://localhost:3000/api/bookings

# View all rooms
curl http://localhost:3000/api/rooms
```

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend won't start
```bash
# Clear and reinstall
cd server
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Calendar shows no dates
- Make sure you've set availability (see "Setting Up Test Data" above)
- Check backend is running on port 3000
- Check browser console for errors

### CORS errors
- Ensure backend `.env` has: `FRONTEND_URL=http://localhost:5173`
- Restart backend server after changing `.env`

### Port already in use
```bash
# Frontend (port 5173)
kill -9 $(lsof -t -i:5173)

# Backend (port 3000)
kill -9 $(lsof -t -i:3000)
```

## 🔄 Daily Development Workflow

### Starting work:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Stopping:

Press `Ctrl+C` in each terminal to stop the servers.

## 📁 Project File Structure

```
oeliv/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── services/         # API calls
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # Main app
│   ├── package.json
│   └── vite.config.ts
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── database/         # Database setup
│   │   ├── routes/           # API endpoints
│   │   └── index.js          # Server
│   └── package.json
│
├── bookings.db               # SQLite database (auto-created)
├── README-REACT.md           # Full documentation
└── SETUP-GUIDE.md            # This file
```

## 🚀 Next Steps

After successful setup:

1. **Customize rooms** - Edit room names/prices in `server/src/database/db.js`
2. **Adjust availability** - Set real availability dates via API
3. **Customize UI** - Modify components in `client/src/components/`
4. **Add features** - See README-REACT.md for enhancement ideas

## 💡 Tips

- Keep both terminals (frontend + backend) running
- Check console for errors if something doesn't work
- The database (`bookings.db`) is automatically created
- Use Chrome DevTools to inspect API calls
- The calendar requires dates in YYYY-MM-DD format

## 📞 Getting Help

If you encounter issues:

1. Check the console output in both terminals
2. Look for error messages in browser console (F12)
3. Verify all environment variables are set correctly
4. Make sure both servers are running
5. Try restarting both frontend and backend

## ✨ Success Indicators

You're all set when:
- ✅ Backend shows "server running on port 3000"
- ✅ Frontend opens at http://localhost:5173
- ✅ Calendar shows available dates (green)
- ✅ You can complete a test booking
- ✅ No errors in browser console

Happy booking! 🎉

