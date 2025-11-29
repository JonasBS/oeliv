import express from 'express';
import {
  getAllTemplates,
  getTemplate,
  getTemplatesByCategory,
  updateTemplate,
  createTemplate,
  deleteTemplate,
  previewTemplate,
  TEMPLATE_VARIABLES
} from '../services/templateService.js';
import {
  SUPPORTED_LANGUAGES,
  COUNTRY_CODES,
  getAllCountries,
  getPopularCountries,
  getDefaultCountryForLanguage
} from '../services/languageService.js';

const router = express.Router();

// Get all available template variables
router.get('/variables', (req, res) => {
  res.json({
    variables: TEMPLATE_VARIABLES,
    syntax: 'Use {{variable_name}} in your templates'
  });
});

// Get supported languages
router.get('/languages', (req, res) => {
  res.json({
    languages: SUPPORTED_LANGUAGES,
    default: 'da'
  });
});

// Get country codes for phone input
router.get('/countries', (req, res) => {
  res.json({
    popular: getPopularCountries(),
    all: getAllCountries()
  });
});

// Get default country for a language
router.get('/countries/default/:language', (req, res) => {
  const { language } = req.params;
  const countryCode = getDefaultCountryForLanguage(language);
  const country = COUNTRY_CODES[countryCode];
  
  res.json({
    code: countryCode,
    ...country
  });
});

// Get all templates
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    let templates;
    if (category) {
      templates = await getTemplatesByCategory(category);
    } else {
      templates = await getAllTemplates();
    }
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template by key
router.get('/key/:key', async (req, res) => {
  try {
    const template = await getTemplate(req.params.key);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Get single template by ID
router.get('/:id', async (req, res) => {
  try {
    const { dbGet } = await import('../database/db.js');
    const template = await dbGet('SELECT * FROM message_templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Preview a template with sample data
router.post('/:id/preview', async (req, res) => {
  try {
    const { dbGet } = await import('../database/db.js');
    const template = await dbGet('SELECT * FROM message_templates WHERE id = ?', [req.params.id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const preview = previewTemplate(template, req.body.variables || {});
    res.json(preview);
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

// Create new template
router.post('/', async (req, res) => {
  try {
    const { template_key, name, description, category, channel, email_subject, email_body, sms_body } = req.body;
    
    if (!template_key || !name) {
      return res.status(400).json({ error: 'template_key and name are required' });
    }
    
    // Check if key already exists
    const existing = await getTemplate(template_key);
    if (existing) {
      return res.status(400).json({ error: 'Template key already exists' });
    }
    
    const template = await createTemplate({
      template_key,
      name,
      description,
      category,
      channel,
      email_subject,
      email_body,
      sms_body
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const template = await updateTemplate(req.params.id, req.body);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    await deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(400).json({ error: error.message || 'Failed to delete template' });
  }
});

// Reset template to default
router.post('/:id/reset', async (req, res) => {
  try {
    const { dbGet } = await import('../database/db.js');
    const template = await dbGet('SELECT template_key FROM message_templates WHERE id = ?', [req.params.id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Get default template from migration file (simplified - just return current)
    // In a real implementation, you'd store defaults separately
    res.json({ message: 'Reset functionality not yet implemented', template });
  } catch (error) {
    console.error('Error resetting template:', error);
    res.status(500).json({ error: 'Failed to reset template' });
  }
});

export default router;

