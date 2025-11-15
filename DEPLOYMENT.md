# 🚀 Deployment Guide - ØLIV Website

## Hurtig Deployment (Anbefalet)

### Option 1: Netlify Drop (Nemmest - 30 sekunder)

1. Gå til [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag & drop `index.html` filen direkte på siden
3. Done! Du får et live URL med det samme
4. Valgfrit: Tilføj custom domain i Netlify settings

**Fordele:**
- Gratis
- SSL inkluderet
- Instant deployment
- CDN inkluderet
- Ingen configuration nødvendig

---

### Option 2: Vercel (Anbefalet for Git Integration)

**Via CLI:**
```bash
# Installer Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**Via Website:**
1. Gå til [vercel.com](https://vercel.com)
2. Import dit Git repository
3. Vercel detecter automatisk det er en static site
4. Deploy!

**Fordele:**
- Gratis for personal projects
- Automatisk deployment ved git push
- Edge network (super hurtig)
- Custom domains
- SSL inkluderet

---

### Option 3: GitHub Pages (God til Open Source)

1. Push din kode til GitHub
2. Gå til repository Settings → Pages
3. Vælg:
   - Source: **Deploy from branch**
   - Branch: **main** (eller din branch)
   - Folder: **/ (root)**
4. Klik Save
5. Dit site vil være live på: `https://<username>.github.io/<repo>/`

**Custom Domain Setup:**
- Tilføj en fil kaldet `CNAME` med dit domain
- Opdater DNS records hos din domain provider

**Fordele:**
- Gratis
- Direkte integration med Git
- God til dokumentation/portfolios

---

### Option 4: Cloudflare Pages (Hurtigst Globalt)

1. Gå til [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect dit Git repository
3. Build settings:
   - Build command: (tom)
   - Output directory: `/`
4. Deploy!

**Fordele:**
- Gratis
- Verdens hurtigste CDN
- Unlimited bandwidth
- Automatisk SSL
- DDoS protection

---

## Avanceret Deployment

### Option 5: Traditional Hosting (cPanel/FTP)

Hvis du har traditional web hosting:

1. **Via FTP:**
   ```
   - Connect til din server via FTP (FileZilla, Cyberduck, etc.)
   - Upload index.html til public_html/ eller www/
   - Done!
   ```

2. **Via cPanel File Manager:**
   - Log ind på cPanel
   - Gå til File Manager
   - Naviger til public_html/
   - Upload index.html
   - Set permissions til 644
   - Besøg dit domain

---

### Option 6: AWS S3 + CloudFront

For enterprise-level hosting:

```bash
# Opret S3 bucket
aws s3 mb s3://oliv-website

# Upload filen
aws s3 cp index.html s3://oliv-website/ --acl public-read

# Enable static website hosting
aws s3 website s3://oliv-website/ --index-document index.html

# Optional: Setup CloudFront for CDN
aws cloudfront create-distribution --origin-domain-name oliv-website.s3.amazonaws.com
```

---

### Option 7: Docker Container (For Full Control)

**Dockerfile:**
```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Deploy:**
```bash
# Build
docker build -t oliv-website .

# Run locally
docker run -p 8080:80 oliv-website

# Deploy til cloud
docker push your-registry/oliv-website
```

---

## Custom Domain Setup

### Når du har deployed:

**1. Køb et domain (hvis du ikke har et):**
   - [Namecheap](https://www.namecheap.com)
   - [GoDaddy](https://www.godaddy.com)
   - [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)

**2. Point domain til din deployment:**

For **Netlify/Vercel/Cloudflare Pages:**
- De giver dig CNAME records at tilføje
- Tilføj i din domain provider's DNS settings

For **GitHub Pages:**
```
Type: A
Name: @
Value: 185.199.108.153
      185.199.109.153
      185.199.110.153
      185.199.111.153

Type: CNAME
Name: www
Value: <username>.github.io
```

**3. Enable SSL:**
- Alle moderne hosting providers tilbyder gratis SSL (Let's Encrypt)
- Det aktiveres automatisk i de fleste tilfælde

---

## Performance Optimering Post-Deployment

### 1. Tilføj Analytics
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Test Performance
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

### 3. SEO Checklist
- ✅ Descriptive title tag
- ✅ Meta description
- ✅ Alt text på alle billeder
- ✅ Semantic HTML
- ✅ Mobile-friendly
- ✅ Fast load time
- Add: Sitemap.xml
- Add: Robots.txt
- Add: Open Graph tags for social sharing

---

## Troubleshooting

### Problem: 404 Error
**Solution:** Check at index.html er i root directory

### Problem: Billeder loader ikke
**Solution:** Check CORS settings og URL paths er korrekte

### Problem: Styling ser forkert ud
**Solution:** Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### Problem: Custom domain virker ikke
**Solution:** 
- Tjek DNS propagation (kan tage op til 48 timer)
- Brug [DNS Checker](https://dnschecker.org/)
- Verificer DNS records er korrekte

---

## Anbefalinger

**For dette projekt (ØLIV):**

1. **Bedst for simplicitet:** Netlify Drop
2. **Bedst for professionelt:** Vercel med Git integration
3. **Bedst for hastighed:** Cloudflare Pages
4. **Bedst for budget:** GitHub Pages (100% gratis)

**Min anbefaling:** Start med **Vercel** eller **Netlify** - de er gratis, hurtige og professionelle.

---

## Næste Skridt

1. Vælg en deployment platform ovenfor
2. Deploy dit site
3. Test på forskellige devices
4. Tilføj custom domain
5. Enable analytics
6. Del link med kunder! 🎉

---

Brug for hjælp? Lad mig vide hvilken platform du vælger, så kan jeg guide dig gennem processen!
