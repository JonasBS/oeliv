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
      await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for prices to load
      await page.waitForSelector('[data-testid="price-and-discounted-price"]', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const priceElement = document.querySelector('[data-testid="price-and-discounted-price"]');
        const availabilityElement = document.querySelector('[data-testid="availability-message"]');
        const roomTypeElement = document.querySelector('[data-testid="title"]');

        return {
          price: priceElement?.textContent?.replace(/[^\d]/g, '') || null,
          availability: availabilityElement?.textContent || 'available',
          roomType: roomTypeElement?.textContent || 'Unknown'
        };
      });

      await page.close();

      return {
        source: 'Booking.com',
        url: config.url,
        price: parseInt(data.price) || null,
        availability: this.parseAvailability(data.availability),
        room_type: data.roomType,
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

        switch (competitor.source.toLowerCase()) {
          case 'booking.com':
            result = await this.scrapeBookingCom(competitor);
            break;
          case 'airbnb':
            result = await this.scrapeAirbnb(competitor);
            break;
          case 'hotels.com':
            result = await this.scrapeHotelsCom(competitor);
            break;
        }

        if (result) {
          // Save to database
          await this.saveToDatabase(result);
          results.push(result);
        }
      } catch (error) {
        console.error(`Error scraping ${competitor.source}:`, error);
      }

      // Delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await this.close();
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

