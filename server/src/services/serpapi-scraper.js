/**
 * SerpApi Google Hotels Scraper
 * 
 * Fallback scraper using SerpApi when Puppeteer fails or is blocked.
 * Provides reliable access to Google Hotels pricing data.
 * 
 * Pricing: Free tier = 100 searches/month
 * Docs: https://serpapi.com/google-hotels-api
 */

import { getJson } from 'serpapi';

class SerpApiScraper {
  constructor() {
    this.apiKey = process.env.SERPAPI_KEY;
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      console.log('⚠️  SerpApi not configured (no SERPAPI_KEY in .env)');
    } else {
      console.log('✅ SerpApi configured and ready');
    }
  }

  /**
   * Extract hotel ID from Booking.com URL
   * Example: https://www.booking.com/hotel/dk/gronbechs.html → "gronbechs"
   */
  extractHotelInfo(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Booking.com
      if (hostname.includes('booking.com')) {
        const match = url.match(/\/hotel\/[^\/]+\/([^\/\.?]+)/);
        if (match) {
          const slug = match[1];
          // Convert "gronbechs" to "Grønbechs Hotel"
          const name = slug.split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          return {
            source: 'Booking.com',
            name: name,
            query: `${name} hotel Denmark`
          };
        }
      }
      
      // Airbnb
      if (hostname.includes('airbnb')) {
        const match = url.match(/\/rooms\/(\d+)/);
        if (match) {
          return {
            source: 'Airbnb',
            name: 'Airbnb Property',
            query: `Airbnb ${match[1]}`
          };
        }
      }
      
      // Hotels.com
      if (hostname.includes('hotels.com')) {
        const match = url.match(/\/ho(\d+)/);
        if (match) {
          return {
            source: 'Hotels.com',
            name: 'Hotel',
            query: `hotel ${match[1]}`
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting hotel info:', error);
      return null;
    }
  }

  /**
   * Scrape hotel prices using SerpApi Google Hotels
   */
  async scrapeHotelPrice(config) {
    if (!this.enabled) {
      throw new Error('SerpApi not configured - add SERPAPI_KEY to .env');
    }

    try {
      console.log(`🔍 [SerpApi] Scraping: ${config.source}`);
      
      // Extract hotel info from URL
      const hotelInfo = this.extractHotelInfo(config.url);
      if (!hotelInfo) {
        throw new Error('Could not extract hotel info from URL');
      }
      
      console.log(`   Query: "${hotelInfo.query}"`);
      
      // Prepare search parameters
      const checkIn = config.check_in || this.getDefaultCheckIn();
      const checkOut = config.check_out || this.getDefaultCheckOut(checkIn);
      
      const searchParams = {
        api_key: this.apiKey,
        engine: 'google_hotels',
        q: hotelInfo.query,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults: config.adults || 2,
        currency: 'DKK',
        gl: 'dk', // Denmark
        hl: 'da'  // Danish
      };
      
      console.log(`   Dates: ${checkIn} to ${checkOut}`);
      
      // Make API request
      const response = await getJson(searchParams);
      
      if (!response || !response.properties || response.properties.length === 0) {
        console.log('⚠️  [SerpApi] No properties found');
        return null;
      }
      
      // Find best matching property
      const property = this.findBestMatch(response.properties, hotelInfo.name, config.source);
      
      if (!property) {
        console.log('⚠️  [SerpApi] No matching property found');
        return null;
      }
      
      console.log(`✅ [SerpApi] Found: ${property.name}`);
      
      // Extract price
      const price = this.extractPrice(property, checkIn, checkOut);
      
      if (!price) {
        console.log('⚠️  [SerpApi] No price found for property');
        return null;
      }
      
      console.log(`✅ [SerpApi] Price: ${price.perNight} DKK/night`);
      
      // Return in same format as Puppeteer scraper
      return {
        source: config.source || hotelInfo.source,
        url: config.url,
        price: price.perNight,
        availability: price.available ? 'available' : 'sold_out',
        room_type: config.room_mapping || property.type || 'Standard',
        scraped_at: new Date(),
        search_checkin: checkIn,
        search_checkout: checkOut,
        method: 'serpapi' // Track which method was used
      };
      
    } catch (error) {
      console.error(`❌ [SerpApi] Error scraping ${config.source}:`, error.message);
      return null;
    }
  }

  /**
   * Find best matching property from search results
   */
  findBestMatch(properties, targetName, sourceName) {
    // Try exact match first
    const exactMatch = properties.find(p => 
      p.name && p.name.toLowerCase().includes(targetName.toLowerCase())
    );
    if (exactMatch) return exactMatch;
    
    // Try partial match
    const words = targetName.toLowerCase().split(' ').filter(w => w.length > 3);
    const partialMatch = properties.find(p => {
      const pName = p.name ? p.name.toLowerCase() : '';
      return words.some(word => pName.includes(word));
    });
    if (partialMatch) return partialMatch;
    
    // Return first property as fallback
    console.log(`⚠️  Using first property as fallback for "${targetName}"`);
    return properties[0];
  }

  /**
   * Extract price from property data
   */
  extractPrice(property, checkIn, checkOut) {
    try {
      // Calculate nights
      const nights = this.calculateNights(checkIn, checkOut);
      
      // Try different price fields
      let totalPrice = null;
      let perNightPrice = null;
      
      // Check for rate_per_night
      if (property.rate_per_night && property.rate_per_night.extracted_lowest) {
        perNightPrice = property.rate_per_night.extracted_lowest;
      } else if (property.rate_per_night && property.rate_per_night.lowest) {
        // Parse string like "1.234 kr."
        perNightPrice = this.parsePrice(property.rate_per_night.lowest);
      }
      
      // Check for total_rate
      if (property.total_rate && property.total_rate.extracted_lowest) {
        totalPrice = property.total_rate.extracted_lowest;
      } else if (property.total_rate && property.total_rate.lowest) {
        totalPrice = this.parsePrice(property.total_rate.lowest);
      }
      
      // Calculate per-night if we only have total
      if (!perNightPrice && totalPrice && nights > 0) {
        perNightPrice = Math.round(totalPrice / nights);
      }
      
      // Validate price range
      if (perNightPrice && perNightPrice >= 400 && perNightPrice <= 25000) {
        return {
          perNight: Math.round(perNightPrice),
          total: totalPrice,
          nights: nights,
          available: true
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Error extracting price:', error);
      return null;
    }
  }

  /**
   * Parse price string (handles Danish format)
   */
  parsePrice(priceStr) {
    if (!priceStr) return null;
    if (typeof priceStr === 'number') return priceStr;
    
    // Remove currency and whitespace
    let cleaned = priceStr.replace(/kr\.?|DKK|€|EUR|\$/gi, '').trim();
    cleaned = cleaned.replace(/\s/g, '');
    
    // Handle Danish format (dot = thousands, comma = decimal)
    if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.match(/\d+\.\d{3}/)) {
      cleaned = cleaned.replace(/\./g, '');
    }
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * Calculate nights between dates
   */
  calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get default check-in date (2 months ahead)
   */
  getDefaultCheckIn() {
    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get default check-out date (3 nights after check-in)
   */
  getDefaultCheckOut(checkIn) {
    const date = new Date(checkIn);
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if SerpApi is available and configured
   */
  isAvailable() {
    return this.enabled;
  }

  /**
   * Get usage stats (if API provides it)
   */
  async getUsageStats() {
    if (!this.enabled) return null;
    
    try {
      const response = await getJson({
        api_key: this.apiKey,
        engine: 'google',
        q: 'test' // Minimal query to check status
      });
      
      return {
        available: true,
        searches_left: response.search_information?.searches_remaining || 'Unknown'
      };
    } catch (error) {
      console.error('Error checking SerpApi usage:', error);
      return null;
    }
  }
}

export default SerpApiScraper;

