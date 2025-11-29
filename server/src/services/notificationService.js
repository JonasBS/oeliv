import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import dotenv from 'dotenv';
import { renderTemplate } from './templateService.js';

dotenv.config();

const emailConfig = {
  sendgridKey: process.env.SENDGRID_API_KEY,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM_EMAIL
};

const smsConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_FROM_NUMBER,
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
};

// Email enabled if SendGrid OR traditional SMTP configured
const emailEnabled = Boolean(
  (emailConfig.sendgridKey && emailConfig.from) ||
  (emailConfig.host && emailConfig.port && emailConfig.user && emailConfig.pass && emailConfig.from)
);

const smsEnabled = Boolean(
  smsConfig.accountSid &&
  smsConfig.authToken &&
  (smsConfig.fromNumber || smsConfig.messagingServiceSid)
);

let mailTransporter = null;
let twilioClient = null;
let useSendGrid = false;

if (emailEnabled) {
  // Use SendGrid if available, otherwise fall back to SMTP
  if (emailConfig.sendgridKey) {
    sgMail.setApiKey(emailConfig.sendgridKey);
    useSendGrid = true;
    console.log('✅ Email notifications enabled (SendGrid)');
  } else {
    mailTransporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    });
    console.log('✅ Email notifications enabled (SMTP)');
  }
} else {
  console.warn('📧 Email notifications disabled - missing email configuration');
}

