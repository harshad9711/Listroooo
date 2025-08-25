import OpenAI from "openai";

interface AdData {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  platform: string;
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
  };
}

interface RecreatedAd {
  originalAd: AdData;
  recreatedTitle: string;
  recreatedBody: string;
  recreatedImagePrompt?: string;
}

const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable browser usage
});

// Retry helper function with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 20000 // 20 seconds base delay for OpenAI's rate limits
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      if (error?.status === 429 && retries < maxRetries) {
        retries++;
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, retries - 1) + Math.random() * 5000;
        console.log(`Rate limit hit. Retrying in ${Math.round(delay / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

export async function fetchWinningAds(platform: string): Promise<AdData[]> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/ads/winning?platform=${platform}`);
    if (!response.ok) throw new Error('Failed to fetch winning ads');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching winning ads:', error);
    // Fallback to mock data if API fails
    const mockAds: AdData[] = [
      {
        id: '1',
        title: 'Experience Wireless Freedom',
        body: 'Introducing our new wireless earbuds with active noise cancellation. Get yours today!',
        imageUrl: 'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg',
        platform: 'Meta',
        performance: {
          impressions: 50000,
          clicks: 2500,
          ctr: 5.0,
          spend: 1000
        }
      },
      {
        id: '2',
        title: 'Your Music, Your Way',
        body: 'Premium sound quality meets comfort. Limited time offer - 20% off!',
        imageUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
        platform: 'TikTok',
        performance: {
          impressions: 75000,
          clicks: 4500,
          ctr: 6.0,
          spend: 1500
        }
      }
    ];

    return mockAds.filter(ad => 
      platform === 'all' || ad.platform.toLowerCase() === platform.toLowerCase()
    );
  }
}

export async function recreateAd(ad: AdData, brandTone: string): Promise<RecreatedAd> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please check your environment variables.');
  }

  const prompt = `
Rewrite this ad in a unique and engaging way while maintaining the core message.
Use a ${brandTone} tone of voice.

Original Title: ${ad.title}
Original Body: ${ad.body}

Provide a new title and body that captures attention and drives conversions.
Keep the title under 60 characters and the body under 200 characters.
`;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert ad copywriter specializing in social media ads." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
    });

    const content = response.choices[0].message.content?.trim() || '';
    const [recreatedTitle, ...bodyParts] = content.split('\n\n');

    return {
      originalAd: ad,
      recreatedTitle: recreatedTitle.replace('Title: ', ''),
      recreatedBody: bodyParts.join('\n\n').replace('Body: ', '')
    };
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your environment configuration.');
    }
    if (error.status === 429) {
      throw new Error('OpenAI API rate limit reached. Please try again in a few moments.');
    }
    throw new Error('Failed to generate ad content. Please try again later.');
  }
}

export async function generateCreatives(ads: AdData[], brandTone: string): Promise<RecreatedAd[]> {
  // Process ads sequentially with delay between requests
  const recreatedAds: RecreatedAd[] = [];
  
  for (const ad of ads) {
    try {
      // Add small delay between requests to help avoid rate limits
      if (recreatedAds.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const recreatedAd = await recreateAd(ad, brandTone);
      recreatedAds.push(recreatedAd);
    } catch (error) {
      console.error(`Failed to recreate ad ${ad.id}:`, error);
      // Continue processing other ads even if one fails
      continue;
    }
  }
  
  return recreatedAds;
}

export function exportResults(ads: RecreatedAd[]): string {
  const csvRows = [
    ['Original Title', 'Original Body', 'Recreated Title', 'Recreated Body', 'Platform', 'Impressions', 'Clicks', 'CTR', 'Spend']
  ];

  ads.forEach(ad => {
    csvRows.push([
      ad.originalAd.title,
      ad.originalAd.body,
      ad.recreatedTitle,
      ad.recreatedBody,
      ad.originalAd.platform,
      ad.originalAd.performance.impressions.toString(),
      ad.originalAd.performance.clicks.toString(),
      `${ad.originalAd.performance.ctr}%`,
      `$${ad.originalAd.performance.spend}`
    ]);
  });

  return csvRows.map(row => row.join(',')).join('\n');
}