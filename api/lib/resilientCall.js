// Simple resilient call implementation for JavaScript compatibility

export class ResilientServiceCalls {
  static async callVeo(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('Veo API call failed:', error.message);
      throw error;
    }
  }

  static async callGemini(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('Gemini API call failed:', error.message);
      throw error;
    }
  }

  static async callOpenAI(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('OpenAI API call failed:', error.message);
      throw error;
    }
  }

  static async callSupabase(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('Supabase call failed:', error.message);
      throw error;
    }
  }
}
