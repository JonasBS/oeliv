import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { roomsApi } from '../../services/api';
import type { Room } from '../../types';

interface PricingRule {
  id: string;
  name: string;
  room_id: number | null;
  start_date: string;
  end_date: string;
  price_modifier: number;
  modifier_type: 'percentage' | 'fixed';
  active: boolean;
}

const PricingTab = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    room_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    price_modifier: 0,
    modifier_type: 'percentage' as 'percentage' | 'fixed',
  });

  useEffect(() => {
    loadRooms();
    loadPricingRules();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadPricingRules = () => {
    // Mock data - i produktion ville dette være fra API
    const mockRules: PricingRule[] = [
      {
        id: '1',
        name: 'Høj sæson (Sommer)',
        room_id: null,
        start_date: '2025-06-01',
        end_date: '2025-08-31',
        price_modifier: 25,
        modifier_type: 'percentage',
        active: true,
      },
      {
        id: '2',
        name: 'Jul & Nytår',
        room_id: null,
        start_date: '2025-12-20',
        end_date: '2026-01-05',
        price_modifier: 40,
        modifier_type: 'percentage',
        active: true,
      },
      {
        id: '3',
        name: 'Lav sæson (Vinter)',
        room_id: null,
        start_date: '2026-01-06',
        end_date: '2026-03-31',
        price_modifier: -15,
        modifier_type: 'percentage',
        active: true,
      },
    ];
    setPricingRules(mockRules);
  };

  const handleAddRule = () => {
    const newRule: PricingRule = {
      id: Date.now().toString(),
      name: formData.name,
      room_id: formData.room_id ? Number(formData.room_id) : null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      price_modifier: formData.price_modifier,
      modifier_type: formData.modifier_type,
      active: true,
    };

    setPricingRules([...pricingRules, newRule]);
    setShowAddForm(false);
    resetForm();
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;

    setPricingRules(pricingRules.map(rule => 
      rule.id === editingRule.id 
        ? { ...editingRule, ...formData, room_id: formData.room_id ? Number(formData.room_id) : null }
        : rule
    ));
    setEditingRule(null);
    resetForm();
  };

  const handleDeleteRule = (id: string) => {
    setPricingRules(pricingRules.filter(rule => rule.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setPricingRules(pricingRules.map(rule => 
      rule.id === id ? { ...rule, active: !rule.active } : rule
    ));
  };

  const handleEditRule = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      room_id: rule.room_id?.toString() || '',
      start_date: rule.start_date,
      end_date: rule.end_date,
      price_modifier: rule.price_modifier,
      modifier_type: rule.modifier_type,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      room_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      price_modifier: 0,
      modifier_type: 'percentage',
    });
  };

  const calculateExamplePrice = (basePrice: number, modifier: number, type: 'percentage' | 'fixed') => {
    if (type === 'percentage') {
      return basePrice + (basePrice * modifier / 100);
    }
    return basePrice + modifier;
  };

  const getModifierDisplay = (modifier: number, type: 'percentage' | 'fixed') => {
    if (type === 'percentage') {
      return `${modifier > 0 ? '+' : ''}${modifier}%`;
    }
    return `${modifier > 0 ? '+' : ''}${new Intl.NumberFormat('da-DK', { 
      style: 'currency', 
      currency: 'DKK',
      minimumFractionDigits: 0 
    }).format(modifier)}`;
  };

  const getRoomName = (roomId: number | null) => {
    if (!roomId) return 'Alle værelser';
    const room = rooms.find(r => r.id === roomId);
    return room?.name || `Værelse #${roomId}`;
  };

  return (
    <div className="pricing-tab">
      <div className="tab-header">
        <h2>Priser & Sæsoner</h2>
        <button 
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingRule(null);
            resetForm();
          }}
          className="btn-primary"
        >
          {showAddForm ? '✕ Annuller' : '+ Tilføj prisregel'}
        </button>
      </div>

      <div className="pricing-info-card">
        <h3>💰 Dynamisk prissætning</h3>
        <p>
          Opret prisregler for at justere priser baseret på sæson, begivenheder eller høj efterspørgsel. 
          Regler kan gælde for alle værelser eller specifikke værelser.
        </p>
      </div>

      {showAddForm && (
        <div className="pricing-form-card">
          <h3>{editingRule ? '✏️ Rediger prisregel' : '➕ Ny prisregel'}</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="rule-name">Navn på regel *</label>
              <input
                id="rule-name"
                type="text"
                className="form-input"
                placeholder="f.eks. 'Høj sæson (Sommer)'"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rule-room">Anvendes på</label>
              <select
                id="rule-room"
                className="form-select"
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              >
                <option value="">Alle værelser</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rule-start">Start dato *</label>
              <input
                id="rule-start"
                type="date"
                className="form-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rule-end">Slut dato *</label>
              <input
                id="rule-end"
                type="date"
                className="form-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rule-type">Pris justering type</label>
              <select
                id="rule-type"
                className="form-select"
                value={formData.modifier_type}
                onChange={(e) => setFormData({ ...formData, modifier_type: e.target.value as 'percentage' | 'fixed' })}
              >
                <option value="percentage">Procent (%)</option>
                <option value="fixed">Fast beløb (DKK)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rule-modifier">
                Justering {formData.modifier_type === 'percentage' ? '(%)' : '(DKK)'}
              </label>
              <input
                id="rule-modifier"
                type="number"
                className="form-input"
                placeholder={formData.modifier_type === 'percentage' ? '+25 eller -15' : '+500 eller -200'}
                value={formData.price_modifier}
                onChange={(e) => setFormData({ ...formData, price_modifier: Number(e.target.value) })}
              />
              <small className="form-help">
                Positiv værdi = højere pris, Negativ værdi = lavere pris
              </small>
            </div>
          </div>

          {rooms.length > 0 && (
            <div className="price-example">
              <h4>Eksempel priser:</h4>
              <div className="price-example-grid">
                {rooms.slice(0, 3).map((room) => (
                  <div key={room.id} className="price-example-item">
                    <span className="example-room">{room.name}</span>
                    <span className="example-base">
                      {new Intl.NumberFormat('da-DK', { 
                        style: 'currency', 
                        currency: 'DKK',
                        minimumFractionDigits: 0 
                      }).format(room.base_price)}
                    </span>
                    <span className="example-arrow">→</span>
                    <span className="example-new">
                      {new Intl.NumberFormat('da-DK', { 
                        style: 'currency', 
                        currency: 'DKK',
                        minimumFractionDigits: 0 
                      }).format(calculateExamplePrice(room.base_price, formData.price_modifier, formData.modifier_type))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions-inline">
            <button 
              onClick={() => {
                setShowAddForm(false);
                setEditingRule(null);
                resetForm();
              }}
              className="btn-secondary"
            >
              Annuller
            </button>
            <button 
              onClick={editingRule ? handleUpdateRule : handleAddRule}
              className="btn-primary"
              disabled={!formData.name || !formData.start_date || !formData.end_date}
            >
              {editingRule ? 'Gem ændringer' : 'Tilføj regel'}
            </button>
          </div>
        </div>
      )}

      <div className="pricing-rules-list">
        <h3>Aktive prisregler ({pricingRules.filter(r => r.active).length})</h3>
        
        {pricingRules.length === 0 ? (
          <div className="empty-state">
            <p>Ingen prisregler oprettet endnu</p>
            <p className="empty-state-sub">
              Klik "Tilføj prisregel" for at oprette din første sæsonbaserede prisregel
            </p>
          </div>
        ) : (
          <div className="pricing-rules-grid">
            {pricingRules.map((rule) => (
              <div key={rule.id} className={`pricing-rule-card ${!rule.active ? 'inactive' : ''}`}>
                <div className="rule-header">
                  <div>
                    <h4>{rule.name}</h4>
                    <span className="rule-room">{getRoomName(rule.room_id)}</span>
                  </div>
                  <span className={`rule-modifier ${rule.price_modifier > 0 ? 'positive' : 'negative'}`}>
                    {getModifierDisplay(rule.price_modifier, rule.modifier_type)}
                  </span>
                </div>

                <div className="rule-dates">
                  <div className="date-item">
                    <span className="date-label">Fra:</span>
                    <span className="date-value">
                      {format(new Date(rule.start_date), 'dd. MMM yyyy', { locale: da })}
                    </span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">Til:</span>
                    <span className="date-value">
                      {format(new Date(rule.end_date), 'dd. MMM yyyy', { locale: da })}
                    </span>
                  </div>
                </div>

                <div className="rule-actions">
                  <button 
                    onClick={() => handleToggleActive(rule.id)}
                    className={`toggle-btn ${rule.active ? 'active' : 'inactive'}`}
                  >
                    {rule.active ? '✓ Aktiv' : '✗ Inaktiv'}
                  </button>
                  <button 
                    onClick={() => handleEditRule(rule)}
                    className="edit-btn"
                  >
                    ✏️ Rediger
                  </button>
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="delete-btn"
                  >
                    🗑️ Slet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingTab;

