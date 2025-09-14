/**
 * Resilient call utility combining circuit breakers and retries
 * Provides robust error handling for external service calls
 */

import { CircuitBreaker, CircuitBreakerManager } from './circuitBreaker.js';
import { withRetry, withRetryAdvanced, RetryOptions } from './retry.js';
import pino from 'pino';

const logger = pino({ name: 'resilient-call' });

export interface ResilientCallOptions {
  circuitBreaker?: CircuitBreaker;
  retryOptions?: RetryOptions;
  serviceName?: string;
  enableCircuitBreaker?: boolean;
  enableRetries?: boolean;
}

/**
 * Execute a function with circuit breaker and retry protection
 */
export async function withResilientCall<T>(
  fn: () => Promise<T>,
  options: ResilientCallOptions = {}
): Promise<T> {
  const {
    circuitBreaker,
    retryOptions = {},
    serviceName = 'unknown',
    enableCircuitBreaker = true,
    enableRetries = true
  } = options;

  const breaker = circuitBreaker || CircuitBreakerManager.prototype.getBreaker(serviceName);
  
  // Wrap the function with retries if enabled
  const wrappedFn = enableRetries 
    ? () => withRetryAdvanced(fn, retryOptions)
    : fn;

  try {
    // Execute with circuit breaker protection
    const result = enableCircuitBreaker
      ? await breaker.execute(wrappedFn)
      : await wrappedFn();

    logger.debug(`Resilient call succeeded for ${serviceName}`);
    return result;
  } catch (error) {
    logger.error(`Resilient call failed for ${serviceName}:`, error);
    throw error;
  }
}

/**
 * Pre-configured resilient calls for common services
 */
export class ResilientServiceCalls {
  private static circuitBreakerManager = new CircuitBreakerManager();

  static async callVeo<T>(fn: () => Promise<T>): Promise<T> {
    return withResilientCall(fn, {
      circuitBreaker: this.circuitBreakerManager.getBreaker('veo', {
        timeout: 25000,
        errorThresholdPercentage: 50,
        volumeThreshold: 10,
        resetTimeout: 30000
      }),
      retryOptions: {
        maxTries: 5,
        initialDelay: 250,
        maxDelay: 2000,
        retriableStatusCodes: [429, 500, 502, 503, 504]
      },
      serviceName: 'veo'
    });
  }

  static async callGemini<T>(fn: () => Promise<T>): Promise<T> {
    return withResilientCall(fn, {
      circuitBreaker: this.circuitBreakerManager.getBreaker('gemini', {
        timeout: 25000,
        errorThresholdPercentage: 50,
        volumeThreshold: 10,
        resetTimeout: 30000
      }),
      retryOptions: {
        maxTries: 5,
        initialDelay: 250,
        maxDelay: 2000,
        retriableStatusCodes: [429, 500, 502, 503, 504]
      },
      serviceName: 'gemini'
    });
  }

  static async callOpenAI<T>(fn: () => Promise<T>): Promise<T> {
    return withResilientCall(fn, {
      circuitBreaker: this.circuitBreakerManager.getBreaker('openai', {
        timeout: 25000,
        errorThresholdPercentage: 50,
        volumeThreshold: 10,
        resetTimeout: 30000
      }),
      retryOptions: {
        maxTries: 5,
        initialDelay: 250,
        maxDelay: 2000,
        retriableStatusCodes: [429, 500, 502, 503, 504]
      },
      serviceName: 'openai'
    });
  }

  static async callSupabase<T>(fn: () => Promise<T>): Promise<T> {
    return withResilientCall(fn, {
      circuitBreaker: this.circuitBreakerManager.getBreaker('supabase', {
        timeout: 15000,
        errorThresholdPercentage: 50,
        volumeThreshold: 10,
        resetTimeout: 30000
      }),
      retryOptions: {
        maxTries: 3,
        initialDelay: 250,
        maxDelay: 1000,
        retriableStatusCodes: [429, 500, 502, 503, 504]
      },
      serviceName: 'supabase'
    });
  }

  static getAllCircuitBreakerStats() {
    return this.circuitBreakerManager.getAllStats();
  }

  static resetAllCircuitBreakers() {
    this.circuitBreakerManager.resetAll();
  }
}

