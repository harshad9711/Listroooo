import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable browser usage
});

interface Veo3PromptOptions {
  tone?: string;
  style?: string;
  aspectRatio?: string;
  targetPlatform?: string;
}

/**
 * Generate an optimized Veo3 prompt from a user's idea
 * 
 * @param userIdea - Brief description of the desired video
 * @param opts - Optional settings for tone, style, etc.
 * @returns Promise<string> - The generated Veo3 prompt
 */
export async function generateVeo3Prompt(
  userIdea: string,
  opts: Veo3PromptOptions = {}
): Promise<string> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-veo3-prompt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userIdea,
        ...opts
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate prompt');
    }

    const data = await response.json();
    return data.prompt;
  } catch (error) {
    console.error('Prompt generation error:', error);
    throw new Error('Failed to generate Veo3 prompt. Please try again later.');
  }
}