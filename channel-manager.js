/**
 * Channel Manager Integration
 * Handles synchronization with external booking channels (booking.com, Airbnb, etc.)
 */

class ChannelManager {
  constructor() {
    this.channels = {
      booking_com: {
        name: 'Booking.com',
        enabled: false,
        apiKey: null
      },
      airbnb: {
        name: 'Airbnb',
        enabled: false,
        apiKey: null
      },
      expedia: {
        name: 'Expedia',
        enabled: false,
        apiKey: null
      }
    };
    this.syncInterval = null;
  }

  /**
   * Initialize channel manager with API keys
   */
  init(config) {
    Object.keys(config).forEach(channel => {
      if (this.channels[channel]) {
        this.channels[channel].enabled = config[channel].enabled || false;
        this.channels[channel].apiKey = config[channel].apiKey || null;
      }
    });
  }

  /**
   * Sync availability with external channels
   */
  async syncAvailability(roomId, startDate, endDate) {
    const syncPromises = [];
    
    Object.keys(this.channels).forEach(channelKey => {
      const channel = this.channels[channelKey];
      if (channel.enabled && channel.apiKey) {
        syncPromises.push(
          this.syncChannel(channelKey, roomId, startDate, endDate)
        );
      }
    });

    try {
      const results = await Promise.allSettled(syncPromises);
      return results.map((result, index) => ({
        channel: Object.keys(this.channels)[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : result.reason
      }));
    } catch (error) {
      console.error('Error syncing availability:', error);
      throw error;
    }
  }

  /**
   * Sync with a specific channel
   */
  async syncChannel(channelKey, roomId, startDate, endDate) {
    const channel = this.channels[channelKey];
    
    switch (channelKey) {
      case 'booking_com':
        return await this.syncBookingCom(roomId, startDate, endDate, channel.apiKey);
      case 'airbnb':
        return await this.syncAirbnb(roomId, startDate, endDate, channel.apiKey);
      case 'expedia':
        return await this.syncExpedia(roomId, startDate, endDate, channel.apiKey);
      default:
        throw new Error(`Unknown channel: ${channelKey}`);
    }
  }

  /**
   * Sync with Booking.com API
   */
  async syncBookingCom(roomId, startDate, endDate, apiKey) {
    // This would integrate with Booking.com's actual API
    // For now, it's a placeholder structure
    
    try {
      const response = await fetch('/api/channel/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: 'booking_com',
          availability: {
            room_id: roomId,
            start_date: startDate,
            end_date: endDate
          }
        })
      });

      if (!response.ok) {
        throw new Error('Booking.com sync failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Booking.com sync error:', error);
      throw error;
    }
  }

  /**
   * Sync with Airbnb API
   */
  async syncAirbnb(roomId, startDate, endDate, apiKey) {
    // Placeholder for Airbnb API integration
    try {
      const response = await fetch('/api/channel/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: 'airbnb',
          availability: {
            room_id: roomId,
            start_date: startDate,
            end_date: endDate
          }
        })
      });

      if (!response.ok) {
        throw new Error('Airbnb sync failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Airbnb sync error:', error);
      throw error;
    }
  }

  /**
   * Sync with Expedia API
   */
  async syncExpedia(roomId, startDate, endDate, apiKey) {
    // Placeholder for Expedia API integration
    try {
      const response = await fetch('/api/channel/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: 'expedia',
          availability: {
            room_id: roomId,
            start_date: startDate,
            end_date: endDate
          }
        })
      });

      if (!response.ok) {
        throw new Error('Expedia sync failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Expedia sync error:', error);
      throw error;
    }
  }

  /**
   * Receive booking from external channel
   */
  async receiveBooking(channel, bookingData) {
    try {
      const response = await fetch('/api/channel/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: channel,
          booking_data: bookingData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to process booking from ${channel}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error receiving booking from ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Start automatic sync interval
   */
  startAutoSync(intervalMinutes = 15) {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    this.syncInterval = setInterval(() => {
      this.syncAllChannels();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all enabled channels
   */
  async syncAllChannels() {
    // Get all rooms and sync availability for next 12 months
    try {
      const roomsResponse = await fetch('/api/rooms');
      const rooms = await roomsResponse.json();

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 12);
      const startDate = new Date();

      const syncPromises = rooms.map(room =>
        this.syncAvailability(room.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
      );

      await Promise.allSettled(syncPromises);
      console.log('Auto-sync completed');
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChannelManager;
} else {
  window.ChannelManager = ChannelManager;
}
