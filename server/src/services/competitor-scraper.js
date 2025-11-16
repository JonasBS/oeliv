import puppeteer from 'puppeteer';

class CompetitorScraper {
  constructor(db) {
    this.db = db;
    this.browser = null;
  }

  async initialize() {
    console.log('🚀 Initializing Puppeteer with stealth mode...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      ],
      ignoreHTTPSErrors: true
    });
    console.log('✅ Puppeteer initialized');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Scrape Booking.com with advanced anti-detection
  async scrapeBookingCom(config) {
    const page = await this.browser.newPage();
    
    try {
      // Set realistic browser fingerprint
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      await page.setViewport({ 
        width: 1920, 
        height: 1080,
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: true,
        isMobile: false
      });

      // Remove automation indicators
      await page.evaluateOnNewDocument(() => {
        // Overwrite the `navigator.webdriver` property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });

        // Overwrite the `plugins` property to use a custom getter
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Overwrite the `languages` property to use a custom getter
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'da'],
        });

        // Pass the Chrome Test
        window.chrome = {
          runtime: {},
        };

        // Pass the Permissions Test
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });

      // Set additional headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      });
      
      console.log(`🔍 Scraping Booking.com: ${config.source || 'Unknown'}`);
      console.log(`📍 URL: ${config.url}`);
      
      // Navigate with retry logic
      let retries = 3;
      let loaded = false;
      
      while (retries > 0 && !loaded) {
        try {
          await page.goto(config.url, { 
            waitUntil: 'domcontentloaded',
            timeout: 45000 
          });
          loaded = true;
          console.log('✅ Page loaded successfully');
        } catch (error) {
          retries--;
          console.log(`⚠️  Load attempt failed. Retries left: ${retries}`);
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Wait for content to render
      console.log('⏳ Waiting for prices to load...');
      await page.waitForTimeout(5000);

      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight / 2);
      });
      await page.waitForTimeout(1000);

      // Extract data with comprehensive selectors
      const data = await page.evaluate(() => {
        // Helper: Extract number from text
        const extractNumber = (text) => {
          if (!text) return null;
          // Remove spaces and handle Danish thousand separator
          let cleaned = text.replace(/\s/g, '');
          // Remove currency symbols
          cleaned = cleaned.replace(/kr\.?|DKK|€|EUR|\$/gi, '');
          // Replace comma with dot
          cleaned = cleaned.replace(',', '.');
          // Extract first number sequence
          const match = cleaned.match(/(\d+(?:\.\d+)?)/);
          if (!match) return null;
          const num = parseFloat(match[1]);
          return isNaN(num) ? null : num;
        };

        let results = {
          price: null,
          priceText: '',
          availability: 'available',
          roomType: 'Standard',
          pageTitle: document.title,
          foundSelectors: []
        };

        // Comprehensive price selectors for Booking.com (2024/2025)
        const priceSelectors = [
          // Primary price selectors
          '[data-testid="price-and-discounted-price"]',
          '[data-testid="price-for-x-nights"]',
          'span[aria-label*="pris"]',
          'span[aria-label*="price"]',
          
          // Price display classes
          '.prco-valign-middle-helper',
          '.bui-price-display__value',
          '.prco-text-nowrap-helper',
          '.prco-inline-block-maker-helper',
          '[data-et-click*="price"]',
          
          // Property card prices
          '.bui_price_currency',
          '.bui_price_display__value',
          '.e2e-property-card-price',
          
          // Search result prices
          '.txp-price',
          '.sr-price',
          '.bui-u-sr-only',
          
          // Generic approaches
          'strong[aria-hidden="true"]',
          'span[data-price]',
          '.e2e-price-item'
        ];

        // Try each selector
        for (const selector of priceSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const elem of elements) {
              const text = (elem.textContent || elem.innerText || '').trim();
              if (!text || text.length === 0) continue;
              
              // Check if contains a number and currency
              if (/\d/.test(text) && (text.includes('kr') || text.includes('DKK') || /\d{3,}/.test(text))) {
                const num = extractNumber(text);
                
                // Validate price range (typical hotel prices per night in DKK)
                if (num && num >= 200 && num <= 25000) {
                  results.price = num;
                  results.priceText = text;
                  results.foundSelectors.push(selector);
                  console.log(`✓ Found price: ${text} (${num} kr) via ${selector}`);
                  break;
                }
              }
            }
            if (results.price) break;
          } catch (e) {
            // Selector failed, continue
          }
        }

        // Fallback: Search entire page text for price patterns
        if (!results.price) {
          console.log('⚠️  No price found via selectors, searching page text...');
          const bodyText = document.body.innerText;
          
          // Pattern: "1.234 kr." or "1234 kr" or "DKK 1234"
          const patterns = [
            /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:kr\.?|DKK)/gi,
            /(?:kr\.?|DKK)\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi
          ];
          
          for (const pattern of patterns) {
            const matches = [...bodyText.matchAll(pattern)];
            for (const match of matches) {
              const num = extractNumber(match[0]);
              if (num && num >= 200 && num <= 25000) {
                results.price = num;
                results.priceText = match[0];
                results.foundSelectors.push('text-search');
                console.log(`✓ Found price in text: ${match[0]} (${num} kr)`);
                break;
              }
            }
            if (results.price) break;
          }
        }

        // Get availability status
        const availText = document.body.innerText.toLowerCase();
        if (availText.includes('udsolgt') || availText.includes('sold out') || availText.includes('ikke ledige')) {
          results.availability = 'sold_out';
        } else if (availText.includes('kun') || availText.includes('only') || availText.includes('sidste')) {
          results.availability = 'limited';
        }

        // Get property/room name
        const titleSelectors = [
          'h1', 'h2[id*="hp"]', '.hp__hotel-name',
          '[data-testid="title"]', '.property-title'
        ];
        for (const sel of titleSelectors) {
          const elem = document.querySelector(sel);
          if (elem && elem.textContent && elem.textContent.trim().length > 0) {
            results.roomType = elem.textContent.trim().substring(0, 100);
            break;
          }
        }

        return results;
      });

      await page.close();

      // Log results
      console.log(`📊 Scraping results for ${config.source}:`);
      console.log(`   Price: ${data.price} kr (from: "${data.priceText}")`);
      console.log(`   Availability: ${data.availability}`);
      console.log(`   Selectors used: ${data.foundSelectors.join(', ')}`);
      console.log(`   Page: ${data.pageTitle}`);

      if (!data.price) {
        console.warn(`⚠️  No price found for ${config.source}.`);
        console.warn(`   Possible reasons:`);
        console.warn(`   - Page structure changed`);
        console.warn(`   - Requires specific check-in dates`);
        console.warn(`   - Geographic restrictions`);
        console.warn(`   - Property not available`);
        return null;
      }

      return {
        source: config.source || 'Booking.com',
        url: config.url,
        price: Math.round(data.price),
        availability: this.parseAvailability(data.availability),
        room_type: config.room_mapping || data.roomType,
        scraped_at: new Date()
      };
      
    } catch (error) {
      console.error(`❌ Error scraping ${config.source || 'Booking.com'}:`, error.message);
      try {
        await page.close();
      } catch (e) {
        // Page already closed
      }
      return null;
    }
  }

  // Scrape Airbnb
  async scrapeAirbnb(config) {
    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for Airbnb pricing
      await page.waitForSelector('._tyxjp1', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const priceElement = document.querySelector('._tyxjp1');
        const titleElement = document.querySelector('h1');
        
        return {
          price: priceElement?.textContent?.replace(/[^\d]/g, '') || null,
          roomType: titleElement?.textContent || 'Unknown',
          availability: 'available'
        };
      });

      await page.close();

      return {
        source: 'Airbnb',
        url: config.url,
        price: parseInt(data.price) || null,
        availability: 'available',
        room_type: data.roomType,
        scraped_at: new Date()
      };
    } catch (error) {
      console.error('Error scraping Airbnb:', error.message);
      await page.close();
      return null;
    }
  }

  // Scrape Hotels.com
  async scrapeHotelsCom(config) {
    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('[data-stid="price-display"]', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const priceElement = document.querySelector('[data-stid="price-display"]');
        const roomElement = document.querySelector('h2[data-stid="section-room-list-title"]');
        
        return {
          price: priceElement?.textContent?.replace(/[^\d]/g, '') || null,
          roomType: roomElement?.textContent || 'Unknown'
        };
      });

      await page.close();

      return {
        source: 'Hotels.com',
        url: config.url,
        price: parseInt(data.price) || null,
        availability: 'available',
        room_type: data.roomType,
        scraped_at: new Date()
      };
    } catch (error) {
      console.error('Error scraping Hotels.com:', error.message);
      await page.close();
      return null;
    }
  }

  parseAvailability(text) {
    if (!text) return 'available';
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes('sold out') || lowerText.includes('udsolgt')) {
      return 'sold_out';
    }
    if (lowerText.includes('only') || lowerText.includes('few') || lowerText.includes('få')) {
      return 'limited';
    }
    return 'available';
  }

  async scrapeAll(competitors) {
    await this.initialize();
    const results = [];

    for (const competitor of competitors) {
      try {
        let result = null;

        // Detect platform from URL instead of source name
        const url = competitor.url.toLowerCase();
        
        if (url.includes('booking.com')) {
          console.log(`Scraping Booking.com: ${competitor.source || 'Unknown'}`);
          result = await this.scrapeBookingCom(competitor);
        } else if (url.includes('airbnb')) {
          console.log(`Scraping Airbnb: ${competitor.source || 'Unknown'}`);
          result = await this.scrapeAirbnb(competitor);
        } else if (url.includes('hotels.com')) {
          console.log(`Scraping Hotels.com: ${competitor.source || 'Unknown'}`);
          result = await this.scrapeHotelsCom(competitor);
        } else {
          console.log(`Unknown platform for ${competitor.url}`);
        }

        if (result) {
          // Save to database
          await this.saveToDatabase(result);
          results.push(result);
          console.log(`✅ Saved data for ${result.source}: ${result.price} DKK`);
        } else {
          console.log(`❌ No result for ${competitor.source}`);
        }
      } catch (error) {
        console.error(`Error scraping ${competitor.source}:`, error);
      }

      // Delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await this.close();
    console.log(`✅ Scraping complete. Total results: ${results.length}`);
    return results;
  }

  async saveToDatabase(data) {
    try {
      await this.db.run(`
        INSERT INTO competitor_prices (
          source, url, price, availability, room_type, scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        data.source,
        data.url,
        data.price,
        data.availability,
        data.room_type,
        data.scraped_at.toISOString()
      ]);
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  }

  async getLatestPrices() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM competitor_prices 
        WHERE scraped_at > datetime('now', '-24 hours')
        ORDER BY scraped_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getHistoricalData(days = 30) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          source,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          DATE(scraped_at) as date
        FROM competitor_prices 
        WHERE scraped_at > datetime('now', '-${days} days')
        GROUP BY source, DATE(scraped_at)
        ORDER BY date DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

export default CompetitorScraper;

