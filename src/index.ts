import express from 'express';
import dotenv from 'dotenv';
import breweriesRouter from './routes/breweries';
import breweryFeaturesRouter from './routes/brewery_features';
import socialMediaPlatformsRouter from './routes/social_media_platforms'
import brewerySocialMediaRouter from './routes/brewery_social_media'

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json({ limit: '10mb' }));

app.use('/api/breweries', breweriesRouter);
app.use('/api/brewery_features', breweryFeaturesRouter)
app.use('/api/social_media_platforms', socialMediaPlatformsRouter)
app.use('/api/brewery_social_media', brewerySocialMediaRouter)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
