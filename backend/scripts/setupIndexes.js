// backend/config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ============================================
// CREATE ALL INDEXES (Spatial + Vector)
// ============================================

async function createAllIndexes() {
  try {
    console.log("🔄 Creating database indexes...");
    
    // 1. Create 2dsphere indexes for geospatial queries
    await createSpatialIndexes();
    
    // 2. Create Vector Search Indexes
    await createVectorIndexes();
    
    console.log("✅ All indexes created successfully!");
  } catch (err) {
    console.error("❌ Index creation failed:", err);
    throw err;
  }
}

// ============================================
// 1. SPATIAL INDEXES (2dsphere) - FIXED
// ============================================

async function createSpatialIndexes() {
  try {
    const db = mongoose.connection.db;
    
    // Get existing indexes to avoid conflicts
    const userIndexes = await db.collection('users').indexes();
    const taskIndexes = await db.collection('tasks').indexes();
    
    // Helper to check if index exists
    const indexExists = (indexes, name) => indexes.some(idx => idx.name === name);
    
    // ----- USER COLLECTION INDEXES -----
    
    // 1. Location 2dsphere index
    if (!indexExists(userIndexes, 'user_location_2dsphere')) {
      // Check if location index already exists with default name
      const hasLocationIndex = userIndexes.some(idx => 
        idx.key && idx.key.location && idx.key.location === '2dsphere'
      );
      
      if (hasLocationIndex) {
        console.log("ℹ️ User location 2dsphere index already exists (default name), skipping...");
      } else {
        await db.collection('users').createIndex(
          { location: '2dsphere' },
          { name: 'user_location_2dsphere' }
        );
        console.log("✅ User location 2dsphere index created");
      }
    } else {
      console.log("ℹ️ User location 2dsphere index already exists");
    }
    
    // 2. Email unique index
    if (!indexExists(userIndexes, 'user_email_unique')) {
      // Check if email index already exists
      const hasEmailIndex = userIndexes.some(idx => 
        idx.key && idx.key.email && idx.unique
      );
      
      if (hasEmailIndex) {
        console.log("ℹ️ User email unique index already exists, skipping...");
      } else {
        await db.collection('users').createIndex(
          { email: 1 },
          { unique: true, name: 'user_email_unique' }
        );
        console.log("✅ User email unique index created");
      }
    } else {
      console.log("ℹ️ User email unique index already exists");
    }
    
    // ----- TASK COLLECTION INDEXES -----
    
    // 3. Task location 2dsphere index
    if (!indexExists(taskIndexes, 'task_location_2dsphere')) {
      const hasLocationIndex = taskIndexes.some(idx => 
        idx.key && idx.key.location && idx.key.location === '2dsphere'
      );
      
      if (hasLocationIndex) {
        console.log("ℹ️ Task location 2dsphere index already exists (default name), skipping...");
      } else {
        await db.collection('tasks').createIndex(
          { location: '2dsphere' },
          { name: 'task_location_2dsphere' }
        );
        console.log("✅ Task location 2dsphere index created");
      }
    } else {
      console.log("ℹ️ Task location 2dsphere index already exists");
    }
    
    // 4. Task status + created index
    if (!indexExists(taskIndexes, 'task_status_created')) {
      await db.collection('tasks').createIndex(
        { status: 1, createdAt: -1 },
        { name: 'task_status_created' }
      );
      console.log("✅ Task status+created index created");
    } else {
      console.log("ℹ️ Task status+created index already exists");
    }
    
    // ----- REVIEW COLLECTION INDEXES (if collection exists) -----
    const collections = await db.listCollections().toArray();
    const hasReviews = collections.some(c => c.name === 'reviews');
    
    if (hasReviews) {
      const reviewIndexes = await db.collection('reviews').indexes();
      
      if (!indexExists(reviewIndexes, 'review_task_unique')) {
        const hasTaskIndex = reviewIndexes.some(idx => 
          idx.key && idx.key.task && idx.unique
        );
        
        if (hasTaskIndex) {
          console.log("ℹ️ Review task unique index already exists, skipping...");
        } else {
          await db.collection('reviews').createIndex(
            { task: 1 },
            { unique: true, name: 'review_task_unique' }
          );
          console.log("✅ Review task unique index created");
        }
      } else {
        console.log("ℹ️ Review task unique index already exists");
      }
    }

  } catch (err) {
    console.error("❌ Spatial index creation failed:", err);
    // Don't throw - continue to vector indexes
  }
}

// ============================================
// 2. VECTOR SEARCH INDEXES
// ============================================

