/**
 * Refresh Competitor Data - Delete old and scrape new
 * 
 * This script:
 * 1. Deletes all old competitor prices
 * 2. Fetches configured competitors
 * 3. Scrapes fresh data with the fixed system
 */

import { getDatabase } from './src/database/db.js';
import CompetitorScraper from './src/services/competitor-scraper.js';

console.log('🔄 Refreshing competitor price data...\n');
console.log('═'.repeat(80));

const db = await getDatabase();

// Step 1: Delete old data
console.log('🗑️  Step 1: Deleting old competitor prices...');
const deleteResult = await new Promise((resolve, reject) => {
  db.run('DELETE FROM competitor_prices', function(err) {
    if (err) reject(err);
    else resolve(this.changes);
  });
});
console.log(`   ✅ Deleted ${deleteResult} old records\n`);

// Step 2: Get configured competitors
console.log('📋 Step 2: Loading competitor configurations...');

// Try competitor_configs first, fall back to manual list
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
          resolve(null); // Table doesn't exist
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

// Fall back to hardcoded competitor if table doesn't exist
if (!competitors || competitors.length === 0) {
  console.log('   ℹ️  Using default competitor (Grønbechs for testing)');
  competitors = [
    {
      name: 'Grønbechs Hotel (TEST)',
      url: 'https://www.booking.com/hotel/dk/gronbechs.da.html?checkin=2026-07-01&checkout=2026-07-04&group_adults=2&no_rooms=1',
      room_mapping: 'Standard Double'
    }
  ];
}

console.log(`   ✅ Found ${competitors.length} enabled competitors:\n`);
competitors.forEach((c, i) => {
  console.log(`      ${i + 1}. ${c.name}`);
  console.log(`         URL: ${c.url.slice(0, 60)}...`);
});
console.log('');

if (competitors.length === 0) {
  console.log('⚠️  No competitors configured!');
  console.log('   Add competitors in the admin panel first.\n');
  process.exit(0);
}

// Step 3: Scrape fresh data
console.log('═'.repeat(80));
console.log('🔍 Step 3: Scraping fresh data with FIXED system...\n');

const scraper = new CompetitorScraper(db);

try {
  await scraper.initialize();
  
  const results = [];
  
  for (let i = 0; i < competitors.length; i++) {
    const competitor = competitors[i];
    console.log(`\n[${ i + 1}/${competitors.length}] Scraping: ${competitor.name}`);
    console.log('─'.repeat(80));
    
    try {
      let result = null;
      let usedFallback = false;
      const url = competitor.url.toLowerCase();
      
      // Try Puppeteer first
      if (url.includes('booking.com')) {
        result = await scraper.scrapeBookingCom({
          source: competitor.name,
          url: competitor.url,
          room_mapping: competitor.room_mapping
        });
      } else if (url.includes('airbnb')) {
        result = await scraper.scrapeAirbnb({
          source: competitor.name,
          url: competitor.url,
          room_mapping: competitor.room_mapping
        });
      } else if (url.includes('hotels.com')) {
        result = await scraper.scrapeHotelsCom({
          source: competitor.name,
          url: competitor.url,
          room_mapping: competitor.room_mapping
        });
      }
      
      // Fall back to SerpApi if needed
      if (!result && scraper.serpApi.isAvailable()) {
        console.log('   ⚠️  Puppeteer failed, trying SerpApi fallback...');
        result = await scraper.serpApi.scrapeHotelPrice({
          source: competitor.name,
          url: competitor.url,
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
          results.push(room);
          
          console.log(`   ✅ [${method}] Saved: ${room.room_type} - ${room.price} DKK/night`);
          console.log(`      Dates: ${room.search_checkin} to ${room.search_checkout}`);
        }
      } else {
        console.log(`   ❌ Failed to get price`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    // Delay between requests
    if (i < competitors.length - 1) {
      console.log('   ⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  await scraper.close();
  
  console.log('\n═'.repeat(80));
  console.log('                    SUMMARY');
  console.log('═'.repeat(80));
  console.log(`✅ Successfully scraped: ${results.length}/${competitors.length}`);
  console.log(`❌ Failed: ${competitors.length - results.length}`);
  console.log('');
  
  if (results.length > 0) {
    console.log('📊 New prices:');
    results.forEach(r => {
      console.log(`   ${r.source}: ${r.price} DKK/night (${r.search_checkin} to ${r.search_checkout})`);
    });
  }
  
  console.log('\n🎉 Done! Refresh admin panel to see new data.\n');
  
} catch (error) {
  console.error('❌ Fatal error:', error);
  await scraper.close();
  process.exit(1);
}

