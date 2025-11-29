# 📸 Billede Upload Guide

## Oversigt

Dit admin panel understøtter nu **direkte upload af værelsesbilleder** fra din computer. Billeder gemmes på serveren og kan administreres gennem admin panelet.

## 🎯 To Måder at Tilføje Billeder

### Option 1: Upload fra Computer (Anbefalet!)
1. Åbn admin panelet → **Værelser**
2. Klik **"✏️ Rediger & konfigurer channels"** på et værelse
3. Klik **"📤 Upload fra computer"**
4. Vælg et billede fra din computer
5. Vent på upload (du ser "⏳ Uploader...")
6. ✅ Billedet er nu uploadet og preview vises
7. Klik **"💾 Gem ændringer"**

### Option 2: Indsæt URL
1. Åbn admin panelet → **Værelser**
2. Klik **"✏️ Rediger & konfigurer channels"**
3. Indsæt URL i **"Billede URL"** feltet
4. Preview vises automatisk
5. Klik **"💾 Gem ændringer"**

## ✅ Understøttede Formater

- **JPEG/JPG** ✅
- **PNG** ✅
- **WebP** ✅
- **GIF** ✅

## 📏 Begrænsninger

- **Max filstørrelse**: 10MB
- **Anbefalet bredde**: Mindst 800px
- **Anbefalet format**: Landskab (16:9 eller 4:3)

## 💾 Hvor Gemmes Billeder?

Uploadede billeder gemmes i:
```
/uploads/rooms/
```

Hver fil får et unikt navn:
```
værelsenavn-timestamp-randomid.jpg
```

Eksempel:
```
kystværelse-1763313123027-869813413.jpg
```

## 🔗 Billede URLs

Efter upload får du automatisk en URL som:
```
/uploads/rooms/kystværelse-1763313123027-869813413.jpg
```

Dette gemmes automatisk i databasen når du klikker "Gem ændringer".

## 🎨 Best Practices

### 1. Billedkvalitet
- **Brug high-quality billeder** (mindst 800px bred)
- **Optimér filstørrelse** før upload (brug komprimering)
- **Konsistent stil** for alle værelser

### 2. Billedformat
- **Landskab format** fungerer bedst (16:9 eller 4:3)
- **Undgå portræt format** (for smalt til kort)
- **Centreret komposition** (vigtige elementer i midten)

### 3. Indhold
- **Vis værelset tydeligt** (ikke kun detaljer)
- **God belysning** (naturligt dagslys er bedst)
- **Ryddeligt og rent** (gør klar til fotografering)
- **Ingen personer** (fokus på værelset)

## 🔄 Udskiftning af Billeder

Sådan udskifter du et eksisterende billede:

1. **Åbn værelse i edit-mode**
2. **Upload nyt billede** (det gamle overskrives ikke automatisk)
3. **Slet gammelt billede** (valgfrit, for at spare plads)
4. **Gem ændringer**

## 🗑️ Sletning af Billeder

### Via Admin Panel (Fremtidig Feature)
Kommende feature: Slet billeder direkte fra admin panelet.

### Via Server
For nu kan du slette billeder manuelt:
```bash
cd /Users/jonasbaggersorensen/Documents/ØLIV/oeliv/uploads/rooms
rm gammelt-billede.jpg
```

## 🌐 Produktion (Railway)

### Vigtigt!
Uploadede filer gemmes **lokalt** på serveren. Når du deployer til Railway:

1. **Filer slettes** ved hver ny deploy
2. **Løsning**: Brug cloud storage (S3, Cloudinary, etc.)

### Anbefalet til Produktion

#### Option A: Cloudinary (Nemmest)
- Gratis tier: 25GB storage, 25GB bandwidth
- Automatisk image optimization
- CDN inkluderet
- [cloudinary.com](https://cloudinary.com)

#### Option B: AWS S3
- Betaling per brug
- Meget pålidelig
- Kræver mere setup

#### Option C: Railway Persistent Storage
- Railway tilbyder volumes til persistent storage
- Kræver konfiguration i `railway.json`

## 🔧 Backend API

### Upload Endpoint
```
POST /api/upload/room-image
Content-Type: multipart/form-data

Body:
- image: [file]
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "/uploads/rooms/filename.jpg",
  "filename": "filename.jpg",
  "size": 32700,
  "message": "Billede uploaded succesfuldt"
}
```

### Delete Endpoint (For Fremtidig Brug)
```
DELETE /api/upload/room-image/:filename
```

**Response:**
```json
{
  "success": true,
  "message": "Billede slettet"
}
```

## 📊 Eksempel Workflow

### Scenarie: Tilføj billeder til alle værelser

1. **Forbered billeder**:
   - Tag eller saml 5 billeder (et per værelse)
   - Omdøb til: `kystværelse.jpg`, `havsuite.jpg`, etc.
   - Optimér størrelse (max 2MB hver)

2. **Upload**:
   - Åbn admin → Værelser
   - For hvert værelse:
     - Klik "Rediger"
     - Upload billede
     - Tilføj beskrivelse
     - Gem

3. **Verificer**:
   - Gå tilbage til Værelser-oversigten
   - Se at alle billeder vises korrekt

## 🐛 Fejlfinding

### "Kun billedfiler er tilladt"
- Du forsøger at uploade en ikke-billedfil
- Tjek at filtypen er JPEG, PNG, WebP eller GIF

### "Billedet er for stort (max 10MB)"
- Din fil er over 10MB
- Komprimer billedet før upload
- Brug værktøjer som [tinypng.com](https://tinypng.com)

### "Upload fejlede"
- Tjek din internetforbindelse
- Prøv med en mindre fil
- Tjek browser-konsollen for fejl

### Billede vises ikke i preview
- Vent et øjeblik efter upload
- Tjek URL'en er korrekt
- Genindlæs siden

## 💡 Pro Tips

1. **Bulk Upload**: Upload alle billeder på én gang ved at åbne flere værelser i tabs
2. **Genbrugelige URLs**: Brug samme billede URL for flere værelser hvis relevant
3. **Backup**: Gem originale billeder på din computer som backup
4. **Optimering**: Brug WebP format for bedre komprimering
5. **Placering**: Gem originale billeder i en `originals/` mappe på din computer

## 🚀 Fremtidige Features

- [ ] Drag & drop upload
- [ ] Bulk upload (flere billeder på én gang)
- [ ] Billedgalleri (flere billeder per værelse)
- [ ] Auto-crop til optimal størrelse
- [ ] Cloud storage integration (Cloudinary/S3)
- [ ] Slet billeder direkte fra admin panel
- [ ] Billedredigering (crop, rotate, filter)

---

**Version**: 1.0  
**Opdateret**: 16. november 2025




