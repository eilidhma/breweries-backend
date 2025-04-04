import pool from "../db";

export interface SocialMediaPlatform {
  platform_name: string
}

// Create a new Social Media Platform
export const createSocialMediaPlatform = async (platform: SocialMediaPlatform): Promise<SocialMediaPlatform> => {

  const platform_name = platform.platform_name

  const result = await pool.query(
    `
    INSERT INTO social_media_platforms
    (platform_name)
    VALUES ($1)
    RETURNING *;
    `,
    [platform_name]
  );

  return result.rows[0];
};
