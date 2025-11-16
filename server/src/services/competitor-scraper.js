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
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      console.log(`Scraping: ${config.url}`);
      
      await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Try multiple selectors for Booking.com
      const data = await page.evaluate(() => {
        // Try different price selectors
        const priceSelectors = [
          '[data-testid="price-and-discounted-price"]',
          '.prco-valign-middle-helper',
          '.bui-price-display__value',
          '[data-testid="price-for-x-nights"]',
          '.prco-text-nowrap-helper'
        ];
        
        let price = null;
        for (const selector of priceSelectors) {
          const elem = document.querySelector(selector);
          if (elem) {
            const text = elem.textContent;
            const match = text.match(/[\d.]+/);
            if (match) {
              price = parseFloat(match[0].replace(/\./g, ''));
              break;
            }
          }
        }

        // Get availability
        const availSelectors = [
          '[data-testid="availability-message"]',
          '.bui-alert__description',
          '.fe_banner__message'
        ];
        
        let availability = 'available';
        for (const selector of availSelectors) {
          const elem = document.querySelector(selector);
          if (elem && elem.textContent) {
            availability = elem.textContent;
            break;
          }
        }

        // Get room type from URL or page title
        const titleElem = document.querySelector('h2') || document.querySelector('h1');
        const roomType = titleElem?.textContent || 'Standard';

        return {
          price,
          availability,
          roomType
        };
      });

      await page.close();

      console.log(`Scraped data:`, data);

      return {
        source: config.source || 'Booking.com',
        url: config.url,
        price: data.price || null,
        availability: this.parseAvailability(data.availability),
        room_type: config.room_mapping || data.roomType,
        scraped_at: new Date()
      };
    } catch (error) {
      console.error('Error scraping Booking.com:', error.message);
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

