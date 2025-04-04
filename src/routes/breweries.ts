import express from 'express';
import {
  getAllBreweries,
  getBreweryById,
  createBrewery,
  deleteBrewery,
  updateBrewery,
  Brewery,
} from '../model/breweries';

import { Request, Response } from 'express';

const router = express.Router();

// GET /api/breweries
router.get('/', async (_req: Request, res: Response) => {
  try {
    const breweries = await getAllBreweries();
    res.json(breweries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch breweries' });
  }
});


// POST /api/breweries
router.post('/', async (req: Request, res: Response) => {
  const breweryData: Omit<Brewery, 'id' | 'created_at' | 'updated_at'> = req.body;
  try {
    const newBrewery = await createBrewery(breweryData);
    res.status(201).json(newBrewery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create brewery' });
  }
});

// DELETE /api/breweries/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await deleteBrewery(id);
    res.status(204).send(); // No Content
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete brewery' });
  }
});

export default router;
