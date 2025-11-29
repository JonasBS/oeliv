-- Add language support to message templates
ALTER TABLE message_templates ADD COLUMN language TEXT NOT NULL DEFAULT 'da';

-- Create index for language lookups
CREATE INDEX IF NOT EXISTS idx_message_templates_language ON message_templates(template_key, language);

-- Update existing templates to be Danish
UPDATE message_templates SET language = 'da' WHERE language IS NULL OR language = '';

-- Make template_key + language unique instead of just template_key
-- First drop the old unique constraint by recreating the table structure
-- SQLite doesn't support DROP CONSTRAINT, so we work around it

-- Insert English templates
INSERT OR IGNORE INTO message_templates (template_key, name, description, category, channel, language, email_subject, email_body, sms_body) VALUES
(
  'booking_confirmation',
  'Booking Confirmation',
  'Sent when a booking is created or confirmed',
  'booking',
  'both',
  'en',
  'Confirmation of your stay at ØLIV',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hello {{guest_name}}</h2>
  <p>Thank you for booking with ØLIV. We hereby confirm your stay.</p>
  <div style="background:#f7f4ef;border-radius:12px;padding:16px;margin:24px 0;">
    <p><strong>Room:</strong> {{room_name}}{{room_unit}}</p>
    <p><strong>Dates:</strong> {{check_in_date}} – {{check_out_date}}</p>
    <p><strong>Guests:</strong> {{guests}}</p>
    <p><strong>Booking ID:</strong> #{{booking_id}}</p>
  </div>
  {{lock_code_section}}
  {{cleaning_section}}
  <p>We look forward to welcoming you at ØLIV.</p>
  <p style="margin-top:24px;">Best regards<br/>The ØLIV Team</p>
</div>',
  'Hello {{guest_name}}! Your booking at ØLIV is confirmed. Room: {{room_name}}{{room_unit}}. {{check_in_date}}-{{check_out_date}}.{{lock_code}} 🌿 Cleaning on request. We look forward to seeing you!'
),
(
  'checkin_reminder',
  'Check-in Reminder',
  'Sent the day before check-in',
  'booking',
  'sms',
  'en',
  NULL,
  NULL,
  'Hello {{guest_name}}! 🌿 We look forward to seeing you tomorrow at {{room_name}}{{room_unit}}. Check-in from {{checkin_time}}.{{lock_code}} Cleaning on request. Welcome to ØLIV!'
),
(
  'checkout_reminder',
  'Check-out Reminder',
  'Sent on check-out day',
  'booking',
  'sms',
  'en',
  NULL,
  NULL,
  'Hello {{guest_name}}! 🌿 Thank you for staying at ØLIV. Please check out by {{checkout_time}}. We hope you enjoyed your stay and look forward to welcoming you again!'
),
(
  'lock_code_resend',
  'Resend Lock Code',
  'When lock code is resent manually',
  'booking',
  'both',
  'en',
  'Your door code for ØLIV',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hello {{guest_name}}</h2>
  <p>Here is your door code for your stay at ØLIV:</p>
  {{lock_code_section}}
  <p><strong>Room:</strong> {{room_name}}{{room_unit}}</p>
  <p><strong>Dates:</strong> {{check_in_date}} – {{check_out_date}}</p>
  <p style="margin-top:24px;">Best regards<br/>The ØLIV Team</p>
</div>',
  'Hello {{guest_name}}! Here is your door code for ØLIV: {{lock_code_plain}}. Room: {{room_name}}{{room_unit}}. The code is active from check-in at {{checkin_time}}.'
),
(
  'feedback_request',
  'Feedback Request',
  'Sent after check-out to request feedback',
  'crm',
  'both',
  'en',
  'How was your stay at ØLIV?',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hello {{guest_name}}</h2>
  <p>Thank you for staying at ØLIV! We hope you had a wonderful experience.</p>
  <p>We would love to hear your thoughts. It only takes 2 minutes:</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="{{feedback_url}}" style="background:#4a5d23;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Give Feedback</a>
  </p>
  <p>Your feedback helps us improve!</p>
  <p style="margin-top:24px;">Best regards<br/>The ØLIV Team</p>
</div>',
  'Hello {{guest_name}}! Thank you for staying at ØLIV 🌿 We would love to hear your thoughts: {{feedback_url}}'
);

