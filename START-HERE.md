# 🚀 ØLIV Booking System - Quick Start

## Start Backend Server

### Option 1: Using the start script (Easy!)
```bash
./start-backend.sh
```

### Option 2: Manual start
```bash
cd server
node src/index.js
```

## When Backend is Running:

You'll see:
```
✅ Connected to SQLite database
✅ Revenue management tables created
✅ Database initialized successfully
✅ Booking engine server running on port 3000
🤖 Revenue Management: Enabled
```

## Then Open:

- **Admin Panel**: http://localhost:3000/admin-react.html
- **Main Website**: http://localhost:3000/index.html
- **Health Check**: http://localhost:3000/health

## Features Available:

1. 📅 **Bookings** - View and manage all bookings
2. 🏠 **Rooms** - Manage rooms and pricing
3. 💰 **Pricing & Seasons** - Set seasonal pricing rules
4. 📊 **Revenue Management** - AI-powered price optimization + competitor tracking
5. 📆 **Availability** - Manage room availability per date
6. 📱 **Channel Manager** - OTA integrations

## Stop Backend:

Press `Ctrl+C` in the terminal where backend is running

## Important:

⚠️ **Backend must be running for the system to work!**

Keep the terminal open with backend running while using the admin panel.

