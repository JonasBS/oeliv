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

  // Scrape Booking.com with advanced anti-detection and AUTOMATED SEARCH
  async scrapeBookingCom(config) {
    const page = await this.browser.newPage();
    
    try {
      // ==================================================================
      // 🎯 SMART DATE FINDER - Find available dates automatically
      // ==================================================================
      
      console.log('🔍 Finding available dates...');
      
      // Extract hotel name from URL for search
      const hotelMatch = config.url.match(/\/hotel\/[^\/]+\/([^\/\.?]+)/);
      const hotelSlug = hotelMatch ? hotelMatch[1] : '';
      const hotelName = hotelSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      console.log(`🏨 Hotel: "${hotelName}"`);
      
      // Try multiple date ranges to find availability
      // Scan from near-term to 6 months ahead (covers summer season)
      const dateRanges = [
        { days: 7, desc: '1 week ahead' },
        { days: 14, desc: '2 weeks ahead' },
        { days: 30, desc: '1 month ahead' },
        { days: 60, desc: '2 months ahead' },
        { days: 90, desc: '3 months ahead' },
        { days: 120, desc: '4 months ahead' },
        { days: 150, desc: '5 months ahead' },
        { days: 180, desc: '6 months ahead (summer)' }
      ];
      
      let checkInStr, checkOutStr, availableDatesFound = false;
      
      for (const range of dateRanges) {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + range.days);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 3); // 3 nights
        
        checkInStr = checkIn.toISOString().split('T')[0];
        checkOutStr = checkOut.toISOString().split('T')[0];
        
        console.log(`📅 Testing ${range.desc}: ${checkInStr} to ${checkOutStr}`);
        
        // Build test URL
        const baseUrl = config.url.split('?')[0];
        const testUrl = `${baseUrl}?checkin=${checkInStr}&checkout=${checkOutStr}&group_adults=2&no_rooms=1`;
        
        try {
          await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(3000);
          
          // Check if dates are available
          const availabilityCheck = await page.evaluate(() => {
            const bodyText = document.body.textContent.toLowerCase();
            
            // Look for VERY SPECIFIC unavailability messages (exact phrases only)
            const hasExactUnavailableMessage = 
              bodyText.includes('ikke tilgængeligt på vores website på dine valgte datoer') ||
              bodyText.includes('ikke tilgængelige på denne ejendom på dine valgte datoer');
            
            // Look for room types/listings - stronger indicator of availability
            const roomSelectors = [
              '[data-testid="property-card"]',
              '.hprt-table-cell-roomtype',
              '.roomName',
              '.room-info',
              '.hprt-table',
              '.roomPrice',
              'td.hprt-table-cell',
              '[id*="room"]'
            ];
            
            let hasRoomListings = false;
            for (const selector of roomSelectors) {
              if (document.querySelectorAll(selector).length > 0) {
                hasRoomListings = true;
                break;
              }
            }
            
            // Look for price displays
            const priceSelectors = [
              '[data-testid="price-and-discounted-price"]',
              '.bui-price-display',
              '.prco-valign-middle-helper',
              '.bui-price-display__value',
              '.prco-inline-box-icon-last-child'
            ];
            
            let hasPriceElements = false;
            for (const selector of priceSelectors) {
              if (document.querySelectorAll(selector).length > 0) {
                hasPriceElements = true;
                break;
              }
            }
            
            // Strong availability indicators
            // If we have price elements, consider it available even if there's a general unavailable message
            // (Booking.com shows "some rooms not available" even when others ARE available)
            const isAvailable = hasPriceElements || (hasRoomListings && !hasExactUnavailableMessage);
            
            return { 
              available: isAvailable,
              hasExactUnavailableMessage,
              hasRoomListings,
              hasPriceElements
            };
          });
          
          console.log(`   Unavailable msg: ${availabilityCheck.hasExactUnavailableMessage}, Rooms: ${availabilityCheck.hasRoomListings}, Price elements: ${availabilityCheck.hasPriceElements}`);
          
          if (availabilityCheck.available) {
            console.log(`✅ Found available dates: ${checkInStr} to ${checkOutStr}`);
            availableDatesFound = true;
            break;
          } else {
            console.log(`❌ Not available: ${range.desc}`);
          }
        } catch (error) {
          console.log(`⚠️  Error checking ${range.desc}: ${error.message}`);
        }
      }
      
      if (!availableDatesFound) {
        console.log('⚠️  No available dates found in next 6 months, using last tested dates');
      }
      
      console.log(`🎯 Final dates: ${checkInStr} to ${checkOutStr}`);

      // Anti-detection setup
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
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'da'],
        });
        window.chrome = {
          runtime: {},
        };
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });

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
      
      // ==================================================================
      // 🎯 SMART AUTOMATED SEARCH - Build search URL like a real user
      // ==================================================================
      
      console.log('🔍 Building search URL with dates...');
      
      // Strategy: Go directly to hotel page WITH search parameters
      // This simulates clicking "Search" with dates already selected
      let searchUrl = config.url;
      
      // Clean URL - remove old parameters if present
      const baseUrl = config.url.split('?')[0];
      
      // Build comprehensive search parameters
      const searchParams = new URLSearchParams({
        checkin: checkInStr,
        checkout: checkOutStr,
        group_adults: '2',
        group_children: '0',
        no_rooms: '1',
        selected_currency: 'DKK'
      });
      
      searchUrl = `${baseUrl}?${searchParams.toString()}`;
      
      console.log('🌐 Navigating to hotel with search parameters...');
      console.log(`📍 ${searchUrl}`);
      
      let retries = 2;
      let pageLoaded = false;
      
      while (retries > 0 && !pageLoaded) {
        try {
          await page.goto(searchUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 45000 
          });
          pageLoaded = true;
          console.log('✅ Page loaded with search parameters');
        } catch (error) {
          retries--;
          console.log(`⚠️  Load failed, retries left: ${retries}`);
          if (retries === 0) {
            throw new Error(`Failed to load page: ${error.message}`);
          }
          await page.waitForTimeout(3000);
        }
      }
      
      // ==================================================================
      // 📊 Wait for prices to load and extract data
      // ==================================================================
      
      console.log('⏳ Waiting for dynamic prices to calculate...');
      await page.waitForTimeout(4000);
      
      console.log('📜 Scrolling to trigger price loading...');
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight / 2);
      });
      await page.waitForTimeout(1500);
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight / 2);
      });
      await page.waitForTimeout(2000);
      
      console.log('💰 Extracting price data...');
      
      // Take screenshot for debugging (optional - comment out in production)
      try {
        const screenshotPath = `/tmp/booking-${config.source || 'hotel'}-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      } catch (e) {
        console.log('⚠️  Could not save screenshot');
      }

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
        scraped_at: new Date(),
        search_checkin: checkInStr,
        search_checkout: checkOutStr
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

  // Scrape Airbnb with anti-detection
  async scrapeAirbnb(config) {
    const page = await this.browser.newPage();
    
    try {
      // Anti-detection setup (same as Booking.com)
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      await page.setViewport({ 
        width: 1920, 
        height: 1080,
        deviceScaleFactor: 1
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        window.chrome = { runtime: {} };
      });

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      });

      console.log(`🔍 Scraping Airbnb: ${config.source || 'Unknown'}`);
      console.log(`📍 URL: ${config.url}`);

      // Navigate with retry
      let retries = 3;
      let loaded = false;
      
      while (retries > 0 && !loaded) {
        try {
          await page.goto(config.url, { 
            waitUntil: 'domcontentloaded',
            timeout: 45000 
          });
          loaded = true;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('⏳ Waiting for Airbnb content...');
      await page.waitForTimeout(5000);

      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight / 2);
      });
      await page.waitForTimeout(1000);

      // Extract price with comprehensive selectors
      const data = await page.evaluate(() => {
        const extractNumber = (text) => {
          if (!text) return null;
          const cleaned = text.replace(/\s/g, '').replace(/kr\.?|DKK|€|EUR|\$|,/gi, '');
          const match = cleaned.match(/(\d+(?:\.\d+)?)/);
          return match ? parseFloat(match[1]) : null;
        };

        let results = {
          price: null,
          priceText: '',
          roomType: 'Airbnb Listing',
          foundSelectors: []
        };

        // Airbnb price selectors (2024/2025)
        const priceSelectors = [
          '._tyxjp1', // Old selector
          '._1y74zjx',
          '[data-plugin-in-point-id*="PRICE"]',
          '._1k4xcdh',
          '._ymq6as',
          'span._doc79r',
          'span._tyxjp1',
          '[class*="price"]',
          'div[data-testid="price-availability-row"]'
        ];

        for (const selector of priceSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const elem of elements) {
              const text = (elem.textContent || '').trim();
              if (/\d/.test(text) && (text.includes('kr') || text.includes('DKK') || /\d{3,}/.test(text))) {
                const num = extractNumber(text);
                if (num && num >= 200 && num <= 25000) {
                  results.price = num;
                  results.priceText = text;
                  results.foundSelectors.push(selector);
                  break;
                }
              }
            }
            if (results.price) break;
          } catch (e) {
            // Continue
          }
        }

        // Fallback: Search body text
        if (!results.price) {
          const bodyText = document.body.innerText;
          const patterns = [
            /(\d{1,3}(?:[.,\s]\d{3})*)\s*(?:kr\.?|DKK)/gi,
            /(?:kr\.?|DKK)\s*(\d{1,3}(?:[.,\s]\d{3})*)/gi
          ];
          
          for (const pattern of patterns) {
            const matches = [...bodyText.matchAll(pattern)];
            for (const match of matches) {
              const num = extractNumber(match[0]);
              if (num && num >= 200 && num <= 25000) {
                results.price = num;
                results.priceText = match[0];
                results.foundSelectors.push('text-search');
                break;
              }
            }
            if (results.price) break;
          }
        }

        // Get title
        const titleSelectors = ['h1', '[data-testid="listing-title"]', '._14i3z6h'];
        for (const sel of titleSelectors) {
          const elem = document.querySelector(sel);
          if (elem && elem.textContent) {
            results.roomType = elem.textContent.trim().substring(0, 100);
            break;
          }
        }

        return results;
      });

      await page.close();

      console.log(`📊 Airbnb results for ${config.source}:`);
      console.log(`   Price: ${data.price} kr (from: "${data.priceText}")`);
      console.log(`   Selectors: ${data.foundSelectors.join(', ')}`);

      if (!data.price) {
        console.warn(`⚠️  No price found for Airbnb: ${config.source}`);
        return null;
      }

      // Extract dates from URL if available
      const checkInMatch = config.url.match(/check_in=(\d{4}-\d{2}-\d{2})/);
      const checkOutMatch = config.url.match(/check_out=(\d{4}-\d{2}-\d{2})/);

      return {
        source: config.source || 'Airbnb',
        url: config.url,
        price: Math.round(data.price),
        availability: 'available',
        room_type: config.room_mapping || data.roomType,
        scraped_at: new Date(),
        search_checkin: checkInMatch ? checkInMatch[1] : null,
        search_checkout: checkOutMatch ? checkOutMatch[1] : null
      };
      
    } catch (error) {
      console.error(`❌ Error scraping Airbnb ${config.source}:`, error.message);
      try {
        await page.close();
      } catch (e) {
        // Already closed
      }
      return null;
    }
  }

  // Scrape Hotels.com with anti-detection
  async scrapeHotelsCom(config) {
    const page = await this.browser.newPage();
    
    try {
      // Anti-detection setup
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.chrome = { runtime: {} };
      });

      console.log(`🔍 Scraping Hotels.com: ${config.source || 'Unknown'}`);
      
      await page.goto(config.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 45000 
      });

      await page.waitForTimeout(5000);
      await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
      await page.waitForTimeout(1000);

      const data = await page.evaluate(() => {
        const extractNumber = (text) => {
          if (!text) return null;
          const cleaned = text.replace(/\s/g, '').replace(/kr\.?|DKK|€|EUR|\$|,/gi, '');
          const match = cleaned.match(/(\d+(?:\.\d+)?)/);
          return match ? parseFloat(match[1]) : null;
        };

        let results = { price: null, priceText: '', roomType: 'Standard' };

        const priceSelectors = [
          '[data-stid="price-display"]',
          '[data-stid="price"]',
          '.uitk-text-price-lockup',
          '[class*="price"]'
        ];

        for (const selector of priceSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const elem of elements) {
            const text = (elem.textContent || '').trim();
            if (/\d/.test(text)) {
              const num = extractNumber(text);
              if (num && num >= 200 && num <= 25000) {
                results.price = num;
                results.priceText = text;
                break;
              }
            }
          }
          if (results.price) break;
        }

        // Fallback
        if (!results.price) {
          const bodyText = document.body.innerText;
          const match = bodyText.match(/(\d{1,3}(?:[.,\s]\d{3})*)\s*(?:kr|DKK)/i);
          if (match) {
            results.price = extractNumber(match[0]);
            results.priceText = match[0];
          }
        }

        const titleElem = document.querySelector('h1, h2');
        if (titleElem) results.roomType = titleElem.textContent.trim().substring(0, 100);

        return results;
      });

      await page.close();

      console.log(`📊 Hotels.com results: ${data.price} kr`);

      if (!data.price) {
        console.warn(`⚠️  No price found for Hotels.com: ${config.source}`);
        return null;
      }

      // Extract dates from URL if available (Hotels.com uses checkIn/checkOut params)
      const checkInMatch = config.url.match(/checkIn=(\d{4}-\d{2}-\d{2})/);
      const checkOutMatch = config.url.match(/checkOut=(\d{4}-\d{2}-\d{2})/);

      return {
        source: config.source || 'Hotels.com',
        url: config.url,
        price: Math.round(data.price),
        availability: 'available',
        room_type: config.room_mapping || data.roomType,
        scraped_at: new Date(),
        search_checkin: checkInMatch ? checkInMatch[1] : null,
        search_checkout: checkOutMatch ? checkOutMatch[1] : null
      };
      
    } catch (error) {
      console.error(`❌ Error scraping Hotels.com ${config.source}:`, error.message);
      try {
        await page.close();
      } catch (e) {}
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
          source, url, price, availability, room_type, scraped_at, search_checkin, search_checkout
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.source,
        data.url,
        data.price,
        data.availability,
        data.room_type,
        data.scraped_at.toISOString(),
        data.search_checkin || null,
        data.search_checkout || null
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

