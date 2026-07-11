// backend/scripts/addEmbeddingField.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function addEmbeddingFields() {
  try {
    await mongoose.connect(process.env.atlas_URL);
    console.log("✅ Connected to MongoDB");
    
    const db = mongoose.connection.db;
    
    // Add embedding field to users collection
    await db.collection('users').updateMany(
      {},
      { $set: { embedding: [], embeddedAt: null } }
    );
    console.log("✅ Added embedding field to users");
    
    // Add embedding field to tasks collection
    await db.collection('tasks').updateMany(
      {},
      { $set: { embedding: [], embeddedAt: null } }
    );
    console.log("✅ Added embedding field to tasks");
    
    // Add embedding field to reviews collection
    await db.collection('reviews').updateMany(
      {},
      { $set: { embedding: [], embeddedAt: null } }
    );
    console.log("✅ Added embedding field to reviews");
    
    console.log("🎉 All embedding fields added successfully!");
    
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

addEmbeddingFields();