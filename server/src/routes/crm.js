import express from 'express';
import {
  listGuests,
  getGuestDetail,
  addGuestTag,
  removeGuestTag,
  addInteraction,
  updateInteraction,
  listCampaigns,
  createCampaign,
  updateCampaign,
  runCampaign,
  runAutomations,
} from '../services/crmService.js';
import { getFeedbackStats, getRecentFeedback } from '../services/feedbackService.js';

const router = express.Router();

router.get('/guests', async (req, res, next) => {
  try {
    const guests = await listGuests({
      search: req.query.search || '',
      tag: req.query.tag || null,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      upcoming: req.query.upcoming === '1',
    });
    res.json(guests);
  } catch (error) {
    next(error);
  }
});

router.get('/guests/:id', async (req, res, next) => {
  try {
    const guest = await getGuestDetail(req.params.id);
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json(guest);
  } catch (error) {
    next(error);
  }
});

router.post('/guests/:id/tags', async (req, res, next) => {
  try {
    await addGuestTag(req.params.id, req.body.tag);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/guests/:id/tags/:tag', async (req, res, next) => {
  try {
    await removeGuestTag(req.params.id, req.params.tag);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/guests/:id/interactions', async (req, res, next) => {
  try {
    const interaction = await addInteraction(req.params.id, req.body);
    res.json(interaction);
  } catch (error) {
    next(error);
  }
});

router.patch('/interactions/:id', async (req, res, next) => {
  try {
    await updateInteraction(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/campaigns', async (req, res, next) => {
  try {
    const campaigns = await listCampaigns();
    res.json(campaigns);
  } catch (error) {
    next(error);
  }
});

router.post('/campaigns', async (req, res, next) => {
  try {
    const campaign = await createCampaign(req.body);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

router.patch('/campaigns/:id', async (req, res, next) => {
  try {
    const campaign = await updateCampaign(req.params.id, req.body);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

router.post('/campaigns/:id/run', async (req, res, next) => {
  try {
    const result = await runCampaign(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/automation/run', async (req, res, next) => {
  try {
    await runAutomations();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/feedback/summary', async (req, res, next) => {
  try {
    const summary = await getFeedbackStats();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

router.get('/feedback/recent', async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 8;
    const items = await getRecentFeedback(limit);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

export default router;


