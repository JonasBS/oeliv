const tf = require('@tensorflow/tfjs-node');

class PriceOptimizer {
  constructor(db) {
    this.db = db;
    this.model = null;
  }

  // Calculate optimal price based on multiple factors
  async generateRecommendation(roomId, targetDate) {
    const factors = await this.gatherPricingFactors(roomId, targetDate);
    const recommendation = this.calculateOptimalPrice(factors);
    
    return {
      room_id: roomId,
      target_date: targetDate,
      current_price: factors.currentPrice,
      recommended_price: recommendation.price,
      confidence: recommendation.confidence,
      reason: this.generateReason(factors, recommendation),
      potential_revenue_increase: this.calculateRevenueIncrease(
        factors.currentPrice, 
        recommendation.price,
        factors.expectedBookings
      ),
      factors: factors
    };
  }

  async gatherPricingFactors(roomId, targetDate) {
    const [
      currentPrice,
      competitorPrices,
      historicalOccupancy,
      seasonality,
      dayOfWeek,
      localEvents,
      bookingLeadTime,
      demandLevel
    ] = await Promise.all([
      this.getCurrentPrice(roomId),
      this.getCompetitorAveragePrices(targetDate),
      this.getHistoricalOccupancy(roomId, targetDate),
      this.getSeasonalityFactor(targetDate),
      this.getDayOfWeekFactor(targetDate),
      this.checkLocalEvents(targetDate),
      this.getBookingLeadTime(targetDate),
      this.calculateDemandLevel(roomId, targetDate)
    ]);

    return {
      currentPrice,
      competitorAvgPrice: competitorPrices.average,
      competitorMinPrice: competitorPrices.min,
      competitorMaxPrice: competitorPrices.max,
      competitorCount: competitorPrices.count,
      historicalOccupancy,
      seasonalityMultiplier: seasonality,
      dayOfWeekMultiplier: dayOfWeek,
      hasLocalEvents: localEvents.length > 0,
      eventImpact: this.calculateEventImpact(localEvents),
      daysUntilDate: bookingLeadTime,
      demandLevel,
      expectedBookings: this.estimateBookings(demandLevel, historicalOccupancy)
    };
  }

  calculateOptimalPrice(factors) {
    // Base price from competitors
    let optimalPrice = factors.competitorAvgPrice || factors.currentPrice;

    // Apply demand-based adjustments
    const demandMultipliers = {
      'very_low': 0.85,
      'low': 0.92,
      'medium': 1.0,
      'high': 1.12,
      'very_high': 1.25
    };
    optimalPrice *= demandMultipliers[factors.demandLevel] || 1.0;

    // Apply seasonality
    optimalPrice *= factors.seasonalityMultiplier;

    // Apply day of week factor
    optimalPrice *= factors.dayOfWeekMultiplier;

    // Event premium
    if (factors.hasLocalEvents) {
      optimalPrice *= (1 + factors.eventImpact);
    }

    // Booking lead time adjustment (last-minute premium)
    if (factors.daysUntilDate < 7) {
      optimalPrice *= 1.1;
    } else if (factors.daysUntilDate < 3) {
      optimalPrice *= 1.2;
    }

    // Historical occupancy adjustment
    if (factors.historicalOccupancy > 0.8) {
      optimalPrice *= 1.15;
    } else if (factors.historicalOccupancy < 0.4) {
      optimalPrice *= 0.95;
    }

    // Ensure within reasonable bounds (10-50% of competitor average)
    if (factors.competitorAvgPrice) {
      const minPrice = factors.competitorAvgPrice * 0.8;
      const maxPrice = factors.competitorAvgPrice * 1.3;
      optimalPrice = Math.max(minPrice, Math.min(maxPrice, optimalPrice));
    }

    // Round to nearest 50
    optimalPrice = Math.round(optimalPrice / 50) * 50;

    // Calculate confidence score
    const confidence = this.calculateConfidence(factors);

    return { price: optimalPrice, confidence };
  }

