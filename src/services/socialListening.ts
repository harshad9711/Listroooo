// TODO: use Instagram Graph API to fetch recent posts for #hashtag
// Docs: https://developers.facebook.com/docs/instagram-api/reference/hashtag-search
// You need a valid Instagram Graph API access token with required permissions.
// Store your access token in an environment variable (never commit to git!)

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || '';
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID || '';

/**
 * Fetch recent Instagram posts for a hashtag using the Instagram Graph API.
 * @param hashtag The hashtag to search for (without #)
 * @returns Array of post objects or empty array
 */
export async function fetchSocialUGC(hashtag: string) {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    throw new Error('Missing Instagram API credentials. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID.');
  }

  // 1. Get hashtag ID
  const hashtagSearchUrl = `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${INSTAGRAM_USER_ID}&q=${encodeURIComponent(hashtag)}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
  const hashtagRes = await fetch(hashtagSearchUrl);
  const hashtagData = await hashtagRes.json();
  if (!hashtagData.data || !hashtagData.data[0]) {
    return [];
  }
  const hashtagId = hashtagData.data[0].id;

  // 2. Get recent media for hashtag
  // Docs: https://developers.facebook.com/docs/instagram-api/reference/hashtag/recent-media
  const mediaUrl = `https://graph.facebook.com/v19.0/${hashtagId}/recent_media?user_id=${INSTAGRAM_USER_ID}&fields=id,caption,media_type,media_url,permalink,timestamp,username&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
  const mediaRes = await fetch(mediaUrl);
  const mediaData = await mediaRes.json();
  if (!mediaData.data) {
    return [];
  }
  // TODO: handle paging if you want more than the first page
  return mediaData.data;
} 