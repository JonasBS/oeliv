# ØLIV Booking Engine

Fuld booking engine med channel manager integration.

## Features

- ✅ **Kalender med tilgængelighedsvisning** - Interaktiv kalender der viser ledige/optagne datoer
- ✅ **Booking API** - Check tilgængelighed, opret booking, opdater booking status
- ✅ **SQLite database** - Bookings, værelser, tilgængelighed og channel sync log
- ✅ **Channel Manager struktur** - Klar til integration med booking.com, Airbnb, Expedia
- ✅ **Admin panel** - Se alle bookings, administrer værelser og tilgængelighed
- ✅ **Dynamisk værelsesvalg** - Værelser vises baseret på tilgængelighed
- ✅ **Automatisk prisberegning** - Beregner total pris baseret på valgte datoer
- 🔄 **Betalingsintegration (Stripe)** - Struktur klar, mangler API keys
- 🔄 **Email bekræftelser** - Struktur klar, mangler SMTP konfiguration
- 🔄 **Channel manager API integration** - Struktur klar, mangler API keys fra channels

## Installation

```bash
npm install
```

## Konfiguration

Kopier `.env.example` til `.env` og udfyld:

```bash
cp .env.example .env
```

## Start Server

```bash
npm start
# eller for development:
npm run dev
```

Serveren kører på `http://localhost:3000`

## API Endpoints

### Bookings
- `GET /api/bookings/:id` - Hent booking
- `POST /api/bookings` - Opret booking
- `PATCH /api/bookings/:id` - Opdater booking status
- `GET /api/admin/bookings` - Hent alle bookings (admin)

### Availability
- `GET /api/availability` - Hent tilgængelighed for datoområde
- `POST /api/check-availability` - Tjek tilgængelighed for specifikke datoer
- `POST /api/admin/availability` - Opdater tilgængelighed (admin)

### Rooms
- `GET /api/rooms` - Hent alle værelser

### Channel Manager
- `POST /api/channel/sync` - Synkroniser med channel manager
- `POST /api/channel/booking` - Modtag booking fra ekstern channel

## Struktur

```
/workspace/
├── server.js              # Express backend server
├── booking.js             # Frontend booking engine & kalender
├── channel-manager.js     # Channel manager integration klasse
├── admin.html             # Admin panel til booking management
├── package.json           # Node.js dependencies
├── .env.example           # Miljøvariabler template
└── bookings.db            # SQLite database (oprettes automatisk)
```

## Næste Skridt

1. **Betalingsintegration**: 
   - Tilføj Stripe API keys i `.env`
   - Integrer Stripe checkout i booking flow
   - Håndter betalingsbekræftelser

2. **Email**: 
   - Konfigurer SMTP i `.env`
   - Send booking bekræftelser ved oprettelse
   - Send påmindelser før ankomst

3. **Channel Manager**: 
   - Få API keys fra booking.com, Airbnb, Expedia
   - Konfigurer webhooks til at modtage bookings
   - Sæt automatisk sync op (hver 15. minut)

4. **Admin Panel**: 
   - Tilføj redigering af bookings
   - Tilføj bulk opdatering af tilgængelighed
   - Tilføj eksport af bookings (CSV/PDF)

5. **Tilgængelighed**: 
   - Initialiser tilgængelighed for alle værelser (næste 12 måneder)
   - Sæt sæsonpriser op
   - Konfigurer minimum ophold per sæson

## Database Struktur

- `rooms` - Værelser
- `bookings` - Bookings
- `availability` - Dato-baseret tilgængelighed og priser
- `channel_sync` - Channel manager sync log
