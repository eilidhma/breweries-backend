import pool from '../db';
import { batchCreateBreweryFeatureRelationships } from './brewery_feature_relationships';

// Define the shape of a brewery
export interface Brewery {
  id: number;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  province: string;
  phone: string;
  website_url: string;
  country: string;
  menu_url: string
  social_media?: string[]
  brewery_type?: string[]
}

// Get all breweries
export const getAllBreweries = async (): Promise<Brewery[]> => {
  const result = await pool.query(`
      SELECT
      breweries.*,
      COALESCE(features.feature_array, '{}') AS features,
      COALESCE(social_media.platform_links, '{}'::jsonb) AS social_media
    FROM breweries
    LEFT JOIN (
      SELECT 
        brewery_id,
        ARRAY_AGG(DISTINCT brewery_features.feature_name ORDER BY brewery_features.feature_name) AS feature_array
      FROM brewery_feature_relationships
      JOIN brewery_features ON brewery_feature_relationships.feature_id = brewery_features.feature_id
      GROUP BY brewery_id
    ) features ON breweries.id = features.brewery_id
    LEFT JOIN (
      SELECT
        brewery_id,
        jsonb_object_agg(social_media_platforms.platform_name, brewery_social_media.url) AS platform_links
      FROM brewery_social_media
      JOIN social_media_platforms ON brewery_social_media.platform_id = social_media_platforms.platform_id
      GROUP BY brewery_id
    ) social_media ON breweries.id = social_media.brewery_id;
  `);

  return result.rows;
};

// Get a single brewery by ID
export const getBreweryById = async (id: number): Promise<Brewery | null> => {
  const result = await pool.query(`
    SELECT * FROM breweries WHERE id = $1
  `,
  [id]);
  return result.rows[0] || null;
};

// Create a new brewery
export const createBrewery = async (brewery: Omit<Brewery, 'id' | 'created_at' | 'updated_at'>): Promise<Brewery> => {
  const {
    name,
    address,
    city,
    province,
    postal_code,
    phone,
    website_url,
    country,
    menu_url
  } = brewery;

  console.log(brewery, "BREWERY ~~~~~~~~~~~~")

  const result = await pool.query(
    `
    INSERT INTO breweries
    (name, address, city, province, postal_code, phone, website_url, country, menu_url)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
    `,
    [name, address, city, province, postal_code, phone, website_url, country, menu_url]
  );

  return result.rows[0];
};

export const addBreweriesByBulk = async(breweries: Brewery[]) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    const createdBreweries: Brewery[] = [];
    const featureRelationships: Array<{ breweryId: number, featureNames: string[] }> = [];
    
    for (const breweryData of breweries) {
      // Destructure to separate brewery_type and other fields
      const { 
        social_media, 
        brewery_type = [], 
        ...validBreweryData 
      } = breweryData;
      
      // Insert brewery into database
      const breweryQuery = `
        INSERT INTO breweries(
          name, city, address, postal_code, 
          province, phone, website_url, country, menu_url
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const breweryValues = [
        validBreweryData.name,
        validBreweryData.city,
        validBreweryData.address,
        validBreweryData.postal_code,
        validBreweryData.province,
        validBreweryData.phone,
        validBreweryData.website_url,
        validBreweryData.country,
        validBreweryData.menu_url
      ];
      
      const breweryResult = await client.query(breweryQuery, breweryValues);
      const newBrewery = breweryResult.rows[0];
      createdBreweries.push(newBrewery);

      if (brewery_type && brewery_type.length > 0) {
        featureRelationships.push({
          breweryId: newBrewery.id,
          featureNames: brewery_type
        });
      }
    }
    
    await batchCreateBreweryFeatureRelationships(featureRelationships);

    await client.query('COMMIT');
    return createdBreweries;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating breweries in bulk:', error);
    throw new Error('Failed to create breweries in bulk');
  } finally {
    client.release();
  }
}

// Delete a brewery
export const deleteBrewery = async (id: number): Promise<void> => {
  await pool.query('DELETE FROM breweries WHERE id = $1', [id]);
};

// Update a brewery
export const updateBrewery = async (id: number, updates: Partial<Brewery>): Promise<Brewery | null> => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  if (fields.length === 0) return getBreweryById(id);

  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const result = await pool.query(
    `UPDATE breweries SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );

  return result.rows[0] || null;
};
