

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Review from "../models/Review.js";
import * as aiServices from "../services/aiService.js";

dotenv.config();

// ============================================
// HELPER FUNCTIONS
// ============================================

function prepareTaskEmbeddingText(task) {
  const parts = [
    task.title || '',
    task.description || '',
    (task.category || []).join(' '),
    task.city || '',
    task.urgency || '',
  ];
  return parts.filter(p => p && p.trim().length > 0).join(' ');
}

function prepareReviewEmbeddingText(review) {
  const parts = [
    review.comment || '',
    `Rating: ${review.rating}`,
    (review.tags || []).join(' '),
  ];
  return parts.filter(p => p && p.trim().length > 0).join(' ');
}

// ============================================
// BACKFILL TASKER EMBEDDINGS
// ============================================

async function backfillTaskerEmbeddings() {
  console.log('🔄 Starting tasker embedding backfill...');
  
  const taskers = await User.find({ role: 'tasker' });
  console.log(`📊 Found ${taskers.length} taskers`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const tasker of taskers) {
    try {
      const embeddingText = aiServices.prepareTaskerEmbeddingText(tasker);
      const embedding = await aiServices.generateEmbedding(embeddingText);
      
      await User.findByIdAndUpdate(tasker._id, { 
        embedding, 
        embeddedAt: new Date() 
      });
      successCount++;
      
      console.log(`✅ ${successCount}/${taskers.length}: ${tasker.name}`);
      
      // Rate limit to avoid API throttling
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failCount++;
      console.error(`❌ Failed for ${tasker.name}:`, error.message);
    }
  }
  
  console.log(`✅ Tasker backfill complete! Success: ${successCount}, Failed: ${failCount}`);
}

// ============================================
// BACKFILL TASK EMBEDDINGS
// ============================================

async function backfillTaskEmbeddings() {
  console.log('🔄 Starting task embedding backfill...');
  
  const tasks = await Task.find({});
  console.log(`📊 Found ${tasks.length} tasks`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const task of tasks) {
    try {
      const embeddingText = prepareTaskEmbeddingText(task);
      const embedding = await aiServices.generateEmbedding(embeddingText);
      
      await Task.findByIdAndUpdate(task._id, { 
        embedding, 
        embeddedAt: new Date() 
      });
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`📊 Processed ${successCount}/${tasks.length} tasks`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failCount++;
      console.error(`❌ Failed for task ${task._id}:`, error.message);
    }
  }
  
  console.log(`✅ Task backfill complete! Success: ${successCount}, Failed: ${failCount}`);
}

// ============================================
// BACKFILL REVIEW EMBEDDINGS
// ============================================

async function backfillReviewEmbeddings() {
  console.log('🔄 Starting review embedding backfill...');
  
  const reviews = await Review.find({});
  console.log(`📊 Found ${reviews.length} reviews`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const review of reviews) {
    try {
      const embeddingText = prepareReviewEmbeddingText(review);
      const embedding = await aiServices.generateEmbedding(embeddingText);
      
      await Review.findByIdAndUpdate(review._id, { 
        embedding, 
        embeddedAt: new Date() 
      });
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`📊 Processed ${successCount}/${reviews.length} reviews`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failCount++;
      console.error(`❌ Failed for review ${review._id}:`, error.message);
    }
  }
  
  console.log(`✅ Review backfill complete! Success: ${successCount}, Failed: ${failCount}`);
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.atlas_URL);
    console.log('✅ Connected to MongoDB');
    
    // Run backfills
    await backfillTaskerEmbeddings();
    await backfillTaskEmbeddings();
    await backfillReviewEmbeddings();
    
    console.log('🎉 All backfills completed successfully!');
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main();