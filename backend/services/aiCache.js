// backend/services/aiCache.js
const NodeCache = require('node-cache');
const crypto = require('crypto');

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour TTL

class AICache {
  static getKey(type, ...params) {
    const hash = crypto.createHash('md5');
    hash.update(`${type}:${JSON.stringify(params)}`);
    return hash.digest('hex');
  }

  static get(type, ...params) {
    const key = this.getKey(type, ...params);
    return cache.get(key);
  }

  static set(type, data, ...params) {
    const key = this.getKey(type, ...params);
    cache.set(key, data);
  }

  static clear(type) {
    if (type) {
      const keys = cache.keys().filter(k => k.startsWith(type));
      keys.forEach(k => cache.del(k));
    } else {
      cache.flushAll();
    }
  }
}

module.exports = AICache;

// Usage in aiService.js
const AICache = require('./aiCache');

async function enhanceTask(title, description, category) {
  // Check cache first
  const cacheKey = 'enhance';
  const cached = AICache.get(cacheKey, title, description, category);
  if (cached) {
    console.log('✅ AI enhancement from cache');
    return cached;
  }

  // ... generate enhancement ...

  // Store in cache
  AICache.set(cacheKey, result, title, description, category);
  return result;
}