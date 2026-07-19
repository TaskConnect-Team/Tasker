// backend/routes/aiRoutes.js
import express from 'express';
const router = express.Router();
import { aiRateLimiter, embeddingRateLimiter } from '../middleware/aiRateLimiter.js';
import protect from '../middleware/authMiddleware.js';
import { enhanceTask, suggestPrice, generateEmbedding, generateText } from '../services/aiService.js';
import User from '../models/User.js'; // Converted Tasker model require to top-level ES import
import Task from '../models/Task.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeTask = (task) => {
  const plainTask = typeof task.toObject === 'function' ? task.toObject() : task;
  const geoLocation = plainTask.location?.type === 'Point' ? plainTask.location : null;
  const locationLabel = plainTask.locationLabel || plainTask.city || '';

  return {
    ...plainTask,
    locationLabel,
    location: locationLabel,
    geoLocation,
  };
};

const matchesTaskFilters = (task, filters = {}) => {
  if (filters.status && task.status !== filters.status) return false;
  if (filters.location) {
    const location = `${task.locationLabel || ''} ${task.city || ''}`.toLowerCase();
    if (!location.includes(String(filters.location).toLowerCase())) return false;
  }
  if (filters.category) {
    const categories = Array.isArray(task.category) ? task.category : [];
    const selected = String(filters.category).split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
    if (selected.length && !categories.some((item) => selected.includes(String(item).toLowerCase()))) return false;
  }
  if (filters.minPrice && Number(task.price) < Number(filters.minPrice)) return false;
  if (filters.maxPrice && Number(task.price) > Number(filters.maxPrice)) return false;

  return true;
};

const buildTextTaskQuery = ({ q, status = 'open', location, minPrice, maxPrice, category, excludeId }) => {
  const query = { status };
  const terms = [q, category].filter(Boolean).join(' ').trim();

  if (terms) {
    const regex = new RegExp(escapeRegex(terms), 'i');
    query.$or = [{ title: regex }, { description: regex }, { category: regex }];
  }

  if (location) {
    const regex = new RegExp(escapeRegex(location), 'i');
    query.$or = [...(query.$or || []), { city: regex }, { locationLabel: regex }];
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return query;
};

// ============================================
// TASK ENHANCEMENT ENDPOINT
// ============================================
router.post('/enhance-task', protect, aiRateLimiter, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    // Validation
    if (!title || title.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters',
      });
    }

    if (!description || description.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    // Call AI service
    const result = await enhanceTask(title, description, category);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Enhance task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance task description. Please try again.',
    });
  }
});

// ============================================
// PRICE SUGGESTION ENDPOINT
// ============================================
router.post('/suggest-price', protect, aiRateLimiter, async (req, res) => {
  try {
    const { city, category, description, urgency } = req.body;

    // Validation
    if (!city || city.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'City is required',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    if (!description || description.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters',
      });
    }

    // Call AI service
    const result = await suggestPrice(
      city,
      category,
      description,
      urgency || 'normal'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Price suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suggest price. Please try again.',
    });
  }
});

