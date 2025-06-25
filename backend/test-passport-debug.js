const fs = require('fs');

function log(message) {
  console.log(message);
  fs.appendFileSync('debug.log', message + '\n');
}

try {
  // Clear previous log
  if (fs.existsSync('debug.log')) {
    fs.unlinkSync('debug.log');
  }
  
  log('=== PASSPORT DEBUG TEST ===');
  log('Testing passport configuration step by step...');
  
  log('1. Loading passport...');
  const passport = require('passport');
  log('✅ passport loaded successfully');
  
  log('2. Loading strategies...');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const GitHubStrategy = require('passport-github2').Strategy;
  log('✅ strategies loaded successfully');
  
  log('3. Loading other deps...');
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  log('✅ other dependencies loaded');
  
  log('4. Testing environment variables...');
  log('JWT_SECRET exists: ' + (process.env.JWT_SECRET ? 'YES' : 'NO'));
  log('GOOGLE_CLIENT_ID exists: ' + (process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO'));
  
  log('5. Testing passport configuration...');
  // Try to load the actual passport config
  const passportConfig = require('./config/passport');
  log('✅ passport config loaded successfully');
  
  log('\n🎉 ALL TESTS PASSED!');
  
} catch (error) {
  log('❌ ERROR: ' + error.message);
  log('Stack: ' + error.stack);
  process.exit(1);
}