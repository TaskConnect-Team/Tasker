export const normalizeScore = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return Math.round(score <= 1 ? score * 100 : score);
};

export const getMatchColor = (score) => {
  const normalized = normalizeScore(score);

  if (normalized >= 80) return 'text-green-700 bg-green-50 border-green-200';
  if (normalized >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
};

export const getMatchLabel = (score) => {
  const normalized = normalizeScore(score);

  if (normalized >= 80) return 'Excellent Match';
  if (normalized >= 50) return 'Good Match';
  return 'Relevant';
};

export const formatSearchSource = (source) => {
  if (source === 'vector' || source === 'ai') {
    return 'AI Smart Match';
  }

  if (source === 'hybrid') {
    return 'Hybrid Search';
  }

  return 'Text Search';
};

export const getTaskConfidenceScore = (task) => {
  if (!task) {
    return 0;
  }

  let score = 0;

  if ((task.title || '').trim().length >= 10) score += 20;
  if ((task.description || '').trim().length >= 80) score += 35;
  if (Array.isArray(task.category) && task.category.length > 0) score += 15;
  if (task.price || task.budget) score += 15;
  if (task.city || task.location) score += 10;
  if (task.scheduledAt) score += 5;

  return Math.min(score, 100);
};

export const buildAITags = (task) => {
  const categories = Array.isArray(task?.category) ? task.category : [];

  return categories.map((tag) => ({
    label: tag,
    confidence: 0.82,
  }));
};
