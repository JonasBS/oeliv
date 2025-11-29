import express from 'express';
import { dbGet, dbAll } from '../database/db.js';
import { 
  getFullPersonalizedGuide, 
  getAllExperiences,
  getFeaturedExperiences 
} from '../services/recommendationService.js';

const router = express.Router();

/**
 * Get all experiences (no personalization)
 */
router.get('/experiences', async (req, res) => {
  try {
    const all = getAllExperiences();
    res.json(all);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

/**
 * Get featured experiences only (Lærkegaards egne tilbud)
 */
router.get('/featured', async (req, res) => {
  try {
    const featured = getFeaturedExperiences();
    res.json(featured);
  } catch (error) {
    console.error('Error fetching featured:', error);
    res.status(500).json({ error: 'Failed to fetch featured experiences' });
  }
});

/**
 * Get personalized recommendations by preferences token
 */
router.get('/personalized/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Fetch booking and guest data from token
    const bookingData = await dbGet(`
      SELECT 
        b.id as booking_id,
        b.guest_name,
        b.guest_email,
        b.guests as guest_count,
        b.check_in,
        b.check_out,
        b.preferences_submitted,
        r.name as room_name,
        gp.is_special_occasion,
        gp.occasion_type,
        gp.has_dietary_requirements,
        gp.dietary_requirements,
        gp.breakfast_in_room,
        gp.room_temperature,
        gp.wants_flowers,
        gp.wants_champagne,
        gp.estimated_arrival_time
      FROM guest_preferences gp
      JOIN bookings b ON b.id = gp.booking_id
      JOIN rooms r ON r.id = b.room_id
      WHERE gp.access_token = ?
    `, [token]);
    
    if (!bookingData) {
      // Return generic recommendations if no token match
      const all = getAllExperiences();
      return res.json({
        personalized: false,
        featured: all.featured,
        experiences: all.experiences
      });
    }
    
    // Get guest CRM data if available
    const guestCrm = await dbGet(`
      SELECT 
        g.id,
        g.segment,
        g.total_bookings,
        g.lifetime_value,
        g.first_booking_date,
        g.notes
      FROM guests g
      WHERE g.email = ?
    `, [bookingData.guest_email]);
    
    // Get previous bookings to know what they might have already experienced
    const previousBookings = await dbAll(`
      SELECT check_in, check_out, room_id
      FROM bookings
      WHERE guest_email = ? AND id != ? AND status = 'confirmed'
      ORDER BY check_in DESC
      LIMIT 10
    `, [bookingData.guest_email, bookingData.booking_id]);
    
    // Build guest profile for recommendation engine
    const guestProfile = {
      guestName: bookingData.guest_name,
      guestCount: bookingData.guest_count,
      checkIn: bookingData.check_in,
      checkOut: bookingData.check_out,
      
      // Occasion
      occasion: bookingData.is_special_occasion ? bookingData.occasion_type : null,
      
      // Preferences
      hasDietaryRequirements: bookingData.has_dietary_requirements,
      dietaryRequirements: bookingData.dietary_requirements,
      wantsBreakfastInRoom: bookingData.breakfast_in_room,
      wantsRelaxation: bookingData.room_temperature === 'warm',
      
      // Extras requested
      wantsFlowers: bookingData.wants_flowers,
      wantsChampagne: bookingData.wants_champagne,
      
      // CRM data
      segment: guestCrm?.segment || 'new',
      totalBookings: guestCrm?.total_bookings || 0,
      lifetimeValue: guestCrm?.lifetime_value || 0,
      isFirstVisit: !guestCrm || guestCrm.total_bookings <= 1,
      
      // Previous experiences (simplified - could be enhanced)
      previousExperiences: previousBookings.length > 0 ? ['hammershus', 'gudhjem'] : []
    };
    
    // Get personalized guide
    const personalizedGuide = await getFullPersonalizedGuide(guestProfile);
    
    res.json({
      personalized: true,
      ...personalizedGuide
    });
    
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * Get personalized recommendations by booking ID (admin)
 */
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const bookingData = await dbGet(`
      SELECT 
        b.id as booking_id,
        b.guest_name,
        b.guest_email,
        b.guests as guest_count,
        b.check_in,
        b.check_out,
        r.name as room_name,
        gp.is_special_occasion,
        gp.occasion_type,
        gp.has_dietary_requirements,
        gp.breakfast_in_room
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN guest_preferences gp ON gp.booking_id = b.id
      WHERE b.id = ?
    `, [bookingId]);
    
    if (!bookingData) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Get guest CRM data
    const guestCrm = await dbGet(`
      SELECT segment, total_bookings, lifetime_value
      FROM guests WHERE email = ?
    `, [bookingData.guest_email]);
    
    const guestProfile = {
      guestName: bookingData.guest_name,
      guestCount: bookingData.guest_count,
      occasion: bookingData.is_special_occasion ? bookingData.occasion_type : null,
      segment: guestCrm?.segment || 'new',
      isFirstVisit: !guestCrm || guestCrm.total_bookings <= 1,
      hasDietaryRequirements: bookingData.has_dietary_requirements,
      wantsBreakfastInRoom: bookingData.breakfast_in_room
    };
    
    const personalizedGuide = await getFullPersonalizedGuide(guestProfile);
    
    res.json({
      personalized: true,
      booking: {
        id: bookingData.booking_id,
        guestName: bookingData.guest_name,
        roomName: bookingData.room_name,
        checkIn: bookingData.check_in,
        checkOut: bookingData.check_out
      },
      ...personalizedGuide
    });
    
  } catch (error) {
    console.error('Error fetching booking recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;

