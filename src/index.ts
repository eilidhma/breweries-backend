import express from 'express';
import dotenv from 'dotenv';
// import breweriesRouter from './routes/breweries';
import breweriesRouter from './routes/breweries';
import breweryFeaturesRouter from './routes/brewery_features';

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());
// app.use('/api/breweries', breweriesRouter);

app.use('/api/breweries', breweriesRouter);
app.use('/api/brewery_features', breweryFeaturesRouter)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
