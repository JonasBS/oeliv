# 🎯 Sådan får du KORREKTE priser fra Booking.com

## 🔴 Problem: Kalender-priser vs. Rigtige priser

Som du opdagede:
1. **Kalender viser cirkapriser**: 900 kr, 1.1K kr
2. **Efter "Søg" vises rigtig pris**: F.eks. 1.500 kr

Vores scraper skal bruge den **RIGTIGE pris efter søgning**.

## ✅ Løsning: Brug den korrekte URL-type

### ❌ FORKERT URL (Kalender-pris):
```
https://www.booking.com/hotel/dk/gronbechs.da.html
```
Dette viser kun CIRKA-priser i kalenderen.

### ✅ RIGTIG URL (Søgeresultat med valgte datoer):

Der er 2 gode måder:

#### **Metode 1: Hotel-side med søgeparametre** ⭐ ANBEFALET
```
https://www.booking.com/hotel/dk/gronbechs.da.html?checkin=2026-03-15&checkout=2026-03-18&group_adults=2&no_rooms=1&selected_currency=DKK
```

#### **Metode 2: Søgeresultat-side**
```
https://www.booking.com/searchresults.da.html?ss=Allinge&checkin=2026-03-15&checkout=2026-03-18&group_adults=2&dest_id=-2739235&dest_type=city
```

## 📋 Sådan får du den RIGTIGE URL:

### Step-by-Step Guide:

#### **1. Åbn Booking.com**
Gå til: https://www.booking.com

#### **2. Søg efter hotellet**
- Indtast destination: "Grønbechs Hotel" eller "Allinge"
- Vælg datoer: F.eks. 15. marts - 18. marts 2026
- Vælg gæster: 2 voksne, 1 værelse
- Klik **"Søg"**

#### **3. Find hotellet i resultaterne**
- Klik på hotelnavnet
- Du kommer til hotelsiden MED dine søgeparametre

#### **4. Kopier URL'en fra adresselinjen**
URL'en ser nu ud som:
```
https://www.booking.com/hotel/dk/gronbechs.da.html?checkin=2026-03-15&checkout=2026-03-18&group_adults=2&group_children=0&no_rooms=1&selected_currency=DKK&[masse andre parametre]
```

#### **5. Brug denne URL i systemet**
- Gå til Admin Panel → Revenue Management
- Konkurrent-konfiguration → Tilføj konkurrent
- Indsæt URL'en
- Klik "Gem"

## 🎯 Vigtigt: URL-parametre forklaret

```
https://www.booking.com/hotel/dk/gronbechs.da.html?
  checkin=2026-03-15           ← Check-in dato
  &checkout=2026-03-18         ← Check-out dato
  &group_adults=2              ← Antal voksne
  &group_children=0            ← Antal børn
  &no_rooms=1                  ← Antal værelser
  &selected_currency=DKK       ← Valuta (DKK = danske kroner)
```

**OBS:** Systemet tilføjer automatisk datoer hvis de mangler, MEN:
- Det er BEDRE at bruge en URL med datoer du selv valgte
- Så får du præcis de priser du sammenligner med

## 🔄 Automatisk opdatering af datoer

Vores system erstatter automatisk gamle datoer med nye:

**Din URL:**
```
checkin=2026-03-15&checkout=2026-03-18
```

**System opdaterer til:**
```
checkin=2025-11-17&checkout=2025-11-20  ← I morgen + 3 nætter
```

Dette sikrer altid AKTUELLE priser! 📅

## 🧪 Test at det virker:

### 1. Manuel test
Åbn URL'en i din browser:
```
https://www.booking.com/hotel/dk/gronbechs.da.html?checkin=2025-11-17&checkout=2025-11-20&group_adults=2&no_rooms=1
```

Ser du en SPECIFIK pris (ikke kalender-circa)? ✅

### 2. Scraping test
Admin Panel → Revenue Management → "🔍 Opdater markedsdata"

Check logs:
```bash
tail -f /tmp/oeliv-dated-scraping.log
```

Se om prisen matcher det du så manuelt!

## 💡 Pro Tips:

### Tip 1: Brug samme periode
Hvis du vil sammenligne priser for en weekend i april:
- Sæt ALLE konkurrent-URL'er til samme periode
- F.eks. 11-13 april 2026
- Så får du 100% sammenlignelige priser

### Tip 2: Match værelsestype
- Hvis du vil sammenligne dit "Deluxe værelse"
- Find lignende værelser hos konkurrenter
- Klik ind på det SPECIFIKKE værelse
- Kopier URL'en

### Tip 3: Bookmark URL'er
Hvis du finder en god URL:
1. Test at den virker
2. Gem den i systemet
3. Systemet opdaterer datoer automatisk fremover

## ⚠️ Hvad du IKKE skal bruge:

### ❌ Forsiden:
```
https://www.booking.com/
```

### ❌ Hotel uden datoer:
```
https://www.booking.com/hotel/dk/gronbechs.da.html
```

### ❌ Billeder/detaljer side:
```
https://www.booking.com/hotel/dk/gronbechs.da.html#map
```

## 🎯 Quick Reference:

| Situation | URL-type | Eksempel |
|-----------|----------|----------|
| ❌ Forkert | Hotel uden datoer | `booking.com/hotel/dk/gronbechs.da.html` |
| ⚠️  OK | System tilføjer datoer | Systemet gør det automatisk |
| ✅ Bedst | Hotel med dine datoer | `...gronbechs.da.html?checkin=2026-03-15&...` |
| ✅ Perfekt | Specifikt værelse | `...#room_config_id=123&...` |

## 🚀 Next Steps:

1. **Opdater dine konkurrent-URL'er**
   - Brug metoden beskrevet ovenfor
   - Få URL'er MED søgeparametre

2. **Test scraping**
   - Klik "Opdater markedsdata"
   - Sammenlign med manuel check

3. **Verificer priser**
   - Se om scraped priser matcher virkeligheden
   - Juster hvis nødvendigt

4. **Kør dagligt**
   - Systemet holder datoer opdateret
   - Du får altid friske markedspriser

---

## ❓ Spørgsmål?

**Q: Skal jeg opdatere URL'erne manuelt hver dag?**
A: NEJ! Systemet opdaterer datoerne automatisk til "i morgen + 3 nætter".

**Q: Hvad hvis Booking.com ændrer deres URL-format?**
A: Vores scraper har flere fallback-metoder og kan finde priser på forskellige måder.

**Q: Kan jeg bruge URL'er fra Booking.com appen?**
A: Ja, men brug desktop-URL'er for bedst resultat. App-URL'er kan være anderledes.

**Q: Skal jeg bruge .da.html eller .com?**
A: .da.html viser danske priser i DKK - brug den! 🇩🇰

