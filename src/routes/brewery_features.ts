import express from 'express';
import {
  addFeaturesArray
} from '../model/brewery_features';

import { Request, Response } from 'express';
``
const router = express.Router();

// POST /api/brewery_features
router.post('/', async (req: Request, res: Response) => {
  const features = req.body;
  try {
    const features_added = await addFeaturesArray(features);
    console.log(features_added);
    res.status(201).json(features_added);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add features' });
  }
});

export default router;
