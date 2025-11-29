-- Message templates for guest communications
CREATE TABLE IF NOT EXISTS message_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'booking',
  channel TEXT NOT NULL DEFAULT 'both', -- 'email', 'sms', 'both'
  
  -- Email specific
  email_subject TEXT,
  email_body TEXT,
  
  -- SMS specific
  sms_body TEXT,
  
  -- Settings
  active INTEGER DEFAULT 1,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default templates
INSERT OR IGNORE INTO message_templates (template_key, name, description, category, channel, email_subject, email_body, sms_body) VALUES
(
  'booking_confirmation',
  'Booking bekræftelse',
  'Sendes når en booking oprettes eller bekræftes',
  'booking',
  'both',
  'Bekræftelse af ophold hos ØLIV',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hej {{guest_name}}</h2>
  <p>Tak for din booking hos ØLIV. Vi bekræfter hermed dit ophold.</p>
  <div style="background:#f7f4ef;border-radius:12px;padding:16px;margin:24px 0;">
    <p><strong>Værelse:</strong> {{room_name}}{{room_unit}}</p>
    <p><strong>Datoer:</strong> {{check_in_date}} – {{check_out_date}}</p>
    <p><strong>Antal gæster:</strong> {{guests}}</p>
    <p><strong>Booking-ID:</strong> #{{booking_id}}</p>
  </div>
  {{lock_code_section}}
  {{cleaning_section}}
  <p>Vi glæder os til at byde dig velkommen hos ØLIV.</p>
  <p style="margin-top:24px;">De bedste hilsner<br/>ØLIV Teamet</p>
</div>',
  'Hej {{guest_name}}! Din booking hos ØLIV er bekræftet. Værelse: {{room_name}}{{room_unit}}. {{check_in_date}}-{{check_out_date}}.{{lock_code}} 🌿 Rengøring på forespørgsel. Vi glæder os til at se dig!'
),
(
  'checkin_reminder',
  'Check-in påmindelse',
  'Sendes dagen før check-in',
  'booking',
  'sms',
  NULL,
  NULL,
  'Hej {{guest_name}}! 🌿 Vi glæder os til at se dig i morgen på {{room_name}}{{room_unit}}. Check-in fra kl. {{checkin_time}}.{{lock_code}} Rengøring på forespørgsel. Velkommen til ØLIV!'
),
(
  'checkout_reminder',
  'Check-out påmindelse',
  'Sendes på check-out dagen',
  'booking',
  'sms',
  NULL,
  NULL,
  'Hej {{guest_name}}! 🌿 Tak for dit ophold hos ØLIV. Husk check-out inden kl. {{checkout_time}}. Vi håber du har nydt opholdet og ser frem til at byde dig velkommen igen!'
),
(
  'lock_code_resend',
  'Gensend låsekode',
  'Når låsekode gensendes manuelt',
  'booking',
  'both',
  'Din dørkode til ØLIV',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hej {{guest_name}}</h2>
  <p>Her er din dørkode til dit ophold hos ØLIV:</p>
  {{lock_code_section}}
  <p><strong>Værelse:</strong> {{room_name}}{{room_unit}}</p>
  <p><strong>Datoer:</strong> {{check_in_date}} – {{check_out_date}}</p>
  <p style="margin-top:24px;">De bedste hilsner<br/>ØLIV Teamet</p>
</div>',
  'Hej {{guest_name}}! Her er din dørkode til ØLIV: {{lock_code_plain}}. Værelse: {{room_name}}{{room_unit}}. Koden er aktiv fra check-in kl. {{checkin_time}}.'
),
(
  'cleaning_request_confirm',
  'Rengøring bekræftet',
  'Bekræftelse når gæst anmoder om rengøring',
  'service',
  'sms',
  NULL,
  NULL,
  'Hej {{guest_name}}! 🧹 Vi har modtaget din anmodning om rengøring. Vi kommer forbi i løbet af dagen. God dag!'
),
(
  'feedback_request',
  'Feedback anmodning',
  'Sendes efter check-out for at bede om feedback',
  'crm',
  'both',
  'Hvordan var dit ophold hos ØLIV?',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hej {{guest_name}}</h2>
  <p>Tak for dit ophold hos ØLIV! Vi håber du havde en fantastisk oplevelse.</p>
  <p>Vi vil meget gerne høre din mening. Det tager kun 2 minutter:</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="{{feedback_url}}" style="background:#4a5d23;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Giv feedback</a>
  </p>
  <p>Din feedback hjælper os med at blive endnu bedre!</p>
  <p style="margin-top:24px;">De bedste hilsner<br/>ØLIV Teamet</p>
</div>',
  'Hej {{guest_name}}! Tak for dit ophold hos ØLIV 🌿 Vi vil meget gerne høre din mening: {{feedback_url}}'
),
(
  'welcome_back',
  'Velkommen tilbage',
  'Sendes til tidligere gæster som CRM kampagne',
  'crm',
  'both',
  'Vi savner dig hos ØLIV',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hej {{guest_name}}</h2>
  <p>Det er et stykke tid siden vi så dig sidst, og vi savner dig!</p>
  <p>Book dit næste ophold og oplev ØLIV igen:</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="{{booking_url}}" style="background:#4a5d23;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Book nu</a>
  </p>
  <p style="margin-top:24px;">De bedste hilsner<br/>ØLIV Teamet</p>
</div>',
  'Hej {{guest_name}}! 🌿 Vi savner dig hos ØLIV. Book dit næste ophold på {{booking_url}}'
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_templates_key ON message_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);

