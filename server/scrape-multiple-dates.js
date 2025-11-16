import { getDatabase } from './src/database/db.js';
import CompetitorScraper from './src/services/competitor-scraper.js';
import 'dotenv/config';

/**
 * Scrape competitor prices for MULTIPLE dates to fill the calendar
 */
async function scrapeMultipleDates() {
  console.log('📅 Scraping competitor prices for MULTIPLE dates...\n');
  console.log('═'.repeat(80));

  const db = await getDatabase();

  // Define date ranges to scrape (next 3 months, weekly intervals)
  const today = new Date();
  const dateRanges = [];
  
  // Generate date ranges: every week for the next 12 weeks (3 months)
  for (let week = 0; week < 12; week++) {
    const checkin = new Date(today);
    checkin.setDate(today.getDate() + (week * 7));
    
    const checkout = new Date(checkin);
    checkout.setDate(checkin.getDate() + 3); // 3-night stay
    
    // Format as YYYY-MM-DD
    const checkinStr = checkin.toISOString().split('T')[0];
    const checkoutStr = checkout.toISOString().split('T')[0];
    
    dateRanges.push({ checkin: checkinStr, checkout: checkoutStr });
  }

  console.log(`📊 Will scrape ${dateRanges.length} different date ranges:\n`);
  dateRanges.forEach((range, i) => {
    console.log(`   ${i + 1}. ${range.checkin} → ${range.checkout}`);
  });

  console.log('\n═'.repeat(80));
  console.log('🔍 Starting scraping process...\n');

  // Get competitor configurations
  let competitors = [];
  try {
    competitors = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, source as name, url, room_mapping, enabled
        FROM competitor_configs
        WHERE enabled = 1
      `, (err, rows) => {
        if (err) {
          if (err.message.includes('no such table')) {
            resolve(null);
          } else {
            reject(err);
          }
        } else {
          resolve(rows || []);
        }
      });
    });
  } catch (error) {
    console.log('   ⚠️  competitor_configs table not found');
  }

  // Fallback to hardcoded competitor
  if (!competitors || competitors.length === 0) {
    console.log('   ℹ️  Using default competitor (Grønbechs)');
    competitors = [
      {
        name: 'Grønbechs Hotel',
        url: 'https://www.booking.com/hotel/dk/gronbechs.da.html',
        room_mapping: 'Standard Double'
      }
    ];
  }

  console.log(`✅ Found ${competitors.length} competitor(s)\n`);

  const scraper = new CompetitorScraper(db);
  await scraper.initialize();

  let totalResults = 0;
  let successCount = 0;
  let failCount = 0;

  // Loop through each competitor and each date range
  for (let compIndex = 0; compIndex < competitors.length; compIndex++) {
    const competitor = competitors[compIndex];
    
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🏨 COMPETITOR ${compIndex + 1}/${competitors.length}: ${competitor.name}`);
    console.log('═'.repeat(80));

    for (let dateIndex = 0; dateIndex < dateRanges.length; dateIndex++) {
      const dateRange = dateRanges[dateIndex];
      
      console.log(`\n[${dateIndex + 1}/${dateRanges.length}] Scraping: ${dateRange.checkin} → ${dateRange.checkout}`);
      console.log('─'.repeat(80));

      try {
        // Build URL with date parameters
        const baseUrl = competitor.url.split('?')[0]; // Remove existing params
        const urlWithDates = `${baseUrl}?checkin=${dateRange.checkin}&checkout=${dateRange.checkout}&group_adults=2&group_children=0&no_rooms=1&selected_currency=DKK`;

        let result = null;
        let usedFallback = false;
        const url = urlWithDates.toLowerCase();

        // Try Puppeteer first
        if (url.includes('booking.com')) {
          result = await scraper.scrapeBookingCom({
            source: competitor.name,
            url: urlWithDates,
            room_mapping: competitor.room_mapping
          });
        } else if (url.includes('airbnb')) {
          result = await scraper.scrapeAirbnb({
            source: competitor.name,
            url: urlWithDates,
            room_mapping: competitor.room_mapping
          });
        } else if (url.includes('hotels.com')) {
          result = await scraper.scrapeHotelsCom({
            source: competitor.name,
            url: urlWithDates,
            room_mapping: competitor.room_mapping
          });
        }

        // Fall back to SerpApi if needed
        if (!result && scraper.serpApi.isAvailable()) {
          console.log('   ⚠️  Puppeteer failed, trying SerpApi fallback...');
          result = await scraper.serpApi.scrapeHotelPrice({
            source: competitor.name,
            url: urlWithDates,
            room_mapping: competitor.room_mapping
          });
          usedFallback = true;
        }

        if (result) {
          // Handle array of rooms (multi-room) or single room
          const roomsArray = Array.isArray(result) ? result : [result];

          const method = usedFallback ? '🔄 SerpApi' : '🤖 Puppeteer';

          for (const room of roomsArray) {
            await scraper.saveToDatabase(room);
            totalResults++;

            console.log(`   ✅ [${method}] ${room.room_type}: ${room.price} DKK/night`);
          }
          successCount++;
        } else {
          console.log(`   ❌ No results`);
          failCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failCount++;
      }

      // Delay between date ranges to avoid rate limiting
      if (dateIndex < dateRanges.length - 1) {
        const delayMs = 3000; // 3 seconds
        console.log(`   ⏳ Waiting ${delayMs / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  await scraper.close();

  console.log('\n═'.repeat(80));
  console.log('                    FINAL SUMMARY');
  console.log('═'.repeat(80));
  console.log(`✅ Successful scrapes: ${successCount}/${dateRanges.length * competitors.length}`);
  console.log(`❌ Failed scrapes: ${failCount}`);
  console.log(`📊 Total room prices saved: ${totalResults}`);
  console.log(`📅 Date ranges covered: ${dateRanges.length}`);
  console.log(`🏨 Competitors: ${competitors.length}`);
  console.log('\n🎉 Done! Refresh admin panel to see calendar filled with data.\n');

  await db.close();
}

scrapeMultipleDates().catch(console.error);

