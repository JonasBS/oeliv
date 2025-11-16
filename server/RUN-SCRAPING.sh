#!/bin/bash

echo "🚀 Starting 10-month scraping..."
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📅 This will scrape 40 weeks of competitor prices"
echo "⏱️  Estimated time: 3-5 minutes"
echo ""
echo "💡 TIP: You can:"
echo "   - Keep this window open to watch progress"
echo "   - Or press Ctrl+C to cancel"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

cd "$(dirname "$0")"
node scrape-multiple-dates.js

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ SCRAPING COMPLETE!"
echo ""
echo "📊 Check results:"
COUNT=$(sqlite3 src/database/database.sqlite "SELECT COUNT(*) FROM competitor_prices WHERE search_checkin IS NOT NULL;" 2>/dev/null || echo "0")
DATES=$(sqlite3 src/database/database.sqlite "SELECT COUNT(DISTINCT search_checkin) FROM competitor_prices WHERE search_checkin IS NOT NULL;" 2>/dev/null || echo "0")

echo "   Total prices: $COUNT"
echo "   Unique dates: $DATES"
echo ""
echo "🎉 Ready! Open: http://localhost:3000/admin-react.html"
echo "════════════════════════════════════════════════════════════════"