async function createVectorIndexes() {
  try {
    // Get database reference
    const db = mongoose.connection.db;
    
    // Check if Atlas Vector Search is available
    try {
      // Test if we can list search indexes
      await db.collection('users').listSearchIndexes().toArray();
    } catch (err) {
      if (err.codeName === 'AtlasError') {
        console.log("⚠️ MongoDB Atlas Vector Search not available. Skipping vector indexes.");
        console.log("ℹ️ Vector search requires MongoDB Atlas with Atlas Search enabled.");
        return;
      }
      // Other error - continue anyway
    }
    
    // --- 2.1 User Vector Index (for Tasker semantic search) ---
    await createVectorIndex(db, 'users', 'user_vector_search', {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 768,
          similarity: 'cosine',
        },
        {
          type: 'filter',
          path: 'role',
        },
        {
          type: 'filter',
          path: 'isVerified',
        },
        {
          type: 'filter',
          path: 'averageRating',
        },
      ],
    });

    // --- 2.2 Task Vector Index (for task similarity search) ---
    await createVectorIndex(db, 'tasks', 'task_vector_search', {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 768,
          similarity: 'cosine',
        },
        {
          type: 'filter',
          path: 'status',
        },
        {
          type: 'filter',
          path: 'category',
        },
        {
          type: 'filter',
          path: 'city',
        },
      ],
    });

    // --- 2.3 Review Vector Index (for sentiment/analysis) ---
    const collections = await db.listCollections().toArray();
    const hasReviews = collections.some(c => c.name === 'reviews');
    
    if (hasReviews) {
      await createVectorIndex(db, 'reviews', 'review_vector_search', {
        fields: [
          {
            type: 'vector',
            path: 'embedding',
            numDimensions: 768,
            similarity: 'cosine',
          },
          {
            type: 'filter',
            path: 'rating',
          },
        ],
      });
    }

    console.log("✅ Vector search indexes processed");

  } catch (err) {
    if (err.code === 66 || err.codeName === 'IndexAlreadyExists') {
      console.log("ℹ️ Vector indexes already exist");
    } else {
      console.error("❌ Vector index creation failed:", err.message);
      // Don't throw - this is non-critical for basic app functionality
    }
  }
}

// ============================================
// HELPER: Create a single vector index
// ============================================

async function createVectorIndex(db, collectionName, indexName, definition) {
  try {
    // Check if collection exists
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === collectionName);
    
    if (!collectionExists) {
      console.log(`ℹ️ Collection "${collectionName}" doesn't exist yet, skipping vector index`);
      return;
    }
    
    // Check if index already exists
    let existingIndexes = [];
    try {
      existingIndexes = await db
        .collection(collectionName)
        .listSearchIndexes()
        .toArray();
    } catch (err) {
      // If listSearchIndexes fails, the collection might not have search indexes
      if (err.codeName === 'AtlasError') {
        console.log(`ℹ️ Atlas Search not available for "${collectionName}"`);
        return;
      }
      // Continue - assume no indexes
    }
    
    const indexExists = existingIndexes.some(idx => idx.name === indexName);
    
    if (indexExists) {
      console.log(`ℹ️ Vector index "${indexName}" already exists on "${collectionName}"`);
      return;
    }

    // Create the vector index
    try {
      await db.command({
        createSearchIndexes: collectionName,
        indexes: [
          {
            name: indexName,
            type: 'vectorSearch',
            definition: definition,
          },
        ],
      });
      
      console.log(`✅ Vector index "${indexName}" created on "${collectionName}"`);
    } catch (err) {
      if (err.code === 66 || err.codeName === 'IndexAlreadyExists' || 
          err.message.includes('already exists')) {
        console.log(`ℹ️ Index "${indexName}" already exists on "${collectionName}"`);
        return;
      }
      throw err;
    }

  } catch (err) {
    if (err.code === 66 || err.codeName === 'IndexAlreadyExists' || 
        err.message.includes('already exists')) {
      console.log(`ℹ️ Index "${indexName}" already exists on "${collectionName}"`);
      return;
    }
    console.error(`❌ Failed to create vector index "${indexName}":`, err.message);
    // Don't throw - let other indexes continue
  }
}

// ============================================
// CHECK VECTOR INDEXES
// ============================================

async function checkVectorIndexes() {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        const indexes = await db
          .collection(collection.name)
          .listSearchIndexes()
          .toArray();
        
        if (indexes.length > 0) {
          console.log(`📊 ${collection.name}: ${indexes.length} search indexes`);
          indexes.forEach(idx => {
            console.log(`   - ${idx.name} (${idx.type})`);
          });
        }
      } catch (err) {
        // Collection might not have search indexes
        if (!err.message.includes('not found')) {
          console.log(`ℹ️ No search indexes on ${collection.name}`);
        }
      }
    }
    
    return true;
  } catch (err) {
    console.error("❌ Failed to check vector indexes:", err.message);
    return false;
  }
}

// ============================================
// DROP INDEXES (Utility for cleanup)
// ============================================

async function dropIndexes(collectionName, indexName) {
  try {
    const db = mongoose.connection.db;
    await db.collection(collectionName).dropIndex(indexName);
    console.log(`✅ Dropped index "${indexName}" from "${collectionName}"`);
  } catch (err) {
    console.error(`❌ Failed to drop index "${indexName}":`, err.message);
  }
}

// ============================================
// LIST ALL INDEXES (Utility for debugging)
// ============================================

async function listAllIndexes() {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const indexes = await db.collection(collection.name).indexes();
      console.log(`📊 ${collection.name}: ${indexes.length} indexes`);
      indexes.forEach(idx => {
        console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    }
  } catch (err) {
    console.error("❌ Failed to list indexes:", err);
  }
}




const runMigration = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.atlas_URL);
    
    await createAllIndexes();
    
    console.log("👋 Migration complete. Disconnecting...");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
};

runMigration();