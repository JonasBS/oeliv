import { useEffect, useMemo, useState } from 'react';
import { feedbackApi } from '../services/api';
import type { FeedbackFormData } from '../types';
import './FeedbackForm.css';

interface FeedbackFormProps {
  token: string;
}

const HIGHLIGHT_OPTIONS = [
  { key: 'room', label: 'Værelset', icon: '🛏️' },
  { key: 'breakfast', label: 'Morgenmad', icon: '🥐' },
  { key: 'spa', label: 'Spa & velvære', icon: '🧖' },
  { key: 'staff', label: 'Personalet', icon: '👥' },
  { key: 'nature', label: 'Omgivelser', icon: '🌿' },
  { key: 'other', label: 'Andet', icon: '✨' },
];

const FeedbackForm = ({ token }: FeedbackFormProps) => {
  const [formData, setFormData] = useState<FeedbackFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [positiveNote, setPositiveNote] = useState('');
  const [improvementNote, setImprovementNote] = useState('');
  const [highlightTags, setHighlightTags] = useState<string[]>([]);
  const [contactOk, setContactOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await feedbackApi.getForm(token);
        setFormData(data);
        if (data.status === 'completed') {
          setSubmitted(true);
        }
      } catch (err) {
        setError('Linket er udløbet eller ugyldigt.');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      loadForm();
    }
  }, [token]);

  const stayInfo = useMemo(() => {
    if (!formData) return null;
    const formatter = new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long' });
    const checkIn = formatter.format(new Date(formData.check_in));
    const checkOut = formatter.format(new Date(formData.check_out));
    return `${checkIn} – ${checkOut}`;
  }, [formData]);

  const toggleTag = (key: string) => {
    setHighlightTags((prev) =>
      prev.includes(key) ? prev.filter((tag) => tag !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating === 0) {
      setError('Vælg venligst en vurdering.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await feedbackApi.submit(token, {
        rating,
        positive_note: positiveNote,
        improvement_note: improvementNote,
        highlight_tags: highlightTags,
        contact_ok: contactOk,
      });
      setSubmitted(true);
    } catch (err) {
      setError('Kunne ikke sende din feedback. Prøv igen om lidt.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="feedback-shell">
        <div className="feedback-card center">Indlæser din oplevelse...</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="feedback-shell">
        <div className="feedback-card center error">{error || 'Linket er ikke længere aktivt.'}</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="feedback-shell">
        <div className="feedback-card center success">
          <h2>Tak for din feedback</h2>
          <p>Vi sætter stor pris på, at du delte din oplevelse med os.</p>
          <p>Team ØLIV 🌿</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-shell">
      <form className="feedback-card" onSubmit={handleSubmit}>
        <header>
          <p className="eyebrow">ØLIV feedback</p>
          <h1>Hvordan var dit ophold, {formData.guest_name}?</h1>
          <p>
            {stayInfo} · {formData.nights} {formData.nights === 1 ? 'nat' : 'nætter'}
            {formData.room_name ? ` · ${formData.room_name}` : ''}
          </p>
        </header>

        <section>
          <label>Din vurdering</label>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`rating-star ${value <= rating ? 'active' : ''}`}
                onClick={() => setRating(value)}
              >
                ★
              </button>
            ))}
          </div>
        </section>

        <section>
          <label>Hvad var det bedste?</label>
          <textarea
            value={positiveNote}
            onChange={(event) => setPositiveNote(event.target.value)}
            placeholder="Fortæl kort hvad du nød mest..."
          />
        </section>

        <section>
          <label>Er der noget vi kan forbedre?</label>
          <textarea
            value={improvementNote}
            onChange={(event) => setImprovementNote(event.target.value)}
            placeholder="Del meget gerne forslag eller ønsker"
          />
        </section>

        <section>
          <label>Vælg det der beskriver opholdet bedst</label>
          <div className="tag-grid">
            {HIGHLIGHT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`tag-chip ${highlightTags.includes(option.key) ? 'selected' : ''}`}
                onClick={() => toggleTag(option.key)}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="inline-row">
          <label>
            <input
              type="checkbox"
              checked={contactOk}
              onChange={(event) => setContactOk(event.target.checked)}
            />
            Kontakt mig gerne, hvis I vil følge op på min feedback
          </label>
        </section>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary primary" disabled={submitting}>
          {submitting ? 'Sender...' : 'Send feedback'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;









