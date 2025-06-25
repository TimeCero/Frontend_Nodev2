console.log('Testing passport...');
try {
  const passport = require('passport');
  console.log('✅ passport loaded successfully');
  console.log('passport type:', typeof passport);
} catch (error) {
  console.error('❌ passport error:', error.message);
  console.error('Stack:', error.stack);
}