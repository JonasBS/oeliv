#!/bin/bash

# ØLIV Booking System - Initialize Availability
# This script sets up availability for all rooms for the next 12 months

echo "🚀 Initializing availability for ØLIV rooms..."
echo ""

# API endpoint
API_URL="http://localhost:3000/api/admin/availability"

# Date range (current year)
START_DATE=$(date +%Y)-01-01
END_DATE=$(date +%Y)-12-31

# Room configurations
# Format: room_id|room_name|price|min_stay
ROOMS=(
  "1|Kystværelse|1200|2"
  "2|Havsuite|1500|2"
  "3|Stor havsuite|2000|2"
  "4|Ferielejlighed|1800|2"
  "5|Gårdsværelser|1300|2"
)

# Initialize availability for each room
for room_config in "${ROOMS[@]}"; do
  IFS='|' read -r room_id room_name price min_stay <<< "$room_config"
  
  echo "📅 Setting availability for $room_name (Room $room_id)..."
  echo "   Price: ${price} DKK/night"
  echo "   Min stay: ${min_stay} nights"
  echo "   Period: $START_DATE to $END_DATE"
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"room_id\": $room_id,
      \"start_date\": \"$START_DATE\",
      \"end_date\": \"$END_DATE\",
      \"price\": $price,
      \"min_stay\": $min_stay,
      \"available\": 1
    }")
  
  # Check if successful
  if echo "$response" | grep -q "success"; then
    echo "   ✅ Success!"
  else
    echo "   ❌ Failed: $response"
  fi
  echo ""
done

echo "✨ Availability initialization complete!"
echo ""
echo "You can now:"
echo "  1. Open http://localhost:5173"
echo "  2. Click 'Book nu'"
echo "  3. See available dates in the calendar"

