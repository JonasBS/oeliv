import { useState, useEffect, useCallback } from 'react';

interface Template {
  id: number;
  template_key: string;
  name: string;
  description: string | null;
  category: string;
  channel: string;
  email_subject: string | null;
  email_body: string | null;
  sms_body: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

interface TemplateVariables {
  [key: string]: string;
}

interface PreviewResult {
  email_subject: string | null;
  email_body: string | null;
  sms_body: string | null;
}

const API_BASE = 'http://localhost:3000/api';

const CATEGORY_LABELS: Record<string, string> = {
  booking: '📅 Booking',
  service: '🧹 Service',
  crm: '🤝 CRM',
  custom: '✨ Brugerdefineret'
};

const CHANNEL_LABELS: Record<string, string> = {
  email: '📧 Kun email',
  sms: '📱 Kun SMS',
  both: '📧📱 Begge'
};

const TemplatesTab = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [variables, setVariables] = useState<TemplateVariables>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewTab, setPreviewTab] = useState<'email' | 'sms'>('email');
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVariables = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/templates/variables`);
      if (!response.ok) throw new Error('Failed to fetch variables');
      const data = await response.json();
      setVariables(data.variables);
    } catch (err) {
      console.error('Error fetching variables:', err);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchVariables();
  }, [fetchTemplates, fetchVariables]);

  const handlePreview = async (template: Template) => {
    try {
      const response = await fetch(`${API_BASE}/templates/${template.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: {} })
      });
      if (!response.ok) throw new Error('Failed to preview');
      const data = await response.json();
      setPreview(data);
    } catch (err) {
      alert('Kunne ikke generere preview');
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          description: editingTemplate.description,
          email_subject: editingTemplate.email_subject,
          email_body: editingTemplate.email_body,
          sms_body: editingTemplate.sms_body,
          active: editingTemplate.active
        })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      await fetchTemplates();
      setEditingTemplate(null);
      setPreview(null);
    } catch (err) {
      alert('Kunne ikke gemme skabelon');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate({ ...template });
    setPreview(null);
    handlePreview(template);
  };

  const handleToggleActive = async (template: Template) => {
    try {
      await fetch(`${API_BASE}/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: template.active ? 0 : 1 })
      });
      fetchTemplates();
    } catch (err) {
      alert('Kunne ikke opdatere status');
    }
  };

  const insertVariable = (varName: string) => {
    // This is a simplified version - in a real implementation you'd insert at cursor position
    const variable = `{{${varName}}}`;
    navigator.clipboard.writeText(variable);
    alert(`Kopieret: ${variable}\n\nIndsæt det i din skabelon.`);
  };

  const categories = ['all', ...new Set(templates.map(t => t.category))];
  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  if (loading) return <div className="loading">Indlæser skabeloner...</div>;
  if (error) return <div className="error">Fejl: {error}</div>;

  return (
    <div className="templates-tab">
      <div className="templates-header">
        <div className="templates-intro">
          <h3>📝 Besked-skabeloner</h3>
          <p>Rediger alle beskeder der sendes til gæster via email og SMS.</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="templates-categories">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'all' ? '📋 Alle' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Templates list */}
      <div className="templates-list">
        {filteredTemplates.map(template => (
          <div 
            key={template.id} 
            className={`template-card ${template.active ? '' : 'inactive'}`}
          >
            <div className="template-header">
              <div className="template-info">
                <h4>{template.name}</h4>
                <p className="template-description">{template.description}</p>
                <div className="template-meta">
                  <span className="template-key">{template.template_key}</span>
                  <span className="template-channel">{CHANNEL_LABELS[template.channel]}</span>
                </div>
              </div>
              <div className="template-status">
                <span className={`status-badge ${template.active ? 'active' : 'inactive'}`}>
                  {template.active ? '✅ Aktiv' : '⏸️ Inaktiv'}
                </span>
              </div>
            </div>
            
            <div className="template-preview-snippet">
              {template.sms_body && (
                <div className="snippet sms">
                  <strong>SMS:</strong> {template.sms_body.substring(0, 80)}...
                </div>
              )}
            </div>

            <div className="template-actions">
              <button 
                type="button" 
                className="btn-small"
                onClick={() => handleToggleActive(template)}
              >
                {template.active ? 'Deaktiver' : 'Aktiver'}
              </button>
              <button 
                type="button" 
                className="btn-small btn-primary"
                onClick={() => handleEdit(template)}
              >
                ✏️ Rediger
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="modal-overlay" onClick={() => { setEditingTemplate(null); setPreview(null); }}>
          <div className="modal-content template-modal" onClick={e => e.stopPropagation()}>
            <div className="template-editor">
              <div className="editor-main">
                <h3>Rediger: {editingTemplate.name}</h3>
                <p className="editor-description">{editingTemplate.description}</p>

                {/* Email Section */}
                {(editingTemplate.channel === 'email' || editingTemplate.channel === 'both') && (
                  <div className="editor-section">
                    <h4>📧 Email</h4>
                    
                    <div className="form-group">
                      <label htmlFor="email-subject">Emne</label>
                      <input
                        id="email-subject"
                        type="text"
                        value={editingTemplate.email_subject || ''}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          email_subject: e.target.value
                        })}
                        placeholder="Email emne..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email-body">Indhold (HTML)</label>
                      <textarea
                        id="email-body"
                        value={editingTemplate.email_body || ''}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          email_body: e.target.value
                        })}
                        rows={12}
                        placeholder="Email indhold..."
                      />
                    </div>
                  </div>
                )}

                {/* SMS Section */}
                {(editingTemplate.channel === 'sms' || editingTemplate.channel === 'both') && (
                  <div className="editor-section">
                    <h4>📱 SMS</h4>
                    
                    <div className="form-group">
                      <label htmlFor="sms-body">
                        Besked 
                        <span className="char-count">
                          ({(editingTemplate.sms_body || '').length}/160 tegn)
                        </span>
                      </label>
                      <textarea
                        id="sms-body"
                        value={editingTemplate.sms_body || ''}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          sms_body: e.target.value
                        })}
                        rows={4}
                        placeholder="SMS besked..."
                        maxLength={320}
                      />
                      {(editingTemplate.sms_body || '').length > 160 && (
                        <p className="sms-warning">⚠️ Over 160 tegn = 2 SMS-beskeder</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => { setEditingTemplate(null); setPreview(null); }}
                  >
                    Annuller
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => handlePreview(editingTemplate)}
                  >
                    🔄 Opdater preview
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Gemmer...' : 'Gem ændringer'}
                  </button>
                </div>
              </div>

              {/* Sidebar with variables and preview */}
              <div className="editor-sidebar">
                {/* Variables */}
                <div className="variables-section">
                  <h4>📌 Variabler</h4>
                  <p className="variables-hint">Klik for at kopiere</p>
                  <div className="variables-list">
                    {Object.entries(variables).map(([key, description]) => (
                      <button
                        key={key}
                        type="button"
                        className="variable-btn"
                        onClick={() => insertVariable(key)}
                        title={description}
                      >
                        {`{{${key}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {preview && (
                  <div className="preview-section">
                    <h4>👁️ Preview</h4>
                    <div className="preview-tabs">
                      {editingTemplate.channel !== 'sms' && (
                        <button
                          type="button"
                          className={previewTab === 'email' ? 'active' : ''}
                          onClick={() => setPreviewTab('email')}
                        >
                          Email
                        </button>
                      )}
                      {editingTemplate.channel !== 'email' && (
                        <button
                          type="button"
                          className={previewTab === 'sms' ? 'active' : ''}
                          onClick={() => setPreviewTab('sms')}
                        >
                          SMS
                        </button>
                      )}
                    </div>
                    <div className="preview-content">
                      {previewTab === 'email' && preview.email_body && (
                        <div className="email-preview">
                          <div className="email-subject-preview">
                            <strong>Emne:</strong> {preview.email_subject}
                          </div>
                          <div 
                            className="email-body-preview"
                            dangerouslySetInnerHTML={{ __html: preview.email_body }}
                          />
                        </div>
                      )}
                      {previewTab === 'sms' && preview.sms_body && (
                        <div className="sms-preview">
                          <div className="sms-bubble">
                            {preview.sms_body}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;

