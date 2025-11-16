# 📅 Sådan Scraper Du 10 Måneder Frem

## 🎯 3 Måder at Køre Scraping

### **Metode 1: Se alt output (Anbefalet første gang)**
```bash
cd server
./RUN-SCRAPING.sh
```
✅ Du ser alt der sker i real-time  
✅ Du ved præcis hvornår det er færdigt  
✅ Du kan følge med i progress (1/40, 2/40, osv.)  

**Hold vinduet åbent** - når scriptet stopper, er det færdigt! 🎉

---

### **Metode 2: Kør i baggrunden + tjek progress**

**Start scraping i baggrunden:**
```bash
cd server
node scrape-multiple-dates.js &
```

**Tjek status undervejs:**
```bash
cd server
./check-scraping-progress.sh
```

Output vil vise:
- 🔄 "Scraping is RUNNING..." (hvis det stadig kører)
- ✅ "Scraping is FINISHED!" (når det er færdigt)
- 📊 Antal priser og datoer scraped

**Kør check-scriptet igen og igen indtil det siger FINISHED!**

---

### **Metode 3: Direkte kommando (simpel)**
```bash
cd server
node scrape-multiple-dates.js
```

---

## ⏱️ Hvornår Er Det Færdigt?

### **Du ved det er færdigt når:**

1. **Scriptet stopper** og viser:
   ```
   ═══════════════════════════════════════
                FINAL SUMMARY
   ═══════════════════════════════════════
   ✅ Successfully scraped: 40/40
   📊 Total room prices saved: 160
   🎉 Done! Refresh admin panel...
   ```

2. **Eller brug check-scriptet:**
   ```bash
   ./check-scraping-progress.sh
   ```
   Når det siger "✅ Scraping is FINISHED!" er du klar!

3. **Eller tjek processen:**
   ```bash
   ps aux | grep scrape-multiple-dates
   ```
   Hvis der ingen output er, er det færdigt!

---

## 📊 Forventet Tid

- **40 datoer** bliver scraped
- **Hver dato** tager ca. 5-7 sekunder
- **Total tid:** 3-5 minutter

**Progress:**
```
[1/40]   ✅ 2025-11-16 → 2025-11-19
[2/40]   ✅ 2025-11-23 → 2025-11-26
[3/40]   ✅ 2025-11-30 → 2025-12-03
...
[40/40]  ✅ 2026-08-16 → 2026-08-19

🎉 Done!
```

---

## 🎉 Efter Scraping Er Færdig

**Åbn admin panelet:**
```
http://localhost:3000/admin-react.html
```

**Gå til:** Revenue Management → Se priskalenderen

**Du vil nu se:**
- 📅 10 måneders data i kalenderen
- 💰 Priser for hver uge
- 🏠 Alle værelsestyper
- 🔍 Funktionelle filtre

---

## 🆘 Fejlfinding

### **Scraping crasher?**
```bash
# Tjek om backend kører
lsof -i :3000

# Genstart backend hvis nødvendigt
cd server
npm start
```

### **Ingen data efter scraping?**
```bash
# Tjek database direkte
cd server
sqlite3 src/database/database.sqlite "SELECT COUNT(*) FROM competitor_prices;"
```

### **Vil du scrape igen?**
```bash
# Slet gamle data først
node refresh-competitor-data.js

# Kør så scraping
./RUN-SCRAPING.sh
```

---

## 💡 Tips

- ☕ Tag en kop kaffe mens det kører (3-5 min)
- 👀 Hold øje med output - det er interessant!
- 📊 Du ser priser opdatere i real-time
- 🔄 Kan afbrydes med Ctrl+C hvis nødvendigt

