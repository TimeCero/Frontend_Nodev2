// Load environment variables first
require('dotenv').config();

console.log('Testing auth routes...');

try {
  console.log('1. Loading auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ auth routes loaded successfully');
  
  console.log('2. Checking route type...');
  console.log('Route type:', typeof authRoutes);
  
  console.log('\n🎉 Auth routes test passed!');
  
} catch (error) {
  console.error('❌ ERROR in auth routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}