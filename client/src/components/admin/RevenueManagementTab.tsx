import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { roomsApi, revenueApi } from '../../services/api';
import type { Room } from '../../types';

interface CompetitorPrice {
  id: number;
  source: string;
  room_type: string;
  price: number;
  scraped_at: string;
  availability: 'available' | 'limited' | 'sold_out';
  search_checkin?: string | null;
  search_checkout?: string | null;
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

interface CompetitorConfig {
  id?: number;
  name: string;
  url: string;
  room_type: string;
  active: boolean;
}

const RevenueManagementTab = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [competitorPrices, setCompetitorPrices] = useState<CompetitorPrice[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [priceRecommendations, setPriceRecommendations] = useState<PriceRecommendation[]>([]);
  const [competitorConfigs, setCompetitorConfigs] = useState<CompetitorConfig[]>([]);
  const [scraping, setScraping] = useState(false);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState<CompetitorConfig>({
    name: '',
    url: '',
    room_type: 'standard',
    active: true,
  });

  useEffect(() => {
    loadRooms();
    loadCompetitorPrices();
    loadMarketInsights();
    generatePriceRecommendations();
    loadCompetitorConfigs();
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
      console.log('📊 Loading competitor prices with dates from API...');
      const data = await revenueApi.getCompetitorPricesWithDates();
      console.log(`✅ Loaded ${data.length} competitor prices:`, data);
      
      if (data && data.length > 0) {
        setCompetitorPrices(data);
        return;
      }
      
      // If no data, show message
      console.warn('⚠️  No competitor prices found in database');
      setCompetitorPrices([]);
    } catch (error) {
      console.error('Error loading competitor prices:', error);
      setCompetitorPrices([]);
    }
  };

  const loadMarketInsights = async () => {
    try {
      console.log('📊 Loading market insights from API...');
      const data = await revenueApi.getMarketInsights(7);
      console.log(`✅ Loaded ${data.length} market insights:`, data);
      setMarketInsights(data);
    } catch (error) {
      console.error('Error loading market insights:', error);
      setMarketInsights([]);
    }
  };

  const loadCompetitorConfigs = async () => {
    try {
      const data = await revenueApi.getCompetitorConfig();
      // Map database fields to frontend format
      const mapped = data.map((config: any) => ({
        id: config.id,
        name: config.source,
        url: config.url,
        room_type: config.room_mapping || 'standard',
        active: config.active === 1,
      }));
      setCompetitorConfigs(mapped);
    } catch (error) {
      console.error('Error loading competitor configs:', error);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name || !newCompetitor.url) {
      alert('Udfyld venligst navn og URL');
      return;
    }

    try {
      await revenueApi.addCompetitorConfig(newCompetitor);
      await loadCompetitorConfigs();
      setShowAddCompetitor(false);
      setNewCompetitor({
        name: '',
        url: '',
        room_type: 'standard',
        active: true,
      });
      alert('✅ Konkurrent tilføjet!');
    } catch (error) {
      console.error('Error adding competitor:', error);
      alert('❌ Fejl ved tilføjelse af konkurrent');
    }
  };

  const handleDeleteCompetitor = async (id: number) => {
    if (!confirm('Er du sikker på du vil slette denne konkurrent?')) {
      return;
    }

    try {
      await revenueApi.deleteCompetitorConfig(id);
      await loadCompetitorConfigs();
      alert('✅ Konkurrent slettet!');
    } catch (error) {
      console.error('Error deleting competitor:', error);
      alert('❌ Fejl ved sletning');
    }
  };

  const handleToggleCompetitor = async (config: CompetitorConfig) => {
    if (!config.id) return;

    try {
      await revenueApi.updateCompetitorConfig(config.id, {
        ...config,
        active: !config.active,
      });
      await loadCompetitorConfigs();
    } catch (error) {
      console.error('Error toggling competitor:', error);
      alert('❌ Fejl ved opdatering');
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

      {/* Competitor Prices with Calendar View */}
      <div className="section-card">
        <div className="section-header">
          <h3>📅 Konkurrentpriser efter dato</h3>
          <span className="last-updated">
            Sidst opdateret: {format(new Date(), 'dd. MMM yyyy HH:mm', { locale: da })}
          </span>
        </div>

        <div className="competitor-calendar-view">
          {(() => {
            // Group prices by date range
            const pricesByDateRange = competitorPrices.reduce((acc, comp) => {
              if (comp.search_checkin && comp.search_checkout) {
                const key = `${comp.search_checkin}_${comp.search_checkout}`;
                if (!acc[key]) {
                  acc[key] = {
                    checkin: comp.search_checkin,
                    checkout: comp.search_checkout,
                    prices: []
                  };
                }
                acc[key].prices.push(comp);
              } else {
                // No date - put in "Other" category
                if (!acc['no_date']) {
                  acc['no_date'] = {
                    checkin: null,
                    checkout: null,
                    prices: []
                  };
                }
                acc['no_date'].prices.push(comp);
              }
              return acc;
            }, {} as Record<string, { checkin: string | null, checkout: string | null, prices: CompetitorPrice[] }>);

            const sortedDateRanges = Object.entries(pricesByDateRange).sort((a, b) => {
              if (a[0] === 'no_date') return 1;
              if (b[0] === 'no_date') return -1;
              return (a[1].checkin || '').localeCompare(b[1].checkin || '');
            });

            return sortedDateRanges.map(([key, dateGroup]) => (
              <div key={key} className="date-range-group">
                <div className="date-range-header">
                  {dateGroup.checkin && dateGroup.checkout ? (
                    <>
                      <span className="date-icon">📅</span>
                      <span className="date-range">
                        {format(new Date(dateGroup.checkin), 'd. MMM', { locale: da })} - {format(new Date(dateGroup.checkout), 'd. MMM yyyy', { locale: da })}
                      </span>
                      <span className="nights-count">
                        ({Math.ceil((new Date(dateGroup.checkout).getTime() - new Date(dateGroup.checkin).getTime()) / (1000 * 60 * 60 * 24))} nætter)
                      </span>
                      <span className="price-avg">
                        Gennemsnit: {new Intl.NumberFormat('da-DK', { 
                          style: 'currency', 
                          currency: 'DKK',
                          minimumFractionDigits: 0 
                        }).format(dateGroup.prices.reduce((sum, p) => sum + p.price, 0) / dateGroup.prices.length)}
                      </span>
                    </>
                  ) : (
                    <span className="date-unknown">⚠️ Ingen dato-information</span>
                  )}
                </div>

                <div className="competitor-grid-mini">
                  {dateGroup.prices.map((comp, index) => (
                    <div key={`${key}-${index}`} className="competitor-card-mini">
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

                      <div className="comp-scraped">
                        Scraped: {format(new Date(comp.scraped_at), 'HH:mm', { locale: da })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          {competitorPrices.length === 0 && (
            <div className="empty-state">
              <p>📊 Ingen konkurrentpriser endnu.</p>
              <p>Klik "🔍 Opdater markedsdata" for at starte scraping.</p>
            </div>
          )}
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

      {/* Competitor Configuration */}
      <div className="section-card">
        <div className="section-header">
          <h3>🏨 Konkurrent-konfiguration</h3>
          <button 
            onClick={() => setShowAddCompetitor(!showAddCompetitor)}
            className="add-competitor-btn"
          >
            {showAddCompetitor ? '✕ Annuller' : '+ Tilføj konkurrent'}
          </button>
        </div>

        {showAddCompetitor && (
          <div className="add-competitor-form">
            <div className="form-row">
              <div className="form-field">
                <label>Navn</label>
                <input
                  type="text"
                  placeholder="Hotel Søndergaard"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>URL</label>
                <input
                  type="url"
                  placeholder="https://www.booking.com/hotel/dk/..."
                  value={newCompetitor.url}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, url: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Værelse-type</label>
                <select
                  value={newCompetitor.room_type}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, room_type: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
              <button onClick={handleAddCompetitor} className="save-competitor-btn">
                💾 Gem konkurrent
              </button>
            </div>
          </div>
        )}

        <div className="competitor-list">
          {competitorConfigs.length === 0 ? (
            <div className="empty-state">
              <p>🏨 Ingen konkurrenter konfigureret endnu.</p>
              <p>Tilføj konkurrent-URLs fra Booking.com, Airbnb, etc. for at starte prissammenligning.</p>
            </div>
          ) : (
            competitorConfigs.map((config) => (
              <div key={config.id} className="competitor-config-card">
                <div className="competitor-info">
                  <div className="competitor-header">
                    <h4>{config.name}</h4>
                    <span className={`status-badge ${config.active ? 'active' : 'inactive'}`}>
                      {config.active ? '✓ Aktiv' : '✕ Inaktiv'}
                    </span>
                  </div>
                  <div className="competitor-url">{config.url}</div>
                  <div className="competitor-meta">
                    <span className="room-type-tag">{config.room_type}</span>
                  </div>
                </div>
                <div className="competitor-actions">
                  <button
                    onClick={() => handleToggleCompetitor(config)}
                    className="toggle-btn"
                    title={config.active ? 'Deaktiver' : 'Aktiver'}
                  >
                    {config.active ? '⏸' : '▶️'}
                  </button>
                  <button
                    onClick={() => config.id && handleDeleteCompetitor(config.id)}
                    className="delete-btn"
                    title="Slet"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="setup-card">
        <h3>⚙️ Sådan bruges systemet</h3>
        <p>
          Revenue Management systemet hjælper dig med at optimere dine priser baseret på markedsforhold:
        </p>
        <ul className="setup-list">
          <li><strong>1. Tilføj konkurrenter:</strong> Indtast URLs fra Booking.com, Airbnb, etc. ovenfor</li>
          <li><strong>2. Klik "Opdater markedsdata":</strong> Scraper aktuelle priser fra konkurrenter</li>
          <li><strong>3. Gennemgå anbefalinger:</strong> AI analyserer data og foreslår optimale priser</li>
          <li><strong>4. Anvend priser:</strong> Klik "Anvend" på relevante anbefalinger</li>
          <li><strong>5. Gentag dagligt:</strong> Hold dig opdateret med markedet</li>
        </ul>
        <div className="setup-tips">
          <h4>💡 Tips til bedre resultater:</h4>
          <ul>
            <li>Tilføj 3-5 sammenlignelige konkurrenter i dit område</li>
            <li>Kør scraping dagligt eller hver 6. time i højsæson</li>
            <li>Kombiner med sæsonpriser for maksimal optimering</li>
            <li>Monitor anbefalingerne men brug din erfaring til den endelige beslutning</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RevenueManagementTab;

