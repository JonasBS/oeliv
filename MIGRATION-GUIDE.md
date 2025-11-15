# Migration Guide: Vanilla JS → React + Node.js

Guide for transitioning from the old vanilla JavaScript booking system to the new React + Node.js system.

## 📊 What Changed?

### Old System
- **Frontend:** Vanilla JavaScript (`booking.js`, `main.js`)
- **Backend:** Node.js/Express (`server.js`)
- **Database:** SQLite
- **Structure:** Single directory, mixed files

### New System
- **Frontend:** React + TypeScript (`client/`)
- **Backend:** Node.js/Express with modular structure (`server/`)
- **Database:** SQLite (same)
- **Structure:** Separated client/server architecture

## 🔄 File Mapping

### Frontend Files

| Old File | New Location | Status |
|----------|--------------|--------|
| `booking.js` | `client/src/components/BookingCalendar.tsx` | ✅ Converted to React |
| `booking.js` | `client/src/components/BookingModal.tsx` | ✅ Converted to React |
| `main.js` | `client/src/App.tsx` | ✅ Converted to React |
| `styles.css` | `client/src/*.css` | ✅ Split into component styles |

### Backend Files

| Old File | New Location | Status |
|----------|--------------|--------|
| `server.js` | `server/src/index.js` | ✅ Restructured |
| - | `server/src/routes/rooms.js` | ✅ New modular structure |
| - | `server/src/routes/availability.js` | ✅ New modular structure |
| - | `server/src/routes/bookings.js` | ✅ New modular structure |
| - | `server/src/routes/channel.js` | ✅ New modular structure |
| - | `server/src/database/db.js` | ✅ Extracted database logic |

### Database

| Item | Status |
|------|--------|
| `bookings.db` | ✅ Compatible - no changes needed |
| Schema | ✅ Same structure |
| Data | ✅ Preserved |

## 🚀 Migration Steps

### Step 1: Backup Current System

```bash
# Backup your old files
cd /Users/jonasbaggersorensen/Documents/ØLIV/oeliv
mkdir backup-old-system
cp booking.js main.js server.js bookings.db backup-old-system/
```

### Step 2: Install New System

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### Step 3: Configure Environment

```bash
# Create client env file
cp client/.env.example client/.env

# Create server env file
cp server/.env.example server/.env
```

### Step 4: Test Backend Compatibility

```bash
# Start new backend
cd server
npm run dev
```

Test API endpoints:
```bash
# Test rooms endpoint
curl http://localhost:3000/api/rooms

# Test availability endpoint
curl http://localhost:3000/api/availability?start_date=2024-01-01&end_date=2024-12-31
```

### Step 5: Migrate Data (if needed)

If you have existing bookings in `bookings.db`, they will work automatically with the new system! The database schema is unchanged.

### Step 6: Test Frontend

```bash
# In a new terminal
cd client
npm run dev
```

Open http://localhost:5173 and test the booking flow.

## 📋 Feature Comparison

### Preserved Features ✅

All features from the old system are preserved:

- ✅ Interactive calendar with availability
- ✅ Date range selection
- ✅ Room selection
- ✅ Guest information form
- ✅ Booking creation
- ✅ Toast notifications
- ✅ Multi-step form
- ✅ Price calculation
- ✅ Availability checking
- ✅ Database storage

### New Features 🆕

The new system adds:

- 🆕 TypeScript type safety
- 🆕 Better component architecture
- 🆕 Improved error handling
- 🆕 Better state management
- 🆕 Modular backend structure
- 🆕 Better mobile responsiveness
- 🆕 Improved accessibility
- 🆕 Better development experience

## 🔧 API Compatibility

### Breaking Changes: None! ✅

All API endpoints remain the same:

```javascript
// These work exactly the same
GET  /api/rooms
GET  /api/availability
POST /api/check-availability
POST /api/bookings
GET  /api/bookings/:id
PATCH /api/bookings/:id
```

### Request/Response Format: Unchanged ✅

Example booking request (same as before):
```json
{
  "room_id": 1,
  "check_in": "2024-06-15",
  "check_out": "2024-06-18",
  "guests": 2,
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "guest_phone": "+45 12345678"
}
```

## 🎨 Integrating with Existing Website

### Option 1: Replace Booking Modal (Recommended)

If you have an existing ØLIV website, you can integrate the new React booking system:

