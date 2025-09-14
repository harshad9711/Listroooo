/**
 * Retry utility with exponential backoff
 * Handles transient errors (429, 5xx) with exponential backoff
 */

type Fn<T> = () => Promise<T>;

export async function withRetry<T>(fn: Fn<T>, tries = 5): Promise<T> {
  let delay = 250;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const retriable = [429, 500, 502, 503, 504].some(c => 
        String(e?.status || "").includes(String(c))
      );
      
      if (!retriable || i === tries - 1) {
        throw e;
      }
      
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 2000);
    }
  }
  throw new Error("unreachable");
}

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxTries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retriableStatusCodes?: number[];
}

/**
 * Advanced retry with configurable options
 */
export async function withRetryAdvanced<T>(
  fn: Fn<T>, 
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxTries = 5,
    initialDelay = 250,
    maxDelay = 2000,
    backoffMultiplier = 2,
    retriableStatusCodes = [429, 500, 502, 503, 504]
  } = options;

  let delay = initialDelay;
  
  for (let i = 0; i < maxTries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const retriable = retriableStatusCodes.some(c => 
        String(e?.status || "").includes(String(c))
      );
      
      if (!retriable || i === maxTries - 1) {
        throw e;
      }
      
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }
  throw new Error("unreachable");
}

