import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { roomsApi, revenueApi } from '../../services/api';
import type { Room } from '../../types';

interface CompetitorPrice {
  source: string;
  room_type: string;
  price: number;
  date_checked: string;
  availability: 'available' | 'limited' | 'sold_out';
}

interface MarketInsight {
  date: string;
  our_price: number;
  avg_competitor_price: number;
  occupancy_rate: number;
  demand_level: 'low' | 'medium' | 'high' | 'very_high';
  recommended_price: number;
}

interface PriceRecommendation {
  room_id: number;
  current_price: number;
  recommended_price: number;
  reason: string;
  potential_revenue_increase: number;
}

const RevenueManagementTab = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [competitorPrices, setCompetitorPrices] = useState<CompetitorPrice[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [priceRecommendations, setPriceRecommendations] = useState<PriceRecommendation[]>([]);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    loadRooms();
    loadCompetitorPrices();
    loadMarketInsights();
    generatePriceRecommendations();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadCompetitorPrices = async () => {
    try {
      const data = await revenueApi.getCompetitorPrices();
      setCompetitorPrices(data);
    } catch (error) {
      console.error('Error loading competitor prices:', error);
      // Fallback to mock data if API fails
      const mockPrices: CompetitorPrice[] = [
        {
          source: 'Booking.com',
          room_type: 'Double Room',
          price: 1450,
          date_checked: new Date().toISOString(),
          availability: 'available',
        },
        {
          source: 'Airbnb',
          room_type: 'Double Room',
          price: 1380,
          date_checked: new Date().toISOString(),
          availability: 'limited',
        },
      ];
      setCompetitorPrices(mockPrices);
    }
  };

  const loadMarketInsights = async () => {
    try {
      const data = await revenueApi.getMarketInsights(3);
      setMarketInsights(data);
    } catch (error) {
      console.error('Error loading market insights:', error);
      // Fallback to mock data
      const mockInsights: MarketInsight[] = [
        {
          date: '2025-12-20',
          our_price: 1200,
          avg_competitor_price: 1450,
          occupancy_rate: 45,
          demand_level: 'high',
          recommended_price: 1400,
        },
      ];
      setMarketInsights(mockInsights);
    }
  };

  const generatePriceRecommendations = async () => {
    try {
      const data = await revenueApi.getPriceRecommendations(7);
      
      // Convert grouped data to array format
      const recommendations: PriceRecommendation[] = [];
      for (const roomId in data) {
        const roomRecs = data[roomId];
        if (roomRecs && roomRecs.length > 0) {
          // Take first recommendation for each room
          recommendations.push(roomRecs[0]);
        }
      }
      
      setPriceRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Fallback to mock data
      const mockRecommendations: PriceRecommendation[] = [
        {
          room_id: 1,
          current_price: 1200,
          recommended_price: 1450,
          reason: 'Konkurrentpriser er 20% højere. Høj efterspørgsel i perioden.',
          potential_revenue_increase: 3750,
        },
      ];
      setPriceRecommendations(mockRecommendations);
    }
  };

  const handleScrapeCompetitors = async () => {
    setScraping(true);
    try {
      // Get competitor configs
      const configs = await revenueApi.getCompetitorConfig();
      
      if (configs.length === 0) {
        alert('Ingen konkurrenter konfigureret. Tilføj konkurrent-URLs i indstillingerne.');
        return;
      }

      // Trigger scraping
      await revenueApi.scrapeCompetitors(configs);
      
      // Reload data
      await loadCompetitorPrices();
      await loadMarketInsights();
      await generatePriceRecommendations();
      
      alert('✅ Konkurrentdata opdateret!');
    } catch (error) {
      console.error('Error scraping competitors:', error);
      alert('❌ Fejl ved scraping. Se konsollen for detaljer.');
    } finally {
      setScraping(false);
    }
  };

  const handleApplyPrice = async (rec: PriceRecommendation) => {
    if (!confirm(`Vil du anvende anbefalet pris på ${rec.recommended_price} kr for værelse #${rec.room_id}?`)) {
      return;
    }

    try {
      const targetDate = new Date().toISOString().split('T')[0];
      await revenueApi.applyRecommendedPrice(rec.room_id, targetDate, rec.recommended_price);
      alert('✅ Pris opdateret!');
      await generatePriceRecommendations();
    } catch (error) {
      console.error('Error applying price:', error);
      alert('❌ Fejl ved prisændring. Se konsollen for detaljer.');
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return '#4caf50';
      case 'limited': return '#ff9800';
      case 'sold_out': return '#f44336';
      default: return '#757575';
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'low': return '#9e9e9e';
      case 'medium': return '#2196f3';
      case 'high': return '#ff9800';
      case 'very_high': return '#f44336';
      default: return '#757575';
    }
  };

  const calculatePriceDifference = (ourPrice: number, competitorPrice: number) => {
    const diff = ((competitorPrice - ourPrice) / ourPrice) * 100;
    return diff;
  };

  return (
    <div className="revenue-tab">
      <div className="tab-header">
        <h2>Revenue Management & Konkurrentanalyse</h2>
        <button 
          onClick={handleScrapeCompetitors}
          className="sync-btn"
          disabled={scraping}
        >
          {scraping ? '🔄 Scraper konkurrenter...' : '🔍 Opdater markedsdata'}
        </button>
      </div>

      <div className="revenue-info-card">
        <h3>📊 Intelligente prisanbefalinger</h3>
        <p>
          Baseret på konkurrentpriser, efterspørgsel, sæson og historisk data genererer systemet 
          automatiske prisanbefalinger for at maksimere din omsætning.
        </p>
      </div>

      {/* Price Recommendations */}
      <div className="section-card">
        <div className="section-header">
          <h3>💡 Anbefalede prisjusteringer</h3>
          <span className="badge-info">
            Potentiel ekstra omsætning: {new Intl.NumberFormat('da-DK', { 
              style: 'currency', 
              currency: 'DKK',
              minimumFractionDigits: 0 
            }).format(priceRecommendations.reduce((sum, r) => sum + r.potential_revenue_increase, 0))} / måned
          </span>
        </div>

        <div className="recommendations-grid">
          {priceRecommendations.map((rec) => {
            const room = rooms.find(r => r.id === rec.room_id);
            const increase = rec.recommended_price - rec.current_price;
            const increasePercent = ((increase / rec.current_price) * 100).toFixed(0);

            return (
              <div key={rec.room_id} className="recommendation-card">
                <div className="rec-header">
                  <h4>{room?.name || `Værelse #${rec.room_id}`}</h4>
                  <span className="price-increase">+{increasePercent}%</span>
                </div>

                <div className="price-comparison">
                  <div className="price-item">
                    <span className="price-label">Nuværende pris:</span>
                    <span className="price-current">
                      {new Intl.NumberFormat('da-DK', { 
                        style: 'currency', 
                        currency: 'DKK',
                        minimumFractionDigits: 0 
                      }).format(rec.current_price)}
                    </span>
                  </div>
                  <div className="price-arrow">→</div>
                  <div className="price-item">
                    <span className="price-label">Anbefalet pris:</span>
                    <span className="price-recommended">
                      {new Intl.NumberFormat('da-DK', { 
                        style: 'currency', 
                        currency: 'DKK',
                        minimumFractionDigits: 0 
                      }).format(rec.recommended_price)}
                    </span>
                  </div>
                </div>

                <div className="rec-reason">
                  <p>{rec.reason}</p>
                </div>

                <div className="rec-revenue">
                  <span>💰 Potentiel ekstra omsætning: </span>
                  <strong>
                    {new Intl.NumberFormat('da-DK', { 
                      style: 'currency', 
                      currency: 'DKK',
                      minimumFractionDigits: 0 
                    }).format(rec.potential_revenue_increase)} / måned
                  </strong>
                </div>

                <button className="apply-btn" onClick={() => handleApplyPrice(rec)}>
                  ✓ Anvend denne pris
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitor Prices */}
      <div className="section-card">
        <div className="section-header">
          <h3>🔍 Konkurrentpriser</h3>
          <span className="last-updated">
            Sidst opdateret: {format(new Date(), 'dd. MMM yyyy HH:mm', { locale: da })}
          </span>
        </div>

        <div className="competitor-grid">
          {competitorPrices.map((comp, index) => (
            <div key={index} className="competitor-card">
              <div className="comp-header">
                <span className="comp-source">{comp.source}</span>
                <span 
                  className="comp-availability"
                  style={{ backgroundColor: getAvailabilityColor(comp.availability) }}
                >
                  {comp.availability === 'available' ? 'Ledig' : 
                   comp.availability === 'limited' ? 'Få tilbage' : 'Udsolgt'}
                </span>
              </div>

              <div className="comp-room">{comp.room_type}</div>

              <div className="comp-price">
                {new Intl.NumberFormat('da-DK', { 
                  style: 'currency', 
                  currency: 'DKK',
                  minimumFractionDigits: 0 
                }).format(comp.price)}
              </div>

              <div className="comp-diff">
                {(() => {
                  const ourRoom = rooms.find(r => r.name.includes('Double') || r.name.includes('Suite'));
                  if (ourRoom) {
                    const diff = calculatePriceDifference(ourRoom.base_price, comp.price);
                    return (
                      <span className={diff > 0 ? 'diff-higher' : 'diff-lower'}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(0)}% vs. vores pris
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Insights */}
      <div className="section-card">
        <div className="section-header">
          <h3>📈 Markedsindsigt & Efterspørgsel</h3>
        </div>

        <div className="insights-table">
          <div className="table-header">
            <div>Dato</div>
            <div>Vores pris</div>
            <div>Gns. konkurrent</div>
            <div>Belægning</div>
            <div>Efterspørgsel</div>
            <div>Anbefaling</div>
          </div>

          {marketInsights.map((insight, index) => (
            <div key={index} className="table-row">
              <div className="insight-date">
                {format(new Date(insight.date), 'dd. MMM', { locale: da })}
              </div>
              <div className="insight-our-price">
                {new Intl.NumberFormat('da-DK', { 
                  style: 'currency', 
                  currency: 'DKK',
                  minimumFractionDigits: 0 
                }).format(insight.our_price)}
              </div>
              <div className="insight-competitor">
                {new Intl.NumberFormat('da-DK', { 
                  style: 'currency', 
                  currency: 'DKK',
                  minimumFractionDigits: 0 
                }).format(insight.avg_competitor_price)}
              </div>
              <div className="insight-occupancy">
                <div className="occupancy-bar">
                  <div 
                    className="occupancy-fill" 
                    style={{ width: `${insight.occupancy_rate}%` }}
                  />
                </div>
                <span>{insight.occupancy_rate}%</span>
              </div>
              <div className="insight-demand">
                <span 
                  className="demand-badge"
                  style={{ backgroundColor: getDemandColor(insight.demand_level) }}
                >
                  {insight.demand_level === 'low' ? 'Lav' :
                   insight.demand_level === 'medium' ? 'Mellem' :
                   insight.demand_level === 'high' ? 'Høj' : 'Meget høj'}
                </span>
              </div>
              <div className="insight-recommended">
                <strong>
                  {new Intl.NumberFormat('da-DK', { 
                    style: 'currency', 
                    currency: 'DKK',
                    minimumFractionDigits: 0 
                  }).format(insight.recommended_price)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="setup-card">
        <h3>⚙️ Konfigurer automatisk prisoptimering</h3>
        <p>
          For at aktivere real-time konkurrentovervågning skal du konfigurere følgende:
        </p>
        <ul className="setup-list">
          <li>✓ Tilføj konkurrent-URLs (Booking.com, Airbnb, Hotels.com)</li>
          <li>✓ Indstil scraping-interval (dagligt, hver 6. time, etc.)</li>
          <li>✓ Definer minimum og maximum priser for hvert værelse</li>
          <li>✓ Vælg automatiske prisregler (f.eks. "Match konkurrenter +5%")</li>
          <li>✓ Aktiver email-notifikationer ved store prisændringer</li>
        </ul>
        <button className="setup-btn">
          🚀 Start opsætning
        </button>
      </div>
    </div>
  );
};

export default RevenueManagementTab;

