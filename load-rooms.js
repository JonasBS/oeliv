/**
 * Load rooms dynamically from API and display on overnatning.html
 */

(function() {
  'use strict';

  // Get API base URL
  const API_BASE = window.API_BASE_URL || '';

  // Load rooms when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRooms);
  } else {
    loadRooms();
  }

  async function loadRooms() {
    const roomGrid = document.querySelector('.room-grid');
    if (!roomGrid) return; // Not on overnatning page

    try {
      // Show loading state
      roomGrid.innerHTML = '<div class="rooms-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">Indlæser værelser...</div>';

      // Fetch rooms from API
      const response = await fetch(`${API_BASE}/api/rooms`);
      if (!response.ok) throw new Error('Kunne ikke hente værelser');

      const rooms = await response.json();

      // Clear loading state
      roomGrid.innerHTML = '';

      // Render each room
      rooms.forEach(room => {
        const roomCard = createRoomCard(room);
        roomGrid.appendChild(roomCard);
      });

    } catch (error) {
      console.error('Error loading rooms:', error);
      roomGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--muted);">
          <p>Kunne ikke indlæse værelser. Prøv at genindlæse siden.</p>
        </div>
      `;
    }
  }

  function createRoomCard(room) {
    const article = document.createElement('article');
    article.className = 'room-card room-card-detailed';

    // Get primary image or first image
    const primaryImage = room.images?.find(img => img.is_primary) || room.images?.[0];
    const imageUrl = primaryImage?.image_url || room.image_url || 'https://images.unsplash.com/photo-1559599189-c3f2b6f6e270?q=80&w=1200&auto=format&fit=crop';

    // Format price
    const priceFormatted = new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(room.base_price);

    article.innerHTML = `
      <div class="room-image">
        <a href="room.html?id=${room.id}">
          <img src="${imageUrl}" alt="${room.name}" loading="lazy" />
          ${room.images && room.images.length > 1 ? `<div class="image-count">${room.images.length} billeder</div>` : ''}
        </a>
      </div>
      <div class="room-content">
        <h2 class="room-title">
          <a href="room.html?id=${room.id}" style="color: inherit; text-decoration: none;">
            ${room.name}
          </a>
        </h2>
        <p class="room-meta">
          ${room.room_size ? `${room.room_size} m² · ` : ''}
          Til ${room.max_guests} ${room.max_guests === 1 ? 'person' : 'personer'}
        </p>
        ${room.description ? `<p class="room-description">${room.description}</p>` : ''}
        <div class="room-footer">
          <span class="room-price">Fra ${priceFormatted} / nat</span>
          <div style="display: flex; gap: 0.5rem;">
            <a href="room.html?id=${room.id}" class="btn-secondary btn-small" style="text-decoration: none; flex: 1; text-align: center;">
              Se detaljer
            </a>
            <button class="btn-primary btn-small js-open-booking" type="button" data-room="${room.name}" style="flex: 1;">
              Book nu
            </button>
          </div>
        </div>
      </div>
    `;

    return article;
  }
})();

