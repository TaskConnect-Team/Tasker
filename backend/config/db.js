import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.atlas_URL);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

export default connectDB;



// Force Mongoose to build the index programmatically
async function createSpatialIndex() {
  try {
    await mongoose.model('Task').cleanIndexes(); // Optional: clears broken indexes
    await mongoose.model('Task').ensureIndexes();
    console.log("✅ 2dsphere index built successfully!");
  } catch (err) {
    console.error("❌ Index creation failed:", err);
  }
}

export { createSpatialIndex };
