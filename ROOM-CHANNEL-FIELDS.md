# Room Channel Manager Fields

## Oversigt

Dit bookingsystem har nu udvidet support for channel manager-integration med Booking.com og Airbnb. Hvert værelse kan nu konfigureres med specifikke felter der gør det nemmere at synkronisere bookinger og tilgængelighed mellem platforme.

## Nye Felter

### Grundlæggende Felter

- **`image_url`**: URL til et billede af værelset
  - Kan være fra Booking.com, Airbnb, Unsplash eller egen server
  - Eksempel: `"https://images.unsplash.com/photo-123456?w=800"`
  - Vises som hovedbillede i admin panelet

- **`description`**: Kort beskrivelse af værelset
  - Vises under værelsesnavn i admin panelet
  - Eksempel: `"Hyggeligt værelse med havudsigt og morgensol"`

### Booking.com Felter

- **`booking_com_id`**: Dit hotel/property ID på Booking.com
  - Find dette i Booking.com Extranet under "Property settings"
  - Eksempel: `123456`

- **`booking_com_room_name`**: Det nøjagtige værelsenavn som det vises på Booking.com
  - Dette skal matche præcist for at synkronisering virker
  - Eksempel: `"Standard Double Room"`

- **`booking_com_rate_plan_id`**: Rate Plan ID (valgfrit)
  - Bruges hvis du har flere priskategorier/pakker
  - Eksempel: `"NR123456"`

### Airbnb Felter

- **`airbnb_listing_id`**: Airbnb Listing ID
  - Find dette i URL'en på din Airbnb-annonce
  - URL format: `airbnb.com/rooms/[LISTING_ID]`
  - Eksempel: `"12345678"`

- **`airbnb_room_name`**: Titlen på din Airbnb-annonce
  - Eksempel: `"Cozy Room with Ocean View"`

### Synkroniseringsfelter

- **`channel_sync_enabled`**: Om automatisk synkronisering er aktiveret (0 eller 1)
  - Når aktiveret, vil bookinger og tilgængelighed automatisk blive synkroniseret

- **`last_channel_sync`**: Timestamp for sidste synkronisering
  - Opdateres automatisk når channel-felter opdateres

- **`channel_sync_notes`**: Fritekst-noter om synkronisering
  - Eksempel: "Booking.com navngivning afviger lidt fra vores interne"

## Brug i Admin Panelet

1. **Åbn Admin Panelet**: Gå til `http://localhost:3000/admin-react.html` (eller din produktions-URL)

2. **Navigér til "Værelser"**: Klik på "🏠 Værelser" i sidebaren

3. **Rediger et værelse**: Klik på "✏️ Rediger & konfigurer channels" på et værelse

4. **Udfyld channel-felter**:
   - Grundlæggende oplysninger (navn, pris, max gæster)
   - Booking.com integration (ID, værelsenavn, rate plan)
   - Airbnb integration (listing ID, værelsenavn)
   - Synkroniseringsindstillinger (aktiver/deaktiver, noter)

5. **Gem**: Klik på "💾 Gem ændringer"

## Status Badges

I værelseoversigten vises badges for hver platform:

- **🏨 Booking.com**: Vises hvis `booking_com_id` er sat
- **🏠 Airbnb**: Vises hvis `airbnb_listing_id` er sat
- **⚠️ Ingen channels**: Vises hvis ingen platform er konfigureret

## API Endepunkter

### Hent alle værelser (med channel-felter)
```bash
GET /api/rooms
```

### Opdater et værelse
```bash
PATCH /api/rooms/:id
Content-Type: application/json

{
  "booking_com_id": "123456",
  "booking_com_room_name": "Standard Double Room",
  "airbnb_listing_id": "12345678",
  "airbnb_room_name": "Cozy Room",
  "channel_sync_enabled": 1,
  "channel_sync_notes": "Synkroniserer hver time"
}
```

## Integration med Channel Manager

Disse felter er designet til at blive brugt af Channel Manager-fanen senere. Når du har konfigureret dine værelser med de rigtige ID'er og navne, vil automatisk synkronisering kunne:

1. **Pull bookinger** fra Booking.com og Airbnb ind i dit system
2. **Push tilgængelighed** fra dit system til platformene
3. **Undgå overbookinger** ved at holde alle platforme synkroniseret
4. **Automatisk opdatere priser** baseret på dit revenue management system

## Database Schema

De nye felter er tilføjet til `rooms` tabellen:

```sql
-- Basic fields
image_url TEXT
description TEXT

-- Booking.com fields
booking_com_id TEXT
booking_com_room_name TEXT
booking_com_rate_plan_id TEXT

-- Airbnb fields
airbnb_listing_id TEXT
airbnb_room_name TEXT

-- General channel manager fields
channel_sync_enabled INTEGER DEFAULT 0
last_channel_sync DATETIME
channel_sync_notes TEXT
```

## Næste Trin

1. ✅ Konfigurer dine værelser med Booking.com og Airbnb-felter
2. ⏳ Implementer automatisk synkronisering i Channel Manager-fanen
3. ⏳ Test synkronisering med testbookinger
4. ⏳ Aktivér live synkronisering

## Eksempel på konfigureret værelse

```json
{
  "id": 1,
  "name": "Kystværelse",
  "type": "coast",
  "max_guests": 2,
  "base_price": 1200,
  "active": 1,
  "booking_com_id": "123456",
  "booking_com_room_name": "Standard Double Room with Sea View",
  "booking_com_rate_plan_id": "NR789",
  "airbnb_listing_id": "45678901",
  "airbnb_room_name": "Coastal Room with Beautiful Ocean View",
  "channel_sync_enabled": 1,
  "last_channel_sync": "2025-11-16T16:59:51.000Z",
  "channel_sync_notes": "Booking.com navngivning inkluderer 'Sea View', Airbnb bruger 'Ocean View'"
}
```

## Support

Hvis du har spørgsmål eller problemer, check:
- Booking.com Extranet for dine property/room ID'er
- Airbnb Host Dashboard for dine listing ID'er
- Channel Manager-fanen for synkroniseringsstatus

---

**Version**: 1.0  
**Opdateret**: 16. november 2025

