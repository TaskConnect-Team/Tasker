
class AIMonitor {
  static logRequest(type, userId, success, duration, error = null) {
    // Log to console or database
    console.log({
      timestamp: new Date().toISOString(),
      type,
      userId,
      success,
      duration: duration + 'ms',
      error: error?.message,
    });
    
    // Could also store in MongoDB for analytics
    // await AIUsageLog.create({ type, userId, success, duration });
  }
  
  static trackCost(type, tokens) {
    const costPerToken = type === 'embedding' ? 0.0000001 : 0.000001;
    const cost = tokens * costPerToken;
    console.log(`💰 ${type} cost: $${cost.toFixed(6)}`);
  }
}

// Usage
const start = Date.now();
try {
  const result = await generateStructuredResponse(systemPrompt, userPrompt);
  AIMonitor.logRequest('enhance', req.user._id, true, Date.now() - start);
} catch (error) {
  AIMonitor.logRequest('enhance', req.user._id, false, Date.now() - start, error);
}