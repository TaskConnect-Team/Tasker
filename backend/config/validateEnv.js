
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'atlas_URL',
  'JWT_SECRET',
  // ... more
];

function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these in your .env file');
    process.exit(1);
  }
  
  console.log('✅ All environment variables are set');
}

module.exports = validateEnv;

// backend/server.js
const validateEnv = require('./config/validateEnv');
validateEnv(); // Call at startup