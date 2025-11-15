# Sådan sætter du tilgængelighed fra backend

Der er flere måder at sætte tilgængelighed på værelser:

## 1. Via API Endpoint (REST)

### Sæt tilgængelighed for et værelse i et datoområde

**Endpoint:** `POST /api/admin/availability`

**Request Body:**
```json
{
  "room_id": 1,
  "start_date": "2024-12-01",
  "end_date": "2024-12-31",
  "price": 1200,
  "min_stay": 2
}
```

**Eksempel med cURL:**
```bash
curl -X POST https://web-production-367a.up.railway.app/api/admin/availability \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "start_date": "2024-12-01",
    "end_date": "2024-12-31",
    "price": 1200,
    "min_stay": 2
  }'
```

**Eksempel med JavaScript (Node.js):**
```javascript
const response = await fetch('https://web-production-367a.up.railway.app/api/admin/availability', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    room_id: 1,
    start_date: '2024-12-01',
    end_date: '2024-12-31',
    price: 1200,
    min_stay: 2
  })
});

const result = await response.json();
console.log(result);
```

## 2. Direkte i Database (SQLite)

Hvis du har adgang til databasen direkte:

```sql
-- Sæt tilgængelighed for et værelse på en specifik dato
INSERT OR REPLACE INTO availability (room_id, date, available, price, min_stay, source)
VALUES (1, '2024-12-15', 1, 1200, 2, 'manual');

-- Sæt værelse som optaget
INSERT OR REPLACE INTO availability (room_id, date, available, price, min_stay, source)
VALUES (1, '2024-12-20', 0, NULL, NULL, 'manual');

-- Sæt tilgængelighed for flere datoer
INSERT OR REPLACE INTO availability (room_id, date, available, price, min_stay, source)
VALUES 
  (1, '2024-12-01', 1, 1200, 2, 'manual'),
  (1, '2024-12-02', 1, 1200, 2, 'manual'),
  (1, '2024-12-03', 1, 1200, 2, 'manual');
```

## 3. Via Admin Panel Script

Opret en simpel HTML side til at administrere tilgængelighed:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Set Availability</title>
</head>
<body>
  <h1>Sæt Tilgængelighed</h1>
  <form id="availability-form">
    <label>Værelse ID: <input type="number" name="room_id" required></label><br>
    <label>Start dato: <input type="date" name="start_date" required></label><br>
    <label>Slut dato: <input type="date" name="end_date" required></label><br>
    <label>Pris (DKK): <input type="number" name="price"></label><br>
    <label>Min. ophold (nætter): <input type="number" name="min_stay" value="1"></label><br>
    <button type="submit">Sæt tilgængelighed</button>
  </form>
  
  <script>
    document.getElementById('availability-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        room_id: parseInt(formData.get('room_id')),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        price: formData.get('price') ? parseInt(formData.get('price')) : null,
        min_stay: parseInt(formData.get('min_stay')) || 1
      };
      
      const response = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      alert(result.success ? `Tilgængelighed sat for ${result.dates_updated} datoer` : 'Fejl!');
    });
  </script>
</body>
</html>
```

## 4. Sæson-baseret tilgængelighed (Script)

Opret et script til at sætte priser baseret på sæsoner:

```javascript
// set-seasonal-availability.js
const API_BASE = 'https://web-production-367a.up.railway.app/api';

const seasons = {
  low: { price: 1200, min_stay: 1, months: [10, 11, 12, 1, 2, 3, 4] }, // Okt-Apr
  shoulder: { price: 1400, min_stay: 2, months: [5, 6, 9] }, // Maj, Jun, Sep
  high: { price: 1700, min_stay: 3, months: [7, 8] } // Jul, Aug
};

async function setSeasonalAvailability(roomId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  // Generate all dates for the year
  const dates = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const month = d.getMonth() + 1;
    let season = null;
    
    if (seasons.low.months.includes(month)) season = seasons.low;
    else if (seasons.shoulder.months.includes(month)) season = seasons.shoulder;
    else if (seasons.high.months.includes(month)) season = seasons.high;
    
    if (season) {
      dates.push({
        date: d.toISOString().split('T')[0],
        price: season.price,
        min_stay: season.min_stay
      });
    }
  }
  
  // Set availability in batches
  for (let i = 0; i < dates.length; i += 30) {
    const batch = dates.slice(i, i + 30);
    const start = batch[0].date;
    const end = batch[batch.length - 1].date;
    
    await fetch(`${API_BASE}/admin/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: roomId,
        start_date: start,
        end_date: end,
        price: batch[0].price,
        min_stay: batch[0].min_stay
      })
    });
    
    console.log(`Set availability for ${start} to ${end}`);
  }
}

// Brug det sådan:
setSeasonalAvailability(1, 2024); // Sæt for værelse 1, år 2024
```

## 5. Via Admin Panel (forbedret)

Jeg kan opdatere `admin.html` til at have en bedre interface til at sætte tilgængelighed. Skal jeg gøre det?

## Vigtige noter:

- **room_id**: ID'et på værelset (1-5 baseret på default rooms)
- **available**: 1 = ledig, 0 = optaget
- **price**: Pris i DKK (kan være NULL hvis ikke sat)
- **min_stay**: Minimum antal nætter (standard: 1)
- **source**: 'manual' for manuel indtastning, eller channel navn for automatisk

## Eksempel: Sæt hele 2024

```bash
# Lavsæson (Okt-Apr)
curl -X POST https://web-production-367a.up.railway.app/api/admin/availability \
  -H "Content-Type: application/json" \
  -d '{"room_id": 1, "start_date": "2024-10-01", "end_date": "2024-04-30", "price": 1200, "min_stay": 1}'

# Skuldersæson (Maj, Jun, Sep)
curl -X POST https://web-production-367a.up.railway.app/api/admin/availability \
  -H "Content-Type: application/json" \
  -d '{"room_id": 1, "start_date": "2024-05-01", "end_date": "2024-06-30", "price": 1400, "min_stay": 2}'

# Højsæson (Jul, Aug)
curl -X POST https://web-production-367a.up.railway.app/api/admin/availability \
  -H "Content-Type: application/json" \
  -d '{"room_id": 1, "start_date": "2024-07-01", "end_date": "2024-08-31", "price": 1700, "min_stay": 3}'
```
