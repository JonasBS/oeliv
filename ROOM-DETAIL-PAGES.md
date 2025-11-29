# 🏠 Individuelle Værelses-sider

## Oversigt

Nu har hver værelse sin egen dedikerede side med **alle detaljer** inklusiv de nye felter vi har tilføjet til channel manager integrationen.

## 📁 Nye Filer

### 1. `/room.html`
Dynamisk side til at vise et enkelt værelse med alle detaljer.

**URL format:** `room.html?id=1` (hvor `id` er værelsets ID)

**Funktioner:**
- Full-screen hero image med værelsenavn og pris
- Billedgalleri (hvis flere billeder er tilgængelige)
- Alle værelsesdetaljer organiseret i sektioner
- Sticky booking-kort i sidebar
- Responsivt design

### 2. `/load-room-detail.js`
JavaScript til at indlæse og vise værelsesinformation dynamisk.

**Funktioner:**
- Henter data fra `/api/rooms/:id`
- Viser alle nye felter (størrelse, sengetype, faciliteter, etc.)
- Dansk oversættelse af alle værdier
- Håndtering af manglende data elegant

## 🎨 Værelses-sektioner

### Hero Section
- Stort baggrundsbillede (primært billede fra galleriet)
- Værelsenavn
- Kort info (størrelse, gæster, pris)

### Billedgalleri
- Viser alle uploadede billeder i et responsivt grid
- Klikbart for at se fuld størrelse (fremtidig funktion)

### Værelsesdetaljer 🏠
- **Størrelse** (m²)
- **Seng** (type: king, queen, double, etc.)
- **Badeværelse** (privat, ensuite, delt)
- **Udsigt** (hav, have, natur, etc.)
- **Etage**
- **Gæster** (standard + max)

### Faciliteter ✨
- Dynamisk liste baseret på `amenities` JSON
- Checkmark design med grid layout
- Eksempler: WiFi, TV, A/C, Balkon, etc.

### Bookingregler 📋
- **Min/max antal nætter**
- **Check-in/check-out tider**
- **Afbestillingspolitik** (fleksibel, moderat, striks)
- **Særlige tilladelser:**
  - 🚬 Rygning
  - 🐾 Kæledyr
  - ♿ Handicapvenligt

### Booking-kort (Sidebar)
- Pris per nat
- "Forespørg booking" knap
- Liste over inkluderede services
- Sticky positioning (følger med når man scroller)
- "Se alle værelser" link

## 🔗 Integration

### Opdateret overnatning.html
Værelse-kort på `/overnatning.html` har nu:
- Klikbart billede → går til detail-side
- Klikbar titel → går til detail-side
- Viser `room_size` hvis tilgængelig
- "Se detaljer" knap
- "Book nu" knap

### Backend API
Ny endpoint tilføjet: `GET /api/rooms/:id`

**Response inkluderer:**
- Alle værelses-felter
- Alle billeder sorteret efter `is_primary` og `display_order`
- `image_url` sættes til primært billede for bagudkompatibilitet

## 🎯 Fordele

### For gæster
- ✅ Se alle detaljer før booking
- ✅ Stort billedgalleri
- ✅ Klar information om regler og faciliteter
- ✅ Nemt at sammenligne værelser

### For ejere
- ✅ Vis alle dine channel manager data
- ✅ Konsistent med Booking.com/Airbnb
- ✅ Professionelt udtryk
- ✅ SEO-venligt (hver værelse har egen URL)

## 📱 Responsive Design

- **Desktop:** 2-kolonners layout (detaljer + booking card)
- **Tablet:** 2-kolonners layout stadig
- **Mobil:** 1-kolonne, booking card nederst

## 🚀 Brug

### Se en værelse-side
1. Gå til http://localhost:3000/overnatning.html
2. Klik på et værelse eller "Se detaljer"
3. Du kommer til `room.html?id=X`

### Tilføj data i admin
1. Gå til http://localhost:3000/admin-react.html
2. Åbn "Værelser" tab
3. Klik "Rediger" på et værelse
4. Udfyld alle de nye felter:
   - Værelsesdetaljer (størrelse, seng, badeværelse)
   - Faciliteter (vælg alle der passer)
   - Bookingregler (min/max nætter, tider)
   - Yderligere (rygning, kæledyr, handicap)
5. Gem ændringer

### Upload billeder
1. I værelses-editoren, klik "Upload nyt billede"
2. Upload flere billeder
3. Sæt ét som primært (bruges i hero)
4. Tilføj evt. billedtekster

## 🎨 Styling

Alle styles er tilføjet til:
- `room.html` (inline styles i `<style>` tag)
- `styles.css` (`.image-count` badge)

**Design-principper:**
- Blød, moderne æstetik
- Rundede hjørner (16-20px)
- Bløde skygger
- Olive/Cream farveskema
- God whitespace

## 🔮 Fremtidige forbedringer

- [ ] Lightbox til billedgalleri
- [ ] Booking-formular integreret på siden
- [ ] Anmeldelser/ratings
- [ ] "Lignende værelser" sektion
- [ ] Kalender med tilgængelighed og priser
- [ ] Virtual tour / 360° fotos
- [ ] Dynamisk prissætning vist i real-time

## 📊 Eksempel-data

Jeg har tilføjet eksempel-data til værelse 1 og 2:

**Værelse 1 (Kystværelse):**
- 28 m²
- Queen size seng
- Ensuite badeværelse
- Havudsigt
- 8 faciliteter
- Handicapvenligt

**Værelse 2:**
- 35 m²
- King size seng
- Ensuite badeværelse
- Have-udsigt
- 9 faciliteter
- Kæledyr tilladt

## ✅ Test

```bash
# Start serveren
cd server && npm start

# Åbn i browser:
http://localhost:3000/overnatning.html

# Klik på "Se detaljer" for Kystværelse
# → Du skulle se alle detaljer, billeder, faciliteter, etc.
```

---

**Status:** ✅ Færdig og klar til brug!




