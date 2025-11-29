/**
 * Load single room details from backend API
 */

// Get room ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('id');

// Helper: format amenities
const formatAmenities = (amenitiesStr) => {
  if (!amenitiesStr) return [];
  try {
    return JSON.parse(amenitiesStr);
  } catch {
    return [];
  }
};

// Helper: translate bed types
const translateBedType = (bedType) => {
  const translations = {
    'single': 'Enkelt seng',
    'twin': '2x enkeltsenge',
    'double': 'Dobbeltseng',
    'queen': 'Queen size',
    'king': 'King size',
    'sofa_bed': 'Sovesofa'
  };
  return translations[bedType] || bedType;
};

// Helper: translate bathroom types
const translateBathroom = (bathroomType) => {
  const translations = {
    'private': 'Privat badeværelse',
    'ensuite': 'Ensuite badeværelse',
    'shared': 'Delt badeværelse'
  };
  return translations[bathroomType] || bathroomType;
};

// Helper: translate view types
const translateView = (viewType) => {
  const translations = {
    'sea': 'Havudsigt',
    'garden': 'Gårdhave',
    'countryside': 'Naturudsigt',
    'city': 'Byudsigt',
    'no_view': 'Ingen særlig udsigt'
  };
  return translations[viewType] || viewType;
};

// Helper: translate cancellation policy
const translateCancellation = (policy) => {
  const translations = {
    'flexible': 'Fleksibel (gratis afbestilling indtil 24 timer før)',
    'moderate': 'Moderat (gratis afbestilling indtil 5 dage før)',
    'strict': 'Striks (ingen refundering)'
  };
  return translations[policy] || policy;
};

