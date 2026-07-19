import User from '../models/User.js'; 
import Review from '../models/Review.js'; 
import { generateEmbedding } from '../services/aiService.js';

/**
 * Runs detached from the main request/response cycle.
 * Takes the fully updated user document and generates a semantic vector.
 */

export const runProfileEmbeddingWorker = async (userId, latestUserDoc) => {
  try {
    
    console.log(` Starting embedding ....`);

    // The userDoc already contains the merged updates from the controller
    const semanticText = `
      Location: ${latestUserDoc.city ?? ""}.
      Headline: ${latestUserDoc.tagline ?? ""}.
      About: ${latestUserDoc.bio ?? ""}.
      Skills: ${(latestUserDoc.skills ?? []).join(", ")}.
      Services Offered: ${(latestUserDoc.services ?? []).join(", ")}.
    `.trim();

    // Ping the AI Service
    const embeddingVector = await generateEmbedding(semanticText);

    // Silently update the database in the background
    if (embeddingVector && embeddingVector.length > 0) {
       await User.findByIdAndUpdate(userId, { embedding: embeddingVector, embeddedAt: new Date() }, { new: true, runValidators: true });
       console.log(` ✅ Embedding successfully saved!`);
    }
  } catch (error) {
    console.error(` ❌ Failed to embed profile for Tasker!`, error);
 }
};


/**
 * Runs detached from the main request/response cycle.
 * Embeds a review so it can be used for semantic matching later.
 */
export const runReviewEmbeddingWorker = async (reviewId, reviewData, taskCategory) => {
  try {
    console.log(` Starting embedding ...`);

    const semanticText = ` 
      Rating: ${reviewData.rating} out of 5 stars.
      Task Category: ${taskCategory || "General Task"}.
      Feedback: ${reviewData.comment || "No written feedback provided."}.
      Tags: ${(reviewData.tags || []).join(", ")}.
    `.trim();

    const embeddingVector = await generateEmbedding(semanticText);
    
    if (embeddingVector && embeddingVector.length > 0) {
       await Review.findByIdAndUpdate(reviewId, { embedding: embeddingVector, embeddedAt: new Date() }, { new: true, runValidators: true });
       console.log(` ✅ Embedding successfully saved for Review!`);
    }
  } catch (error) {
    console.error(` ❌ Failed to embed Review:`, error);
  }
};
