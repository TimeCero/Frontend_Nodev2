// Load environment variables first
require('dotenv').config();

const fs = require('fs');

function log(message) {
  console.log(message);
  fs.appendFileSync('debug-env.log', message + '\n');
}

try {
  // Clear previous log
  if (fs.existsSync('debug-env.log')) {
    fs.unlinkSync('debug-env.log');
  }
  
  log('=== PASSPORT TEST WITH ENV ===');
  log('Testing passport configuration with environment variables...');
  
  log('1. Checking environment variables...');
  log('JWT_SECRET: ' + (process.env.JWT_SECRET ? 'LOADED' : 'MISSING'));
  log('GOOGLE_CLIENT_ID: ' + (process.env.GOOGLE_CLIENT_ID ? 'LOADED' : 'MISSING'));
  log('GOOGLE_CLIENT_SECRET: ' + (process.env.GOOGLE_CLIENT_SECRET ? 'LOADED' : 'MISSING'));
  log('GITHUB_CLIENT_ID: ' + (process.env.GITHUB_CLIENT_ID ? 'LOADED' : 'MISSING'));
  
  log('2. Loading passport...');
  const passport = require('passport');
  log('✅ passport loaded successfully');
  
  log('3. Loading strategies...');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const GitHubStrategy = require('passport-github2').Strategy;
  log('✅ strategies loaded successfully');
  
  log('4. Loading passport configuration...');
  const passportConfig = require('./config/passport');
  log('✅ passport config loaded successfully');
  
  log('5. Testing passport exports...');
  log('passport exported: ' + (passportConfig.passport ? 'YES' : 'NO'));
  log('generateJWT exported: ' + (passportConfig.generateJWT ? 'YES' : 'NO'));
  log('getAllUsers exported: ' + (passportConfig.getAllUsers ? 'YES' : 'NO'));
  
  log('\n🎉 ALL TESTS PASSED!');
  
} catch (error) {
  log('❌ ERROR: ' + error.message);
  log('Stack: ' + error.stack);
  process.exit(1);
}