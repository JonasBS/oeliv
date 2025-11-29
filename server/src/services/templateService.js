import { dbAll, dbGet, dbRun } from '../database/db.js';

/**
 * Available template variables and their descriptions
 */
export const TEMPLATE_VARIABLES = {
  // Guest info
  guest_name: 'Gæstens fulde navn',
  guest_first_name: 'Gæstens fornavn',
  guest_email: 'Gæstens email',
  guest_phone: 'Gæstens telefon',
  
  // Booking info
  booking_id: 'Booking ID nummer',
  room_name: 'Værelsets navn',
  room_unit: 'Værelses enhed/nummer (f.eks. " (Værelse 3)")',
  check_in_date: 'Check-in dato formateret',
  check_out_date: 'Check-out dato formateret',
  guests: 'Antal gæster',
  total_price: 'Total pris',
  nights: 'Antal overnatninger',
  
  // Times
  checkin_time: 'Check-in tidspunkt (standard: 15:00)',
  checkout_time: 'Check-out tidspunkt (standard: 11:00)',
  
  // Lock code
  lock_code: 'Låsekode med tekst (f.eks. " Dørkode: 123456.")',
  lock_code_plain: 'Kun låsekoden (f.eks. "123456")',
  lock_code_section: 'Fuld låsekode sektion til email (HTML)',
  
  // Cleaning
  cleaning_section: 'Rengørings-info sektion til email (HTML)',
  
  // URLs
  feedback_url: 'Link til feedback formular',
  booking_url: 'Link til booking side',
  preferences_url: 'Link til præference-formular',
  
  // Hotel info
  hotel_phone: 'Hotellets telefonnummer',
  
  // Dates
  today: 'Dagens dato',
  current_year: 'Nuværende år'
};

/**
 * Format a date in Danish locale
 */
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('da-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Build the lock code HTML section for emails
 */
const buildLockCodeSection = (lockCode) => {
  if (!lockCode) return '';
  return `
    <div style="background:#e8f5e9;border-radius:12px;padding:16px;margin:24px 0;border-left:4px solid #4caf50;">
      <p style="margin:0;font-size:14px;color:#2e7d32;"><strong>🔐 Din dørkode</strong></p>
      <p style="margin:8px 0 0 0;font-size:28px;font-weight:bold;letter-spacing:4px;color:#1b5e20;">${lockCode}</p>
      <p style="margin:8px 0 0 0;font-size:12px;color:#558b2f;">Koden er aktiv fra check-in kl. 15:00 til check-out kl. 11:00</p>
    </div>
  `;
};

/**
 * Build the cleaning info HTML section for emails
 */
const buildCleaningSection = () => {
  return `
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
  `;
};

/**
 * Build variables object from booking data
 */
export const buildTemplateVariables = (data) => {
  const checkIn = data.check_in ? new Date(data.check_in) : null;
  const checkOut = data.check_out ? new Date(data.check_out) : null;
  const nights = checkIn && checkOut ? Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) : 0;
  
  // Extract first name from full name
  const nameParts = (data.guest_name || '').split(' ');
  const firstName = nameParts[0] || '';
  
  return {
    // Guest info
    guest_name: data.guest_name || '',
    guest_first_name: firstName,
    guest_email: data.guest_email || '',
    guest_phone: data.guest_phone || '',
    
    // Booking info
    booking_id: data.id || data.booking_id || '',
    room_name: data.room_name || '',
    room_unit: data.room_unit_label ? ` (${data.room_unit_label})` : '',
    check_in_date: formatDate(data.check_in),
    check_out_date: formatDate(data.check_out),
    guests: data.guests || '',
    total_price: data.total_price ? `${data.total_price} kr` : '',
    nights: nights,
    
    // Times
    checkin_time: data.checkin_time || '15:00',
    checkout_time: data.checkout_time || '11:00',
    
    // Lock code
    lock_code: data.lockCode ? ` Dørkode: ${data.lockCode}.` : '',
    lock_code_plain: data.lockCode || '',
    lock_code_section: buildLockCodeSection(data.lockCode),
    
    // Cleaning
    cleaning_section: buildCleaningSection(),
    
    // URLs
    feedback_url: data.feedback_url || process.env.FEEDBACK_URL || 'https://øliv.dk/feedback',
    booking_url: data.booking_url || process.env.BOOKING_URL || 'https://øliv.dk',
    preferences_url: data.preferences_url || (data.preferences_token 
      ? `${process.env.FRONTEND_URL || 'https://øliv.dk'}/preferences/${data.preferences_token}` 
      : ''),
    
    // Hotel info
    hotel_phone: process.env.HOTEL_PHONE || '+45 XX XX XX XX',
    
    // Dates
    today: formatDate(new Date()),
    current_year: new Date().getFullYear()
  };
};

/**
 * Replace template variables in a string
 * Variables are in format {{variable_name}}
 */
