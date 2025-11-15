# Quick Deploy Guide - Railway (5 minutter)

## Hurtigste vej til live booking engine:

### 1. Gå til Railway
👉 [railway.app](https://railway.app) → Log ind med GitHub

### 2. Opret nyt projekt
- Klik "New Project"
- Vælg "Deploy from GitHub repo"
- Vælg `JonasBS/oeliv`

### 3. Vent på deploy
Railway finder automatisk `package.json` og deployer.

### 4. Få din API URL
- I Railway dashboard → din app → Settings → Networking
- Klik "Generate Domain"
- Kopier URL'en (fx: `https://oeliv-production.up.railway.app`)

### 5. Opdater frontend
I `index.html`, find denne linje (ca. linje 457):
```html
<!-- <script>window.API_BASE_URL = 'https://your-api-url.railway.app';</script> -->
```

Og ændr til din Railway URL:
```html
<script>window.API_BASE_URL = 'https://din-railway-url.railway.app';</script>
```

### 6. Commit og push
```bash
git add index.html
git commit -m "Update API URL for Railway"
git push origin main
```

### 7. Test!
Gå til `https://jonasbs.github.io/oeliv` og test booking modalen.

---

## Gratis tier limits:
- ✅ 500 timer/måned (mere end nok)
- ✅ $5 gratis kredit
- ✅ Automatisk HTTPS
- ✅ Custom domain muligt

---

## Hvis du får fejl:

**"Cannot connect to API"**
- Tjek at Railway appen kører (grøn status)
- Tjek at API URL er korrekt i `index.html`
- Tjek Railway logs for fejl

**"CORS error"**
- I Railway → Settings → Variables
- Tilføj: `FRONTEND_URL=https://jonasbs.github.io/oeliv`

**"Database error"**
- SQLite filen oprettes automatisk første gang
- Tjek Railway logs hvis der er problemer

---

## Næste skridt efter deploy:
1. ✅ Test booking flow
2. 🔄 Tilføj Stripe til betalinger
3. 🔄 Sæt email op til bekræftelser
4. 🔄 Initialiser tilgængelighed for værelser
