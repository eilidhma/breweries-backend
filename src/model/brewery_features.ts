import pool from '../db';

export const addFeaturesToBrewery = async(features: string[]): Promise<void> => {
  const client = await pool.connect();
  console.log(features, 'features in model!');
  try {
    const values = features.map((feature, index) => `($${index + 1})`).join(', ');
    const query = `INSERT INTO brewery_features (feature_name) VALUES ${values}`;
    
    await client.query(query, features);
    console.log('Features added successfully');
  } catch (error) {
    console.error('Error adding features:', error);
  } finally {
    client.release();
  }
}