import { useState, useEffect } from 'react';
import { roomsApi, roomImagesApi, roomUnitsApi } from '../../services/api';
import type { Room, RoomImage, RoomUnit } from '../../types';

const RoomsTab = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
  const [roomUnits, setRoomUnits] = useState<RoomUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitForm, setUnitForm] = useState({ label: '', ttlock_lock_id: '' });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomUnits = async (roomId: number) => {
    setUnitsLoading(true);
    try {
      const units = await roomUnitsApi.list(roomId);
      setRoomUnits(units);
    } catch (error) {
      console.error('Error loading room units:', error);
      setRoomUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleEditRoom = async (room: Room) => {
    setEditingRoom({ ...room });
    setShowEditModal(true);
    
    // Load images for this room
    try {
      const images = await roomImagesApi.getImages(room.id);
      setRoomImages(images);
    } catch (error) {
      console.error('Error loading room images:', error);
      setRoomImages([]);
    }

    await loadRoomUnits(room.id);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingRoom(null);
    setRoomImages([]);
    setRoomUnits([]);
    setUnitForm({ label: '', ttlock_lock_id: '' });
  };

  const handleSaveRoom = async () => {
    if (!editingRoom) return;

    try {
      const { images: _images, units: _units, ...roomPayload } = editingRoom;
      await roomsApi.update(editingRoom.id, roomPayload);
      await loadRooms();
      handleCloseModal();
      alert('✅ Værelse opdateret!');
    } catch (error) {
      console.error('Error updating room:', error);
      alert('❌ Fejl ved opdatering af værelse');
    }
  };

  const handleAddUnit = async () => {
    if (!editingRoom) return;
    if (!unitForm.label.trim()) {
      alert('Skriv et værelsesnummer/navn');
      return;
    }
    try {
      const newUnit = await roomUnitsApi.create(editingRoom.id, {
        label: unitForm.label.trim(),
        ttlock_lock_id: unitForm.ttlock_lock_id.trim() || undefined,
      });
      setRoomUnits((prev) => [...prev, newUnit]);
      setUnitForm({ label: '', ttlock_lock_id: '' });
    } catch (error) {
      console.error('Error adding room unit:', error);
      alert('❌ Kunne ikke oprette fysisk værelse');
    }
  };

  const handleUnitFieldChange = (unitId: number, field: keyof Pick<RoomUnit, 'label' | 'ttlock_lock_id'>, value: string) => {
    setRoomUnits((prev) =>
      prev.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              [field]: value,
            }
          : unit
      )
    );
  };

  const handleUnitFieldBlur = async (unit: RoomUnit, field: 'label' | 'ttlock_lock_id') => {
    try {
      await roomUnitsApi.update(unit.id, { [field]: unit[field] || null });
    } catch (error) {
      console.error('Error updating room unit:', error);
      alert('❌ Kunne ikke opdatere værelse');
    }
  };

  const handleToggleUnitActive = async (unit: RoomUnit) => {
    try {
      const updated = await roomUnitsApi.update(unit.id, { active: unit.active ? 0 : 1 });
      setRoomUnits((prev) => prev.map((u) => (u.id === unit.id ? updated : u)));
    } catch (error) {
      console.error('Error toggling room unit:', error);
      alert('❌ Kunne ikke opdatere status');
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('Er du sikker på at du vil slette dette værelse?')) return;
    try {
      await roomUnitsApi.delete(unitId);
      setRoomUnits((prev) => prev.filter((u) => u.id !== unitId));
    } catch (error) {
      console.error('Error deleting room unit:', error);
      alert('❌ Kunne ikke slette værelse');
    }
  };

  const handleFieldChange = (field: keyof Room, value: string | number) => {
    if (!editingRoom) return;
    setEditingRoom({
      ...editingRoom,
      [field]: value
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingRoom) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Kun billedfiler er tilladt');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Billedet er for stort (max 10MB)');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);

      // Get API base URL
      const apiBase = (window as any).API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/upload/room-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload fejlede');
      }

      const data = await response.json();
      
      // Add image to room
      const isPrimary = roomImages.length === 0; // First image is primary
      await roomImagesApi.addImage(editingRoom.id, {
        image_url: data.imageUrl,
        is_primary: isPrimary
      });
      
      // Reload images
      const updatedImages = await roomImagesApi.getImages(editingRoom.id);
      setRoomImages(updatedImages);
      
      alert(`✅ Billede tilføjet til galleri`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Fejl ved upload af billede');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    if (!editingRoom) return;
    
    try {
      await roomImagesApi.updateImage(imageId, { is_primary: true });
      
      // Reload images
      const updatedImages = await roomImagesApi.getImages(editingRoom.id);
      setRoomImages(updatedImages);
      
      alert('✅ Primært billede opdateret');
    } catch (error) {
      console.error('Error setting primary image:', error);
      alert('❌ Fejl ved opdatering');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!editingRoom) return;
    if (!confirm('Er du sikker på du vil slette dette billede?')) return;
    
    try {
      await roomImagesApi.deleteImage(imageId);
      
      // Reload images
      const updatedImages = await roomImagesApi.getImages(editingRoom.id);
      setRoomImages(updatedImages);
      
      alert('✅ Billede slettet');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('❌ Fejl ved sletning');
    }
  };

  const handleUpdateCaption = async (imageId: number, caption: string) => {
    try {
      await roomImagesApi.updateImage(imageId, { caption });
      
      // Reload images
      if (editingRoom) {
        const updatedImages = await roomImagesApi.getImages(editingRoom.id);
        setRoomImages(updatedImages);
      }
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Indlæser værelser...</p>
      </div>
    );
  }

  return (
    <div className="rooms-tab">
      <div className="tab-header">
        <h2>Værelser ({rooms.length})</h2>
        <p className="tab-subtitle">
          Rediger værelsesoplysninger og konfigurer channel manager-integration
        </p>
      </div>

      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room.id} className="room-card-admin">
            {/* Room Image */}
            {room.image_url ? (
              <div 
                className="room-image"
                style={{ backgroundImage: `url(${room.image_url})` }}
              >
                <span className="room-type-badge">{room.type}</span>
              </div>
            ) : (
              <div className="room-image-placeholder">
                <span className="placeholder-icon">🏠</span>
                <span className="placeholder-text">Intet billede</span>
                <span className="room-type-badge">{room.type}</span>
              </div>
            )}

            <div className="room-card-body">
              <div className="room-card-header">
                <h3>{room.name}</h3>
              </div>

              {room.description && (
                <p className="room-description">{room.description}</p>
              )}

              <div className="room-info">
                <div className="info-row">
                  <span className="info-label">Pris pr. nat:</span>
                  <span className="info-value">
                    {new Intl.NumberFormat('da-DK', { 
                      style: 'currency', 
                      currency: 'DKK',
                      minimumFractionDigits: 0 
                    }).format(room.base_price)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Max gæster:</span>
                  <span className="info-value">{room.max_guests} personer</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Enheder:</span>
                  <span className="info-value">{room.unit_count} stk.</span>
                </div>

                {/* Channel Manager Status */}
                <div className="channel-status">
                  {room.booking_com_id && (
                    <span className="channel-badge booking-com">
                      🏨 Booking.com
                    </span>
                  )}
                  {room.airbnb_listing_id && (
                    <span className="channel-badge airbnb">
                      🏠 Airbnb
                    </span>
                  )}
                  {!room.booking_com_id && !room.airbnb_listing_id && (
                    <span className="channel-badge no-sync">
                      ⚠️ Ingen channels
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => handleEditRoom(room)}
                className="btn-edit-room"
              >
                ✏️ Rediger & konfigurer channels
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Room Modal */}
      {showEditModal && editingRoom && (
        <div className="modal-overlay admin-modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content room-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rediger værelse: {editingRoom.name}</h2>
              <button onClick={handleCloseModal} className="close-btn">✕</button>
            </div>

            <div className="modal-body">
              {/* Basic Room Info */}
              <div className="form-section">
                <h3>📝 Grundlæggende oplysninger</h3>
                
                <div className="form-group">
                  <label htmlFor="room-name">Værelsenavn:</label>
                  <input
                    id="room-name"
                    type="text"
                    className="form-input"
                    value={editingRoom.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="room-description">Beskrivelse:</label>
                  <textarea
                    id="room-description"
                    className="form-input"
                    rows={2}
                    placeholder="Kort beskrivelse af værelset"
                    value={editingRoom.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>📸 Billedgalleri ({roomImages.length} billeder)</label>
                  
                  {/* Upload Button */}
                  <div className="image-upload-section">
                    <label htmlFor="image-upload-input" className="btn-upload">
                      {uploading ? '⏳ Uploader...' : '+ Upload nyt billede'}
                    </label>
                    <input
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <small className="form-help">
                      Upload flere billeder til galleriet. Første billede bliver primært.
                    </small>
                  </div>

                  {/* Image Gallery */}
                  {roomImages.length > 0 ? (
                    <div className="image-gallery">
                      {roomImages.map((image, index) => (
                        <div key={image.id} className="gallery-item">
                          <div className="gallery-image">
                            <img src={image.image_url} alt={`Billede ${index + 1}`} />
                            {image.is_primary === 1 && (
                              <div className="primary-badge">⭐ Primær</div>
                            )}
                          </div>
                          <div className="gallery-actions">
                            <input
                              type="text"
                              className="form-input form-input-small"
                              placeholder="Billedtekst (valgfrit)"
                              value={image.caption || ''}
                              onChange={(e) => handleUpdateCaption(image.id, e.target.value)}
                            />
                            <div className="gallery-buttons">
                              {image.is_primary !== 1 && (
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => handleSetPrimaryImage(image.id)}
                                  title="Sæt som primært billede"
                                >
                                  ⭐ Gør primær
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-icon delete-btn"
                                onClick={() => handleDeleteImage(image.id)}
                                title="Slet billede"
                              >
                                🗑️ Slet
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-gallery">
                      <p>Ingen billeder endnu. Upload det første billede.</p>
                    </div>
                  )}
                </div>

                <div className="form-group-inline">
                  <div className="form-group">
                    <label htmlFor="room-price">Basispris (DKK/nat):</label>
                    <input
                      id="room-price"
                      type="number"
                      className="form-input"
                      value={editingRoom.base_price}
                      onChange={(e) => handleFieldChange('base_price', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="room-guests">Max gæster:</label>
                    <input
                      id="room-guests"
                      type="number"
                      className="form-input"
                      value={editingRoom.max_guests}
                      onChange={(e) => handleFieldChange('max_guests', Number(e.target.value))}
                    />
                  </div>
                <div className="form-group">
                  <label htmlFor="room-units">Antal enheder:</label>
                  <input
                    id="room-units"
                    type="number"
                    className="form-input"
                    min={1}
                    value={editingRoom.unit_count}
                    onChange={(e) => handleFieldChange('unit_count', Math.max(1, Number(e.target.value)))}
                  />
                </div>
                </div>
              </div>

              {/* Room Details Section */}
              <div className="form-section">
                <h3>🏠 Værelsesdetaljer</h3>
                <p className="form-help">
                  Detaljeret information der bruges af Booking.com og Airbnb
                </p>

                <div className="form-group-inline">
                  <div className="form-group">
                    <label htmlFor="room-size">Størrelse (m²):</label>
                    <input
                      id="room-size"
                      type="number"
                      className="form-input"
                      placeholder="F.eks. 25"
                      value={editingRoom.room_size || ''}
                      onChange={(e) => handleFieldChange('room_size', Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bed-type">Sengetype:</label>
                    <select
                      id="bed-type"
                      className="form-select"
                      value={editingRoom.bed_type || ''}
                      onChange={(e) => handleFieldChange('bed_type', e.target.value)}
                    >
                      <option value="">Vælg...</option>
                      <option value="single">Enkelt seng</option>
                      <option value="twin">2x enkeltsenge</option>
                      <option value="double">Dobbeltseng</option>
                      <option value="queen">Queen size</option>
                      <option value="king">King size</option>
                      <option value="sofa_bed">Sovesofa</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-inline">
                  <div className="form-group">
                    <label htmlFor="bathroom-type">Badeværelse:</label>
                    <select
                      id="bathroom-type"
                      className="form-select"
                      value={editingRoom.bathroom_type || ''}
                      onChange={(e) => handleFieldChange('bathroom_type', e.target.value)}
                    >
                      <option value="">Vælg...</option>
                      <option value="private">Privat</option>
                      <option value="ensuite">Ensuite</option>
                      <option value="shared">Delt</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="view-type">Udsigt:</label>
                    <select
                      id="view-type"
                      className="form-select"
                      value={editingRoom.view_type || ''}
                      onChange={(e) => handleFieldChange('view_type', e.target.value)}
                    >
                      <option value="">Vælg...</option>
                      <option value="sea">Havudsigt</option>
                      <option value="garden">Gårdhave</option>
                      <option value="countryside">Natur</option>
                      <option value="city">By</option>
                      <option value="no_view">Ingen særlig udsigt</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="amenities">Faciliteter (vælg alle der passer):</label>
                  <div className="amenities-grid">
                    {['WiFi', 'TV', 'Air Conditioning', 'Heating', 'Mini Fridge', 'Coffee Maker', 'Safe', 'Desk', 'Wardrobe', 'Hair Dryer', 'Iron', 'Balcony', 'Terrace', 'Sea View'].map(amenity => {
                      const currentAmenities = editingRoom.amenities ? JSON.parse(editingRoom.amenities) : [];
                      const isChecked = currentAmenities.includes(amenity);
                      
                      return (
                        <label key={amenity} className="amenity-checkbox">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = editingRoom.amenities ? JSON.parse(editingRoom.amenities) : [];
                              const updated = e.target.checked
                                ? [...current, amenity]
                                : current.filter((a: string) => a !== amenity);
                              handleFieldChange('amenities', JSON.stringify(updated));
                            }}
                          />
                          <span>{amenity}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Booking Rules Section */}
              <div className="form-section">
                <h3>📋 Bookingregler</h3>
                
                <div className="form-group-inline">
                  <div className="form-group">
                    <label htmlFor="standard-occupancy">Standard antal gæster:</label>
                    <input
                      id="standard-occupancy"
                      type="number"
                      className="form-input"
                      value={editingRoom.standard_occupancy || 2}
                      onChange={(e) => handleFieldChange('standard_occupancy', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="min-nights">Min antal nætter:</label>
                    <input
                      id="min-nights"
                      type="number"
                      className="form-input"
                      value={editingRoom.min_nights || 1}
                      onChange={(e) => handleFieldChange('min_nights', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-group-inline">
                  <div className="form-group">
                    <label htmlFor="check-in-time">Check-in tid:</label>
                    <input
                      id="check-in-time"
                      type="time"
                      className="form-input"
                      value={editingRoom.check_in_time || '15:00'}
                      onChange={(e) => handleFieldChange('check_in_time', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="check-out-time">Check-out tid:</label>
                    <input
                      id="check-out-time"
                      type="time"
                      className="form-input"
                      value={editingRoom.check_out_time || '11:00'}
                      onChange={(e) => handleFieldChange('check_out_time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cancellation-policy">Afbestillingspolitik:</label>
                  <select
                    id="cancellation-policy"
                    className="form-select"
                    value={editingRoom.cancellation_policy || 'flexible'}
                    onChange={(e) => handleFieldChange('cancellation_policy', e.target.value)}
                  >
                    <option value="flexible">Fleksibel (gratis afbestilling indtil 24 timer før)</option>
                    <option value="moderate">Moderat (gratis afbestilling indtil 5 dage før)</option>
                    <option value="strict">Striks (ingen refundering)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Yderligere:</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editingRoom.smoking_allowed === 1}
                        onChange={(e) => handleFieldChange('smoking_allowed', e.target.checked ? 1 : 0)}
                      />
                      <span>Rygning tilladt</span>
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editingRoom.pets_allowed === 1}
                        onChange={(e) => handleFieldChange('pets_allowed', e.target.checked ? 1 : 0)}
                      />
                      <span>Kæledyr tilladt</span>
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editingRoom.accessible === 1}
                        onChange={(e) => handleFieldChange('accessible', e.target.checked ? 1 : 0)}
                      />
                      <span>Handicapvenligt</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Booking.com Configuration */}
              <div className="form-section">
                <h3>🏨 Booking.com Integration</h3>
                <p className="form-help">
                  Konfigurer Booking.com-felter for at synkronisere dette værelse med din Booking.com-opsætning.
                </p>

                <div className="form-group">
                  <label htmlFor="booking-com-id">Booking.com Hotel/Property ID:</label>
                  <input
                    id="booking-com-id"
                    type="text"
                    className="form-input"
                    placeholder="F.eks. 123456"
                    value={editingRoom.booking_com_id || ''}
                    onChange={(e) => handleFieldChange('booking_com_id', e.target.value)}
                  />
                  <small className="form-help">
                    Find dette ID i din Booking.com Extranet under "Property settings"
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="booking-com-room-name">Booking.com værelsenavn:</label>
                  <input
                    id="booking-com-room-name"
                    type="text"
                    className="form-input"
                    placeholder="F.eks. Standard Double Room"
                    value={editingRoom.booking_com_room_name || ''}
                    onChange={(e) => handleFieldChange('booking_com_room_name', e.target.value)}
                  />
                  <small className="form-help">
                    Det nøjagtige værelsenavn som det vises på Booking.com
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="booking-com-rate-plan">Booking.com Rate Plan ID (valgfrit):</label>
                  <input
                    id="booking-com-rate-plan"
                    type="text"
                    className="form-input"
                    placeholder="F.eks. NR123456"
                    value={editingRoom.booking_com_rate_plan_id || ''}
                    onChange={(e) => handleFieldChange('booking_com_rate_plan_id', e.target.value)}
                  />
                  <small className="form-help">
                    Hvis du bruger flere rate plans (priser), angiv det relevante ID her
                  </small>
                </div>
              </div>

              {/* Airbnb Configuration */}
              <div className="form-section">
                <h3>🏠 Airbnb Integration</h3>
                <p className="form-help">
                  Konfigurer Airbnb-felter for at synkronisere dette værelse med din Airbnb-opsætning.
                </p>

                <div className="form-group">
                  <label htmlFor="airbnb-listing-id">Airbnb Listing ID:</label>
                  <input
                    id="airbnb-listing-id"
                    type="text"
                    className="form-input"
                    placeholder="F.eks. 12345678"
                    value={editingRoom.airbnb_listing_id || ''}
                    onChange={(e) => handleFieldChange('airbnb_listing_id', e.target.value)}
                  />
                  <small className="form-help">
                    Find dette ID i URL'en på din Airbnb-annonce (airbnb.com/rooms/<strong>ID</strong>)
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="airbnb-room-name">Airbnb værelsenavn:</label>
                  <input
                    id="airbnb-room-name"
                    type="text"
                    className="form-input"
                    placeholder="F.eks. Cozy Room with Ocean View"
                    value={editingRoom.airbnb_room_name || ''}
                    onChange={(e) => handleFieldChange('airbnb_room_name', e.target.value)}
                  />
                  <small className="form-help">
                    Titlen på din Airbnb-annonce
                  </small>
                </div>
              </div>

              {/* Physical Room Units */}
              <div className="form-section">
                <h3>🏷️ Fysiske værelser</h3>
                <p className="form-help">
                  Opret hver fysisk dør/værelse (fx “Værelse 1”) og tilknyt låse-ID. Så kan bookinger automatisk få en unik kode per værelse.
                </p>

                {unitsLoading ? (
                  <p>Indlæser værelser...</p>
                ) : (
                  <>
                    {roomUnits.length === 0 ? (
                      <p className="form-help">Ingen fysiske værelser endnu. Tilføj dit første værelse herunder.</p>
                    ) : (
                      <div className="room-units-list">
                        {roomUnits.map((unit) => (
                          <div key={unit.id} className="room-unit-row">
                            <div className="room-unit-column">
                              <label>Værelsesnavn / nr.</label>
                              <input
                                type="text"
                                className="form-input"
                                value={unit.label}
                                onChange={(e) => handleUnitFieldChange(unit.id, 'label', e.target.value)}
                                onBlur={() => handleUnitFieldBlur(unit, 'label')}
                              />
                            </div>
                            <div className="room-unit-column">
                              <label>TTLock ID</label>
                              <input
                                type="text"
                                className="form-input"
                                value={unit.ttlock_lock_id || ''}
                                onChange={(e) => handleUnitFieldChange(unit.id, 'ttlock_lock_id', e.target.value)}
                                onBlur={() => handleUnitFieldBlur(unit, 'ttlock_lock_id')}
                              />
                            </div>
                            <div className="room-unit-actions">
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={unit.active === 1}
                                  onChange={() => handleToggleUnitActive(unit)}
                                />
                                <span>Aktiv</span>
                              </label>
                              <button type="button" className="btn-icon delete-btn" onClick={() => handleDeleteUnit(unit.id)}>
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="room-unit-add">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Fx Værelse 1"
                        value={unitForm.label}
                        onChange={(e) => setUnitForm((prev) => ({ ...prev, label: e.target.value }))}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="TTLock ID (valgfrit)"
                        value={unitForm.ttlock_lock_id}
                        onChange={(e) => setUnitForm((prev) => ({ ...prev, ttlock_lock_id: e.target.value }))}
                      />
                      <button type="button" className="btn-primary" onClick={handleAddUnit}>
                        ➕ Tilføj værelse
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Sync Settings */}
              <div className="form-section">
                <h3>⚙️ Synkroniseringsindstillinger</h3>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editingRoom.channel_sync_enabled === 1}
                      onChange={(e) => handleFieldChange('channel_sync_enabled', e.target.checked ? 1 : 0)}
                    />
                    <span>Aktiver automatisk synkronisering til channels</span>
                  </label>
                  <small className="form-help">
                    Når aktiveret, vil bookinger og tilgængelighed automatisk blive synkroniseret
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="channel-notes">Noter (valgfrit):</label>
                  <textarea
                    id="channel-notes"
                    className="form-input"
                    rows={3}
                    placeholder="F.eks. specielle synkroniseringsindstillinger, afvigelser i navngivning, etc."
                    value={editingRoom.channel_sync_notes || ''}
                    onChange={(e) => handleFieldChange('channel_sync_notes', e.target.value)}
                  />
                </div>

                {editingRoom.last_channel_sync && (
                  <div className="sync-info">
                    <span className="sync-label">Sidste synkronisering:</span>
                    <span className="sync-value">
                      {new Date(editingRoom.last_channel_sync).toLocaleString('da-DK')}
                    </span>
                  </div>
                )}
              </div>

              {/* TTLock Mapping */}
              <div className="form-section">
                <h3>🔐 TTLock integration</h3>
                <p className="form-help">
                  Tilknyt dette værelse til låsen i TTLock for at kunne sende midlertidige koder automatisk.
                </p>

                <div className="form-group">
                  <label htmlFor="ttlock-lock-id">TTLock Lock ID</label>
                  <input
                    id="ttlock-lock-id"
                    type="text"
                    className="form-input"
                    placeholder="F.eks. 987654321"
                    value={editingRoom.ttlock_lock_id || ''}
                    onChange={(e) => handleFieldChange('ttlock_lock_id', e.target.value)}
                  />
                  <small className="form-help">
                    Findes i TTLock-appen under låsedetaljer. Hvis feltet er tomt, springes smartlås-automatikken over.
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleCloseModal} className="btn-secondary">
                Annuller
              </button>
              <button onClick={handleSaveRoom} className="btn-primary">
                💾 Gem ændringer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsTab;

