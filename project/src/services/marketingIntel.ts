export async function fetchMarketingMetrics(dateRange: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketing-metrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dateRange })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch marketing metrics');
    }

    return await response.json();
  } catch (error) {
    console.error('Marketing metrics error:', error);
    throw error;
  }
}

export async function analyzeCompetitors(platform: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-competitors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ platform })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze competitors');
    }

    return await response.json();
  } catch (error) {
    console.error('Competitor analysis error:', error);
    throw error;
  }
}

export async function predictCustomerSegments() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-segments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to predict customer segments');
    }

    return await response.json();
  } catch (error) {
    console.error('Customer segmentation error:', error);
    throw error;
  }
}