1. **Build the React app:**
```bash
cd client
npm run build
```

2. **Include in your website:**
```html
<!-- In your existing HTML -->
<div id="booking-root"></div>
<script type="module" src="/path/to/client/dist/assets/index.js"></script>
<link rel="stylesheet" href="/path/to/client/dist/assets/index.css">
```

### Option 2: Iframe Integration

```html
<!-- Embed as iframe -->
<iframe 
  src="http://localhost:5173" 
  width="100%" 
  height="800px"
  style="border: none;"
></iframe>
```

### Option 3: Keep Old Frontend, Use New Backend

The new backend is compatible with your old frontend! Just update the API URL in `booking.js`:

```javascript
// In old booking.js
const API_BASE = 'http://localhost:3000/api';
```

## 📦 Deployment Changes

### Old Deployment
- Deploy `server.js` + static HTML files
- Single process

### New Deployment

**Option A: Separate Deployment**
- Frontend: Deploy to Vercel/Netlify (static)
- Backend: Deploy to Railway/Heroku (Node.js)

**Option B: Combined**
- Build frontend: `cd client && npm run build`
- Serve from backend: `server` serves `client/dist`

## 🐛 Troubleshooting Migration

### Database Issues

**Problem:** "Table doesn't exist"
```bash
# Solution: The new system auto-creates tables
# Just start the server and it will initialize
cd server
npm run dev
```

**Problem:** "Lost my bookings"
```bash
# Solution: Copy old database to project root
cp /path/to/old/bookings.db /Users/jonasbaggersorensen/Documents/ØLIV/oeliv/bookings.db
```

### API Issues

**Problem:** Frontend can't connect to backend
```bash
# Solution: Check CORS settings in server/.env
FRONTEND_URL=http://localhost:5173
```

**Problem:** 404 on API calls
```bash
# Solution: Make sure backend is running on port 3000
cd server
npm run dev
```

## 📝 Code Style Comparison

### Old Style (Vanilla JS)
```javascript
// booking.js
class BookingCalendar {
  constructor(containerId, options) {
    this.container = document.getElementById(containerId);
    // ...
  }
  
  render() {
    this.container.innerHTML = `<div>...</div>`;
  }
}
```

### New Style (React + TypeScript)
```typescript
// BookingCalendar.tsx
interface BookingCalendarProps {
  onSelect: (dates: DateSelection) => void;
}

const BookingCalendar = ({ onSelect }: BookingCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  return (
    <div className="booking-calendar">
      {/* JSX */}
    </div>
  );
};
```

## ✅ Validation Checklist

Before considering migration complete:

- [ ] Backend starts without errors
- [ ] Frontend loads successfully
- [ ] Can view rooms list
- [ ] Calendar shows availability
- [ ] Can select dates
- [ ] Can choose guests
- [ ] Can select room
- [ ] Can fill guest information
- [ ] Can submit booking
- [ ] Booking appears in database
- [ ] Toast notifications work
- [ ] Mobile responsive
- [ ] All API endpoints work

## 🔄 Rollback Plan

If you need to rollback to the old system:

```bash
# Stop new servers
# (Ctrl+C in both terminals)

# Restore old files
cp backup-old-system/* .

# Start old server
node server.js

# Use old HTML files directly
```

Your database is compatible with both systems, so no data loss!

## 🎉 Benefits of New System

1. **Better Development Experience**
   - Hot reload in development
   - TypeScript catches errors early
   - Better code organization

2. **Better Performance**
   - React's efficient rendering
   - Optimized bundle size
   - Better caching

3. **Better Maintainability**
   - Modular code structure
   - Separated concerns
   - Easier to add features

4. **Better User Experience**
   - Smoother interactions
   - Better error handling
   - More responsive UI

## 📞 Need Help?

Migration questions? Check:
1. `SETUP-GUIDE.md` - Setup instructions
2. `README-REACT.md` - Full documentation
3. Console logs in terminal
4. Browser console (F12)

## 🚀 Next Steps After Migration

1. **Test thoroughly** with real booking scenarios
2. **Set real availability** for your rooms
3. **Customize styling** to match your brand
4. **Set up production deployment**
5. **Configure email notifications** (optional)
6. **Add payment integration** (optional)

Remember: The old system is fully backed up and you can always rollback if needed!

