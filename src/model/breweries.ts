import pool from '../db';

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
}

// Get all breweries
export const getAllBreweries = async (): Promise<Brewery[]> => {
  const result = await pool.query('SELECT * FROM breweries ORDER BY name ASC');
  return result.rows;
};

// Get a single brewery by ID
export const getBreweryById = async (id: number): Promise<Brewery | null> => {
  const result = await pool.query('SELECT * FROM breweries WHERE id = $1', [id]);
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
    country
  } = brewery;

  console.log(brewery, "BREWERY ~~~~~~~~~~~~")

  const result = await pool.query(
    `
    INSERT INTO breweries
    (name, address, city, province, postal_code, phone, website_url, country)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *;
    `,
    [name, address, city, province, postal_code, phone, website_url, country]
  );

  return result.rows[0];
};

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
