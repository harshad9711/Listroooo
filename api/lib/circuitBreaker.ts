/**
 * Circuit Breaker implementation
 * Protects against cascading failures by opening circuit when error threshold is reached
 */

import pino from 'pino';

const logger = pino({ name: 'circuit-breaker' });

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export interface CircuitBreakerOptions {
  timeout?: number; // 25s default
  errorThresholdPercentage?: number; // 50% default
  volumeThreshold?: number; // 10 requests default
  resetTimeout?: number; // 30s default
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private requestCount = 0;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      timeout: 25000,
      errorThresholdPercentage: 50,
      volumeThreshold: 10,
      resetTimeout: 30000,
      name: 'circuit-breaker',
      ...options
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.options.resetTimeout) {
        throw new Error(`Circuit breaker is OPEN for ${this.options.name}`);
      }
      this.state = CircuitState.HALF_OPEN;
      logger.info(`Circuit breaker ${this.options.name} transitioning to HALF_OPEN`);
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.options.timeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successes++;
    this.requestCount++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failures = 0;
      logger.info(`Circuit breaker ${this.options.name} transitioning to CLOSED`);
    }
  }

  private onFailure(): void {
    this.failures++;
    this.requestCount++;
    this.lastFailureTime = Date.now();

    const errorRate = (this.failures / this.requestCount) * 100;
    
    if (
      this.requestCount >= this.options.volumeThreshold &&
      errorRate >= this.options.errorThresholdPercentage
    ) {
      this.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker ${this.options.name} transitioning to OPEN (error rate: ${errorRate.toFixed(1)}%)`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requestCount: this.requestCount,
      errorRate: this.requestCount > 0 ? (this.failures / this.requestCount) * 100 : 0,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.requestCount = 0;
    this.lastFailureTime = 0;
    logger.info(`Circuit breaker ${this.options.name} reset`);
  }
}

/**
 * Circuit breaker manager for different services
 */
class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ ...options, name }));
    }
    return this.breakers.get(name)!;
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Global circuit breaker manager
export const circuitBreakerManager = new CircuitBreakerManager();

// Pre-configured circuit breakers for common services
export const veoCircuitBreaker = circuitBreakerManager.getBreaker('veo', {
  timeout: 25000,
  errorThresholdPercentage: 50,
  volumeThreshold: 10,
  resetTimeout: 30000
});

export const geminiCircuitBreaker = circuitBreakerManager.getBreaker('gemini', {
  timeout: 25000,
  errorThresholdPercentage: 50,
  volumeThreshold: 10,
  resetTimeout: 30000
});

export const openaiCircuitBreaker = circuitBreakerManager.getBreaker('openai', {
  timeout: 25000,
  errorThresholdPercentage: 50,
  volumeThreshold: 10,
  resetTimeout: 30000
});

