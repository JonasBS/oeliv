-- Add preference request templates

-- Danish
INSERT OR IGNORE INTO message_templates (template_key, name, description, category, channel, language, email_subject, email_body, sms_body) VALUES
(
  'preferences_request',
  'Præference-forespørgsel',
  'Sendes før ankomst for at spørge om gæstens ønsker og præferencer',
  'booking',
  'both',
  'da',
  'Gør dit ophold hos ØLIV personligt 🌿',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hej {{guest_name}}</h2>
  <p>Vi glæder os til at byde dig velkommen på <strong>{{room_name}}{{room_unit}}</strong> den <strong>{{check_in_date}}</strong>!</p>
  
  <p>For at gøre dit ophold så behageligt som muligt, vil vi gerne høre lidt om dine præferencer.</p>
  
  <p style="text-align:center;margin:32px 0;">
    <a href="{{preferences_url}}" style="background:#4a5d23;color:white;padding:16px 32px;border-radius:30px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">✨ Fortæl os om dine ønsker</a>
  </p>
  
  <div style="background:#f7f4ef;border-radius:12px;padding:20px;margin:24px 0;">
    <p style="margin:0 0 12px 0;font-weight:bold;color:#4a5d23;">Du kan bl.a. vælge:</p>
    <ul style="margin:0;padding-left:20px;color:#555;">
      <li>🌡️ Din foretrukne temperatur (vi tænder varmen inden ankomst!)</li>
      <li>🛏️ Ekstra puder eller tæpper</li>
      <li>🍽️ Diætønsker til morgenmad</li>
      <li>🎉 Særlige anledninger (fødselsdag, jubilæum...)</li>
    </ul>
  </div>
  
  <p>Det tager kun 2 minutter, og hjælper os med at gøre dit ophold helt perfekt! ✨</p>
  
  <p style="margin-top:24px;">Varme hilsner<br/>ØLIV Teamet</p>
</div>',
  'Hej {{guest_name}}! 🌿 Vi glæder os til at se dig {{check_in_date}}. Fortæl os om dine ønsker (temperatur, puder, fejring m.m.): {{preferences_url}} /ØLIV'
);

-- English
INSERT OR IGNORE INTO message_templates (template_key, name, description, category, channel, language, email_subject, email_body, sms_body) VALUES
(
  'preferences_request',
  'Preferences Request',
  'Sent before arrival to ask about guest preferences',
  'booking',
  'both',
  'en',
  'Make your ØLIV stay personal 🌿',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hello {{guest_name}}</h2>
  <p>We are looking forward to welcoming you to <strong>{{room_name}}{{room_unit}}</strong> on <strong>{{check_in_date}}</strong>!</p>
  
  <p>To make your stay as comfortable as possible, we would love to hear about your preferences:</p>
  
  <div style="background:#f7f4ef;border-radius:12px;padding:20px;margin:24px 0;">
    <p style="margin:0 0 16px 0;font-weight:bold;color:#4a5d23;">🛏️ Room</p>
    <ul style="margin:0 0 20px 0;padding-left:20px;">
      <li>Do you prefer extra pillows or blankets?</li>
      <li>Do you have any allergies we should know about?</li>
    </ul>
    
    <p style="margin:0 0 16px 0;font-weight:bold;color:#4a5d23;">🌡️ Comfort</p>
    <ul style="margin:0 0 20px 0;padding-left:20px;">
      <li>What room temperature do you prefer?</li>
      <li>Would you like the floor heating on upon arrival?</li>
    </ul>
    
    <p style="margin:0 0 16px 0;font-weight:bold;color:#4a5d23;">☕ Dining</p>
    <ul style="margin:0 0 20px 0;padding-left:20px;">
      <li>Do you have any dietary requirements? (vegetarian, gluten-free, etc.)</li>
      <li>Would you like breakfast in your room?</li>
    </ul>
    
    <p style="margin:0 0 16px 0;font-weight:bold;color:#4a5d23;">🎉 Special Occasions</p>
    <ul style="margin:0;padding-left:20px;">
      <li>Are you celebrating something special during your stay?</li>
      <li>Would you like flowers, champagne, or anything else in your room?</li>
    </ul>
  </div>
  
  <p><strong>Simply reply to this email</strong> or send us a text at {{hotel_phone}} with your wishes.</p>
  
  <p>No request is too small – we want to make your stay perfect! ✨</p>
  
  <p style="margin-top:24px;">Warm regards<br/>The ØLIV Team</p>
</div>',
  'Hello {{guest_name}}! 🌿 We look forward to seeing you {{check_in_date}}. Any special requests for your stay? (temperature, pillows, diet, celebration?) Reply to this text - we will make it personal for you! /ØLIV'
);

