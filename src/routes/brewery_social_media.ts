import express from 'express';
import { Request, Response } from 'express';
import { addSocialMediaToExistingBreweries } from '../model/brewery_social_media';

const router = express.Router();

router.post('/add-social-media', async (req: Request, res: Response) => {
  try {
    // if (!Array.isArray(req.body)) {
    //   return res.status(400).json({ error: 'Request body must be an array of brewery data' });
    // }
    
    const count = await addSocialMediaToExistingBreweries(req.body);
    res.status(201).json({ message: `Added ${count} social media links` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add social media links' });
  }
});

export default router;