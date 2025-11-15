# 🚀 DEPLOY ØLIV WEBSITE NU - 3 Nemme Metoder

## ⚡ METODE 1: Vercel (Anbefalet - 2 minutter)

### Via Browser (Nemmest):

1. **Gå til:** [vercel.com](https://vercel.com)
2. **Log ind** med GitHub
3. **Klik "Add New Project"**
4. **Vælg dit repository:** `JonasBS/-liv`
5. **Klik "Deploy"** (Vercel finder automatisk index.html)
6. **✅ DONE!** Dit site er live!

**Dit site URL:**  
`https://liv-vercel-app.vercel.app` (eller custom domain)

---

### Via CLI (hvis du er teknisk):

```bash
# Du er allerede i /workspace mappen

# Login til Vercel
vercel login

# Deploy til production
vercel --prod

# Følg prompten og vælg:
# - Setup and deploy? Yes
# - Which scope? Dit username
# - Link to existing project? No
# - Project name? oliv-bornholm (eller hvad du vil)
# - Directory to deploy? ./
# - Override settings? No
```

**✅ Done!** Du får et live URL med det samme.

---

## ⚡ METODE 2: Netlify (Også super nemt)

### Via Browser (Drag & Drop):

1. **Gå til:** [app.netlify.com/drop](https://app.netlify.com/drop)
2. **Drag `index.html` filen** direkte på siden
3. **✅ DONE!** Live på sekunder!

**Du får et URL som:**  
`https://random-name-123.netlify.app`

**For at ændre sitenavn:**
- Klik "Site settings"
- Klik "Change site name"
- Vælg: `oliv-bornholm` (hvis ledig)
- Nu: `https://oliv-bornholm.netlify.app`

---

### Via GitHub Integration (Automatisk deployment):

1. **Gå til:** [app.netlify.com](https://app.netlify.com)
2. **Log ind** med GitHub
3. **Klik "Add new site" → "Import an existing project"**
4. **Vælg GitHub** → Find dit repo: `JonasBS/-liv`
5. **Build settings:**
   - Build command: (lad være tom)
   - Publish directory: `/`
6. **Klik "Deploy"**

**✅ Done!** Nu deployer dit site automatisk hver gang du pusher til GitHub.

---

## ⚡ METODE 3: GitHub Pages (100% Gratis)

### Setup (5 minutter):

1. **Gå til dit GitHub repo:**  
   [github.com/JonasBS/-liv](https://github.com/JonasBS/-liv)

2. **Klik "Settings"** (øverst til højre)

3. **Klik "Pages"** (i venstre menu)

4. **Under "Source":**
   - Vælg: **Deploy from a branch**
   - Branch: **cursor/enhance-farm-hospitality-website-experience-e313** (din nuværende branch)
   - Folder: **/ (root)**
   - Klik **Save**

5. **Vent 1-2 minutter**

6. **Refresh siden** - du vil se:  
   "Your site is live at https://jonasbs.github.io/-liv/"

**✅ Done!** Dit site er nu live på GitHub Pages.

---

## 🎯 Hvilken skal du vælge?

| Platform | Hastighed | Automatisk Deploy | Custom Domain | Anbefaling |
|----------|-----------|-------------------|---------------|------------|
| **Vercel** | ⚡⚡⚡ Hurtigst | ✅ Ja (via Git) | ✅ Gratis | **Bedst for professionelt** |
| **Netlify** | ⚡⚡ Meget hurtig | ✅ Ja (via Git) | ✅ Gratis | **Bedst for simplicitet** |
| **GitHub Pages** | ⚡ Hurtig | ✅ Ja (automatisk) | ✅ Via CNAME | **Bedst for gratis/open source** |

---

## 📱 Hvad sker der efter deployment?

1. **Du får et live URL** - Del med kunder!
2. **SSL aktiveres automatisk** (HTTPS)
3. **CDN aktiveret** - Hurtig loading globalt
4. **Hver git push deployer automatisk** (hvis du vælger Git integration)

---

## 🌐 Tilføj Custom Domain (efter deployment)

### Når du køber et domain (fx oliv-bornholm.dk):

**For Vercel:**
1. Vercel dashboard → Settings → Domains
2. Tilføj dit domain
3. Opdater DNS hos din domain provider (Vercel giver dig DNS records)

**For Netlify:**
1. Netlify dashboard → Domain settings
2. Add custom domain
3. Opdater DNS (Netlify giver dig DNS records)

**For GitHub Pages:**
1. Tilføj en fil kaldet `CNAME` i repo root med dit domain
2. Opdater DNS med A records:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

---

## 🔥 MIN ANBEFALING

**Start med Vercel via browser:**
1. Gå til [vercel.com](https://vercel.com)
2. Log ind med GitHub
3. Import `JonasBS/-liv` repository
4. Klik Deploy
5. **DONE i 2 minutter!**

---

## 💪 BONUS: Preview dit site lokalt først

Vil du se det før deployment?

```bash
# Start en lokal server
npx serve

# Eller brug Python (hvis installeret)
python3 -m http.server 8000

# Åbn i browser:
http://localhost:8000
```

---

## 🆘 Problemer?

**"Billeder loader ikke"**
→ Hard refresh: `Ctrl+Shift+R` (Windows) eller `Cmd+Shift+R` (Mac)

**"Custom domain virker ikke"**
→ DNS kan tage op til 48 timer at propagere. Tjek på [dnschecker.org](https://dnschecker.org)

**"404 error"**
→ Tjek at `index.html` er i root directory (det er det!)

---

## ✅ Checklist Efter Deployment

- [ ] Site er live på URL
- [ ] Alle billeder loader
- [ ] Booking modal virker
- [ ] Mobil responsivt
- [ ] SSL aktiveret (HTTPS)
- [ ] Del link med venner/kunder!

---

**Klar? Vælg en metode ovenfor og deploy nu! 🚀**

Brug for hjælp? Jeg er her! 💪
