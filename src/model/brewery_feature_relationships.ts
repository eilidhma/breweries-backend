import pool from '../db'; // Assuming you have a database pool configured

/**
 * Creates relationships between a brewery and multiple features
 * @param breweryId The ID of the brewery
 * @param featureNames Array of feature names to link to the brewery
 * @returns Array of created relationship IDs
 */

export async function createBreweryFeatureRelationships(
  breweryId: number,
  featureNames: string[]
): Promise<number[]> {
  if (!featureNames || featureNames.length === 0) {
    return [];
  }

  const client = await pool.connect();
  const relationshipIds: number[] = [];

  try {
    await client.query('BEGIN');

    for (const featureName of featureNames) {
      // Get or create the feature
      const featureQuery = `
        WITH feature_lookup AS (
          SELECT feature_id FROM brewery_features WHERE feature_name = $1
        ), feature_insert AS (
          INSERT INTO brewery_features (feature_name)
          SELECT $1
          WHERE NOT EXISTS (SELECT 1 FROM feature_lookup)
          RETURNING feature_id
        )
        SELECT feature_id FROM feature_lookup
        UNION ALL
        SELECT feature_id FROM feature_insert
      `;
      
      const featureResult = await client.query(featureQuery, [featureName]);
      const featureId = featureResult.rows[0]?.feature_id;
      
      if (featureId) {
        // Create relationship between brewery and feature
        const relationshipQuery = `
          INSERT INTO brewery_feature_relationships(brewery_id, feature_id)
          VALUES($1, $2)
          ON CONFLICT (brewery_id, feature_id) DO NOTHING
          RETURNING id
        `;
        
        const relationshipResult = await client.query(relationshipQuery, [breweryId, featureId]);
        if (relationshipResult.rows[0]) {
          relationshipIds.push(relationshipResult.rows[0].id);
        }
      }
    }

    await client.query('COMMIT');
    return relationshipIds;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating brewery feature relationships:', error);
    throw new Error('Failed to create brewery feature relationships');
  } finally {
    client.release();
  }
}

/**
 * Batch creates feature relationships for multiple breweries
 * @param breweryFeatures Array of brewery IDs and their associated feature names
 * @returns Number of relationships created
 */
export async function batchCreateBreweryFeatureRelationships(
  breweryFeatures: Array<{ breweryId: number, featureNames: string[] }>
): Promise<number> {
  if (!breweryFeatures || breweryFeatures.length === 0) {
    return 0;
  }

  const client = await pool.connect();
  let relationshipsCreated = 0;

  try {
    await client.query('BEGIN');

    // First get or create all features and collect their IDs
    const featureIdMap = new Map<string, number>();
    const uniqueFeatureNames = [...new Set(
      breweryFeatures.flatMap(bf => bf.featureNames)
    )];

    for (const featureName of uniqueFeatureNames) {
      const featureQuery = `
        WITH feature_lookup AS (
          SELECT feature_id FROM brewery_features WHERE feature_name = $1
        ), feature_insert AS (
          INSERT INTO brewery_features (feature_name)
          SELECT $1
          WHERE NOT EXISTS (SELECT 1 FROM feature_lookup)
          RETURNING feature_id
        )
        SELECT feature_id FROM feature_lookup
        UNION ALL
        SELECT feature_id FROM feature_insert
      `;
      
      const featureResult = await client.query(featureQuery, [featureName]);
      featureIdMap.set(featureName, featureResult.rows[0]?.feature_id);
    }

    // Now create all relationships in one batch operation
    const relationshipValues: any[] = [];
    const relationshipParams: any[] = [];
    let paramIndex = 1;

    for (const { breweryId, featureNames } of breweryFeatures) {
      for (const featureName of featureNames) {
        const featureId = featureIdMap.get(featureName);
        if (featureId) {
          relationshipValues.push(`($${paramIndex}, $${paramIndex + 1})`);
          relationshipParams.push(breweryId, featureId);
          paramIndex += 2;
        }
      }
    }

    if (relationshipValues.length > 0) {
      const batchQuery = `
        INSERT INTO brewery_feature_relationships(brewery_id, feature_id)
        VALUES ${relationshipValues.join(', ')}
        ON CONFLICT (brewery_id, feature_id) DO NOTHING
      `;
      
      const result = await client.query(batchQuery, relationshipParams);
      relationshipsCreated = result.rowCount || 0;
    }

    await client.query('COMMIT');
    return relationshipsCreated;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error batch creating brewery feature relationships:', error);
    throw new Error('Failed to batch create brewery feature relationships');
  } finally {
    client.release();
  }
}

/**
 * Gets all features for a specific brewery
 * @param breweryId The ID of the brewery
 * @returns Array of feature names
 */
export async function getBreweryFeatures(breweryId: number): Promise<string[]> {
  const query = `
    SELECT bf.feature_name
    FROM brewery_features bf
    JOIN brewery_feature_relationships bfr ON bf.feature_id = bfr.feature_id
    WHERE bfr.brewery_id = $1
  `;
  
  const result = await pool.query(query, [breweryId]);
  return result.rows.map(row => row.feature_name);
}