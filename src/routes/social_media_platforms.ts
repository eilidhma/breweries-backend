import express from 'express';
import { Request, Response } from 'express';
import { createSocialMediaPlatform, SocialMediaPlatform } from "../model/social_media_platforms";

const router = express.Router();

// POST /api/breweries
router.post('/', async (req: Request, res: Response) => {
  const platformData: SocialMediaPlatform = req.body;
  try {
    const newPlatform = await createSocialMediaPlatform(platformData);
    res.status(201).json(newPlatform);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create social media platform' });
  }
});


export default router;