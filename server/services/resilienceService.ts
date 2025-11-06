/**
 * Resilience Service
 * Elite-level error handling with circuit breakers, exponential backoff, and fallback strategies
 * 
 * Patterns implemented:
 * - Circuit Breaker (prevent cascading failures)
 * - Exponential Backoff with Jitter (avoid thundering herd)
 * - Retry with idempotency (safe retries)
 * - Fallback strategies (graceful degradation)
 * - Health checks and monitoring
 * 
 * Inspired by: Netflix Hystrix, AWS SDK, Google SRE practices
 */

export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Failing, reject requests
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time to wait before trying half-open (ms)
  monitoringPeriod: number; // Time window for failure counting (ms)
}

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // Initial delay in ms
  maxDelay: number; // Maximum delay in ms
  multiplier: number; // Backoff multiplier
  jitter: boolean; // Add randomness to prevent thundering herd
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 120000, // 2 minutes
    };
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        console.log(`[Circuit Breaker: ${this.name}] OPEN - Rejecting request`);
        if (fallback) {
          console.log(`[Circuit Breaker: ${this.name}] Using fallback`);
          return fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
      // Transition to half-open to test
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      console.log(`[Circuit Breaker: ${this.name}] Transitioning to HALF_OPEN`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback && this.state === CircuitState.OPEN) {
        console.log(`[Circuit Breaker: ${this.name}] Using fallback after failure`);
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log(`[Circuit Breaker: ${this.name}] Transitioned to CLOSED`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
      console.log(`[Circuit Breaker: ${this.name}] Transitioned to OPEN from HALF_OPEN`);
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
      console.log(
        `[Circuit Breaker: ${this.name}] Transitioned to OPEN (${this.failureCount} failures)`
      );
    }
  }

  getState(): { state: CircuitState; failureCount: number; successCount: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.log(`[Circuit Breaker: ${this.name}] Reset to CLOSED`);
  }
}

export class ResilienceService {
  private static circuitBreakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Execute function with circuit breaker protection
   */
  static async withCircuitBreaker<T>(
    name: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    let breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker(name, config);
      this.circuitBreakers.set(name, breaker);
    }

    return breaker.execute(fn, fallback);
  }

  /**
   * Retry with exponential backoff and jitter
   * 
   * Jitter prevents thundering herd problem when multiple clients retry simultaneously
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig: RetryConfig = {
      maxAttempts: config.maxAttempts || 3,
      initialDelay: config.initialDelay || 1000,
      maxDelay: config.maxDelay || 30000,
      multiplier: config.multiplier || 2,
      jitter: config.jitter !== false, // Default true
    };

    let lastError: Error | null = null;
    let delay = retryConfig.initialDelay;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === retryConfig.maxAttempts) {
          console.error(`[Retry] All ${retryConfig.maxAttempts} attempts failed`);
          break;
        }

        // Calculate delay with exponential backoff
        const baseDelay = Math.min(delay, retryConfig.maxDelay);
        
        // Add jitter (random 0-100% of delay)
        const actualDelay = retryConfig.jitter
          ? baseDelay * (0.5 + Math.random() * 0.5)
          : baseDelay;

        console.log(
          `[Retry] Attempt ${attempt} failed, retrying in ${Math.round(actualDelay)}ms...`
        );

        await this.sleep(actualDelay);
        delay *= retryConfig.multiplier;
      }
    }

    throw lastError || new Error("Retry failed");
  }

  /**
   * Execute with timeout
   */
  static async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage: string = "Operation timed out"
  ): Promise<T> {
    return Promise.race([
      fn(),
      this.sleep(timeoutMs).then(() => {
        throw new Error(timeoutMessage);
      }),
    ]);
  }

  /**
   * Execute with circuit breaker + retry + timeout (full resilience)
   */
  static async executeResilient<T>(
    name: string,
    fn: () => Promise<T>,
    options: {
      fallback?: () => Promise<T>;
      retry?: Partial<RetryConfig>;
      timeout?: number;
      circuitBreaker?: Partial<CircuitBreakerConfig>;
    } = {}
  ): Promise<T> {
    const wrappedFn = async () => {
      const fnWithRetry = () =>
        this.withRetry(fn, options.retry);

      if (options.timeout) {
        return this.withTimeout(fnWithRetry, options.timeout);
      }

      return fnWithRetry();
    };

    return this.withCircuitBreaker(
      name,
      wrappedFn,
      options.fallback,
      options.circuitBreaker
    );
  }

  /**
   * Batch operations with concurrency control
   * Prevents overwhelming external services
   */
  static async batchWithConcurrency<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency: number = 5
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = fn(item).then((result) => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1
        );
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Get circuit breaker status for monitoring
   */
  static getCircuitBreakerStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.circuitBreakers.forEach((breaker, name) => {
      status[name] = breaker.getState();
    });

    return status;
  }

  /**
   * Reset all circuit breakers (use with caution)
   */
  static resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach((breaker) => breaker.reset());
    console.log("[Resilience] All circuit breakers reset");
  }

  /**
   * Health check for monitoring
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    circuitBreakers: Record<string, any>;
  }> {
    const status = this.getCircuitBreakerStatus();
    const allClosed = Object.values(status).every(
      (s: any) => s.state === CircuitState.CLOSED
    );

    return {
      healthy: allClosed,
      circuitBreakers: status,
    };
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
