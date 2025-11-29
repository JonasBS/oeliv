# ØLIV Website - Next.js

Moderne, SEO-optimeret website til ØLIV Farm Hospitality på Bornholm.

## 🚀 Features

- **Next.js 16** med App Router og Turbopack
- **Flersproget** (Dansk, Engelsk, Tysk) med next-intl
- **SEO-optimeret** med sitemap, robots.txt og structured data
- **Tailwind CSS** for styling
- **TypeScript** for type-sikkerhed
- **Responsive design** med mobile-first approach
- **Booking modal** med kalender og multi-step form
- **Billede optimering** med next/image

## 📁 Struktur

```
oeliv-website/
├── src/
│   ├── app/
│   │   ├── [locale]/           # Locale-baseret routing
│   │   │   ├── page.tsx        # Forside
│   │   │   ├── bryggeri/       # Bryggeri side
│   │   │   ├── spa/            # Spa side
│   │   │   ├── overnatning/    # Overnatning side
│   │   │   └── om-os/          # Om os side
│   │   ├── sitemap.ts          # Dynamisk sitemap
│   │   └── robots.ts           # Robots.txt
│   ├── components/             # React komponenter
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── BookingModal.tsx
│   │   └── ...
│   └── i18n/                   # Internationalisering
│       ├── config.ts
│       ├── routing.ts
│       └── request.ts
├── messages/                   # Oversættelsesfiler
│   ├── da.json
│   ├── en.json
│   └── de.json
└── public/                     # Statiske filer
```

## 🛠️ Installation

```bash
cd oeliv-website
npm install
```

## 🏃 Udvikling

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i browseren.

## 🏗️ Build

```bash
npm run build
npm start
```

## 🌐 Sprog

Website understøtter tre sprog:
- **Dansk** (default): `/`, `/bryggeri`, `/spa`, etc.
- **Engelsk**: `/en`, `/en/brewery`, `/en/spa`, etc.
- **Tysk**: `/de`, `/de/brauerei`, `/de/spa`, etc.

## 🔗 API Integration

Website kan forbindes til backend API'en for:
- Booking-forespørgsler
- Værelsesdata
- Tilgængelighed
- Oplevelsesguide

Konfigurer API URL i `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📊 SEO

- Automatisk sitemap generation
- Structured data (JSON-LD) for LodgingBusiness
- Open Graph og Twitter meta tags
- Hreflang tags for flersproget SEO
- Robots.txt konfiguration

## 🎨 Design System

Farver (CSS variables):
- `--charcoal`: #111315
- `--olive`: #46552a
- `--beige`: #d1bca0
- `--cream`: #f5f0e9
- `--muted`: #9a8f82

Fonte:
- Display: Fraunces (serif)
- Body: Inter (sans-serif)

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🚀 Deployment

Anbefalet hosting:
- **Vercel** (gratis tier tilgængelig)
- **Netlify**
- **Docker** container

### Vercel Deployment

```bash
npm install -g vercel
vercel
```

## 📝 License

Proprietary - ØLIV
