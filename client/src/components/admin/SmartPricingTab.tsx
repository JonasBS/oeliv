import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { roomsApi, revenueApi, roomPricesApi } from '../../services/api';
import type { Room } from '../../types';

interface CompetitorPrice {
  id: number;
  source: string;
  room_type: string;
  price: number;
  scraped_at: string;
  availability: 'available' | 'limited' | 'sold_out';
  search_checkin?: string | null;
}

interface PricingSuggestion {
  room: Room;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  strategy: string;
  change: number;
  changePercent: number;
  competitorData: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    count: number;
  };
}

type PricingStrategy = 'budget' | 'midrange' | 'premium' | 'dynamic' | 'bornholm';

const SmartPricingTab = () => {
  const [suggestions, setSuggestions] = useState<PricingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<PricingStrategy>('bornholm'); // Default to Bornholm strategy
  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 30), 'yyyy-MM-dd')
  );

  useEffect(() => {
    loadPricingSuggestions();
  }, [strategy, selectedDate]);

  const loadPricingSuggestions = async () => {
    try {
      setLoading(true);
      
      const [roomsData, competitorPrices] = await Promise.all([
        roomsApi.getAll(),
        revenueApi.getCompetitorPricesWithDates()
      ]);
      
      // Filter prices for selected date
      const relevantPrices = competitorPrices.filter(
        (p: CompetitorPrice) => p.search_checkin === selectedDate
      );
      
      // Generate suggestions for each room
      const newSuggestions: PricingSuggestion[] = roomsData.map(room => {
        return generatePricingSuggestion(room, relevantPrices, strategy);
      });
      
      setSuggestions(newSuggestions);
      
    } catch (error) {
      console.error('Error loading pricing suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePricingSuggestion = (
    room: Room,
    competitorPrices: CompetitorPrice[],
    strategy: PricingStrategy
  ): PricingSuggestion => {
    // Match competitor rooms (double, single, suite, etc.)
    const roomTypeLower = room.name.toLowerCase();
    const matchingPrices = competitorPrices.filter(cp => {
      const compRoomLower = cp.room_type.toLowerCase();
      
      // Match logic
      if (roomTypeLower.includes('dobbelt') || roomTypeLower.includes('double')) {
        return compRoomLower.includes('dobbelt') || compRoomLower.includes('double');
      }
      if (roomTypeLower.includes('enkelt') || roomTypeLower.includes('single')) {
        return compRoomLower.includes('enkelt') || compRoomLower.includes('single');
      }
      if (roomTypeLower.includes('suite')) {
        return compRoomLower.includes('suite');
      }
      return false; // No match
    });

    const currentPrice = room.base_price;
    let suggestedPrice = currentPrice;
    let reason = 'Ingen konkurrentdata tilgængelig';
    let strategyName = 'Behold nuværende pris';

    if (matchingPrices.length > 0) {
      const prices = matchingPrices.map(cp => cp.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

      const competitorData = {
        minPrice,
        maxPrice,
        avgPrice,
        count: matchingPrices.length
      };

      // Apply strategy
      switch (strategy) {
        case 'budget':
          suggestedPrice = Math.round(minPrice * 0.90); // 10% under lowest
          strategyName = 'Budget Positioning';
          reason = `10% under konkurrenters laveste pris (${minPrice} kr)`;
          break;

        case 'midrange':
          suggestedPrice = Math.round((minPrice + avgPrice) / 2);
          strategyName = 'Mellem Position';
          reason = `Mellem laveste (${minPrice} kr) og gennemsnit (${avgPrice} kr)`;
          break;

        case 'premium':
          suggestedPrice = Math.round(avgPrice * 1.05); // 5% over average
          strategyName = 'Premium Positioning';
          reason = `5% over konkurrenters gennemsnitspris (${avgPrice} kr)`;
          break;

        case 'dynamic':
          // Check availability status
          const limitedCount = matchingPrices.filter(cp => cp.availability === 'limited').length;
          const soldOutCount = matchingPrices.filter(cp => cp.availability === 'sold_out').length;
          
          if (soldOutCount > matchingPrices.length / 2) {
            // High demand - price high
            suggestedPrice = Math.round(maxPrice * 0.95);
            strategyName = 'Høj Efterspørgsel';
            reason = `Mange konkurrenter udsolgt - pris tæt på max (${maxPrice} kr)`;
          } else if (limitedCount > matchingPrices.length / 3) {
            // Medium demand
            suggestedPrice = avgPrice;
            strategyName = 'Medium Efterspørgsel';
            reason = `Begrænset tilgængelighed - gennemsnitspris (${avgPrice} kr)`;
          } else {
            // Low demand - competitive pricing
            suggestedPrice = Math.round(minPrice * 0.95);
            strategyName = 'Konkurrencedygtig Pris';
            reason = `God tilgængelighed - konkurrencedygtig pris under minimum (${minPrice} kr)`;
          }
          break;

        case 'bornholm':
          // Bornholm-specific strategy: Season + Weekend + Demand
          const searchDate = new Date(selectedDate);
          const month = searchDate.getMonth() + 1; // 1-12
          const dayOfWeek = searchDate.getDay(); // 0=Sunday, 6=Saturday
          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // Fri-Sun
          
          // Base: Start with average competitor price
          let basePrice = avgPrice;
          let seasonMultiplier = 1.0;
          let weekendBonus = 0;
          let demandAdjustment = 0;
          
          // Season multipliers (Bornholm-specific)
          if (month >= 6 && month <= 8) {
            // Juni-August (Peak season)
            seasonMultiplier = 1.35; // +35%
            strategyName = 'Bornholm Høj Sæson';
            reason = `Sommer på Bornholm - peak sæson (${month === 7 ? 'Juli - højeste' : 'Juni/August'})`;
          } else if (month === 5 || month === 9) {
            // Maj, September (Shoulder season)
            seasonMultiplier = 1.15; // +15%
            strategyName = 'Bornholm Skuldersæson';
            reason = `${month === 5 ? 'Maj' : 'September'} - god vejr, færre turister`;
          } else if (month >= 10 || month <= 3) {
            // Okt-Marts (Low season)
            seasonMultiplier = 0.90; // -10%
            strategyName = 'Bornholm Lavsæson';
            reason = `Vinter/efterår - tiltrækker weekendgæster med discount`;
          } else {
            // April
            seasonMultiplier = 1.05; // +5%
            strategyName = 'Bornholm Forår';
            reason = 'April - forår begynder, stigende interesse';
          }
          
          // Weekend bonus (year-round, especially popular on Bornholm)
          if (isWeekend) {
            weekendBonus = 0.15; // +15% for weekends
            strategyName += ' (Weekend)';
          }
          
          // Demand adjustment based on competitors
          const limitedCountBH = matchingPrices.filter(cp => cp.availability === 'limited').length;
          const soldOutCountBH = matchingPrices.filter(cp => cp.availability === 'sold_out').length;
          
          if (soldOutCountBH > matchingPrices.length / 2) {
            demandAdjustment = 0.20; // +20% when competitors sold out
            reason += `. Høj booking-tryk (+${Math.round(demandAdjustment * 100)}%)`;
          } else if (limitedCountBH > matchingPrices.length / 3) {
            demandAdjustment = 0.10; // +10% when limited availability
            reason += `. Moderat booking-tryk (+${Math.round(demandAdjustment * 100)}%)`;
          }
          
          // Calculate final price
          suggestedPrice = Math.round(
            basePrice * seasonMultiplier * (1 + weekendBonus + demandAdjustment)
          );
          
          // Add weekend info to reason
          if (isWeekend) {
            reason += `. Weekend-tillæg (+15%)`;
          }
          
          // Ensure we're competitive but profitable
          if (suggestedPrice < minPrice * 0.85) {
            suggestedPrice = Math.round(minPrice * 0.85);
          }
          if (suggestedPrice > maxPrice * 1.20) {
            suggestedPrice = Math.round(maxPrice * 1.20);
          }
          
          break;
      }

      return {
        room,
        currentPrice,
        suggestedPrice,
        reason,
        strategy: strategyName,
        change: suggestedPrice - currentPrice,
        changePercent: Math.round(((suggestedPrice - currentPrice) / currentPrice) * 100),
        competitorData
      };
    }

    // No competitor data
    return {
      room,
      currentPrice,
      suggestedPrice: currentPrice,
      reason,
      strategy: strategyName,
      change: 0,
      changePercent: 0,
      competitorData: {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        count: 0
      }
    };
  };

  const handleApplySuggestion = async (suggestion: PricingSuggestion) => {
    if (!confirm(`Vil du anvende anbefalet pris på ${suggestion.suggestedPrice} kr for ${suggestion.room.name} den ${format(new Date(selectedDate), 'd. MMMM yyyy', { locale: da })}?`)) {
      return;
    }

    try {
      // Set date-specific price
      await roomPricesApi.setPrice(suggestion.room.id, selectedDate, suggestion.suggestedPrice);
      
      alert(`✅ Pris opdateret!\n\n${suggestion.room.name}: ${suggestion.suggestedPrice} kr/nat den ${format(new Date(selectedDate), 'd. MMM yyyy', { locale: da })}`);
      
      // Reload suggestions to show updated data
      await loadPricingSuggestions();
    } catch (error) {
      console.error('Error applying price suggestion:', error);
      alert('❌ Fejl ved opdatering af pris. Se konsollen for detaljer.');
    }
  };

  if (loading) {
    return <div className="loading">💰 Beregner smarte priser...</div>;
  }

  return (
    <div className="smart-pricing-tab">
      <div className="pricing-header">
        <div>
          <h2>💡 Smart Prissætning</h2>
          <p>AI-drevne prisanbefalinger baseret på konkurrentanalyse</p>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="pricing-controls">
        <div className="control-group">
          <label>📊 Prisstrategi:</label>
          <select 
            value={strategy} 
            onChange={(e) => setStrategy(e.target.value as PricingStrategy)}
            className="strategy-select"
          >
            <option value="bornholm">🏝️ Bornholm Smart (ANBEFALET)</option>
            <option value="dynamic">🚀 Dynamisk (efterspørgsels-baseret)</option>
            <option value="midrange">🎯 Mellem (balanced position)</option>
            <option value="budget">💵 Budget (10% under konkurrenter)</option>
            <option value="premium">⭐ Premium (over gennemsnit)</option>
          </select>
        </div>

        <div className="control-group">
          <label>📅 Dato:</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
        </div>

        <button onClick={loadPricingSuggestions} className="refresh-btn">
          🔄 Genberegn
        </button>
      </div>

      {/* Strategy Explanation */}
      <div className="strategy-info">
        <h3>
          {strategy === 'bornholm' && '🏝️ Bornholm Smart Strategi'}
          {strategy === 'budget' && '💵 Budget Strategi'}
          {strategy === 'midrange' && '🎯 Mellem Strategi'}
          {strategy === 'premium' && '⭐ Premium Strategi'}
          {strategy === 'dynamic' && '🚀 Dynamisk Strategi'}
        </h3>
        <p>
          {strategy === 'bornholm' && 'Skræddersyet til Bornholm-turisme! Kombinerer sæson (højsæson jun-aug +35%, skuldersæson +15%, lavsæson -10%), weekend-bonus (+15%), og konkurrent-efterspørgsel. Perfekt til danske gæster der elsker Bornholm sommer og weekend-ophold året rundt.'}
          {strategy === 'budget' && 'Tiltrækker prisfølsomme kunder ved at ligge 10% under konkurrenternes laveste pris. God for at fylde værelser i lavsæson.'}
          {strategy === 'midrange' && 'Balanceret position mellem laveste og gennemsnitspris. Sikrer konkurrencedygtighed uden at ofre profit.'}
          {strategy === 'premium' && 'Positionerer dig som premium-tilbud ved at ligge over gennemsnittet. Kræver ekstra værdi (beliggenhed, service, faciliteter).'}
          {strategy === 'dynamic' && 'Automatisk tilpasning baseret på markedets efterspørgsel. Højere priser når konkurrenter er udsolgt, lavere når der er god tilgængelighed.'}
        </p>
      </div>

      {/* Pricing Suggestions */}
      <div className="suggestions-grid">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index} 
            className={`suggestion-card ${suggestion.change === 0 ? 'no-change' : suggestion.change > 0 ? 'increase' : 'decrease'}`}
          >
            <div className="suggestion-header">
              <h4>{suggestion.room.name}</h4>
              <span className="strategy-badge">{suggestion.strategy}</span>
            </div>

            <div className="price-comparison">
              <div className="price-item current">
                <span className="price-label">Nuværende pris</span>
                <span className="price-value">
                  {new Intl.NumberFormat('da-DK', { 
                    style: 'currency', 
                    currency: 'DKK',
                    minimumFractionDigits: 0 
                  }).format(suggestion.currentPrice)}
                </span>
              </div>

              <div className="price-arrow">
                {suggestion.change > 0 && '↗️'}
                {suggestion.change < 0 && '↘️'}
                {suggestion.change === 0 && '➡️'}
              </div>

              <div className="price-item suggested">
                <span className="price-label">Anbefalet pris</span>
                <span className="price-value">
                  {new Intl.NumberFormat('da-DK', { 
                    style: 'currency', 
                    currency: 'DKK',
                    minimumFractionDigits: 0 
                  }).format(suggestion.suggestedPrice)}
                </span>
              </div>
            </div>

            {suggestion.change !== 0 && (
              <div className="price-change">
                <span className={`change-badge ${suggestion.change > 0 ? 'positive' : 'negative'}`}>
                  {suggestion.change > 0 ? '+' : ''}{suggestion.change} kr ({suggestion.change > 0 ? '+' : ''}{suggestion.changePercent}%)
                </span>
              </div>
            )}

            <div className="suggestion-reason">
              <strong>Begrundelse:</strong> {suggestion.reason}
            </div>

            {suggestion.competitorData.count > 0 && (
              <div className="competitor-stats">
                <h5>📊 Konkurrentdata ({format(new Date(selectedDate), 'd. MMM yyyy', { locale: da })}):</h5>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-label">Laveste:</span>
                    <span className="stat-value">{suggestion.competitorData.minPrice} kr</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Gennemsnit:</span>
                    <span className="stat-value">{suggestion.competitorData.avgPrice} kr</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Højeste:</span>
                    <span className="stat-value">{suggestion.competitorData.maxPrice} kr</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Konkurrenter:</span>
                    <span className="stat-value">{suggestion.competitorData.count}</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              className="apply-btn"
              onClick={() => handleApplySuggestion(suggestion)}
              disabled={suggestion.change === 0}
            >
              {suggestion.change === 0 ? '✓ Optimal pris' : '✨ Anvend anbefaling'}
            </button>
          </div>
        ))}
      </div>

      {suggestions.length === 0 && (
        <div className="empty-state">
          <p>📅 Ingen konkurrentdata for {format(new Date(selectedDate), 'd. MMMM yyyy', { locale: da })}</p>
          <p>Vælg en anden dato eller kør scraping for at få prisanbefalinger.</p>
        </div>
      )}
    </div>
  );
};

export default SmartPricingTab;