if (smsEnabled) {
  twilioClient = twilio(smsConfig.accountSid, smsConfig.authToken);
  console.log('✅ SMS notifications enabled (Twilio)');
} else {
  console.warn('📱 SMS notifications disabled - missing Twilio configuration');
}

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('da-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Check if current time is within allowed SMS hours (08:00-21:00 Danish time)
const isWithinSmsHours = () => {
  const now = new Date();
  // Get current hour in Danish timezone
  const danishTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' }));
  const hour = danishTime.getHours();
  return hour >= 8 && hour < 21;
};

// Schedule SMS for next allowed time window
const getNextAllowedSmsTime = () => {
  const now = new Date();
  const danishTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' }));
  const hour = danishTime.getHours();
  
  if (hour >= 21) {
    // After 21:00 - schedule for 08:00 next day
    danishTime.setDate(danishTime.getDate() + 1);
    danishTime.setHours(8, 0, 0, 0);
  } else if (hour < 8) {
    // Before 08:00 - schedule for 08:00 same day
    danishTime.setHours(8, 0, 0, 0);
  }
  
  return danishTime;
};

const buildEmailBody = (booking) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const experienceGuideUrl = `${frontendUrl}/oplevelser`;
  
  let lockCodeSection = '';
  if (booking.lockCode) {
    lockCodeSection = `
      <div style="background:#e8f5e9;border-radius:12px;padding:16px;margin:24px 0;border-left:4px solid #4caf50;">
        <p style="margin:0;font-size:14px;color:#2e7d32;"><strong>🔐 Din dørkode</strong></p>
        <p style="margin:8px 0 0 0;font-size:28px;font-weight:bold;letter-spacing:4px;color:#1b5e20;">${booking.lockCode}</p>
        <p style="margin:8px 0 0 0;font-size:12px;color:#558b2f;">Koden er aktiv fra check-in kl. 15:00 til check-out kl. 11:00</p>
      </div>
    `;
  }

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
    <h2>Hej ${booking.guest_name || ''}</h2>
    <p>Tak for din booking hos ØLIV. Vi bekræfter hermed dit ophold.</p>
    <div style="background:#f7f4ef;border-radius:12px;padding:16px;margin:24px 0;">
      <p><strong>Værelse:</strong> ${booking.room_name || booking.room_id}${booking.room_unit_label ? ` (${booking.room_unit_label})` : ''}</p>
      <p><strong>Datoer:</strong> ${formatDate(booking.check_in)} – ${formatDate(booking.check_out)}</p>
      <p><strong>Antal gæster:</strong> ${booking.guests}</p>
      <p><strong>Booking-ID:</strong> #${booking.id}</p>
    </div>
    ${lockCodeSection}
    <div style="background:#f0f7e6;border-radius:12px;padding:16px;margin:24px 0;border-left:4px solid #7cb342;">
      <p style="margin:0;font-size:14px;color:#558b2f;"><strong>🌿 Bæredygtigt ophold – Rengøring på forespørgsel</strong></p>
      <p style="margin:8px 0 0 0;font-size:14px;color:#33691e;">
        Hos ØLIV værner vi om miljøet og dit privatliv. Vi tilbyder derfor rengøring <strong>på forespørgsel</strong> frem for daglig rengøring.
      </p>
      <p style="margin:12px 0 0 0;font-size:14px;color:#33691e;">
        <strong>Sådan fungerer det:</strong><br/>
        På dit værelse finder du et skilt, du kan hænge på døren inden kl. 10:00, hvis du ønsker rengøring den dag. Du kan også skrive til os på SMS eller email.
      </p>
      <p style="margin:12px 0 0 0;font-size:13px;color:#558b2f;font-style:italic;">
        Ved at vælge rengøring kun når du har brug for det, hjælper du os med at spare vand, energi og kemikalier. Tak fordi du støtter et grønnere ophold! 🌱
      </p>
    </div>
    
    <div style="background:linear-gradient(135deg, #2d5041 0%, #3d6b57 100%);border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0;font-size:24px;">✨</p>
      <p style="margin:12px 0 8px 0;font-size:18px;color:white;font-weight:bold;">Udforsk området</p>
      <p style="margin:0 0 16px 0;font-size:14px;color:rgba(255,255,255,0.9);">
        Opdager de bedste oplevelser, restauranter og aktiviteter i nærheden af Lærkegaard
      </p>
      <a href="${experienceGuideUrl}" style="display:inline-block;background:white;color:#2d5041;padding:12px 28px;border-radius:30px;text-decoration:none;font-weight:bold;font-size:14px;">Se oplevelsesguide →</a>
    </div>
    
    <p>Vi glæder os til at byde dig velkommen hos ØLIV.</p>
    <p style="margin-top:24px;">De bedste hilsner<br/>ØLIV Teamet</p>
  </div>
`;
};

const buildSmsBody = (booking) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  
  let lockCodeText = '';
  if (booking.lockCode) {
    lockCodeText = ` Dørkode: ${booking.lockCode}.`;
  }
  
  // Include room unit label if available
  let roomInfo = booking.room_name || '';
  if (booking.room_unit_label) {
    roomInfo = `${booking.room_name} (${booking.room_unit_label})`;
  }
  
  return `Hej ${booking.guest_name || ''}! Din booking hos ØLIV er bekræftet. Værelse: ${roomInfo}. ${formatDate(booking.check_in)}-${formatDate(booking.check_out)}.${lockCodeText} 🌿 Se oplevelser i området: ${frontendUrl}/oplevelser Vi glæder os!`;
};

export const notifyGuestOfConfirmation = async (booking) => {
  const result = {
    email: { enabled: emailEnabled, sent: false },
    sms: { enabled: smsEnabled, sent: false }
  };

  // Try to use template, fall back to hardcoded if template not found
  let emailSubject = 'Bekræftelse af ophold hos ØLIV';
  let emailBody = buildEmailBody(booking);
  let smsBody = buildSmsBody(booking);

  try {
    const rendered = await renderTemplate('booking_confirmation', booking);
    if (rendered.email_subject) emailSubject = rendered.email_subject;
    if (rendered.email_body) emailBody = rendered.email_body;
    if (rendered.sms_body) smsBody = rendered.sms_body;
  } catch (templateError) {
    console.warn('⚠️ Template not found, using default:', templateError.message);
  }

  if (emailEnabled && booking.guest_email) {
    try {
      if (useSendGrid) {
        // Use SendGrid official API
        await sgMail.send({
          from: emailConfig.from,
          to: booking.guest_email,
          subject: emailSubject,
          html: emailBody
        });
      } else {
        // Use nodemailer SMTP
        await mailTransporter.sendMail({
          from: emailConfig.from,
          to: booking.guest_email,
          subject: emailSubject,
          html: emailBody
        });
      }
      result.email.sent = true;
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
      result.email.error = error.message;
    }
  }

  if (smsEnabled && booking.guest_phone) {
    // Check if within allowed SMS hours (08:00-21:00)
    if (!isWithinSmsHours()) {
      const nextTime = getNextAllowedSmsTime();
      console.log(`📱 SMS scheduled for ${nextTime.toLocaleString('da-DK')} (outside allowed hours 08:00-21:00)`);
      result.sms.scheduled = true;
      result.sms.scheduledFor = nextTime.toISOString();
      
      // Schedule the SMS using Twilio's scheduling feature or queue it
      try {
        const messagePayload = {
          to: booking.guest_phone,
          body: smsBody,
          scheduleType: 'fixed',
          sendAt: nextTime.toISOString()
        };

        if (smsConfig.messagingServiceSid) {
          messagePayload.messagingServiceSid = smsConfig.messagingServiceSid;
        } else if (smsConfig.fromNumber) {
          messagePayload.from = smsConfig.fromNumber;
        }

        await twilioClient.messages.create(messagePayload);
        result.sms.sent = true;
        result.sms.note = `Scheduled for ${nextTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`;
      } catch (error) {
        // If scheduling fails (e.g., Twilio plan doesn't support it), log and skip
        console.warn('⚠️ SMS scheduling not available, will send at next allowed time:', error.message);
        result.sms.sent = false;
        result.sms.error = 'Scheduled SMS not supported - will be sent during business hours';
      }
    } else {
      // Within allowed hours - send immediately
      try {
        const messagePayload = {
          to: booking.guest_phone,
          body: smsBody
        };

        if (smsConfig.messagingServiceSid) {
          messagePayload.messagingServiceSid = smsConfig.messagingServiceSid;
        } else if (smsConfig.fromNumber) {
          messagePayload.from = smsConfig.fromNumber;
        }

        await twilioClient.messages.create(messagePayload);
        result.sms.sent = true;
      } catch (error) {
        console.error('❌ Error sending confirmation SMS:', error);
        result.sms.error = error.message;
      }
    }
  }

  return result;
};

const buildCrmEmailBody = (guest, body) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
    <h2>Hej ${guest.first_name || guest.last_name || ''}</h2>
    <div style="background:#f7f4ef;border-radius:12px;padding:16px;margin:24px 0;">
      ${body}
    </div>
    <p style="margin-top:24px;">De bedste hilsner<br/>ØLIV Teamet</p>
  </div>
`;

// Send day-before check-in reminder SMS
export const sendCheckInReminderSms = async (booking) => {
  if (!smsEnabled || !booking.guest_phone) {
    return { enabled: smsEnabled, sent: false, error: 'SMS not configured or phone missing' };
  }

  // Only send during allowed hours (08:00-21:00)
  if (!isWithinSmsHours()) {
    console.log(`📱 Check-in reminder skipped - outside allowed hours (will be sent by scheduler)`);
    return { enabled: true, sent: false, skipped: true, reason: 'Outside allowed SMS hours (08:00-21:00)' };
  }

  try {
    const checkInTime = '15:00';
    
    // Include room info
    let roomInfo = booking.room_name || '';
    if (booking.room_unit_label) {
      roomInfo = `${booking.room_name} (${booking.room_unit_label})`;
    }
    
    const body = `Hej ${booking.guest_name || ''}! 🌿 Vi glæder os til at se dig i morgen på ${roomInfo}. Check-in fra kl. ${checkInTime}.${booking.lockCode ? ` Dørkode: ${booking.lockCode}.` : ''} Rengøring på forespørgsel. Velkommen til ØLIV!`;

    const messagePayload = {
      to: booking.guest_phone,
      body
    };

    if (smsConfig.messagingServiceSid) {
      messagePayload.messagingServiceSid = smsConfig.messagingServiceSid;
    } else if (smsConfig.fromNumber) {
      messagePayload.from = smsConfig.fromNumber;
    }

    await twilioClient.messages.create(messagePayload);
    return { enabled: true, sent: true };
  } catch (error) {
    console.error('❌ Error sending check-in reminder SMS:', error);
    return { enabled: true, sent: false, error: error.message };
  }
};

export const sendCrmMessage = async ({ channel = 'email', guest, subject, body }) => {
  if (channel === 'sms') {
    if (!smsEnabled || !guest.phone) {
      return { success: false, error: 'SMS not configured or phone missing' };
    }

    try {
      const messagePayload = {
        to: guest.phone,
        body: body
      };

      if (smsConfig.messagingServiceSid) {
        messagePayload.messagingServiceSid = smsConfig.messagingServiceSid;
      } else if (smsConfig.fromNumber) {
        messagePayload.from = smsConfig.fromNumber;
      }

      await twilioClient.messages.create(messagePayload);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending CRM SMS:', error);
      return { success: false, error: error.message };
    }
  }

  if (!emailEnabled || !guest.email) {
    return { success: false, error: 'Email not configured or missing guest email' };
  }

  try {
    if (useSendGrid) {
      // Use SendGrid official API
      await sgMail.send({
        from: emailConfig.from,
        to: guest.email,
        subject: subject || 'Tilbage hos ØLIV?',
        html: buildCrmEmailBody(guest, body || '')
      });
    } else {
      // Use nodemailer SMTP
      await mailTransporter.sendMail({
        from: emailConfig.from,
        to: guest.email,
        subject: subject || 'Tilbage hos ØLIV?',
        html: buildCrmEmailBody(guest, body || '')
      });
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending CRM email:', error);
    return { success: false, error: error.message };
  }
};