  calculateConfidence(factors) {
    let confidence = 0.5; // Base confidence

    // More competitor data = higher confidence
    if (factors.competitorCount >= 3) confidence += 0.2;
    else if (factors.competitorCount >= 2) confidence += 0.1;

    // Historical data = higher confidence
    if (factors.historicalOccupancy > 0) confidence += 0.15;

    // Recent data = higher confidence
    confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  generateReason(factors, recommendation) {
    const reasons = [];

    // Competitor comparison
    if (factors.competitorAvgPrice) {
      const diff = ((factors.competitorAvgPrice - factors.currentPrice) / factors.currentPrice * 100).toFixed(0);
      if (Math.abs(diff) > 10) {
        reasons.push(`Konkurrentpriser er ${Math.abs(diff)}% ${diff > 0 ? 'højere' : 'lavere'}.`);
      }
    }

    // Demand level
    if (factors.demandLevel === 'very_high' || factors.demandLevel === 'high') {
      reasons.push(`${factors.demandLevel === 'very_high' ? 'Meget høj' : 'Høj'} efterspørgsel i perioden.`);
    }

    // Occupancy
    if (factors.historicalOccupancy > 0.8) {
      reasons.push(`Historisk høj belægning (${(factors.historicalOccupancy * 100).toFixed(0)}%).`);
    }

    // Events
    if (factors.hasLocalEvents) {
      reasons.push('Lokale events i området øger efterspørgslen.');
    }

    // Seasonality
    if (factors.seasonalityMultiplier > 1.1) {
      reasons.push('Højsæson med øget efterspørgsel.');
    } else if (factors.seasonalityMultiplier < 0.95) {
      reasons.push('Lavsæson - konkurrencedygtig pris anbefales.');
    }

    // Last minute
    if (factors.daysUntilDate < 7) {
      reasons.push('Sidste-øjebliks booking premium kan anvendes.');
    }

    return reasons.join(' ') || 'Baseret på markedsanalyse og historiske data.';
  }

  calculateRevenueIncrease(currentPrice, recommendedPrice, expectedBookings) {
    const priceIncrease = recommendedPrice - currentPrice;
    // Assume 30 days month, with expected bookings per day
    return priceIncrease * expectedBookings * 30;
  }

  estimateBookings(demandLevel, occupancy) {
    const baseBookings = {
      'very_low': 0.3,
      'low': 0.5,
      'medium': 0.7,
      'high': 0.85,
      'very_high': 0.95
    };

    return (baseBookings[demandLevel] || 0.7) * (occupancy || 0.7);
  }

  // Helper methods to gather data
  async getCurrentPrice(roomId) {
    return new Promise((resolve) => {
      this.db.get(
        'SELECT base_price FROM rooms WHERE id = ?',
        [roomId],
        (err, row) => {
          resolve(row?.base_price || 1000);
        }
      );
    });
  }

  async getCompetitorAveragePrices(targetDate) {
    return new Promise((resolve) => {
      this.db.all(`
        SELECT 
          AVG(price) as average,
          MIN(price) as min,
          MAX(price) as max,
          COUNT(*) as count
        FROM competitor_prices 
        WHERE scraped_at > datetime('now', '-24 hours')
          AND price IS NOT NULL
      `, (err, rows) => {
        if (err || !rows || rows.length === 0) {
          resolve({ average: null, min: null, max: null, count: 0 });
        } else {
          resolve(rows[0]);
        }
      });
    });
  }

  async getHistoricalOccupancy(roomId, targetDate) {
    // Mock - would query historical booking data
    const date = new Date(targetDate);
    const month = date.getMonth();
    
    // Seasonal patterns
    if (month >= 5 && month <= 8) return 0.75; // Summer
    if (month === 11 || month === 0) return 0.85; // Holidays
    return 0.55; // Off-season
  }

  getSeasonalityFactor(targetDate) {
    const date = new Date(targetDate);
    const month = date.getMonth();
    
    // High season (June-August, December)
    if ((month >= 5 && month <= 7) || month === 11) return 1.25;
    // Shoulder season (May, September)
    if (month === 4 || month === 8) return 1.1;
    // Low season
    return 0.9;
  }

  getDayOfWeekFactor(targetDate) {
    const date = new Date(targetDate);
    const dayOfWeek = date.getDay();
    
    // Weekend premium (Friday, Saturday)
    if (dayOfWeek === 5 || dayOfWeek === 6) return 1.15;
    // Sunday
    if (dayOfWeek === 0) return 1.05;
    // Weekdays
    return 1.0;
  }

  async checkLocalEvents(targetDate) {
    // Mock - would integrate with local events API
    return [];
  }

  calculateEventImpact(events) {
    if (events.length === 0) return 0;
    // Major events can increase prices by 20-40%
    return Math.min(events.length * 0.15, 0.4);
  }

  getBookingLeadTime(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async calculateDemandLevel(roomId, targetDate) {
    // Combine multiple signals
    const occupancy = await this.getHistoricalOccupancy(roomId, targetDate);
    const leadTime = this.getBookingLeadTime(targetDate);
    const seasonality = this.getSeasonalityFactor(targetDate);

    const score = (occupancy * 0.5) + (seasonality * 0.3) + ((30 - Math.min(leadTime, 30)) / 30 * 0.2);

    if (score > 0.8) return 'very_high';
    if (score > 0.65) return 'high';
    if (score > 0.45) return 'medium';
    if (score > 0.3) return 'low';
    return 'very_low';
  }

  async generateRecommendationsForAllRooms(daysAhead = 7) {
    const rooms = await this.getAllRooms();
    const recommendations = [];

    for (const room of rooms) {
      for (let i = 0; i < daysAhead; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        
        const rec = await this.generateRecommendation(room.id, targetDate.toISOString().split('T')[0]);
        recommendations.push(rec);
      }
    }

    return recommendations;
  }

  async getAllRooms() {
    return new Promise((resolve) => {
      this.db.all('SELECT * FROM rooms WHERE active = 1', (err, rows) => {
        resolve(rows || []);
      });
    });
  }
}

module.exports = PriceOptimizer;

