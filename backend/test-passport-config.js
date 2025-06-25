console.log('Testing passport configuration...');

try {
  // Test individual imports first
  console.log('1. Testing passport import...');
  const passport = require('passport');
  console.log('✅ passport loaded');
  
  console.log('2. Testing strategies...');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const GitHubStrategy = require('passport-github2').Strategy;
  console.log('✅ strategies loaded');
  
  console.log('3. Testing other dependencies...');
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  console.log('✅ jwt and crypto loaded');
  
  console.log('4. Testing passport configuration...');
  // Simulate the passport.js configuration without environment variables
  const users = new Map();
  
  // Test passport.use with a mock strategy
  console.log('5. Testing passport.use...');
  passport.use('test', {
    authenticate: function() { return true; }
  });
  console.log('✅ passport.use works');
  
  console.log('\n🎉 All passport configuration tests passed!');
  
} catch (error) {
  console.error('❌ Error in passport config test:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}