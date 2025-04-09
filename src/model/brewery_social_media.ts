import pool from '../db';

function determinePlatformId(url: string): number | null {
  const social_media_url = url.toLowerCase();
  
  if (social_media_url.includes('twitter.com') || social_media_url.includes('x.com')) {
    return 1;
  } else if (social_media_url.includes('facebook.com')) {
    return 2; 
  } else if (social_media_url.includes('instagram.com')) {
    return 3; 
  } else if (social_media_url.includes('untappd.com')) {
    return 4;
  }
  
  return null;
}

export async function createBrewerySocialMedia(
  brewery_id: number,
  social_media_urls: string[]
): Promise<number[]> {
  if (!social_media_urls || social_media_urls.length === 0) {
    return [];
  }

  const client = await pool.connect();
  const social_media_ids: number[] = [];

  try {
    await client.query('BEGIN');

    for (const url of social_media_urls) {
      const platform_id = determinePlatformId(url);
      
      if (platform_id) {
        const query = `
          INSERT INTO brewery_social_media(brewery_id, platform_id, url)
          VALUES($1, $2, $3)
          RETURNING social_media_id
        `;
        
        const result = await client.query(query, [brewery_id, platform_id, url]);
        social_media_ids.push(result.rows[0].social_media_id);
      }
    }

    await client.query('COMMIT');
    return social_media_ids;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating brewery social media:', error);
    throw new Error('Failed to create brewery social media');
  } finally {
    client.release();
  }
}

export async function batchCreateBrewerySocialMedia(
  brewery_social_media: Array<{ brewery_id: number, social_media_urls: string[] }>
): Promise<number> {
  if (!brewery_social_media || brewery_social_media.length === 0) {
    return 0;
  }

  const client = await pool.connect();
  let social_media_created = 0;

  try {
    await client.query('BEGIN');

    const values: any[] = [];
    const params: any[] = [];
    let param_index = 1;

    for (const { brewery_id: breweryId, social_media_urls: socialMediaUrls } of brewery_social_media) {
      for (const url of socialMediaUrls) {
        const platform_id = determinePlatformId(url);
        
        if (platform_id) {
          values.push(`($${param_index}, $${param_index + 1}, $${param_index + 2})`);
          params.push(breweryId, platform_id, url);
          param_index += 3;
        }
      }
    }

    if (values.length > 0) {
      const batchQuery = `
        INSERT INTO brewery_social_media(brewery_id, platform_id, url)
        VALUES ${values.join(', ')}
        RETURNING social_media_id
      `;
      
      const result = await client.query(batchQuery, params);
      social_media_created = result.rowCount || 0;
    }

    await client.query('COMMIT');
    return social_media_created;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error batch creating brewery social media:', error);
    throw new Error('Failed to batch create brewery social media');
  } finally {
    client.release();
  }
}

export async function getBrewerySocialMedia(brewery_id: number): Promise<any[]> {
  const query = `
    SELECT bsm.social_media_id, bsm.url, smp.platform_id, smp.platform_name
    FROM brewery_social_media bsm
    JOIN social_media_platforms smp ON bsm.platform_id = smp.platform_id
    WHERE bsm.brewery_id = $1
  `;
  
  const result = await pool.query(query, [brewery_id]);
  return result.rows;
}

export async function addSocialMediaToExistingBreweries(
  brewery_data_array: Array<{ 
    id: number,          // Existing brewery ID
    social_media: string[] // Array of social media URLs
  }>
): Promise<number> {
  if (!brewery_data_array || brewery_data_array.length === 0) {
    return 0;
  }

  const social_media_relationships = brewery_data_array
    .filter(brewery => brewery.social_media && brewery.social_media.length > 0)
    .map(brewery => ({
      brewery_id: brewery.id,
      social_media_urls: brewery.social_media
    }));

  if (social_media_relationships.length === 0) {
    return 0;
  }

  return await batchCreateBrewerySocialMedia(social_media_relationships);
}