-- Insert German templates
INSERT OR IGNORE INTO message_templates (template_key, name, description, category, channel, language, email_subject, email_body, sms_body) VALUES
(
  'booking_confirmation',
  'Buchungsbestätigung',
  'Wird gesendet, wenn eine Buchung erstellt oder bestätigt wird',
  'booking',
  'both',
  'de',
  'Bestätigung Ihres Aufenthalts bei ØLIV',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hallo {{guest_name}}</h2>
  <p>Vielen Dank für Ihre Buchung bei ØLIV. Hiermit bestätigen wir Ihren Aufenthalt.</p>
  <div style="background:#f7f4ef;border-radius:12px;padding:16px;margin:24px 0;">
    <p><strong>Zimmer:</strong> {{room_name}}{{room_unit}}</p>
    <p><strong>Datum:</strong> {{check_in_date}} – {{check_out_date}}</p>
    <p><strong>Gäste:</strong> {{guests}}</p>
    <p><strong>Buchungs-ID:</strong> #{{booking_id}}</p>
  </div>
  {{lock_code_section}}
  {{cleaning_section}}
  <p>Wir freuen uns darauf, Sie bei ØLIV begrüßen zu dürfen.</p>
  <p style="margin-top:24px;">Mit freundlichen Grüßen<br/>Das ØLIV Team</p>
</div>',
  'Hallo {{guest_name}}! Ihre Buchung bei ØLIV ist bestätigt. Zimmer: {{room_name}}{{room_unit}}. {{check_in_date}}-{{check_out_date}}.{{lock_code}} 🌿 Reinigung auf Anfrage. Wir freuen uns auf Sie!'
),
(
  'checkin_reminder',
  'Check-in Erinnerung',
  'Wird am Tag vor dem Check-in gesendet',
  'booking',
  'sms',
  'de',
  NULL,
  NULL,
  'Hallo {{guest_name}}! 🌿 Wir freuen uns, Sie morgen im {{room_name}}{{room_unit}} begrüßen zu dürfen. Check-in ab {{checkin_time}}.{{lock_code}} Reinigung auf Anfrage. Willkommen bei ØLIV!'
),
(
  'checkout_reminder',
  'Check-out Erinnerung',
  'Wird am Check-out Tag gesendet',
  'booking',
  'sms',
  'de',
  NULL,
  NULL,
  'Hallo {{guest_name}}! 🌿 Vielen Dank für Ihren Aufenthalt bei ØLIV. Bitte checken Sie bis {{checkout_time}} aus. Wir hoffen, Sie hatten einen schönen Aufenthalt!'
),
(
  'lock_code_resend',
  'Türcode erneut senden',
  'Wenn der Türcode manuell erneut gesendet wird',
  'booking',
  'both',
  'de',
  'Ihr Türcode für ØLIV',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hallo {{guest_name}}</h2>
  <p>Hier ist Ihr Türcode für Ihren Aufenthalt bei ØLIV:</p>
  {{lock_code_section}}
  <p><strong>Zimmer:</strong> {{room_name}}{{room_unit}}</p>
  <p><strong>Datum:</strong> {{check_in_date}} – {{check_out_date}}</p>
  <p style="margin-top:24px;">Mit freundlichen Grüßen<br/>Das ØLIV Team</p>
</div>',
  'Hallo {{guest_name}}! Hier ist Ihr Türcode für ØLIV: {{lock_code_plain}}. Zimmer: {{room_name}}{{room_unit}}. Der Code ist ab Check-in um {{checkin_time}} aktiv.'
),
(
  'feedback_request',
  'Feedback-Anfrage',
  'Wird nach dem Check-out gesendet',
  'crm',
  'both',
  'de',
  'Wie war Ihr Aufenthalt bei ØLIV?',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hallo {{guest_name}}</h2>
  <p>Vielen Dank für Ihren Aufenthalt bei ØLIV! Wir hoffen, Sie hatten eine wunderbare Zeit.</p>
  <p>Wir würden uns sehr über Ihr Feedback freuen. Es dauert nur 2 Minuten:</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="{{feedback_url}}" style="background:#4a5d23;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Feedback geben</a>
  </p>
  <p>Ihr Feedback hilft uns, noch besser zu werden!</p>
  <p style="margin-top:24px;">Mit freundlichen Grüßen<br/>Das ØLIV Team</p>
</div>',
  'Hallo {{guest_name}}! Vielen Dank für Ihren Aufenthalt bei ØLIV 🌿 Wir würden uns über Ihr Feedback freuen: {{feedback_url}}'
);

-- Add language column to bookings table to store guest preferred language
ALTER TABLE bookings ADD COLUMN guest_language TEXT DEFAULT 'da';

