# Revenue Management & Competitor Intelligence - Production Implementation

## 🚀 System Overview

This is a complete, production-ready revenue management system with:

1. **Web Scraping** - Automated competitor price monitoring
2. **AI Price Optimization** - Intelligent pricing recommendations
3. **Dynamic Pricing** - Per-room, per-date pricing control
4. **Market Intelligence** - Real-time market insights dashboard

## 📦 Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

New dependencies added:
- `puppeteer` - Headless browser for web scraping
- `cheerio` - HTML parsing
- `axios` - HTTP requests
- `@tensorflow/tfjs-node` - Machine learning (optional)
- `node-cron` - Scheduled tasks

### 2. Database Setup

The system will automatically create all necessary tables on first run:

- `competitor_prices` - Stores scraped competitor pricing
- `competitor_config` - Competitor URLs and settings
- `dynamic_pricing` - Per-room, per-date prices
- `price_changes` - Audit log of all price changes
- `pricing_settings` - Auto-pricing configuration
- `price_recommendations` - AI recommendation history

## 🔧 Configuration

### 1. Add Competitor URLs

Use the admin panel or API to add competitors:

```javascript
POST /api/revenue/competitors/config
{
  "source": "Booking.com",
  "url": "https://www.booking.com/hotel/dk/your-competitor.da.html",
  "room_mapping": "{\"double\": 1, \"suite\": 2}",
  "scraping_interval": 360  // minutes
}
```

### 2. Configure Pricing Settings

```javascript
PATCH /api/revenue/pricing/settings
{
  "auto_apply_enabled": false,  // Enable auto-pricing
  "min_price_percentage": 80,    // Min 80% of base price
  "max_price_percentage": 150,   // Max 150% of base price
  "notification_email": "admin@oeliv.dk"
}
```

## 🎯 API Endpoints

### Competitor Data

```javascript
// Get latest competitor prices
GET /api/revenue/competitors/prices

// Get historical data
GET /api/revenue/competitors/history?days=30

// Trigger manual scraping
POST /api/revenue/competitors/scrape
{
  "competitors": [
    { "source": "Booking.com", "url": "..." },
    { "source": "Airbnb", "url": "..." }
  ]
}

// Manage competitor configs
GET    /api/revenue/competitors/config
POST   /api/revenue/competitors/config
PATCH  /api/revenue/competitors/config/:id
DELETE /api/revenue/competitors/config/:id
```

### Price Recommendations

```javascript
// Get recommendations for all rooms (next 7 days)
GET /api/revenue/pricing/recommendations?days=7

// Get recommendation for specific room/date
GET /api/revenue/pricing/recommendations/:roomId?date=2025-12-20

// Apply recommended price
POST /api/revenue/pricing/apply
{
  "room_id": 1,
  "target_date": "2025-12-20",
  "new_price": 1450
}
```

### Market Insights

```javascript
// Get market insights (next 7 days)
GET /api/revenue/market/insights?days=7
```

## 🤖 Automated Scraping

### Option A: Cron Job (Recommended)

Add to your server startup:

```javascript
import cron from 'node-cron';
import CompetitorScraper from './services/competitor-scraper.js';

// Run every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Starting competitor scraping...');
  
  const scraper = new CompetitorScraper(db);
  const competitors = await getActiveCompetitors();
  
  await scraper.scrapeAll(competitors);
  
  console.log('✅ Scraping completed');
});
```

### Option B: External Cron

Add to your system crontab:

```bash
# Run every 6 hours
0 */6 * * * curl -X POST http://localhost:3000/api/revenue/competitors/scrape
```

## 🧠 Price Optimization Algorithm

The AI considers multiple factors:

1. **Competitor Prices** (40% weight)
   - Average competitor price
   - Min/max prices
   - Availability status

2. **Demand Level** (30% weight)
   - Historical occupancy
   - Booking lead time
   - Seasonal patterns

3. **Time Factors** (20% weight)
   - Day of week (weekend premium)
   - Seasonality multiplier
   - Last-minute pricing

4. **External Events** (10% weight)
   - Local events calendar
   - Holidays
   - Special occasions

### Pricing Logic

```
OptimalPrice = CompetitorAvg × DemandMultiplier × SeasonMultiplier × DayOfWeekMultiplier

Where:
- DemandMultiplier: 0.85 (very_low) to 1.25 (very_high)
- SeasonMultiplier: 0.9 (low season) to 1.25 (high season)
- DayOfWeekMultiplier: 1.0 (weekday) to 1.15 (weekend)

Final price is clamped between 80-130% of competitor average
```

## 🔒 Security Considerations

### 1. Rate Limiting

Implement rate limiting for scraping:

```javascript
// Delay between requests
await new Promise(resolve => setTimeout(resolve, 2000));
```

### 2. User Agent Rotation

```javascript
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
];

await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
```

### 3. Proxy Support (Optional)

For high-volume scraping, consider using proxies to avoid IP bans.

## 📊 Monitoring & Alerts

### Email Notifications

Set up email alerts for:
- Large price changes (> 20%)
- Scraping failures
- Competitor price spikes
- Low confidence recommendations

### Logging

All activities are logged:
- `competitor_prices` - Every scraped price
- `price_changes` - Every price update
- `price_recommendations` - Every AI recommendation

## 🚦 Testing

### 1. Test Scraping

```bash
curl -X POST http://localhost:3000/api/revenue/competitors/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "competitors": [
      {
        "source": "Booking.com",
        "url": "https://www.booking.com/hotel/..."
      }
    ]
  }'
```

### 2. Test Recommendations

```bash
curl http://localhost:3000/api/revenue/pricing/recommendations/1?date=2025-12-20
```

### 3. Test Market Insights

```bash
curl http://localhost:3000/api/revenue/market/insights?days=7
```

## 📈 Performance Optimization

### 1. Database Indexing

All critical queries are indexed:
- `competitor_prices(scraped_at, source)`
- `dynamic_pricing(room_id, date)`
- `price_changes(room_id, target_date)`

### 2. Caching

Consider implementing Redis for:
- Latest competitor prices (1-hour TTL)
- Price recommendations (6-hour TTL)

### 3. Batch Processing

Scraping runs in batches with delays to avoid overwhelming servers.

## 🆘 Troubleshooting

### Scraping Fails

1. Check URL is still valid
2. Verify selectors haven't changed
3. Check for CAPTCHA or bot detection
4. Consider using proxies

### Recommendations Seem Off

1. Verify competitor data is recent
2. Check pricing settings (min/max bounds)
3. Review historical occupancy data
3. Adjust algorithm weights if needed

### High Server Load

1. Reduce scraping frequency
2. Limit concurrent scraping jobs
3. Implement result caching
4. Use headless mode for Puppeteer

## 🎓 Next Steps

1. **Connect Frontend** - Update React component to use real API
2. **Add Competitors** - Configure competitor URLs
3. **Test Scraping** - Run manual scrape and verify data
4. **Enable Auto-Pricing** - Turn on automatic price updates
5. **Monitor Results** - Track revenue improvements

## 📝 Notes

- Scraping is legal but respect robots.txt and rate limits
- Some websites may block scrapers - use responsibly
- Always have manual override capability
- Monitor competitor reactions to your pricing
- Review AI recommendations before auto-applying

## 🤝 Support

For issues or questions:
1. Check logs: `./bookings.db` and console output
2. Review API responses for error messages
3. Test individual components (scraping, optimization, apply)

