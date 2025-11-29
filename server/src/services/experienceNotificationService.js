/**
 * Experience Booking Notification Service
 * Sends email and SMS notifications for experience bookings
 */

import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short'
  });
};

/**
 * Send notification when a new experience booking is created
 * - Email/SMS to guest: "Vi har modtaget din forespørgsel"
 * - Email to admin: "Ny booking til godkendelse"
 */
export const sendExperienceBookingNotification = async (booking) => {
  const result = {
    guestEmail: { sent: false },
    guestSms: { sent: false },
    adminEmail: { sent: false }
  };

  const experienceName = booking.experience?.title || booking.experience_name;
  const experienceIcon = booking.experience?.image || '📅';

  // ========== GUEST EMAIL ==========
  if (booking.guest_email && process.env.SENDGRID_API_KEY) {
    try {
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: linear-gradient(135deg, #2d5041 0%, #3d6b57 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <div style="font-size: 48px; margin-bottom: 16px;">${experienceIcon}</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 500;">Tak for din forespørgsel!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e8e8e8; border-top: none;">
            <p style="font-size: 16px; line-height: 1.6;">Hej ${booking.guest_name},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Vi har modtaget din forespørgsel på <strong>${experienceName}</strong> og vender tilbage hurtigst muligt med en bekræftelse.
            </p>
            
            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #666;">Din forespørgsel</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Oplevelse:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">${experienceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Dato:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">${formatDate(booking.booking_date)}</td>
                </tr>
                ${booking.time_slot ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Tidspunkt:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">Kl. ${booking.time_slot}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;">Antal personer:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">${booking.guests}</td>
                </tr>
                ${booking.total_price ? `
                <tr style="border-top: 1px solid #e8e8e8;">
                  <td style="padding: 12px 0 0; color: #666;">Pris:</td>
                  <td style="padding: 12px 0 0; text-align: right; font-weight: 600; color: #2d5041; font-size: 18px;">${booking.total_price} kr</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${booking.notes ? `
            <div style="background: #fff8e6; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Dine bemærkninger:</strong> ${booking.notes}</p>
            </div>
            ` : ''}
            
            <p style="font-size: 16px; line-height: 1.6;">
              Du modtager en bekræftelse på email og SMS, så snart vi har behandlet din forespørgsel.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">
              Har du spørgsmål? Du er altid velkommen til at kontakte os.
            </p>
            
            <p style="margin-top: 32px; color: #666;">
              Venlige hilsner,<br/>
              <strong>Lærkegaard</strong>
            </p>
          </div>
          
          <div style="background: #f8f8f8; padding: 20px 30px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e8e8e8; border-top: none;">
            <p style="margin: 0; font-size: 12px; color: #888;">
              Lærkegårdsvej 5 · 3770 Allinge · Bornholm
            </p>
          </div>
        </div>
      `;

      await sgMail.send({
        to: booking.guest_email,
        from: process.env.SENDGRID_FROM_EMAIL || 'booking@xn--liv-zna.com',
        subject: `${experienceIcon} Vi har modtaget din forespørgsel - ${experienceName}`,
        html: emailHtml
      });

      result.guestEmail.sent = true;
      console.log(`✅ Experience booking email sent to ${booking.guest_email}`);
    } catch (error) {
      console.error('❌ Error sending guest email:', error);
      result.guestEmail.error = error.message;
    }
  }

  // ========== GUEST SMS ==========
  if (booking.guest_phone && twilioClient) {
    try {
      const smsBody = `Hej ${booking.guest_name}! ${experienceIcon} Vi har modtaget din forespørgsel på "${experienceName}" d. ${formatDateShort(booking.booking_date)}${booking.time_slot ? ` kl. ${booking.time_slot}` : ''}. Vi bekræfter snarest! /Lærkegaard`;

      await twilioClient.messages.create({
        to: booking.guest_phone,
        from: process.env.TWILIO_FROM_NUMBER,
        body: smsBody
      });

      result.guestSms.sent = true;
      console.log(`✅ Experience booking SMS sent to ${booking.guest_phone}`);
    } catch (error) {
      console.error('❌ Error sending guest SMS:', error);
      result.guestSms.error = error.message;
    }
  }

  // ========== ADMIN EMAIL ==========
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL;
  if (adminEmail && process.env.SENDGRID_API_KEY) {
    try {
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5041;">📅 Ny oplevelse-booking til godkendelse</h2>
          
          <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Oplevelse:</strong> ${experienceIcon} ${experienceName}</p>
            <p><strong>Gæst:</strong> ${booking.guest_name}</p>
            <p><strong>Email:</strong> ${booking.guest_email || 'Ikke angivet'}</p>
            <p><strong>Telefon:</strong> ${booking.guest_phone || 'Ikke angivet'}</p>
            <p><strong>Dato:</strong> ${formatDate(booking.booking_date)}</p>
            ${booking.time_slot ? `<p><strong>Tidspunkt:</strong> ${booking.time_slot}</p>` : ''}
            <p><strong>Antal personer:</strong> ${booking.guests}</p>
            ${booking.total_price ? `<p><strong>Pris:</strong> ${booking.total_price} kr</p>` : ''}
            ${booking.notes ? `<p><strong>Bemærkninger:</strong> ${booking.notes}</p>` : ''}
            ${booking.room_name ? `<p><strong>Værelse:</strong> ${booking.room_name}</p>` : ''}
          </div>
          
          <p>Gå til admin-panelet for at bekræfte eller afvise bookingen.</p>
        </div>
      `;

      await sgMail.send({
        to: adminEmail,
        from: process.env.SENDGRID_FROM_EMAIL || 'booking@xn--liv-zna.com',
        subject: `🔔 Ny booking: ${experienceName} - ${booking.guest_name}`,
        html: adminHtml
      });

      result.adminEmail.sent = true;
      console.log(`✅ Admin notification email sent`);
    } catch (error) {
      console.error('❌ Error sending admin email:', error);
      result.adminEmail.error = error.message;
    }
  }

  return result;
};

/**
 * Send confirmation when booking is approved
 */
export const sendExperienceBookingConfirmation = async (booking) => {
  const result = {
    email: { sent: false },
    sms: { sent: false }
  };

  const experienceName = booking.experience?.title || booking.experience_name;
  const experienceIcon = booking.experience?.image || '📅';
  const experienceDescription = booking.experience?.description || '';

  // ========== CONFIRMATION EMAIL ==========
  if (booking.guest_email && process.env.SENDGRID_API_KEY) {
    try {
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: linear-gradient(135deg, #2d5041 0%, #3d6b57 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 500;">Din booking er bekræftet!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e8e8e8; border-top: none;">
            <p style="font-size: 16px; line-height: 1.6;">Hej ${booking.guest_name},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Fantastisk! Din booking af <strong>${experienceName}</strong> er nu bekræftet. Vi glæder os til at se dig!
            </p>
            
            <div style="background: linear-gradient(135deg, #f0f7f4 0%, #e8f5e9 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 2px solid #2d5041;">
              <div style="text-align: center; margin-bottom: 16px;">
                <span style="font-size: 48px;">${experienceIcon}</span>
              </div>
              <h2 style="margin: 0 0 8px; text-align: center; color: #2d5041;">${experienceName}</h2>
              
              <div style="background: white; border-radius: 12px; padding: 16px; margin-top: 16px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e8e8e8;">
                      <span style="color: #666;">📅 Dato</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #e8e8e8;">
                      ${formatDate(booking.booking_date)}
                    </td>
                  </tr>
                  ${booking.time_slot ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e8e8e8;">
                      <span style="color: #666;">🕐 Tidspunkt</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #e8e8e8;">
                      Kl. ${booking.time_slot}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e8e8e8;">
                      <span style="color: #666;">👥 Antal</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #e8e8e8;">
                      ${booking.guests} ${booking.guests === 1 ? 'person' : 'personer'}
                    </td>
                  </tr>
                  ${booking.duration ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e8e8e8;">
                      <span style="color: #666;">⏱️ Varighed</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #e8e8e8;">
                      ${booking.duration}
                    </td>
                  </tr>
                  ` : ''}
                  ${booking.total_price ? `
                  <tr>
                    <td style="padding: 12px 0;">
                      <span style="color: #666;">💰 Pris</span>
                    </td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 20px; color: #2d5041;">
                      ${booking.total_price} kr
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </div>
            
            ${experienceDescription ? `
            <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                <strong>Om oplevelsen:</strong><br/>
                ${experienceDescription}
              </p>
            </div>
            ` : ''}
            
            <div style="background: #fff8e6; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>💡 Husk:</strong> Betaling sker ved ankomst. Ved afbud bedes du give besked senest 24 timer før.
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Har du spørgsmål inden da? Du er altid velkommen til at kontakte os.
            </p>
            
            <p style="margin-top: 32px; color: #666;">
              Vi glæder os til at se dig! 🌿<br/><br/>
              Venlige hilsner,<br/>
              <strong>Lærkegaard</strong>
            </p>
          </div>
          
          <div style="background: #2d5041; padding: 20px 30px; text-align: center; border-radius: 0 0 16px 16px;">
            <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8);">
              Lærkegårdsvej 5 · 3770 Allinge · Bornholm
            </p>
          </div>
        </div>
      `;

      await sgMail.send({
        to: booking.guest_email,
        from: process.env.SENDGRID_FROM_EMAIL || 'booking@xn--liv-zna.com',
        subject: `✓ Bekræftet: ${experienceName} - ${formatDateShort(booking.booking_date)}`,
        html: emailHtml
      });

      result.email.sent = true;
      console.log(`✅ Experience confirmation email sent to ${booking.guest_email}`);
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
      result.email.error = error.message;
    }
  }

  // ========== CONFIRMATION SMS ==========
  if (booking.guest_phone && twilioClient) {
    try {
      const smsBody = `✓ BEKRÆFTET: ${experienceName} d. ${formatDateShort(booking.booking_date)}${booking.time_slot ? ` kl. ${booking.time_slot}` : ''}. ${booking.guests} pers. Vi glæder os til at se dig! /Lærkegaard 🌿`;

      await twilioClient.messages.create({
        to: booking.guest_phone,
        from: process.env.TWILIO_FROM_NUMBER,
        body: smsBody
      });

      result.sms.sent = true;
      console.log(`✅ Experience confirmation SMS sent to ${booking.guest_phone}`);
    } catch (error) {
      console.error('❌ Error sending confirmation SMS:', error);
      result.sms.error = error.message;
    }
  }

  return result;
};

export default {
  sendExperienceBookingNotification,
  sendExperienceBookingConfirmation
};

