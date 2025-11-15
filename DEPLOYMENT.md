# Deployment Guide - ØLIV Booking Engine

Guide til at deploye booking engine'en til en hosting service.

## Option 1: Railway (Anbefalet - Nemmest)

Railway er den nemmeste måde at deploye Node.js apps på.

### Trin 1: Opret Railway konto
1. Gå til [railway.app](https://railway.app)
2. Log ind med GitHub
3. Klik "New Project"
4. Vælg "Deploy from GitHub repo"
5. Vælg dit `oeliv` repository

### Trin 2: Konfigurer miljøvariabler
I Railway dashboard:
1. Gå til din app → Settings → Variables
2. Tilføj følgende variabler:
   ```
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://jonasbs.github.io/oeliv
   ```

### Trin 3: Deploy
Railway deployer automatisk når du pusher til `main` branch.

### Trin 4: Få din API URL
1. I Railway dashboard → Settings → Networking
2. Klik "Generate Domain" for at få en gratis URL
3. Kopier URL'en (fx: `https://oeliv-production.up.railway.app`)

### Trin 5: Opdater frontend
Opdater `booking.js` med din Railway API URL:

```javascript
const API_BASE = 'https://din-railway-url.railway.app/api';
// eller brug miljøvariabel:
const API_BASE = (window.API_BASE_URL || window.location.origin) + '/api';
```

---

## Option 2: Render

### Trin 1: Opret Render konto
1. Gå til [render.com](https://render.com)
2. Log ind med GitHub
3. Klik "New +" → "Web Service"
4. Vælg dit `oeliv` repository

### Trin 2: Konfigurer
- **Name:** `oeliv-booking-api`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Plan:** Free

### Trin 3: Miljøvariabler
I Environment Variables:
```
NODE_ENV=production
FRONTEND_URL=https://jonasbs.github.io/oeliv
```

### Trin 4: Deploy
Render deployer automatisk.

---

## Option 3: Fly.io

### Trin 1: Installer Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### Trin 2: Login
```bash
fly auth login
```

### Trin 3: Initialiser app
```bash
cd /workspace
fly launch
```

### Trin 4: Deploy
```bash
fly deploy
```

---

## Option 4: Vercel (Serverless)

Vercel kan køre Express apps som serverless functions.

### Trin 1: Installer Vercel CLI
```bash
npm i -g vercel
```

### Trin 2: Deploy
```bash
cd /workspace
vercel
```

### Trin 3: Opret `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

---

## Opdater Frontend til at bruge API

Efter deployment skal du opdatere `booking.js`:

```javascript
// I booking.js, ændr denne linje:
const API_BASE = 'https://din-api-url.com/api';
```

Eller brug en miljøvariabel i HTML:

```html
<script>
  window.API_BASE_URL = 'https://din-api-url.com';
</script>
<script src="booking.js"></script>
```

---

## Database på Production

SQLite filen (`bookings.db`) bliver gemt lokalt på serveren. For bedre performance og backup, overvej:

1. **Railway/Render:** Bruger persistent volumes automatisk
2. **PostgreSQL:** Opret en database service og opdater `server.js` til at bruge PostgreSQL i stedet for SQLite

---

## CORS Konfiguration

Hvis din frontend kører på `https://jonasbs.github.io/oeliv` og API på en anden domain, skal CORS være konfigureret korrekt (allerede sat op i `server.js`).

---

## Monitoring & Logs

- **Railway:** Dashboard → Logs
- **Render:** Dashboard → Logs
- **Fly.io:** `fly logs`

---

## Troubleshooting

### Database ikke fundet
- Tjek at `bookings.db` bliver oprettet
- Tjek file permissions på serveren

### CORS fejl
- Tjek `FRONTEND_URL` miljøvariabel
- Tjek at CORS middleware er sat op korrekt

### Port fejl
- Sørg for at `PORT` miljøvariabel er sat (hosting services sætter dette automatisk)

---

## Næste Skridt

1. Deploy backend til Railway/Render
2. Opdater `booking.js` med API URL
3. Test booking flow end-to-end
4. Konfigurer Stripe til betalinger
5. Sæt email op til bekræftelser
