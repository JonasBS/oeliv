#!/bin/bash

# Check if scraping is running
if pgrep -f "scrape-multiple-dates.js" > /dev/null; then
    echo "🔄 Scraping is RUNNING..."
    echo ""
    
    # Check how many prices we have so far
    cd "$(dirname "$0")"
    COUNT=$(sqlite3 src/database/database.sqlite "SELECT COUNT(*) FROM competitor_prices WHERE search_checkin IS NOT NULL;" 2>/dev/null || echo "0")
    DATES=$(sqlite3 src/database/database.sqlite "SELECT COUNT(DISTINCT search_checkin) FROM competitor_prices WHERE search_checkin IS NOT NULL;" 2>/dev/null || echo "0")
    
    echo "📊 Progress so far:"
    echo "   Total prices scraped: $COUNT"
    echo "   Unique dates: $DATES / 40"
    echo ""
    echo "⏳ Still working... Run this script again to check progress."
else
    echo "✅ Scraping is FINISHED (or not running)!"
    echo ""
    
    # Show final stats
    cd "$(dirname "$0")"
    COUNT=$(sqlite3 src/database/database.sqlite "SELECT COUNT(*) FROM competitor_prices WHERE search_checkin IS NOT NULL;" 2>/dev/null || echo "0")
    DATES=$(sqlite3 src/database/database.sqlite "SELECT COUNT(DISTINCT search_checkin) FROM competitor_prices WHERE search_checkin IS NOT NULL;" 2>/dev/null || echo "0")
    
    echo "📊 Final results:"
    echo "   Total prices scraped: $COUNT"
    echo "   Unique dates: $DATES"
    echo ""
    echo "🎉 Ready! Refresh admin panel: http://localhost:3000/admin-react.html"
fi

