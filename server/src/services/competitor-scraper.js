import puppeteer from 'puppeteer';

class CompetitorScraper {
  constructor(db) {
    this.db = db;
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Scrape Booking.com
  async scrapeBookingCom(config) {
    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      console.log(`🔍 Scraping: ${config.url}`);
      
      await page.goto(config.url, { 
        waitUntil: 'networkidle0', 
        timeout: 60000 
      });

      // Wait a bit for JavaScript to render
      await page.waitForTimeout(3000);

      // Take screenshot for debugging (optional)
      // await page.screenshot({ path: `/tmp/booking-${Date.now()}.png` });

      // Try multiple selectors for Booking.com - they change frequently
      const data = await page.evaluate(() => {
        // Helper function to extract number from text
        const extractNumber = (text) => {
          if (!text) return null;
          // Remove all non-numeric except . and ,
          const cleaned = text.replace(/[^\d.,]/g, '');
          // Replace comma with dot for decimal
          const normalized = cleaned.replace(',', '.');
          // Parse and return
          const num = parseFloat(normalized);
          return isNaN(num) ? null : num;
        };

        // Try different price selectors
        const priceSelectors = [
          // Modern Booking.com selectors
          '[data-testid="price-and-discounted-price"]',
          '[data-testid="price-for-x-nights"]',
          '[aria-label*="pris"]',
          '[aria-label*="price"]',
          // Class-based selectors
          '.prco-valign-middle-helper',
          '.bui-price-display__value',
          '.prco-text-nowrap-helper',
          '.prco-inline-block-maker-helper',
          // Generic price selectors
          '[class*="price"]',
          '[class*="Price"]',
          // Span with currency
          'span:has-text("kr.")',
          'span:has-text("DKK")',
        ];
        
        let price = null;
        let priceText = '';
        
        // Try each selector
        for (const selector of priceSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const elem of elements) {
              const text = elem.textContent || elem.innerText;
              if (!text) continue;
              
              // Check if it contains numbers
              if (/\d/.test(text)) {
                const num = extractNumber(text);
                // Booking.com prices are typically 500-10000 DKK per night
                if (num && num >= 100 && num <= 50000) {
                  price = num;
                  priceText = text;
                  console.log(`Found price with selector ${selector}: ${text} = ${num}`);
                  break;
                }
              }
            }
            if (price) break;
          } catch (e) {
            // Selector might not work, continue
          }
        }

        // If still no price, try finding any element with "kr" or price-like text
        if (!price) {
          const allText = document.body.innerText;
          const matches = allText.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:kr|DKK)/gi);
          if (matches && matches.length > 0) {
            // Take the first reasonable match
            for (const match of matches) {
              const num = extractNumber(match);
              if (num && num >= 100 && num <= 50000) {
                price = num;
                priceText = match;
                console.log(`Found price in body text: ${match} = ${num}`);
                break;
              }
            }
          }
        }

        // Get availability
        const availSelectors = [
          '[data-testid="availability-message"]',
          '.bui-alert__description',
          '.fe_banner__message',
          '[class*="availability"]',
          '[class*="Availability"]'
        ];
        
        let availability = 'available';
        for (const selector of availSelectors) {
          try {
            const elem = document.querySelector(selector);
            if (elem && elem.textContent) {
              const text = elem.textContent.toLowerCase();
              if (text.includes('kun') || text.includes('only') || text.includes('sidste')) {
                availability = 'limited';
              } else if (text.includes('udsolgt') || text.includes('sold out') || text.includes('ikke ledige')) {
                availability = 'sold_out';
              }
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        // Get room type from page title or headers
        const titleSelectors = ['h2', 'h1', '[data-testid="title"]', '.hp__hotel-name'];
        let roomType = 'Standard';
        for (const selector of titleSelectors) {
          try {
            const elem = document.querySelector(selector);
            if (elem && elem.textContent) {
              roomType = elem.textContent.trim();
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        return {
          price,
          priceText,
          availability,
          roomType,
          pageTitle: document.title,
          url: window.location.href
        };
      });

      await page.close();

      console.log(`📊 Scraped data from ${config.source}:`, {
        price: data.price,
        priceText: data.priceText,
        availability: data.availability,
        pageTitle: data.pageTitle
      });

      if (!data.price) {
        console.warn(`⚠️  No price found for ${config.source}. This might be due to:
- Booking.com detected automation
- Page requires login
- Changed HTML structure
- Geographic restrictions`);
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
      await page.close();
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

