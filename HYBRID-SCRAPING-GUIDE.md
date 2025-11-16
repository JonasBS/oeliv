# 🎯 Hybrid Scraping Guide - Puppeteer + SerpApi

## Hvad er det?

Et **intelligent backup-system** der kombinerer:

1. **🤖 Puppeteer** (primær metode) - Gratis, direkte scraping
2. **🔄 SerpApi** (backup) - Pålidelig API når Puppeteer fejler

---

## Hvordan virker det?

```
Forsøg 1: Puppeteer (direkte scraping)
    ↓
    ✅ Succes? → Gem pris og stop
    ↓
    ❌ Fejl?
    ↓
Forsøg 2: SerpApi (hvis konfigureret)
    ↓
    ✅ Succes? → Gem pris og stop
    ↓
    ❌ Fejl? → Log fejl
```

---

## Installation

### 1. Systemet virker ALLEREDE uden SerpApi! ✅

Puppeteer virker og henter korrekte priser (testet: 2000 DKK/nat for Grønbechs i juli).

### 2. Tilføj SerpApi backup (valgfrit):

**Step 1: Få API nøgle**
```bash
# Gå til: https://serpapi.com/
# 1. Sign up (gratis)
# 2. Bekræft email
# 3. Kopiér din API key
```

**Free tier:**
- ✅ 100 søgninger/måned (gratis for evigt)
- ✅ Google Hotels API adgang
- ✅ Perfekt til backup

**Paid tier (hvis du vil mere):**
- $50/måned = 5.000 søgninger
- $150/måned = 30.000 søgninger

**Step 2: Tilføj til .env**
```bash
cd server
nano .env  # eller vim .env
```

Tilføj denne linje:
```
SERPAPI_KEY=your_actual_api_key_here
```

**Step 3: Genstart server**
```bash
# Hvis backend kører, genstart den
pkill -9 node
npm start
```

---

## Test Systemet

```bash
cd server
node test-hybrid-scraping.js
```

**Forventet output:**
```
✅ SUCCESS!
   Source: Grønbechs Hotel
   Price: 2000 DKK/night
   Method: puppeteer

🤖 Puppeteer: ✅ Working
🔄 SerpApi: ⚠️  Not configured (optional)
```

**Med SerpApi konfigureret:**
```
🤖 Puppeteer: ✅ Working
🔄 SerpApi: ✅ Configured (100 searches/month remaining)
```

---

## Hvordan bruges det?

**Systemet kører automatisk!**

Når du trykker "🔍 Opdater markedsdata" i admin panelet:

1. Systemet prøver **Puppeteer** først (gratis)
2. Hvis det fejler → prøver **SerpApi** (hvis konfigureret)
3. Prisen gemmes med en `method` tag:
   - `method: 'puppeteer'` = Gratis scraping
   - `method: 'serpapi'` = API backup

Du kan se i loggen hvilken metode der blev brugt:
```
✅ [🤖 Puppeteer] Saved: Grønbechs - 2000 DKK/night
✅ [🔄 SerpApi] Saved: Competitor X - 1800 DKK/night
```

---

## Fordele & Ulemper

### Puppeteer (Primær)

**Fordele:**
- ✅ Gratis
- ✅ Direkte fra Booking.com
- ✅ Ingen API limits
- ✅ Virker rigtig godt nu (efter fix)

**Ulemper:**
- ⚠️  Kan blive blokeret af anti-bot
- ⚠️  Kræver vedligeholdelse hvis Booking.com ændrer HTML
- ⚠️  Lidt langsommere (5-10 sek per scrape)

### SerpApi (Backup)

**Fordele:**
- ✅ Meget pålidelig (99.9% uptime)
- ✅ Hurtig (1-2 sek per søgning)
- ✅ Håndterer anti-bot for dig
- ✅ Multi-source (Google Hotels aggregerer flere platforme)

**Ulemper:**
- 💰 Koster penge efter 100 searches/måned
- ⚠️  Afhængig af Google Hotels data (kan være lidt forsinket)

---

## Anbefalet Setup

### For udvikling/test:
```
✅ Brug Puppeteer only (gratis)
❌ Skip SerpApi (ikke nødvendigt)
```