// Load room data
async function loadRoomDetail() {
  if (!roomId) {
    document.getElementById('room-content').innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <h2>Værelse ikke fundet</h2>
        <p>Venligst vælg et værelse fra <a href="overnatning.html">overnatningssiden</a>.</p>
      </div>
    `;
    return;
  }

  try {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE}/api/rooms/${roomId}`);
    
    if (!response.ok) {
      throw new Error('Kunne ikke indlæse værelse');
    }

    const room = await response.json();
    
    // Update page title
    document.title = `${room.name} – ØLIV Farm hospitality`;
    
    // Render hero
    renderHero(room);
    
    // Render content
    renderContent(room);
    
  } catch (error) {
    console.error('Fejl ved indlæsning af værelse:', error);
    document.getElementById('room-content').innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <h2>Der opstod en fejl</h2>
        <p>Kunne ikke indlæse værelsesinformation. Prøv venligst igen.</p>
        <a href="overnatning.html" class="btn-primary" style="margin-top: 1rem;">Tilbage til oversigt</a>
      </div>
    `;
  }
}

// Render hero section
function renderHero(room) {
  const heroElement = document.getElementById('room-hero');
  
  // Use primary image or fallback
  const heroImage = room.images && room.images.length > 0
    ? room.images.find(img => img.is_primary === 1)?.image_url || room.images[0].image_url
    : room.image_url || '/api/placeholder/1200/600';
  
  heroElement.style.backgroundImage = `url(${heroImage})`;
  heroElement.innerHTML = `
    <div class="room-hero-content">
      <h1 class="room-hero-title">${room.name}</h1>
      <div class="room-hero-meta">
        ${room.room_size ? `
          <span class="room-hero-meta-item">
            <span>📐</span>
            <span>${room.room_size} m²</span>
          </span>
        ` : ''} 
        ${room.max_guests ? `
          <span class="room-hero-meta-item">
            <span>👥</span>
            <span>Op til ${room.max_guests} gæster</span>
          </span>
        ` : ''}
        ${room.bed_type ? `
          <span class="room-hero-meta-item">
            <span>🛏️</span>
            <span>${translateBedType(room.bed_type)}</span>
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

// Render main content
function renderContent(room) {
  const contentElement = document.getElementById('room-content');
  
  // Parse amenities
  const amenities = formatAmenities(room.amenities);
  
  contentElement.innerHTML = `
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <a href="index.html">Hjem</a>
      <span class="breadcrumb-separator">/</span>
      <a href="overnatning.html">Overnatning</a>
      <span class="breadcrumb-separator">/</span>
      <span>${room.name}</span>
    </div>

    <div class="room-info-grid">
      <!-- Main content - left side -->
      <div>
        <!-- Description & Story -->
        ${room.description ? `
          <div class="room-story-card">
            <div class="room-story-label">Om oplevelsen</div>
            <p class="room-story-text">${room.description}</p>
          </div>
        ` : ''}

        <!-- Physical details -->
        <div class="room-details-card" style="margin-bottom: 2rem; border: 1px solid rgba(130, 119, 23, 0.1);">
          <h3 style="margin-bottom: 1rem; font-family: var(--font-display); font-size: 1.25rem; color: var(--charcoal);">Værelsesdetaljer</h3>
          ${room.room_size ? `<div class="detail-row"><span class="detail-label">Størrelse</span><span class="detail-value">${room.room_size} m²</span></div>` : ''}
          ${room.bed_type ? `<div class="detail-row"><span class="detail-label">Seng</span><span class="detail-value">${translateBedType(room.bed_type)}</span></div>` : ''}
          ${room.bathroom_type ? `<div class="detail-row"><span class="detail-label">Badeværelse</span><span class="detail-value">${translateBathroom(room.bathroom_type)}</span></div>` : ''}
          ${room.view_type ? `<div class="detail-row"><span class="detail-label">Udsigt</span><span class="detail-value">${translateView(room.view_type)}</span></div>` : ''}
          ${room.floor_number ? `<div class="detail-row"><span class="detail-label">Etage</span><span class="detail-value">${room.floor_number}. sal</span></div>` : ''}
          <div class="detail-row">
            <span class="detail-label">Gæster</span>
            <span class="detail-value">
              ${room.standard_occupancy ? `${room.standard_occupancy} (standard)` : ''} 
              ${room.standard_occupancy && room.max_guests && room.standard_occupancy !== room.max_guests ? ` – maks ${room.max_guests}` : ''}
              ${!room.standard_occupancy && room.max_guests ? `Op til ${room.max_guests}` : ''}
            </span>
          </div>
        </div>

        <!-- Amenities -->
        ${amenities.length > 0 ? `
          <div class="room-details-card" style="margin-bottom: 2rem; border: 1px solid rgba(130, 119, 23, 0.1);">
            <h3 style="margin-bottom: 1rem; font-family: var(--font-display); font-size: 1.25rem; color: var(--charcoal);">Faciliteter</h3>
            <ul class="amenities-list">
              ${amenities.map(amenity => `<li>${amenity}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Booking rules -->
        <div class="room-details-card" style="border: 1px solid rgba(130, 119, 23, 0.1);">
          <h3 style="margin-bottom: 1rem; font-family: var(--font-display); font-size: 1.25rem; color: var(--charcoal);">Bookingregler</h3>
          ${room.min_nights ? `<div class="detail-row"><span class="detail-label">Min. antal nætter</span><span class="detail-value">${room.min_nights}</span></div>` : ''}
          ${room.max_nights ? `<div class="detail-row"><span class="detail-label">Max. antal nætter</span><span class="detail-value">${room.max_nights}</span></div>` : ''}
          ${room.check_in_time ? `<div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${room.check_in_time}</span></div>` : ''}
          ${room.check_out_time ? `<div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${room.check_out_time}</span></div>` : ''}
          ${room.cancellation_policy ? `<div class="detail-row"><span class="detail-label">Afbestilling</span><span class="detail-value">${translateCancellation(room.cancellation_policy)}</span></div>` : ''}
          
          ${room.smoking_allowed || room.pets_allowed || room.accessible ? `
            <div style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--sand);">
              ${room.smoking_allowed ? '<p style="margin: 0.5rem 0;">🚬 Rygning tilladt</p>' : ''}
              ${room.pets_allowed ? '<p style="margin: 0.5rem 0;">🐾 Kæledyr tilladt</p>' : ''}
              ${room.accessible ? '<p style="margin: 0.5rem 0;">♿ Handicapvenligt</p>' : ''}
            </div>
          ` : ''}
        </div>

        <!-- Image Gallery - moved to bottom -->
        ${room.images && room.images.length > 1 ? `
          <div style="margin-top: 3rem;">
            <h3 style="margin-bottom: 1.5rem; font-family: var(--font-display); font-size: 1.5rem; color: var(--charcoal); text-align: center;">
              Galleri
            </h3>
            <div class="room-gallery">
              ${room.images.map(img => `
                <img 
                  src="${img.image_url}" 
                  alt="${img.caption || room.name}"
                  title="${img.caption || ''}"
                  loading="lazy"
                />
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

        <!-- Booking card (sticky sidebar) -->
        <div>
          <div class="room-details-card booking-card">
            <!-- Price Section -->
            <div style="text-align: center; padding-bottom: 2rem; border-bottom: 1px solid rgba(130, 119, 23, 0.1);">
              <p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--olive); margin-bottom: 1rem; font-weight: 600;">
                Pris per nat
              </p>
              <div style="display: flex; align-items: baseline; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                <span style="font-size: 3.5rem; font-weight: 600; color: var(--olive); font-family: var(--font-display); line-height: 1;">
                  ${room.base_price}
                </span>
                <span style="font-size: 1.25rem; color: var(--muted); font-weight: 500;">
                  DKK
                </span>
              </div>
              <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; font-size: 0.8125rem; color: var(--muted); margin-top: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.375rem;">
                  <span>👥</span>
                  <span>${room.max_guests} ${room.max_guests === 1 ? 'person' : 'gæster'}</span>
                </div>
                ${room.room_size ? `
                  <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <span>📐</span>
                    <span>${room.room_size} m²</span>
                  </div>
                ` : ''}
                ${room.bed_type ? `
                  <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <span>🛏️</span>
                    <span>${translateBedType(room.bed_type)}</span>
                  </div>
                ` : ''}
              </div>
              <p style="font-size: 0.8125rem; color: var(--muted); font-style: italic; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(130, 119, 23, 0.05);">
                Inkl. morgenmad & spa-adgang
              </p>
            </div>
            
            <!-- CTA Section -->
            <div style="padding: 2rem 0;">
              <button 
                class="btn-primary js-open-booking" 
                type="button" 
                data-room-id="${room.id}"
                data-room-name="${room.name}"
                style="width: 100%; font-size: 1.0625rem; padding: 1.125rem 1.5rem; font-weight: 500; letter-spacing: 0.01em;">
                Forespørg booking
              </button>
              <p style="font-size: 0.8125rem; color: var(--muted); text-align: center; margin-top: 0.75rem; font-style: italic;">
                Svar inden 24 timer
              </p>
            </div>
            
            <!-- Benefits Section -->
            <div style="padding-top: 2rem; border-top: 1px solid rgba(130, 119, 23, 0.1);">
              <div style="font-size: 0.875rem; color: var(--muted); line-height: 1.9;">
                <p style="margin: 0.75rem 0; display: flex; align-items: flex-start; gap: 0.625rem;">
                  <span style="color: var(--olive); font-size: 1rem; line-height: 1.5;">✓</span>
                  <span>Gratis afbestilling op til 24 timer før ankomst</span>
                </p>
                <p style="margin: 0.75rem 0; display: flex; align-items: flex-start; gap: 0.625rem;">
                  <span style="color: var(--olive); font-size: 1rem; line-height: 1.5;">✓</span>
                  <span>Personlig service fra værterne</span>
                </p>
                <p style="margin: 0.75rem 0; display: flex; align-items: flex-start; gap: 0.625rem;">
                  <span style="color: var(--olive); font-size: 1rem; line-height: 1.5;">✓</span>
                  <span>Ingen betaling nu – bekræft først</span>
                </p>
              </div>
            </div>

          <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(130, 119, 23, 0.1);">
            <h4 style="margin-bottom: 1rem; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--olive); font-weight: 600;">
              Oplevelsen inkluderer
            </h4>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 0.625rem 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; color: var(--muted);">
                <span style="color: var(--olive);">🥖</span>
                <span>Morgenmad med lokale råvarer</span>
              </li>
              <li style="padding: 0.625rem 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; color: var(--muted);">
                <span style="color: var(--olive);">🧖</span>
                <span>Adgang til gårdsauna</span>
              </li>
              <li style="padding: 0.625rem 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; color: var(--muted);">
                <span style="color: var(--olive);">🌊</span>
                <span>300m til stranden</span>
              </li>
              <li style="padding: 0.625rem 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; color: var(--muted);">
                <span style="color: var(--olive);">🍺</span>
                <span>Smagninger fra bryggeriet</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Back to overview -->
        <div style="margin-top: 1.5rem;">
          <a href="overnatning.html" class="btn-secondary" style="width: 100%; text-align: center; display: block; padding: 0.875rem; font-size: 0.9375rem; text-decoration: none; transition: all 0.2s ease;">
            ← Se alle værelser
          </a>
        </div>

        <!-- Trust Signal -->
        <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(244, 241, 234, 0.4); border-radius: 12px; text-align: center;">
          <p style="font-size: 0.8125rem; color: var(--muted); line-height: 1.7; margin: 0;">
            <strong style="color: var(--olive);">Vi værdsætter din tid</strong><br>
            Alle forespørgsler behandles personligt og besvares samme dag.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadRoomDetail);
} else {
  loadRoomDetail();
}