export const replaceVariables = (template, variables) => {
  if (!template) return '';
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    if (variables.hasOwnProperty(varName)) {
      return variables[varName] !== null && variables[varName] !== undefined 
        ? String(variables[varName]) 
        : '';
    }
    // Keep the placeholder if variable not found
    console.warn(`Template variable not found: ${varName}`);
    return match;
  });
};

/**
 * Get a template by key and language
 * Falls back to Danish if language not found, then English
 */
export const getTemplate = async (templateKey, language = 'da') => {
  // Try exact language match first
  let template = await dbGet(
    'SELECT * FROM message_templates WHERE template_key = ? AND language = ? AND active = 1', 
    [templateKey, language]
  );
  
  if (template) return template;
  
  // Fall back to Danish
  if (language !== 'da') {
    template = await dbGet(
      'SELECT * FROM message_templates WHERE template_key = ? AND language = ? AND active = 1', 
      [templateKey, 'da']
    );
    if (template) return template;
  }
  
  // Fall back to English
  if (language !== 'en') {
    template = await dbGet(
      'SELECT * FROM message_templates WHERE template_key = ? AND language = ? AND active = 1', 
      [templateKey, 'en']
    );
  }
  
  return template;
};

/**
 * Get all templates
 */
export const getAllTemplates = async () => {
  return dbAll('SELECT * FROM message_templates ORDER BY category, name');
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (category) => {
  return dbAll('SELECT * FROM message_templates WHERE category = ? ORDER BY name', [category]);
};

/**
 * Update a template
 */
export const updateTemplate = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.email_subject !== undefined) { fields.push('email_subject = ?'); values.push(data.email_subject); }
  if (data.email_body !== undefined) { fields.push('email_body = ?'); values.push(data.email_body); }
  if (data.sms_body !== undefined) { fields.push('sms_body = ?'); values.push(data.sms_body); }
  if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active ? 1 : 0); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await dbRun(`UPDATE message_templates SET ${fields.join(', ')} WHERE id = ?`, values);
  return dbGet('SELECT * FROM message_templates WHERE id = ?', [id]);
};

/**
 * Create a new template
 */
export const createTemplate = async (data) => {
  const result = await dbRun(
    `INSERT INTO message_templates (template_key, name, description, category, channel, email_subject, email_body, sms_body, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.template_key,
      data.name,
      data.description || null,
      data.category || 'custom',
      data.channel || 'both',
      data.email_subject || null,
      data.email_body || null,
      data.sms_body || null,
      data.active !== false ? 1 : 0
    ]
  );
  return dbGet('SELECT * FROM message_templates WHERE id = ?', [result.lastID]);
};

/**
 * Delete a template (only custom templates)
 */
export const deleteTemplate = async (id) => {
  // Don't allow deleting system templates
  const template = await dbGet('SELECT * FROM message_templates WHERE id = ?', [id]);
  if (!template) {
    throw new Error('Template not found');
  }
  
  const systemTemplates = [
    'booking_confirmation', 
    'checkin_reminder', 
    'checkout_reminder',
    'lock_code_resend',
    'cleaning_request_confirm',
    'feedback_request',
    'welcome_back'
  ];
  
  if (systemTemplates.includes(template.template_key)) {
    throw new Error('Cannot delete system template');
  }
  
  await dbRun('DELETE FROM message_templates WHERE id = ?', [id]);
  return { deleted: true };
};

/**
 * Render a template with data
 * @param {string} templateKey - The template key
 * @param {object} data - The data to render
 * @param {string} language - The language code (da, en, de, etc.)
 */
export const renderTemplate = async (templateKey, data, language = 'da') => {
  const template = await getTemplate(templateKey, language);
  
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }
  
  const variables = buildTemplateVariables(data);
  
  return {
    email_subject: template.email_subject ? replaceVariables(template.email_subject, variables) : null,
    email_body: template.email_body ? replaceVariables(template.email_body, variables) : null,
    sms_body: template.sms_body ? replaceVariables(template.sms_body, variables) : null,
    language: template.language
  };
};

/**
 * Preview a template with sample data
 */
export const previewTemplate = (template, customVariables = {}) => {
  const sampleData = {
    guest_name: 'Jonas Eksempel',
    guest_first_name: 'Jonas',
    guest_email: 'jonas@example.com',
    guest_phone: '+4512345678',
    id: 123,
    room_name: 'Kystværelse',
    room_unit_label: 'Værelse 3',
    check_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    check_out: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now
    guests: 2,
    total_price: 2400,
    lockCode: '123456',
    ...customVariables
  };
  
  const variables = buildTemplateVariables(sampleData);
  
  return {
    email_subject: template.email_subject ? replaceVariables(template.email_subject, variables) : null,
    email_body: template.email_body ? replaceVariables(template.email_body, variables) : null,
    sms_body: template.sms_body ? replaceVariables(template.sms_body, variables) : null,
    variables_used: variables
  };
};