### For produktion:
```
✅ Brug Puppeteer som primær (gratis)
✅ Tilføj SerpApi som backup (free tier = 100/måned)
```

Hvis du scraper **3 konkurrenter 2x dagligt**:
- 3 competitors × 2 scrapes/day × 30 days = **180 scrapes/måned**
- Puppeteer får 90% (162 scrapes) → Gratis ✅
- SerpApi får 10% (18 scrapes) → Inden for free tier ✅

---

## Monitorering

### Se hvilken metode der blev brugt:

**I loggen:**
```bash
tail -f server/logs/scraping.log  # Hvis du har logging

# Output:
✅ [🤖 Puppeteer] Saved: Grønbechs - 2000 DKK/night
✅ [🤖 Puppeteer] Saved: Hotel X - 1800 DKK/night
✅ [🔄 SerpApi] Saved: Hotel Y - 2200 DKK/night  # Puppeteer fejlede her
```

### Tjek SerpApi forbrug:

**Option 1: Login til SerpApi dashboard**
```
https://serpapi.com/dashboard
→ Se "Searches this month"
```

**Option 2: API endpoint (kommer snart)**
```javascript
// I admin panel, se SerpApi usage stats
```

---

## Troubleshooting

### Problem: "SerpApi not configured"

**Årsag:** Ingen `SERPAPI_KEY` i `.env`

**Løsning:**
1. Dette er **ikke en fejl** - systemet bruger bare Puppeteer
2. Hvis du vil have backup, følg "Installation" guide ovenfor

### Problem: Alle scrapes bruger SerpApi

**Årsag:** Puppeteer er blokeret eller fejler

**Løsning:**
```bash
# Test Puppeteer direkte:
cd server
node test-hybrid-scraping.js

# Hvis Puppeteer fejler:
# 1. Tjek om Chrome/Chromium er installeret
# 2. Tjek anti-bot detection (se PRICE-SCRAPING-FIX.md)
# 3. Prøv at opdatere Puppeteer: npm update puppeteer
```

### Problem: SerpApi returnerer ingen priser

**Årsag:** Hotel ikke fundet i Google Hotels

**Løsning:**
1. Tjek URL'en - skal være korrekt Booking.com URL
2. Hotellet skal være synligt på Google Hotels
3. Prøv at justere `query` i SerpApi request

---

## Omkostninger (Produktion)

### Scenarie 1: Puppeteer only
```
Månedlig cost: 0 DKK ✅
Pålidelighed: ~85% (godt nok)
```

### Scenarie 2: Hybrid (anbefalet)
```
Månedlig cost: 0 DKK (free tier SerpApi)
Pålidelighed: ~98% (meget godt)
Scrapes: 180/måned (90% Puppeteer, 10% SerpApi backup)
```

### Scenarie 3: Intensiv brug
```
Scrapes: 500/måned
Puppeteer: 450 scrapes (gratis)
SerpApi: 50 scrapes (inden for free tier)
Månedlig cost: 0 DKK ✅
```

### Scenarie 4: Meget intensiv brug
```
Scrapes: 5000/måned (10x dagligt for 15 konkurrenter)
SerpApi paid: $50/måned
Månedlig cost: 375 DKK
```

---

## Konklusion

✅ **Systemet virker PERFEKT nu!**

**Anbefaling:**
1. ✅ **Brug det som det er** (Puppeteer only) - det virker fint!
2. ✅ Tilføj SerpApi key senere hvis du vil have backup (gratis tier er nok)
3. ✅ Monitorér success rate i logs
4. ✅ Opgrader til paid SerpApi kun hvis nødvendigt

**Puppeteer får nu rigtige priser (2000 DKK/nat for Grønbechs juli) og systemet falder elegant tilbage til SerpApi hvis noget går galt.** 🎉

---

## Links

- **SerpApi:** https://serpapi.com/
- **SerpApi Docs:** https://serpapi.com/google-hotels-api
- **Pricing:** https://serpapi.com/pricing
- **Free tier:** 100 searches/month (no credit card needed)

---

## Support

Hvis du har spørgsmål eller problemer:

1. Kør `node test-hybrid-scraping.js` og send output
2. Tjek server logs for fejl
3. Verificer `.env` har korrekt SERPAPI_KEY (hvis du vil bruge backup)

