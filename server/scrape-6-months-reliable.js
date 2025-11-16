import { getDatabase } from './src/database/db.js';
import CompetitorScraper from './src/services/competitor-scraper.js';
import 'dotenv/config';

/**
 * RELIABLE VERSION: Scrape 6 months (more stable, better success rate)
 */
async function scrape6MonthsReliable() {
  console.log('🎯 RELIABLE 6-MONTH SCRAPING...\n');
  console.log('═'.repeat(80));

  const db = await getDatabase();

  // Focus on next 6 months (24 weeks) - more reliable than 10 months
  const today = new Date();
  const dateRanges = [];
  
  for (let week = 1; week <= 24; week++) { // Start from next week
    const checkin = new Date(today);
    checkin.setDate(today.getDate() + (week * 7));
    
    const checkout = new Date(checkin);
    checkout.setDate(checkin.getDate() + 3);
    
    const checkinStr = checkin.toISOString().split('T')[0];
    const checkoutStr = checkout.toISOString().split('T')[0];
    
    dateRanges.push({ checkin: checkinStr, checkout: checkoutStr });
  }

  console.log(`📊 Will scrape ${dateRanges.length} date ranges (6 months):\n`);
  console.log(`   First: ${dateRanges[0].checkin}`);
  console.log(`   Last:  ${dateRanges[dateRanges.length - 1].checkin}`);

  console.log('\n═'.repeat(80));
  console.log('🔍 Starting reliable scraping with timeouts...\n');

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

  console.log(`✅ Scraping ${competitors.length} competitor(s)\n`);

  const scraper = new CompetitorScraper(db);
  await scraper.initialize();

  let totalResults = 0;
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let compIndex = 0; compIndex < competitors.length; compIndex++) {
    const competitor = competitors[compIndex];
    
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🏨 ${competitor.name}`);
    console.log('═'.repeat(80));

    for (let dateIndex = 0; dateIndex < dateRanges.length; dateIndex++) {
      const dateRange = dateRanges[dateIndex];
      const progress = Math.round(((dateIndex + 1) / dateRanges.length) * 100);
      
      console.log(`\n[${dateIndex + 1}/${dateRanges.length}] ${progress}% → ${dateRange.checkin} - ${dateRange.checkout}`);

      try {
        const baseUrl = competitor.url.split('?')[0];
        const urlWithDates = `${baseUrl}?checkin=${dateRange.checkin}&checkout=${dateRange.checkout}&group_adults=2&group_children=0&no_rooms=1&selected_currency=DKK`;

        // TIMEOUT PROTECTION: Max 20 seconds per scrape
        const scrapePromise = (async () => {
          const url = urlWithDates.toLowerCase();
          if (url.includes('booking.com')) {
            return await scraper.scrapeBookingCom({
              source: competitor.name,
              url: urlWithDates,
              room_mapping: competitor.room_mapping
            });
          }
          return null;
        })();

        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve(null), 20000) // 20 second timeout
        );

        const result = await Promise.race([scrapePromise, timeoutPromise]);

        if (result) {
          const roomsArray = Array.isArray(result) ? result : [result];

          for (const room of roomsArray) {
            await scraper.saveToDatabase(room);
            totalResults++;
          }
          
          console.log(`   ✅ Saved ${roomsArray.length} room(s)`);
          successCount++;
        } else {
          console.log(`   ⏭️  Skipped (timeout or no data)`);
          failCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failCount++;
      }

      // Short delay
      if (dateIndex < dateRanges.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
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
  console.log(`✅ Successful: ${successCount}/${dateRanges.length}`);
  console.log(`⏭️  Skipped: ${failCount}`);
  console.log(`📊 Total prices saved: ${totalResults}`);
  console.log(`⏱️  Time: ${elapsedMinutes}m ${remainingSeconds}s`);
  console.log(`📈 Success rate: ${Math.round((successCount / dateRanges.length) * 100)}%`);
  console.log('\n🎉 Done! Calendar now has 6 months of data.\n');

  await db.close();
}

scrape6MonthsReliable().catch(console.error);

