// resetDb.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import all your models (Adjust the paths depending on where this file is located)
import User from './models/User.js';
import Task from './models/Task.js';
import Otp from './models/Otp.js';
import Review from './models/Review.js'; // Uncomment if you have a separate Review model

// Load your environment variables so it can find process.env.MONGO_URI
dotenv.config(); 

const resetDatabase = async () => {
  try {
    // 1. Connect to MongoDB independently
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.atlas_URL);
    console.log('✅ Connected. Commencing Database Wipe...');

    // 2. Delete all documents in each collection safely
    // Passing an empty object {} means "match everything"
    await User.deleteMany({});
    await Task.deleteMany({});
    await Otp.deleteMany({});
    await Review.deleteMany({}); 

    console.log('🧹 SUCCESS: All Users, Tasks, and OTPs have been completely removed.');
    
    // 3. Disconnect and kill the script
    process.exit(0); 

  } catch (error) {
    console.error('❌ ERROR: Failed to reset the database.');
    console.error(error);
    process.exit(1); 
  }
};

// Run the function
resetDatabase();