-- German
INSERT OR IGNORE INTO message_templates (template_key, name, description, category, channel, language, email_subject, email_body, sms_body) VALUES
(
  'preferences_request',
  'Präferenz-Anfrage',
  'Wird vor der Ankunft gesendet, um nach Gästewünschen zu fragen',
  'booking',
  'both',
  'de',
  'Gestalten Sie Ihren ØLIV-Aufenthalt persönlich 🌿',
  '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
  <h2>Hallo {{guest_name}}</h2>
  <p>Wir freuen uns darauf, Sie am <strong>{{check_in_date}}</strong> im <strong>{{room_name}}{{room_unit}}</strong> begrüßen zu dürfen!</p>
  
  <p>Um Ihren Aufenthalt so angenehm wie möglich zu gestalten, möchten wir gerne Ihre Präferenzen erfahren:</p>
  
  <div style="background:#f7f4ef;border-radius:12px;padding:20px;margin:24px 0;">
    <p style="margin:0 0 16px 0;font-weight:bold;color:#4a5d23;">🛏️ Zimmer</p>
    <ul style="margin:0 0 20px 0;padding-left:20px;">
      <li>Bevorzugen Sie zusätzliche Kissen oder Decken?</li>
      <li>Haben Sie Allergien, die wir berücksichtigen sollten?</li>
    </ul>
    
    <p style="margin:0 0 16px 0;font-weight:bold;color:#4a5d23;">🌡️ Komfort</p>
    <ul style="margin:0 0 20px 0;padding-left:20px;">
      <li>Welche Zimmertemperatur bevorzugen Sie?</li>
      <li>Möchten Sie die Fußbodenheizung bei Ankunft eingeschaltet haben?</li>
    </ul>
    
    <p style="margin:0 0 16px 0;font-weight:bold;color:#4a5d23;">☕ Verpflegung</p>
    <ul style="margin:0 0 20px 0;padding-left:20px;">
      <li>Haben Sie besondere Ernährungswünsche? (vegetarisch, glutenfrei, etc.)</li>
      <li>Möchten Sie Frühstück auf dem Zimmer?</li>
    </ul>
    
    <p style="margin:0 0 16px 0;font-weight:bold;color:#4a5d23;">🎉 Besondere Anlässe</p>
    <ul style="margin:0;padding-left:20px;">
      <li>Feiern Sie etwas Besonderes während Ihres Aufenthalts?</li>
      <li>Möchten Sie Blumen, Champagner oder etwas anderes auf dem Zimmer?</li>
    </ul>
  </div>
  
  <p><strong>Antworten Sie einfach auf diese E-Mail</strong> oder senden Sie uns eine SMS an {{hotel_phone}} mit Ihren Wünschen.</p>
  
  <p>Kein Wunsch ist zu klein – wir möchten Ihren Aufenthalt perfekt machen! ✨</p>
  
  <p style="margin-top:24px;">Herzliche Grüße<br/>Das ØLIV Team</p>
</div>',
  'Hallo {{guest_name}}! 🌿 Wir freuen uns auf Sie am {{check_in_date}}. Besondere Wünsche für Ihren Aufenthalt? (Temperatur, Kissen, Ernährung, Feier?) Antworten Sie auf diese SMS - wir machen es persönlich! /ØLIV'
);