// ============================================
// SEMANTIC SEARCH ENDPOINT (Phase 4)
// ============================================
router.get('/search', protect, embeddingRateLimiter, async (req, res) => {
  try {
    const { q, limit = 20, minRating = 0, city, skills, minRate, maxRate } = req.query;

    if (!q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Generate embedding for search query
    const embedding = await generateEmbedding([q, skills, city].filter(Boolean).join(' '));

    console.log('Search embedding generated:', embedding.length);

    // Perform vector search on Tasker collection using the imported User model
    const vectorResults = await User.aggregate([
      {
        $vectorSearch: {
          index: 'user_vector_search',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100,
          limit: parseInt(limit),
          filter: {
            $and: [
              { role: 'tasker' },
              { averageRating: { $gte: parseFloat(minRating) } },
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          tagline: 1,
          profileImage: 1,
          skills: 1,
          services: 1,
          averageRating: 1,
          totalReviews: 1,
          hourlyRate: 1,
          isVerified: 1,
          city: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);


    // Traditional text search (backup/fallback)
    const textResults = await User.find({
      role: 'tasker',
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } },
        { bio: { $regex: q, $options: 'i' } },
      ],
    }).limit(limit);


    const combined = [...vectorResults];
    const existingIds = new Set(combined.map(r => r._id.toString()));

    textResults.forEach(r => {
      if (!existingIds.has(r._id.toString())) {
        combined.push({ ...r.toObject(), score: 0.3 });
        existingIds.add(r._id.toString());
      }
    });

    const filtered = combined.filter((tasker) => {
      if (city && String(tasker.city || tasker.location || '').toLowerCase() !== String(city).toLowerCase()) {
        return false;
      }
      if (skills) {
        const selectedSkills = String(skills).split(',').map(skill => skill.trim().toLowerCase()).filter(Boolean);
        const taskerSkills = (tasker.skills || []).map(skill => String(skill).toLowerCase());
        if (selectedSkills.length && !selectedSkills.some(skill => taskerSkills.includes(skill))) {
          return false;
        }
      }
      if (minRate && Number(tasker.hourlyRate || 0) < Number(minRate)) return false;
      if (maxRate && Number(tasker.hourlyRate || 0) > Number(maxRate)) return false;
      return true;
    });

    res.json({
      success: true,
      data: filtered.slice(0, limit * 2),
      query: q,
      total: filtered.length,
      sources: {
        vector: vectorResults.length,
        text: textResults.length,
      },
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed. Please try again.',
    });
  }
});

// ============================================
// SEMANTIC TASK SEARCH ENDPOINT
// ============================================
router.get('/tasks/search', protect, embeddingRateLimiter, async (req, res) => {
  try {
    const { q, limit = 20, status = 'open', location, minPrice, maxPrice, category } = req.query;
    const searchText = [q, category, location].filter(Boolean).join(' ').trim();


    if (!q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }


    if (!searchText) {
      const tasks = await Task.find(buildTextTaskQuery({ status, location, minPrice, maxPrice, category }))
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(Number(limit));

      return res.json({
        success: true,
        data: tasks.map((task) => ({ ...serializeTask(task), score: 0.45 })),
        query: q || '',
        sources: { vector: 0, text: tasks.length },
      });
    }

    const embedding = await generateEmbedding(searchText);

    let vectorResults = [];

    try {
      vectorResults = await Task.aggregate([
        {
          $vectorSearch: {
            index: 'task_vector_search',
            path: 'embedding',
            queryVector: embedding,
            numCandidates: 100,
            limit: Number(limit),
            filter: { status },
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            price: 1,
            city: 1,
            locationLabel: 1,
            location: 1,
            category: 1,
            status: 1,
            urgency: 1,
            scheduledAt: 1,
            customer: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);
    } catch (vectorError) {
      console.warn('Task vector search unavailable, using text fallback:', vectorError.message);
      vectorResults = [];
    }


    const textResults = await Task.find(buildTextTaskQuery({ q, status, location, minPrice, maxPrice, category }))
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit));


    const combined = vectorResults.map((task) => serializeTask(task)).filter((task) => matchesTaskFilters(task, req.query));
    const existingIds = new Set(combined.map((task) => task._id.toString()));

    textResults.forEach((task) => {
      if (!existingIds.has(task._id.toString())) {
        combined.push({ ...serializeTask(task), score: 0.35 });
      }
    });

    return res.json({
      success: true,
      data: combined.slice(0, Number(limit) * 2),
      query: q,
      total: combined.length,
      sources: {
        vector: vectorResults.length,
        text: textResults.length,
      },
    });
  } catch (error) {
    console.error('Semantic task search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Task search failed. Please try again.',
    });
  }
});

// ============================================
// SIMILAR TASKS ENDPOINT
// ============================================
router.get('/tasks/:taskId/similar', protect, embeddingRateLimiter, async (req, res) => {
  try {
    const { taskId } = req.params;
    const limit = Number(req.query.limit || 4);
    const task = await Task.findById(taskId).select('+embedding');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const searchText = [task.title, task.description, ...(task.category || [])].filter(Boolean).join(' ');
    const embedding = Array.isArray(task.embedding) && task.embedding.length
      ? task.embedding
      : await generateEmbedding(searchText);

    let similarTasks = [];

    try {
      similarTasks = await Task.aggregate([
        {
          $vectorSearch: {
            index: 'task_vector_search',
            path: 'embedding',
            queryVector: embedding,
            numCandidates: 100,
            limit: limit + 1,
            filter: { status: task.status },
          },
        },
        {
          $match: {
            _id: { $ne: task._id },
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            price: 1,
            city: 1,
            locationLabel: 1,
            location: 1,
            category: 1,
            status: 1,
            urgency: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
        { $limit: limit },
      ]);
    } catch (vectorError) {
      console.warn('Similar task vector search unavailable, using text fallback:', vectorError.message);
    }

    if (!similarTasks.length) {
      similarTasks = await Task.find(
        buildTextTaskQuery({
          q: task.title,
          status: task.status,
          category: (task.category || []).join(','),
          excludeId: task._id,
        }),
      )
        .sort({ createdAt: -1 })
        .limit(limit);
    }

    return res.json({
      success: true,
      data: similarTasks.map((item) => ({ ...serializeTask(item), score: item.score || 0.52 })),
    });
  } catch (error) {
    console.error('Similar tasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Similar tasks failed. Please try again.',
    });
  }
});

// ============================================
// STATUS / HEALTH CHECK
// ============================================
router.get('/status', async (req, res) => {
  try {
    // Test AI connection
    const response = await generateText(
      'You are a test assistant.',
      'Say "AI service is working" in exactly 3 words.'
    );

    res.json({
      success: true,
      status: 'operational',
      message: response.trim(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'degraded',
      message: 'AI service is unavailable',
    });
  }
});

export default router;
