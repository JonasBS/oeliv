import { getDatabase } from './src/database/db.js';
import CompetitorScraper from './src/services/competitor-scraper.js';
import 'dotenv/config';

/**
 * QUICK VERSION: Scrape 10 months ahead (bi-weekly for speed)
 */
async function scrapeQuick10Months() {
  console.log('🚀 QUICK 10-MONTH SCRAPING (bi-weekly intervals)...\n');
  console.log('═'.repeat(80));

  const db = await getDatabase();

  // Bi-weekly intervals for 10 months = 20 scrapes instead of 40
  const today = new Date();
  const dateRanges = [];
  
  for (let week = 0; week < 40; week += 2) { // Every 2 weeks
    const checkin = new Date(today);
    checkin.setDate(today.getDate() + (week * 7));
    
    const checkout = new Date(checkin);
    checkout.setDate(checkin.getDate() + 3);
    
    const checkinStr = checkin.toISOString().split('T')[0];
    const checkoutStr = checkout.toISOString().split('T')[0];
    
    dateRanges.push({ checkin: checkinStr, checkout: checkoutStr });
  }

  console.log(`📊 Will scrape ${dateRanges.length} date ranges (bi-weekly):\n`);
  dateRanges.slice(0, 5).forEach((range, i) => {
    console.log(`   ${i + 1}. ${range.checkin} → ${range.checkout}`);
  });
  console.log(`   ... (${dateRanges.length - 5} more)`);

  console.log('\n═'.repeat(80));
  console.log('🔍 Starting quick scraping...\n');

  // Get competitors
  let competitors = [];
  try {
    competitors = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, source as name, url, room_mapping, enabled
        FROM competitor_configs
        WHERE enabled = 1
      `, (err, rows) => {
        if (err) {
          if (err.message.includes('no such table')) resolve(null);
          else reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  } catch (error) {
    console.log('   ⚠️  competitor_configs table not found');
  }

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

  console.log(`✅ Scraping ${competitors.length} competitor(s) × ${dateRanges.length} dates = ${competitors.length * dateRanges.length} total scrapes\n`);

  const scraper = new CompetitorScraper(db);
  await scraper.initialize();

  let totalResults = 0;
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let compIndex = 0; compIndex < competitors.length; compIndex++) {
    const competitor = competitors[compIndex];
    
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🏨 COMPETITOR ${compIndex + 1}/${competitors.length}: ${competitor.name}`);
    console.log('═'.repeat(80));

    for (let dateIndex = 0; dateIndex < dateRanges.length; dateIndex++) {
      const dateRange = dateRanges[dateIndex];
      const progress = Math.round(((dateIndex + 1) / dateRanges.length) * 100);
      
      console.log(`\n[${dateIndex + 1}/${dateRanges.length}] ${progress}% - ${dateRange.checkin} → ${dateRange.checkout}`);
      console.log('─'.repeat(80));

      try {
        const baseUrl = competitor.url.split('?')[0];
        const urlWithDates = `${baseUrl}?checkin=${dateRange.checkin}&checkout=${dateRange.checkout}&group_adults=2&group_children=0&no_rooms=1&selected_currency=DKK`;

        let result = null;
        const url = urlWithDates.toLowerCase();

        if (url.includes('booking.com')) {
          result = await scraper.scrapeBookingCom({
            source: competitor.name,
            url: urlWithDates,
            room_mapping: competitor.room_mapping
          });
        }

        // Fallback to SerpApi
        if (!result && scraper.serpApi.isAvailable()) {
          console.log('   ⚠️  Puppeteer failed, trying SerpApi...');
          result = await scraper.serpApi.scrapeHotelPrice({
            source: competitor.name,
            url: urlWithDates,
            room_mapping: competitor.room_mapping
          });
        }

        if (result) {
          const roomsArray = Array.isArray(result) ? result : [result];

          for (const room of roomsArray) {
            await scraper.saveToDatabase(room);
            totalResults++;
          }
          
          console.log(`   ✅ Saved ${roomsArray.length} room(s)`);
          successCount++;
        } else {
          console.log(`   ❌ No results`);
          failCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failCount++;
      }

      // Faster delay for quick mode
      if (dateIndex < dateRanges.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds
      }
    }
  }

  await scraper.close();

  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = elapsedSeconds % 60;

  console.log('\n═'.repeat(80));
  console.log('                    FINAL SUMMARY');
  console.log('═'.repeat(80));
  console.log(`✅ Successful scrapes: ${successCount}/${dateRanges.length * competitors.length}`);
  console.log(`❌ Failed scrapes: ${failCount}`);
  console.log(`📊 Total room prices saved: ${totalResults}`);
  console.log(`📅 Date ranges covered: ${dateRanges.length}`);
  console.log(`🏨 Competitors: ${competitors.length}`);
  console.log(`⏱️  Time elapsed: ${elapsedMinutes}m ${remainingSeconds}s`);
  console.log('\n🎉 Done! Refresh admin panel to see 10 months of data.\n');

  await db.close();
}

scrapeQuick10Months().catch(console.error);

