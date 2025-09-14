// Simple composer cache implementation for JavaScript compatibility

export function withComposerCache(fn) {
  // Simple implementation - just call the function directly for now
  return fn;
}

export function generateCacheKey(orgId, payload, chunkIds = []) {
  // Simple implementation - return a basic cache key
  return `composer:${orgId}:${Date.now()}`;
}
