import express from 'express';
import { getFeedbackFormData, submitFeedbackResponse } from '../services/feedbackService.js';

const router = express.Router();

router.get('/:token', async (req, res, next) => {
  try {
    const data = await getFeedbackFormData(req.params.token);
    if (!data) {
      return res.status(404).json({ error: 'invalid_token' });
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/:token', async (req, res, next) => {
  try {
    await submitFeedbackResponse(req.params.token, req.body || {});
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'invalid_token') {
      return res.status(404).json({ error: 'invalid_token' });
    }
    if (error.message === 'already_submitted') {
      return res.status(409).json({ error: 'already_submitted' });
    }
    next(error);
  }
});

export default router;









