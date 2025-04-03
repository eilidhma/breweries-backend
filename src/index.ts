import express from 'express';
import dotenv from 'dotenv';
// import breweriesRouter from './routes/breweries';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
// app.use('/api/breweries', breweriesRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
